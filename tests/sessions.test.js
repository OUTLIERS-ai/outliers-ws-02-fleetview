'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { createStore } = require('../lib/sessions');
const { makeDemoHome } = require('./helpers');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (p.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

test('reads the made-up sessions: models, costs, subagent, 1M window, unknown price', () => {
  const demo = makeDemoHome();
  const store = createStore();
  for (const f of walk(demo.projects)) store.processFile(f);
  const S = demo.sessions;
  const v = (id) => store.view(store.sessions.get(id));

  const brain = v(S.brainActive);
  assert.equal(brain.model, 'claude-opus-5');            // the subagent's Haiku must not overwrite it
  assert.equal(brain.status, 'thinking');
  assert.equal(brain.subagents.length, 1);
  assert.equal(brain.subagents[0].agentType, 'note-finder');
  assert.equal(brain.subagents[0].model, 'claude-haiku-4-5-20251001');
  assert.ok(brain.subagents[0].costUSD > 0);
  assert.equal(brain.turnCount, 3);                        // subagent turns are not the session's turns

  const big = v(S.crmLarge);
  assert.equal(big.contextWindow, 1_000_000);
  assert.equal(big.contextWindowSource, 'model id');
  assert.equal(big.contextPct, 42);                        // 420,006 of 1,000,000

  const waiting = v(S.crmWaiting);
  assert.equal(waiting.status, 'waiting');
  assert.equal(waiting.contextWindow, 200_000);

  const other = v(S.otherUnknown);
  assert.equal(other.priceKnown, false);
  assert.equal(other.costUSD, 0);
  assert.ok(other.unpricedTokens > 0);
  assert.deepEqual(other.unpricedModels, ['claude-nova-7']);
});

test('a turn above 200k without [1m] switches the ring to a 1M window', () => {
  const store = createStore();
  const base = { type: 'assistant', sessionId: 's1', cwd: 'C:\\Demo\\CRM', timestamp: new Date().toISOString() };
  store.processEvent({ ...base, message: { id: 'm1', model: 'claude-opus-5', stop_reason: 'end_turn', content: [],
    usage: { input_tokens: 10, cache_read_input_tokens: 300_000, output_tokens: 5 } } });
  const view = store.view(store.sessions.get('s1'));
  assert.equal(view.contextWindow, 1_000_000);
  assert.equal(view.contextWindowSource, 'seen above 200k');
  assert.equal(view.contextPct, 30);
});

test('the same reply logged twice is counted once', () => {
  const store = createStore();
  const ev = { type: 'assistant', sessionId: 's2', timestamp: new Date().toISOString(),
    message: { id: 'same', model: 'claude-sonnet-5', stop_reason: 'end_turn', content: [], usage: { input_tokens: 0, output_tokens: 1_000_000 } } };
  store.processEvent(ev); store.processEvent(ev);
  const view = store.view(store.sessions.get('s2'));
  assert.equal(view.tokensOut, 1_000_000);
  assert.equal(view.costUSD, 10);
  assert.equal(view.turnCount, 1);
});

test('a half-written last line is kept for the next read, not lost', () => {
  const demo = makeDemoHome();
  const f = path.join(demo.projects, 'half', 'half.jsonl');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const line = JSON.stringify({ type: 'assistant', sessionId: 'half', timestamp: new Date().toISOString(),
    message: { id: 'h1', model: 'claude-opus-5', stop_reason: 'end_turn', content: [], usage: { output_tokens: 100 } } });
  fs.writeFileSync(f, line.slice(0, 40));
  const store = createStore();
  store.processFile(f);
  assert.equal(store.sessions.has('half'), false);
  fs.appendFileSync(f, line.slice(40) + '\n');
  store.processFile(f);
  assert.equal(store.view(store.sessions.get('half')).tokensOut, 100);
});
