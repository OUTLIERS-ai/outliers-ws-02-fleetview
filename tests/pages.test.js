'use strict';
// Faults a reader of the 2 pages can see, pinned here so they cannot come back.
// Found in the second review, 2026-09-22: "$$24.69", "Second Brain · Second Brain",
// a top bar still shouting "6 need you" over a banner saying the page is dead,
// a red ring drawn on an amber circle, and labels colliding from 5 sessions up.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');

test('the card page prints 1 dollar sign, not 2', () => {
  const src = read('cards.html');
  assert.doesNotMatch(src, /'stat-label' \}, '\$'\)/, "the header label was '$' and the value already starts with $");
  assert.match(src, /if paid per token/, 'the header says what the figure is');
});

test('the card page prints a folder name once', () => {
  const src = read('cards.html');
  assert.doesNotMatch(src, /\(s\.group \|\| 'Other'\) \+ ' · '/,
    'this printed the folder name and then the same word again as the clickable folder');
  assert.match(src, /folderLine\(/, 'one function decides how the folder line reads');
});

test('when FleetView stops, the whole top bar goes quiet', () => {
  const src = read('graph.html');
  assert.match(src, /#top\.stopped/, 'the stopped state has its own greyed-out rules');
  assert.match(src, /classList\.toggle\('stopped'/, 'setStopped greys the top bar as well as the circles');
  assert.match(src, /needed you at/, 'the count is dated rather than claimed as now');
});

test('the context ring never turns red on top of a status colour', () => {
  const src = read('graph.html');
  assert.doesNotMatch(src, /pct > 0\.85 \? C\.red/, 'a red ring round an amber circle is 2 alarms on 1 dot');
  assert.match(src, /OVER_FULL/, 'over 85% is drawn as its own mark, not as the ring colour');
});

test('the Needs you strip is newest first and is capped at 15% of the screen', () => {
  const src = read('graph.html');
  assert.match(src, /newestFirst/, 'the freshest question is the one still live in a terminal');
  assert.match(src, /NEEDS_MAX_SHARE = 0\.15/, 'the strip may never take more than about 15% of the screen height');
});

test('the columns layout starts before labels can collide', () => {
  const src = read('graph.html');
  assert.match(src, /COLS_PER_FOLDER = 4/, 'above 4 sessions in 1 folder the ring layout writes labels on top of each other');
});
