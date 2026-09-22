// Session state built from Claude Code's own log files
// (<projects>/<folder>/<session>.jsonl and <session>/subagents/agent-*.jsonl).
//
// The parsing and status rules come from Stargx/claude-code-dashboard
// (MIT, Copyright (c) 2025 Cold Beam Games). Changes made here:
//  - cost is worked out per reply with THAT reply's model (a Haiku subagent
//    inside an Opus session is priced as Haiku), split into 5-minute and 1-hour
//    cache writes; a model with no price row is counted as "unpriced", never guessed
//  - the context ring uses main-thread turns only (subagent turns used to
//    overwrite it) and a 200k or 1M window per pricing.contextWindowFor
//  - a half-written last line is kept for the next read instead of being lost
//  - status is worked out when asked, not frozen at read time
'use strict';
const fs = require('fs');
const path = require('path');
const { costOfUsage, getPricing, contextWindowFor } = require('./pricing');

const SKIP_TYPES = new Set(['file-history-snapshot', 'file-history-delta', 'queue-operation', 'last-prompt', 'mode', 'permission-mode', 'atis-latch']);

function lastPart(p) {
  const parts = String(p || '').split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || '';
}

function createStore(opts = {}) {
  const now = opts.now || (() => Date.now());
  const sessions = new Map();
  const seen = new Map();       // sessionId -> Map(messageId -> usage so far)
  const offsets = new Map();    // file -> bytes consumed
  const busy = new Set();       // files being read right now
  const again = new Set();      // files that changed while being read

  function getSession(id) {
    let s = sessions.get(id);
    if (!s) {
      s = {
        sessionId: id, cwd: '', label: '', title: '', model: '', gitBranch: '',
        tokensIn: 0, tokensOut: 0, cacheCreationIn: 0, cacheReadIn: 0,
        costUSD: 0, unpricedTokens: 0, unpricedModels: [],
        turnCount: 0, activeFiles: [], recentLog: [],
        startedAt: null, lastEventAt: null, lastEventType: '', lastContentTypes: [],
        lastTurnInputTotal: 0, maxTurnInput: 0,
        permissionMode: '', version: '', subagents: {},
      };
      sessions.set(id, s);
      seen.set(id, new Map());
    }
    return s;
  }

  function log(s, entry) {
    s.recentLog.push(entry);
    if (s.recentLog.length > 30) s.recentLog = s.recentLog.slice(-30);
  }

  function getSub(s, agentId) {
    if (!s.subagents[agentId]) {
      s.subagents[agentId] = { agentId, agentType: '', task: '', model: '', tokensOut: 0, costUSD: 0, lastEventAt: null, startedAt: null };
    }
    return s.subagents[agentId];
  }

  function processEvent(event, meta = {}) {
    if (!event || !event.sessionId) return;
    // Claude Code writes a short title for each session (no timestamp on that line).
    if (event.type === 'ai-title' && event.aiTitle) { getSession(event.sessionId).title = String(event.aiTitle).slice(0, 80); return; }
    if (!event.timestamp) return;
    if (SKIP_TYPES.has(event.type)) return;
    const s = getSession(event.sessionId);
    const ts = event.timestamp;
    const isSub = !!(event.agentId && (event.isSidechain || meta.agentId));
    if (event.agentId && String(event.agentId).startsWith('acompact')) return; // context-compaction helper, not a real subagent

    if (!s.startedAt || ts < s.startedAt) s.startedAt = ts;
    if (!s.lastEventAt || ts >= s.lastEventAt) {
      s.lastEventAt = ts;
      if (!isSub) s.lastEventType = event.type;
    }
    if (event.cwd && !s.cwd) { s.cwd = event.cwd; s.label = lastPart(event.cwd); }
    if (event.gitBranch && !s.gitBranch) s.gitBranch = event.gitBranch;
    if (event.version) s.version = event.version;
    if (event.permissionMode) s.permissionMode = event.permissionMode;

    const msg = event.message || {};
    const content = msg.content;
    const types = Array.isArray(content) ? content.map(c => c && c.type) : (typeof content === 'string' ? ['text'] : []);
    if (!isSub) s.lastContentTypes = types;

    let sub = null;
    if (isSub) {
      sub = getSub(s, event.agentId);
      if (!sub.startedAt) sub.startedAt = ts;
      if (!sub.lastEventAt || ts > sub.lastEventAt) sub.lastEventAt = ts;
      if (meta.agentType && !sub.agentType) sub.agentType = meta.agentType;
      if (meta.description && !sub.task) sub.task = String(meta.description).slice(0, 120);
      if (!sub.task && event.type === 'user') {
        const t = typeof content === 'string' ? content : (Array.isArray(content) ? (content.find(c => c && c.type === 'text') || {}).text : '');
        if (t) sub.task = t.slice(0, 120);
      }
    }

    if (event.type === 'assistant' && msg.usage) {
      const model = msg.model && msg.model !== '<synthetic>' ? msg.model : '';
      if (model && !isSub) s.model = model;
      if (model && sub) sub.model = model;
      const u = msg.usage;
      const key = (msg.id || event.uuid || ts) + (isSub ? '@' + event.agentId : '');
      const seenMap = seen.get(event.sessionId);
      const prev = seenMap.get(key) || { in: 0, out: 0, cw: 0, cr: 0, cost: 0, turned: false };
      const cur = {
        in: u.input_tokens || 0, out: u.output_tokens || 0,
        cw: u.cache_creation_input_tokens || 0, cr: u.cache_read_input_tokens || 0,
      };
      // The same reply can be logged on several lines with the usage so far; count only the growth.
      const dIn = Math.max(0, cur.in - prev.in), dOut = Math.max(0, cur.out - prev.out);
      const dCw = Math.max(0, cur.cw - prev.cw), dCr = Math.max(0, cur.cr - prev.cr);
      s.tokensIn += dIn; s.tokensOut += dOut; s.cacheCreationIn += dCw; s.cacheReadIn += dCr;
      const priceModel = model || (isSub ? sub.model : s.model);
      const total = costOfUsage(priceModel, u);
      let costDelta = 0;
      if (total === null) {
        s.unpricedTokens += dIn + dOut + dCw + dCr;
        const nm = priceModel || '(no model name)';
        if (!s.unpricedModels.includes(nm)) s.unpricedModels.push(nm);
      } else {
        costDelta = Math.max(0, total - prev.cost);
        s.costUSD += costDelta;
      }
      if (sub) { sub.tokensOut += dOut; sub.costUSD += costDelta; }
      const turned = prev.turned || !!msg.stop_reason;
      if (!isSub && msg.stop_reason && !prev.turned) s.turnCount++;
      seenMap.set(key, { ...cur, cost: total === null ? prev.cost : Math.max(prev.cost, total), turned });

      if (!isSub) {
        const turnInput = cur.in + cur.cw + cur.cr;
        s.lastTurnInputTotal = turnInput;
        if (turnInput > s.maxTurnInput) s.maxTurnInput = turnInput;
      }

      if (Array.isArray(content)) {
        for (const b of content) {
          if (!b) continue;
          if (b.type === 'tool_use') {
            const fp = b.input && (b.input.file_path || b.input.path);
            if (!isSub) log(s, { time: ts, type: 'tool', msg: b.name + (fp ? ': ' + lastPart(fp) : '') });
            if (fp && typeof fp === 'string') {
              const set = new Set([lastPart(fp), ...s.activeFiles]);
              s.activeFiles = [...set].slice(0, 10);
            }
          } else if (b.type === 'text' && b.text && !isSub) {
            log(s, { time: ts, type: 'think', msg: b.text.slice(0, 120) });
          }
        }
      }
    }

    if (event.type === 'user' && !isSub && msg.role === 'user') {
      const t = typeof content === 'string' ? content : (Array.isArray(content) ? (content.find(c => c && c.type === 'text') || {}).text : '');
      if (t) log(s, { time: ts, type: 'user', msg: String(t).slice(0, 120) });
    }
  }

  // Subagent files carry a small .meta.json next to them (agent type + description).
  function readMeta(filePath) {
    const m = /agent-([^\\/]+)\.jsonl$/.exec(filePath);
    if (!m) return {};
    try {
      const j = JSON.parse(fs.readFileSync(filePath.replace(/\.jsonl$/, '.meta.json'), 'utf8'));
      return { agentId: m[1], agentType: j.agentType || '', description: j.description || '' };
    } catch { return { agentId: m[1] }; }
  }

  // Reads whatever has been added to a log file since last time. Synchronous so
  // tests and the first start-up scan are predictable; each read is one chunk.
  function processFile(filePath) {
    if (!filePath.endsWith('.jsonl')) return;
    if (busy.has(filePath)) { again.add(filePath); return; }
    busy.add(filePath);
    try {
      let stat;
      try { stat = fs.statSync(filePath); } catch { return; }
      const start = offsets.get(filePath) || 0;
      if (stat.size <= start) return;
      const len = stat.size - start;
      const buf = Buffer.alloc(len);
      const fd = fs.openSync(filePath, 'r');
      try { fs.readSync(fd, buf, 0, len, start); } finally { fs.closeSync(fd); }
      const lastNl = buf.lastIndexOf(0x0a);
      if (lastNl < 0) return; // no complete line yet; try again next change
      offsets.set(filePath, start + lastNl + 1);
      const meta = readMeta(filePath);
      const text = buf.slice(0, lastNl).toString('utf8');
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        let ev;
        try { ev = JSON.parse(line); } catch { continue; }
        processEvent(ev, meta);
      }
    } finally {
      busy.delete(filePath);
      if (again.delete(filePath)) processFile(filePath);
    }
  }

  function deriveStatus(s) {
    if (!s.lastEventAt) return 'idle';
    const elapsed = now() - new Date(s.lastEventAt).getTime();
    if (elapsed > 60_000) return 'idle';
    if (elapsed < 15_000) {
      if (s.lastEventType === 'assistant') {
        if (s.lastContentTypes.includes('tool_use')) return 'thinking';
        if (s.lastContentTypes.includes('thinking')) return 'thinking';
        if (s.lastContentTypes.includes('text')) return 'waiting';
      }
      if (s.lastEventType === 'progress' || s.lastEventType === 'user') return 'thinking';
    }
    // A subagent still working keeps its parent "thinking".
    for (const sub of Object.values(s.subagents)) {
      if (sub.lastEventAt && now() - new Date(sub.lastEventAt).getTime() < 15_000) return 'thinking';
    }
    return 'idle';
  }

  function contextOf(s) {
    const w = contextWindowFor(s.model, s.maxTurnInput);
    return { contextWindow: w.size, contextWindowSource: w.source, contextPct: Math.min(100, Math.round((s.lastTurnInputTotal / w.size) * 100)) };
  }

  function view(s) {
    const t = now();
    const subs = Object.values(s.subagents).map(x => ({
      agentId: x.agentId, agentType: x.agentType, task: x.task, model: x.model,
      tokensOut: x.tokensOut, costUSD: Math.round(x.costUSD * 100) / 100,
      lastEventAt: x.lastEventAt,
      status: x.lastEventAt && t - new Date(x.lastEventAt).getTime() < 15_000 ? 'thinking' : 'idle',
    }));
    return {
      sessionId: s.sessionId, cwd: s.cwd, label: s.label, title: s.title, gitBranch: s.gitBranch, model: s.model,
      priceKnown: !!getPricing(s.model), status: deriveStatus(s),
      costUSD: Math.round(s.costUSD * 100) / 100, unpricedTokens: s.unpricedTokens, unpricedModels: s.unpricedModels.slice(),
      tokensIn: s.tokensIn, tokensOut: s.tokensOut, cacheRead: s.cacheReadIn, cacheCreate: s.cacheCreationIn,
      turnCount: s.turnCount, lastTurnInputTotal: s.lastTurnInputTotal, ...contextOf(s),
      activeFiles: s.activeFiles.slice(0, 6), recentLog: s.recentLog.slice(-10),
      lastEventAt: s.lastEventAt, startedAt: s.startedAt, permissionMode: s.permissionMode,
      subagents: subs,
    };
  }

  return { processEvent, processFile, deriveStatus, view, sessions, _offsets: offsets };
}

module.exports = { createStore, lastPart };
