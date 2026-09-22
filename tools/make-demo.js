#!/usr/bin/env node
// Writes MADE-UP Claude Code session logs into <root>/.claude/projects so you can
// see FleetView working without touching your real history. Used by the tests
// and for the guide's screenshots.
//
//   node tools/make-demo.js <root>            write the demo once
//   node tools/make-demo.js <root> --live     keep 2 sessions "working" (Ctrl+C to stop)
//
// It also writes <root>/fleetview-demo-config.json with the demo folders.
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) { console.error('usage: node tools/make-demo.js <root-folder> [--live]'); process.exit(2); }
const live = process.argv.includes('--live');
const projects = path.join(root, '.claude', 'projects');

const FOLDERS = [
  { name: 'Second Brain', path: 'C:\\Demo\\Second Brain' },
  { name: 'CRM', path: 'C:\\Demo\\CRM' },
  { name: 'Content Engine', path: 'C:\\Demo\\Content Engine' },
];

const ago = (sec) => new Date(Date.now() - sec * 1000).toISOString();
const encode = (cwd) => cwd.replace(/[^A-Za-z0-9]/g, '-');
let seq = 0;
const id = (p) => `${p}_${(++seq).toString(36).padStart(6, '0')}`;

function user(sessionId, cwd, ts, text, extra = {}) {
  return { type: 'user', sessionId, cwd, gitBranch: extra.branch || 'main', version: '2.3.0', timestamp: ts,
    uuid: id('u'), isSidechain: !!extra.agentId, agentId: extra.agentId, message: { role: 'user', content: text } };
}
function assistant(sessionId, cwd, ts, model, usage, content, extra = {}) {
  return { type: 'assistant', sessionId, cwd, gitBranch: extra.branch || 'main', version: '2.3.0', timestamp: ts,
    uuid: id('a'), isSidechain: !!extra.agentId, agentId: extra.agentId,
    message: { id: extra.msgId || id('msg'), model, role: 'assistant', type: 'message', stop_reason: extra.stop === false ? null : 'end_turn', content,
      usage: { input_tokens: 6, output_tokens: 900, cache_creation_input_tokens: 4000, cache_read_input_tokens: 60000,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 4000 }, service_tier: 'standard', ...usage } } };
}
const text = (t) => [{ type: 'text', text: t }];
const tool = (name, file) => [{ type: 'tool_use', id: id('toolu'), name, input: file ? { file_path: file } : { command: 'ls' } }];

function write(file, events) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, events.map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.renameSync(tmp, file);
}

const S = {
  brainActive: '11111111-aaaa-4aaa-8aaa-000000000001',
  brainIdle: '11111111-aaaa-4aaa-8aaa-000000000002',
  crmWaiting: '11111111-aaaa-4aaa-8aaa-000000000003',
  crmLarge: '11111111-aaaa-4aaa-8aaa-000000000004',
  contentWorking: '11111111-aaaa-4aaa-8aaa-000000000005',
  otherUnknown: '11111111-aaaa-4aaa-8aaa-000000000006',
  yesterday: '11111111-aaaa-4aaa-8aaa-000000000007',
};
const SUB_ID = 'a1b2c3d4e5f60718';

