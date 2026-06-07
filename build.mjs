#!/usr/bin/env node
// build.mjs — Rikkei Managers data pipeline
// -----------------------------------------------------------------------------
//   rikkei-managers.csv  ──parse+clean──▶  managers.clean.json   (editable source)
//                                   └──compact──▶ gzip ──▶ public/data.gz   (shipped)
//
// The data is PUBLIC (no password). It is gzip-compressed only — for transfer size,
// not secrecy. The browser fetches data.gz, gunzips it, and renders (see src/lib/data.js).
// The cleartext CSV and managers.clean.json stay git-ignored; the shipped artifact is
// the compact gzipped JSON in public/data.gz.
//
// Usage:
//   node build.mjs                 rebuild from the CSV
//   node build.mjs --from-json     rebuild from managers.clean.json (after hand-edits)
// -----------------------------------------------------------------------------

import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const p = (f) => join(HERE, f);

const EMAIL_DOMAIN = '@rikkeisoft.com'; // most-common domain, factored out of the payload

// ---------------------------------------------------------------------------
// CSV parser — quoted fields, escaped "" quotes, embedded commas/newlines
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const EXEC_GROUP = 'Ban Điều hành · Executive Team';

function normalizeDivision(raw) {
  let d = clean(raw);
  if (!d) return '';
  d = d.replace(/Divison/gi, 'Division');   // fix recurring typo
  d = d.replace(/\s*,\s*/g, ', ');          // tidy "DN1,DN3" -> "DN1, DN3"
  return d;
}

// Notes column → { label (kept verbatim from the CSV), tier (internal, for styling only) }
function rankInfo(note) {
  const raw = clean(note);
  if (!raw) return { label: null, tier: null };
  const n = raw.toLowerCase();
  let tier = null;
  if (n.includes('executive')) tier = 'exec';
  else if (n.includes('co-founder') || n.includes('founder')) tier = 'founder';
  else if (n.includes('bom')) tier = 'bom';
  else if (n.includes('khách mời') || n.includes('guest')) tier = 'guest';
  return { label: raw, tier };       // label is the original note text — never translated
}

function slugFor(email, name) {
  if (email) return email.split('@')[0].toLowerCase();
  return clean(name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildModel(csvText) {
  const rows = parseCSV(csvText);
  const groups = new Map();
  let lastDivision = '';
  let total = 0;

  for (let r = 1; r < rows.length; r++) {       // skip header
    const [divRaw, titleRaw, nameRaw, emailRaw, noteRaw] = rows[r];
    const name = clean(nameRaw);
    if (!name) continue;                          // skip blank rows

    const div = normalizeDivision(divRaw);
    if (div) lastDivision = div;                  // forward-fill sparse column
    const division = lastDivision || EXEC_GROUP;

    const email = clean(emailRaw).toLowerCase() || null;
    const { label: rank, tier } = rankInfo(noteRaw);
    const person = { name, title: clean(titleRaw) || null, email, rank, tier, slug: slugFor(email, name) };

    if (!groups.has(division)) groups.set(division, []);
    groups.get(division).push(person);
    total++;
  }
  const divisions = [...groups.entries()].map(([name, people]) => ({ name, people }));
  return { generated: new Date().toISOString().slice(0, 10), total, divisions };
}

// ---------------------------------------------------------------------------
// Compaction — drop repeated keys, factor out the shared email domain.
// Person tuple: [name, title|0, email|0, rank|0]   (tier + slug derived client-side)
//   email stored as local-part when it ends with EMAIL_DOMAIN, else the full address.
// ---------------------------------------------------------------------------
function compact(model) {
  const emailCell = (e) => {
    if (!e) return 0;
    return e.endsWith(EMAIL_DOMAIN) ? e.slice(0, -EMAIL_DOMAIN.length) : e;
  };
  return {
    g: model.generated,
    t: model.total,
    dom: EMAIL_DOMAIN,
    d: model.divisions.map((dv) => [
      dv.name,
      dv.people.map((x) => [x.name, x.title || 0, emailCell(x.email), x.rank || 0]),
    ]),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const fromJson = process.argv.includes('--from-json');

let model;
if (fromJson) {
  model = JSON.parse(await readFile(p('managers.clean.json'), 'utf8'));
  console.log('• loaded cleaned data from managers.clean.json');
} else {
  model = buildModel(await readFile(p('rikkei-managers.csv'), 'utf8'));
  await writeFile(p('managers.clean.json'), JSON.stringify(model, null, 2) + '\n');
  console.log('• wrote managers.clean.json (editable source, git-ignored)');
}

const plaintext = JSON.stringify(compact(model));
const gz = gzipSync(Buffer.from(plaintext, 'utf8'), { level: 9 });
await writeFile(p('public/data.gz'), gz);

const pct = ((gz.length / Buffer.byteLength(plaintext)) * 100).toFixed(0);
console.log(`• ${model.total} people · ${model.divisions.length} divisions`);
console.log(`• compact ${Buffer.byteLength(plaintext)} B → gzip ${gz.length} B  (${pct}% of plaintext)`);
console.log('• wrote public/data.gz  (public, no password)');
