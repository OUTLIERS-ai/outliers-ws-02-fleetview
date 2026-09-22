// Reading config.json, and saying in plain words when it cannot be read.
//
// Before 2026-09-22 a damaged config.json was swallowed: FleetView started,
// every folder name disappeared, the port went back to 3010, and the only
// trace was 1 line in fleetview.log. Now the fault travels with the settings,
// so /api/meta can carry it and the page can put a banner at the top.
'use strict';
const fs = require('fs');

// Where in the text a character offset falls, counting from 1.
function lineAndColumn(text, offset) {
  const upto = text.slice(0, Math.max(0, offset));
  const line = upto.split('\n').length;
  const column = offset - upto.lastIndexOf('\n');
  return { line, column };
}

function plainReason(message, snippet, atEnd) {
  const m = String(message || '');
  if ((snippet || '').startsWith('//') || /Unexpected token\s*'?\//.test(m)) return 'settings files cannot hold // comments';
  if (atEnd || /Unexpected end of (JSON|input)/i.test(m)) return 'the file stops in the middle: a bracket or a quote was never closed';
  if (/double-quoted property name/i.test(m) || /Unexpected token\s*'?[\}\]]/.test(m) ||
      (snippet || '').startsWith('}') || (snippet || '').startsWith(']')) return 'there is a comma after the last item';
  if (/Unexpected non-whitespace/i.test(m)) return 'there is something after the final }';
  if (/Bad control character|Unterminated string/i.test(m)) return 'a piece of text was never closed with a quote';
  if (/Expected ',' or/i.test(m)) return 'a comma or a bracket is missing';
  return 'a value is missing or mistyped';
}

// Reads the file's bytes. Returns { text, config, error }.
// error is null, or { message, line, column, kind } with message already in plain words.
function readConfigFile(file) {
  let bytes;
  try { bytes = fs.readFileSync(file); }
  catch (e) {
    if (e.code === 'ENOENT') return { text: '', config: {}, error: null, missing: true };
    return { text: '', config: {}, error: { message: 'config.json could not be opened: ' + e.message, line: 1, column: 1, kind: 'unreadable' } };
  }
  if (bytes.length === 0) {
    return { text: '', config: {}, error: { message: 'config.json is empty. Run  python install.py  to write it again.', line: 1, column: 1, kind: 'empty' } };
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: '', config: {}, error: { kind: 'bom', line: 1, column: 1,
      message: 'config.json starts with an invisible byte-order mark, which Notepad and PowerShell add when they save. Save it again as UTF-8 without that mark, or run  python install.py  to write it fresh.' } };
  }
  const text = bytes.toString('utf8');
  if (text.includes('�')) {
    const at = text.indexOf('�');
    const { line, column } = lineAndColumn(text, at);
    return { text, config: {}, error: { kind: 'encoding', line, column,
      message: 'config.json is not saved as UTF-8: line ' + line + ' has a character FleetView cannot read. Save it as UTF-8, or run  python install.py  to write it fresh.' } };
  }
  try {
    const config = JSON.parse(text);
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return { text, config: {}, error: { kind: 'shape', line: 1, column: 1, message: 'config.json must be a set of settings inside { }.' } };
    }
    return { text, config, error: null };
  } catch (e) {
    const m = /position (\d+)/.exec(e.message);
    const pos = m ? parseInt(m[1], 10) : -1;
    const { line, column } = pos >= 0 ? lineAndColumn(text, pos) : { line: 1, column: 1 };
    const snippet = (text.split('\n')[line - 1] || '').trim();
    const atEnd = pos >= 0 && pos >= text.replace(/\s+$/, '').length;
    return { text, config: {}, error: { kind: 'json', line, column,
      message: 'config.json could not be read (line ' + line + ', column ' + column + '): ' + plainReason(e.message, snippet, atEnd) + '.' } };
  }
}

module.exports = { readConfigFile, lineAndColumn, plainReason };
