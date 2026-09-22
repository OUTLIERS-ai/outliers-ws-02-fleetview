// FleetView server.
// Reads the log files Claude Code already writes and serves two pages:
//   /            the session grid (from Stargx/claude-code-dashboard, MIT, (c) 2025 Cold Beam Games)
//   /graph.html  FleetView: folder hubs -> sessions -> subagent satellites, plus the token panel
// It changes nothing in Claude Code: no hooks, no settings, no database.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, execFile } = require('child_process');
const express = require('express');
const chokidar = require('chokidar');
const { createStore } = require('./lib/sessions');
const { makeGrouper, lastPart } = require('./lib/groups');
const { PRICES_CHECKED, PRICES_SOURCE } = require('./lib/pricing');

// ---------- config ----------
function loadConfig() {
  const file = process.env.FLEETVIEW_CONFIG || path.join(__dirname, 'config.json');
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { if (fs.existsSync(file)) console.error(`config.json could not be read (${e.message}); using defaults.`); }
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return {
    file,
    port: parseInt(process.env.PORT || cfg.port || 3010, 10),
    host: cfg.host || '127.0.0.1',
    projectsDir: cfg.projects_dir || path.join(claudeDir, 'projects'),
    folders: Array.isArray(cfg.folders) ? cfg.folders : [],
    idlePerFolder: Number.isInteger(cfg.idle_per_folder) ? cfg.idle_per_folder : 3,
    hidePaths: !!cfg.hide_paths,
    usageEnabled: process.env.FLEETVIEW_NO_CCUSAGE === '1' ? false : (cfg.usage ? cfg.usage.enabled !== false : true),
    ccusagePackage: (cfg.usage && cfg.usage.package) || 'ccusage@20',
  };
}
const CFG = loadConfig();
const groupOf = makeGrouper(CFG.folders);
const store = createStore();

function publicView(s) {
  const v = store.view(s);
  v.group = groupOf(v.cwd);
  if (CFG.hidePaths) { v.cwd = v.group + ' / ' + lastPart(v.cwd); }
  return v;
}

// ---------- app ----------
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/meta', (req, res) => {
  res.json({
    pricesChecked: PRICES_CHECKED, pricesSource: PRICES_SOURCE,
    costNote: 'Dollar figures are what these tokens would cost on the paid Claude API at standard rates. On a subscription you do not pay them.',
    folders: CFG.folders.map(f => f.name), hidePaths: CFG.hidePaths, usageEnabled: CFG.usageEnabled,
  });
});

// Grid page feed (upstream shape, plus group / contextPct / priceKnown).
app.get('/api/sessions', (req, res) => {
  const all = [...store.sessions.values()].map(publicView);
  const active = all.filter(s => s.status !== 'idle');
  const activeLabels = new Set(active.map(s => s.label));
  const latestIdle = new Map();
  for (const s of all) {
    if (s.status !== 'idle' || activeLabels.has(s.label)) continue;
    const e = latestIdle.get(s.label);
    if (!e || (s.lastEventAt || '') > (e.lastEventAt || '')) latestIdle.set(s.label, s);
  }
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const result = [...active, ...latestIdle.values()];
  for (const s of result) {
    if (s.status === 'idle' && (!s.lastEventAt || new Date(s.lastEventAt) < todayStart)) s.status = 'idle-stale';
  }
  result.sort((a, b) => {
    const at = a.status !== 'idle-stale' ? 1 : 0, bt = b.status !== 'idle-stale' ? 1 : 0;
    if (at !== bt) return bt - at;
    return (a.label || '').localeCompare(b.label || '');
  });
  res.json(result);
});

// FleetView feed: today's sessions, subagents seen in the last 30 minutes,
// idle sessions trimmed to the N most recent per folder (?all=1 shows everything).
app.get('/api/graph', (req, res) => {
  const showAll = req.query.all === '1';
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const now = Date.now();
  const out = [];
  for (const s of store.sessions.values()) {
    if (!showAll && (!s.lastEventAt || new Date(s.lastEventAt) < todayStart)) continue;
    const v = publicView(s);
    v.subagents = v.subagents.filter(x => x.lastEventAt && now - new Date(x.lastEventAt).getTime() < 30 * 60 * 1000);
    out.push(v);
  }
  const active = out.filter(s => s.status !== 'idle');
  const idleBy = new Map();
  for (const s of out) {
    if (s.status !== 'idle') continue;
    if (!idleBy.has(s.group)) idleBy.set(s.group, []);
    idleBy.get(s.group).push(s);
  }
  const kept = [...active];
  for (const list of idleBy.values()) {
    list.sort((a, b) => (b.lastEventAt || '').localeCompare(a.lastEventAt || ''));
    kept.push(...(showAll ? list : list.slice(0, CFG.idlePerFolder)));
  }
  res.json(kept);
});