function build() {
  const brain = FOLDERS[0].path, crm = FOLDERS[1].path, content = FOLDERS[2].path;
  const other = 'C:\\Demo\\Scratch\\invoice-tool';
  const files = {};

  // 1. Second Brain, working now, with one subagent (Haiku) running.
  files[path.join(projects, encode(brain), S.brainActive + '.jsonl')] = [
    user(S.brainActive, brain, ago(600), 'Tidy this week\'s meeting notes into the Projects folder'),
    assistant(S.brainActive, brain, ago(590), 'claude-opus-5', {}, text('I will read the notes first.')),
    assistant(S.brainActive, brain, ago(400), 'claude-opus-5', { output_tokens: 2400, cache_read_input_tokens: 95000 }, tool('Read', 'C:\\Demo\\Second Brain\\Inbox\\2026-09-21 call with Priya Shah Design.md')),
    assistant(S.brainActive, brain, ago(3), 'claude-opus-5', { output_tokens: 1800, cache_read_input_tokens: 118000 }, tool('Agent'), { stop: true }),
  ];
  files[path.join(projects, encode(brain), S.brainActive, 'subagents', `agent-${SUB_ID}.jsonl`)] = [
    user(S.brainActive, brain, ago(120), 'Find every note that mentions the bookkeeping review', { agentId: SUB_ID }),
    assistant(S.brainActive, brain, ago(4), 'claude-haiku-4-5-20251001', { output_tokens: 3200, cache_read_input_tokens: 40000 }, tool('Grep'), { agentId: SUB_ID }),
  ];
  fs.mkdirSync(path.join(projects, encode(brain), S.brainActive, 'subagents'), { recursive: true });
  fs.writeFileSync(path.join(projects, encode(brain), S.brainActive, 'subagents', `agent-${SUB_ID}.meta.json`),
    JSON.stringify({ agentType: 'note-finder', description: 'Find bookkeeping review notes' }));

  // 2. Second Brain, idle since this morning (Sonnet 5).
  files[path.join(projects, encode(brain), S.brainIdle + '.jsonl')] = [
    user(S.brainIdle, brain, ago(3 * 3600), 'Write today\'s daily note'),
    assistant(S.brainIdle, brain, ago(3 * 3600 - 30), 'claude-sonnet-5', { output_tokens: 5200 }, text('Daily note written.')),
  ];

  // 3. CRM, finished a reply and waiting for you.
  files[path.join(projects, encode(crm), S.crmWaiting + '.jsonl')] = [
    user(S.crmWaiting, crm, ago(90), 'Who should I follow up with today?', { branch: 'follow-ups' }),
    assistant(S.crmWaiting, crm, ago(60), 'claude-opus-5', { output_tokens: 3100, cache_read_input_tokens: 70000 }, tool('Read', 'C:\\Demo\\CRM\\Today.md'), { branch: 'follow-ups' }),
    assistant(S.crmWaiting, crm, ago(8), 'claude-opus-5', { output_tokens: 1400, cache_read_input_tokens: 76000 }, text('Three people to follow up: Sam the bookkeeper, Priya Shah Design, and Leo at Northside Joinery.'), { branch: 'follow-ups' }),
  ];

  // 4. CRM, a long 1M-context session (model id ends in [1m]; last turn 420,000 tokens).
  files[path.join(projects, encode(crm), S.crmLarge + '.jsonl')] = [
    user(S.crmLarge, crm, ago(5400), 'Read every contact note and rebuild the pipeline summary'),
    assistant(S.crmLarge, crm, ago(5000), 'claude-opus-5[1m]', { output_tokens: 12000, cache_read_input_tokens: 250000, cache_creation_input_tokens: 80000, cache_creation: { ephemeral_5m_input_tokens: 80000, ephemeral_1h_input_tokens: 0 } }, text('Reading contact notes.')),
    assistant(S.crmLarge, crm, ago(1800), 'claude-opus-5[1m]', { output_tokens: 9000, cache_read_input_tokens: 400000, cache_creation_input_tokens: 20000 }, text('Pipeline summary rebuilt.')),
  ];

  // 5. Content Engine, working now on Fable 5.1.
  files[path.join(projects, encode(content), S.contentWorking + '.jsonl')] = [
    user(S.contentWorking, content, ago(300), 'Draft three post ideas from last week\'s client wins', { branch: 'drafts' }),
    assistant(S.contentWorking, content, ago(2), 'claude-fable-5-1', { output_tokens: 4200, cache_read_input_tokens: 52000 }, tool('Write', 'C:\\Demo\\Content Engine\\drafts\\idea-1.md'), { branch: 'drafts', stop: true }),
  ];

  // 6. A folder not in the config -> "Other", on a model with no price row.
  files[path.join(projects, encode(other), S.otherUnknown + '.jsonl')] = [
    user(S.otherUnknown, other, ago(2400), 'Fix the rounding on the invoice totals'),
    assistant(S.otherUnknown, other, ago(2300), 'claude-nova-7', { output_tokens: 700 }, text('Fixed.')),
  ];

  // 7. Yesterday: hidden on the graph unless ?all=1.
  files[path.join(projects, encode(brain), S.yesterday + '.jsonl')] = [
    user(S.yesterday, brain, ago(30 * 3600), 'Weekly review'),
    assistant(S.yesterday, brain, ago(30 * 3600 - 20), 'claude-opus-4-8', {}, text('Review done.')),
  ];

  const titles = {
    brainActive: 'Tidy meeting notes', brainIdle: 'Daily note', crmWaiting: 'Who to follow up today',
    crmLarge: 'Rebuild pipeline summary', contentWorking: 'Post ideas from client wins',
    otherUnknown: 'Invoice rounding fix', yesterday: 'Weekly review',
  };
  for (const [f, ev] of Object.entries(files)) {
    const sid = ev[0].sessionId;
    const key = Object.keys(S).find(k => S[k] === sid);
    if (!f.includes('subagents') && titles[key]) ev.push({ type: 'ai-title', aiTitle: titles[key], sessionId: sid });
    write(f, ev);
  }
  // Made-up token-panel answer, in the shape ccusage gives, for screenshots only.
  const start = new Date(); start.setMinutes(0, 0, 0); start.setHours(start.getHours() - 2);
  const usageDemo = {
    block: { id: start.toISOString(), isActive: true, startTime: start.toISOString(),
      endTime: new Date(start.getTime() + 5 * 3600e3).toISOString(), totalTokens: 41_250_000, costUSD: 38.4,
      tokenCounts: { inputTokens: 5200, outputTokens: 310_000, cacheCreationInputTokens: 1_900_000, cacheReadInputTokens: 39_034_800 },
      burnRate: { tokensPerMinute: 290_000 }, projection: { totalTokens: 78_900_000, remainingMinutes: 168 } },
    week: { tokens: 612_000_000, cost: 540.2, days: 7 },
    error: null, fetchedAt: Date.now(),
  };
  const usageFile = path.join(root, 'fleetview-demo-usage.json');
  fs.writeFileSync(usageFile, JSON.stringify(usageDemo, null, 2));
  const cfg = { port: 3010, folders: FOLDERS, projects_dir: projects, usage: { enabled: false } };
  const cfgFile = path.join(root, 'fleetview-demo-config.json');
  fs.writeFileSync(cfgFile + '.tmp', JSON.stringify(cfg, null, 2));
  fs.renameSync(cfgFile + '.tmp', cfgFile);
  return { projects, config: cfgFile, usageDemo: usageFile, sessions: S, subagentId: SUB_ID };
}

