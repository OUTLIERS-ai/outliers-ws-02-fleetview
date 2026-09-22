'use strict';
const test = require('node:test');
const assert = require('node:assert');
const P = require('../lib/pricing');

test('model ids are normalised before lookup', () => {
  assert.equal(P.normaliseModel('claude-opus-5[1m]'), 'claude-opus-5');
  assert.equal(P.normaliseModel('claude-haiku-4-5-20251001'), 'claude-haiku-4-5');
  assert.equal(P.normaliseModel('anthropic.claude-sonnet-5'), 'claude-sonnet-5');
  assert.equal(P.normaliseModel('claude-haiku-4-5@20251001'), 'claude-haiku-4-5');
  assert.equal(P.normaliseModel('claude-3-5-haiku-20241022'), 'claude-3-5-haiku');
});

test('current models have the rates checked on 2026-09-22', () => {
  assert.equal(P.PRICES_CHECKED, '2026-09-22');
  assert.deepEqual([P.getPricing('claude-opus-5').input, P.getPricing('claude-opus-5').output], [5, 25]);
  assert.deepEqual([P.getPricing('claude-sonnet-5').input, P.getPricing('claude-sonnet-5').output], [2, 10]);
  assert.deepEqual([P.getPricing('claude-fable-5-1').input, P.getPricing('claude-fable-5-1').output], [10, 50]);
  assert.equal(P.getPricing('claude-fable-5-1').cacheRead, 0.25);
  assert.deepEqual([P.getPricing('claude-haiku-4-5-20251001').input, P.getPricing('claude-haiku-4-5').output], [1, 5]);
  assert.equal(P.getPricing('claude-opus-4-1').output, 75);
});

test('a model with no row is unknown, never a guess', () => {
  assert.equal(P.getPricing('claude-nova-7'), null);
  assert.equal(P.getPricing('claude-opus-4-9'), null);
  assert.equal(P.getPricing(''), null);
  assert.equal(P.costOfUsage('claude-nova-7', { output_tokens: 1000 }), null);
});

test('cost splits 5-minute and 1-hour cache writes', () => {
  const u = { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_read_input_tokens: 1_000_000,
    cache_creation_input_tokens: 2_000_000, cache_creation: { ephemeral_5m_input_tokens: 1_000_000, ephemeral_1h_input_tokens: 1_000_000 } };
  // Opus 5: 5 input + 25 output + 0.5 cache read + 6.25 five-minute write + 10 one-hour write
  assert.equal(P.costOfUsage('claude-opus-5', u), 46.75);
  // no split given: all writes treated as 5-minute
  assert.equal(P.costOfUsage('claude-sonnet-5', { cache_creation_input_tokens: 1_000_000 }), 2.5);
});

test('fast mode uses the premium rates', () => {
  assert.equal(P.costOfUsage('claude-opus-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, speed: 'fast' }), 60);
});

test('context window: 200k unless [1m] or a turn went over 200k', () => {
  assert.deepEqual(P.contextWindowFor('claude-opus-5', 150_000), { size: 200_000, source: 'assumed' });
  assert.deepEqual(P.contextWindowFor('claude-opus-5[1m]', 10), { size: 1_000_000, source: 'model id' });
  assert.deepEqual(P.contextWindowFor('claude-opus-5', 420_000), { size: 1_000_000, source: 'seen above 200k' });
});