// Upstream route (with its 2026-03-09 command-injection fix): click a card title to open its folder.
app.post('/api/open-folder', express.json(), (req, res) => {
  const folder = req.body && req.body.path;
  if (CFG.hidePaths) return res.status(403).json({ error: 'Paths are hidden in config' });
  if (!folder || typeof folder !== 'string') return res.status(400).json({ error: 'No path' });
  const known = [...store.sessions.values()].some(s => s.cwd === folder);
  if (!known) return res.status(404).json({ error: 'Not a session folder' });
  if (!fs.existsSync(folder)) return res.status(404).json({ error: 'Folder not found' });
  const opts = { windowsHide: true };
  if (process.platform === 'win32') execFile('explorer', [folder.replace(/\//g, '\\')], opts, () => {});
  else if (process.platform === 'darwin') execFile('open', [folder], opts, () => {});
  else execFile('xdg-open', [folder], opts, () => {});
  res.json({ ok: true });
});

// ---------- token panel (ccusage) ----------
// ccusage is a free, open-source tool that reads the same log files and knows
// Claude's 5-hour usage windows. It only runs while a FleetView page is open
// (the page asks every 15 seconds); nothing runs on a timer when nobody is looking.
const usage = { block: null, week: null, error: null, blockAt: 0, weekAt: 0, busyBlock: false, busyWeek: false };
function runCcusage(args, cb) {
  const env = { ...process.env, CLAUDE_CONFIG_DIR: path.dirname(CFG.projectsDir) };
  exec(`npx -y ${CFG.ccusagePackage} ${args} --json`,
    { timeout: 180000, maxBuffer: 64 * 1024 * 1024, windowsHide: true, env }, cb);
}
function refreshBlock() {
  if (usage.busyBlock) return; usage.busyBlock = true;
  runCcusage('blocks --active', (err, stdout) => {
    usage.busyBlock = false; usage.blockAt = Date.now();
    if (err) { usage.error = 'ccusage unavailable: ' + String(err.message || err).split('\n')[0].slice(0, 160); return; }
    try {
      const j = JSON.parse(stdout);
      usage.block = (j.blocks || []).find(b => b.isActive) || null;
      usage.error = null;
    } catch (e) { usage.error = 'ccusage answer not understood: ' + String(e.message).slice(0, 120); }
  });
}
function refreshWeek() {
  if (usage.busyWeek) return; usage.busyWeek = true;
  runCcusage('daily', (err, stdout) => {
    usage.busyWeek = false; usage.weekAt = Date.now();
    if (err) return;
    try {
      const days = JSON.parse(stdout).daily || [];
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6); cutoff.setHours(0, 0, 0, 0);
      let tokens = 0, cost = 0, n = 0;
      for (const d of days) {
        const day = d.period || d.date;
        if (!day || new Date(day + 'T00:00:00') < cutoff) continue;
        tokens += d.totalTokens || 0; cost += d.totalCost || 0; n++;
      }
      usage.week = { tokens, cost, days: n };
    } catch { /* keep the last good answer */ }
  });
}
app.get('/api/usage', (req, res) => {
  // Demo only: serve a made-up usage answer from a file (used for the guide's screenshots).
  if (process.env.FLEETVIEW_USAGE_FIXTURE) {
    try { return res.json({ enabled: true, demo: true, ...JSON.parse(fs.readFileSync(process.env.FLEETVIEW_USAGE_FIXTURE, 'utf8')) }); }
    catch (e) { return res.json({ enabled: true, demo: true, block: null, week: null, error: 'demo file unreadable' }); }
  }
  if (!CFG.usageEnabled) {
    return res.json({ enabled: false, block: null, week: null, error: 'ccusage is switched off in config.json', fetchedAt: 0 });
  }
  const t = Date.now();
  if (t - usage.blockAt > 60_000) refreshBlock();
  if (t - usage.weekAt > 300_000) refreshWeek();
  res.json({
    enabled: true, block: usage.block, week: usage.week, error: usage.error,
    pending: usage.busyBlock && !usage.blockAt, fetchedAt: usage.blockAt,
    costNote: 'ccusage dollars are API-equivalent, not money spent on a subscription.',
  });
});

// ---------- start ----------
console.log(`FleetView reading: ${CFG.projectsDir}`);
if (!fs.existsSync(CFG.projectsDir)) {
  console.log('That folder does not exist yet. Run Claude Code once, then restart FleetView.');
}
const watcher = chokidar.watch(CFG.projectsDir, {
  persistent: true, ignoreInitial: false, depth: 4,
  awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
});
const want = (f) => f.endsWith('.jsonl') && !path.basename(f).includes('compact');
watcher.on('add', f => { if (want(f)) store.processFile(f); });
watcher.on('change', f => { if (want(f)) store.processFile(f); });
watcher.on('error', e => console.error('watch error:', e.message));

const server = app.listen(CFG.port, CFG.host, () => {
  console.log(`FleetView running on http://localhost:${CFG.port}/graph.html  (grid: http://localhost:${CFG.port}/)`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${CFG.port} is already in use. Is FleetView already running? Otherwise set "port" in config.json.`);
    process.exit(1);
  }
  throw err;
});
function stop() { watcher.close().finally(() => server.close(() => process.exit(0))); setTimeout(() => process.exit(0), 2000).unref(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

module.exports = { app, store, CFG };
