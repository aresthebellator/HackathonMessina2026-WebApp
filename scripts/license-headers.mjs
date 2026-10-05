#!/usr/bin/env node
/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

// Checks that every first-party source file carries the MIT license header.
//   node scripts/license-headers.mjs        -> report missing headers, exit 1 if any
//   node scripts/license-headers.mjs --fix  -> prepend the header where missing

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

const MARKER = 'SPDX-License-Identifier: MIT';

const NOTICE = [
  'This file is part of Wikingo',
  '<https://github.com/aresthebellator/HackathonMessina2026-WebApp>.',
  'Copyright (c) 2026 aresthebellator (exertia group).',
  '',
  MARKER,
  'Licensed under the MIT License. See the LICENSE file in the project root',
  'for the full license text.',
];

const indent = (lines, prefix) => lines.map((line) => (line ? prefix + line : '')).join('\n');

const blockComment = `/*\n${indent(NOTICE, '  ')}\n*/\n`;
const htmlComment = `<!--\n${indent(NOTICE, '  ')}\n-->\n`;
const hashComment = `${NOTICE.map((line) => (line ? `# ${line}` : '#')).join('\n')}\n`;

const HEADERS = {
  '.ts': blockComment,
  '.tsx': blockComment,
  '.js': blockComment,
  '.mjs': blockComment,
  '.cjs': blockComment,
  '.css': blockComment,
  '.html': htmlComment,
  '.yml': hashComment,
  '.yaml': hashComment,
};

// Only first-party code: the skill collections at the repository root are
// third-party downloads that keep their own licenses (see SKILLS_INDEX.md).
const INCLUDED = [/^src\//, /^server\//, /^public\//, /^scripts\//, /^\.github\/workflows\//, /^[^/]+$/];

const fix = process.argv.includes('--fix');

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((file) => INCLUDED.some((pattern) => pattern.test(file)))
  .filter((file) => extname(file) in HEADERS);

const missing = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (source.split('\n').slice(0, 15).some((line) => line.includes(MARKER))) continue;

  missing.push(file);
  if (!fix) continue;

  // Match the file's line endings (Git may check files out with CRLF on Windows).
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const header = HEADERS[extname(file)].replace(/\n/g, eol);
  // Keep shebangs and doctypes as the very first line.
  const firstLine = source.match(/^(#!.*|<!DOCTYPE[^>]*>)\r?\n/i);
  const updated = firstLine
    ? firstLine[0] + header + source.slice(firstLine[0].length)
    : header + (/^\s*$/.test(source.split('\n')[0]) ? '' : eol) + source;
  writeFileSync(file, updated);
}

if (missing.length === 0) {
  console.log(`License headers OK (${files.length} files checked).`);
} else if (fix) {
  console.log(`Added the license header to ${missing.length} file(s):\n  ${missing.join('\n  ')}`);
} else {
  console.error(`Missing license header in ${missing.length} file(s):\n  ${missing.join('\n  ')}`);
  console.error('Run `npm run license:fix` to add it.');
  process.exit(1);
}
