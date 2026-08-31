#!/usr/bin/env node
/**
 * Build the dashboard from data/*.json into two self-contained outputs:
 *   dist/index.html    — complete page, for GitHub Pages / local / any static host
 *
 *   node scripts/build.js
 *
 * Refuses to build if checks/report.json says BLOCKED (override with --force).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const p = (...a) => path.join(ROOT, ...a);
const FORCE = process.argv.includes('--force');

// ---- gate on the verification report -----------------------------------
let checks = null;
try { checks = JSON.parse(fs.readFileSync(p('checks', 'report.json'), 'utf8')); }
catch { console.error('! No checks/report.json — run: node checks/verify.js'); process.exit(1); }

if (checks.verdict !== 'PASS' && !FORCE) {
  console.error(`\n✗ BUILD REFUSED — verification verdict is ${checks.verdict}`);
  console.error(`  ${checks.blocking.length} blocking failure(s). Fix the data, re-run verify, then build.`);
  console.error('  (--force overrides, but the page will carry the failures.)\n');
  process.exit(1);
}

// ---- load data ---------------------------------------------------------
const dates = fs.readdirSync(p('data'))
  .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map(f => f.replace('.json', '')).sort();

const DAILY = {}, DATA = {};
for (const d of dates) {
  const doc = JSON.parse(fs.readFileSync(p('data', d + '.json'), 'utf8'));
  if (doc.daily) DAILY[d] = doc.daily;
  DATA[d] = doc.reports;
}

// per-date check summary, for the verification strip on the page
const perDate = {};
for (const d of dates) {
  perDate[d] = {
    rows: DATA[d].length,
    verified: DATA[d].filter(r => r.verified).length,
    warnings: (checks.warnings || []).filter(w => w.date === d).length,
    blocking: (checks.blocking || []).filter(f => f.date === d).length
  };
}
const CHECKS = {
  generatedAt: checks.generatedAt,
  verdict: checks.verdict,
  checksRun: (checks.checksRun || []).length,
  totalWarnings: (checks.warnings || []).length,
  totalBlocking: (checks.blocking || []).length,
  perDate
};

// ---- inject ------------------------------------------------------------
const shell = fs.readFileSync(p('templates', 'shell.html'), 'utf8');
// JSON.stringify then guard against a literal </script> inside any string value
const J = o => JSON.stringify(o).replace(/<\/script/gi, '<\\/script');

let html = shell
  .replace('__DAILY__', J(DAILY))
  .replace('__DATA__', J(DATA))
  .replace('__CHECKS__', J(CHECKS));

for (const tok of ['__DAILY__', '__DATA__', '__CHECKS__'])
  if (html.includes(tok)) { console.error('! placeholder not substituted:', tok); process.exit(1); }

fs.mkdirSync(p('dist'), { recursive: true });
fs.writeFileSync(p('dist', 'index.html'), html);
// GitHub Pages serves the repository root, so the root copy is the live page.
// Written here rather than by a separate `cp` step so it can never go stale.
fs.writeFileSync(p('index.html'), html);

const kb = n => (n / 1024).toFixed(1) + 'KB';
console.log(`\n✓ built ${dates.length} date(s), ${Object.values(DATA).reduce((a, x) => a + x.length, 0)} rows`);
console.log(`  dist/index.html     ${kb(html.length)}`);
console.log(`  index.html          ${kb(html.length)}  (served by Pages)`);
console.log(`  verification        ${CHECKS.verdict} · ${CHECKS.checksRun} checks · ${CHECKS.totalWarnings} warnings\n`);