const result = build();
if (require.main === module) {
  console.log(JSON.stringify(result));
  if (live) {
    // Keep the two "working" sessions and the subagent fresh so they stay green.
    const brain = FOLDERS[0].path, crm = FOLDERS[1].path, content = FOLDERS[2].path;
    const steps = [['Read', 'Inbox\\2026-09-19 notes.md'], ['Edit', 'Projects\\Bookkeeping review.md'], ['Grep', ''], ['Write', 'Projects\\Website refresh.md']];
    let step = 0;
    setInterval(() => {
      const [toolName, rel] = steps[step++ % steps.length];
      const add = (file, ev) => fs.appendFileSync(file, JSON.stringify(ev) + '\n');
      add(path.join(projects, encode(brain), S.brainActive + '.jsonl'),
        assistant(S.brainActive, brain, ago(0), 'claude-opus-5', { output_tokens: 600, cache_read_input_tokens: 121000 }, tool(toolName, rel ? 'C:\\Demo\\Second Brain\\' + rel : '')));
      add(path.join(projects, encode(brain), S.brainActive, 'subagents', `agent-${SUB_ID}.jsonl`),
        assistant(S.brainActive, brain, ago(0), 'claude-haiku-4-5-20251001', { output_tokens: 300, cache_read_input_tokens: 41000 }, tool('Grep'), { agentId: SUB_ID }));
      add(path.join(projects, encode(crm), S.crmWaiting + '.jsonl'),
        assistant(S.crmWaiting, crm, ago(6), 'claude-opus-5', { output_tokens: 0, cache_read_input_tokens: 76000 }, text('Want me to draft the three follow-up messages?'), { branch: 'follow-ups', msgId: 'msg_waiting_live' }));
      add(path.join(projects, encode(content), S.contentWorking + '.jsonl'),
        assistant(S.contentWorking, content, ago(0), 'claude-fable-5-1', { output_tokens: 500, cache_read_input_tokens: 53000 }, tool('Write', 'C:\\Demo\\Content Engine\\drafts\\idea-2.md'), { branch: 'drafts' }));
    }, 6000);
  }
}
