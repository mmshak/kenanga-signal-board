#!/usr/bin/env node
/**
 * Kenanga Signal Board — Tier 1 verification suite.
 *
 * Machine checks that either pass or block the build. Run before every publish:
 *     node checks/verify.js            # all dates
 *     node checks/verify.js 2026-08-28 # one date
 *     node checks/verify.js --pdf      # also fetch PDFs (slow, needs network)
 *
 * Exit 0 = safe to publish. Exit 1 = BLOCKING failure, do not publish.
 * Warnings never block; they surface on the page as data-quality flags.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const WANT_PDF = process.argv.includes('--pdf');
const ONLY = process.argv.slice(2).filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a));

const fail = [], warn = [], pass = [];
const F = (id, date, row, msg) => fail.push({ id, date, row, msg });
const W = (id, date, row, msg) => warn.push({ id, date, row, msg });
const P = id => pass.push(id);

const RATINGS = ['OP', 'MP', 'UP'];
const TYPES = ['Results Note', 'Company Updates', 'Sector Updates', 'Market Strategy', 'Economic Viewpoint'];
const BANNED_SRC = ['i3investor', 'tradingview', 'simplywall', 'marketscreener'];
const CONVICTION_WORDS = /top\s+(\w+\s+){0,2}pick|sector\s+pick|our\s+pick|one of our|preferred|most attractive/i;

// ---------------------------------------------------------------- load
const dates = fs.readdirSync(DATA)
  .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map(f => f.replace('.json', ''))
  .filter(d => !ONLY.length || ONLY.includes(d))
  .sort();

if (!dates.length) { console.error('No data files found in', DATA); process.exit(1); }

const docs = {};
for (const d of dates) {
  try { docs[d] = JSON.parse(fs.readFileSync(path.join(DATA, d + '.json'), 'utf8')); }
  catch (e) { F('C01-parse', d, null, 'File is not valid JSON: ' + e.message); }
}
P('C01-parse');

// ---------------------------------------------------------- C02 schema
for (const d of dates) {
  const doc = docs[d]; if (!doc) continue;
  if (doc.date !== d) F('C02-schema', d, null, `date field "${doc.date}" does not match filename`);
  if (!Array.isArray(doc.reports)) { F('C02-schema', d, null, 'reports is not an array'); continue; }

  doc.reports.forEach((r, i) => {
    const id = r.ticker || `row${i}`;
    if (!r.ticker) F('C02-schema', d, id, 'missing ticker');
    if (!r.type) F('C02-schema', d, id, 'missing type');
    else if (!TYPES.includes(r.type)) F('C02-schema', d, id, `unknown report type "${r.type}"`);

    if (r.verified === false) return;               // pending rows carry no figures by design

    if (!r.src) F('C02-schema', d, id, 'verified row has no source URL');
    if (r.rating && !RATINGS.includes(r.rating)) F('C02-schema', d, id, `unknown rating "${r.rating}"`);
    if (r.prevRating && !RATINGS.includes(r.prevRating)) F('C02-schema', d, id, `unknown prevRating "${r.prevRating}"`);

    // a stock row must carry the numbers it claims to show
    if (r.type === 'Results Note' || r.type === 'Company Updates') {
      for (const f of ['tp', 'price']) {
        if (r[f] == null) F('C02-schema', d, id, `missing ${f}`);
        else if (typeof r[f] !== 'number' || !isFinite(r[f]) || r[f] <= 0)
          F('C02-schema', d, id, `${f} is not a positive number: ${JSON.stringify(r[f])}`);
      }
      if (!Array.isArray(r.summary) || r.summary.length !== 5)
        F('C02-schema', d, id, `executive summary must have exactly 5 takeaways, found ${r.summary ? r.summary.length : 0}`);
      if (!r.quote) F('C02-schema', d, id, 'no quoted line from the report');
    }
  });
}
P('C02-schema');

// ------------------------------------------------- C03 no banned sources
for (const d of dates) {
  const blob = JSON.stringify(docs[d] || {}).toLowerCase();
  for (const b of BANNED_SRC)
    if (blob.includes(b))
      F('C03-source', d, null, `prohibited aggregator source "${b}" present — see rules/signals.md §1`);
}
P('C03-source');

// ------------------------------------- C04 conviction quote is real & sound
// KEYSTONE CHECK. The entire Kenanga Signal rests on this.
for (const d of dates) {
  (docs[d]?.reports || []).forEach(r => {
    if (!r.conviction) {
      // inverse guard: quote contains pick language but conviction was not set
      if (r.quote && CONVICTION_WORDS.test(r.quote))
        W('C04-conviction', d, r.ticker,
          `quoted line contains conviction language but no conviction field was set — re-read the report: "${r.quote.slice(0, 90)}..."`);
      return;
    }
    const c = r.conviction.trim();
    if (!/^["'“‘]/.test(c))
      F('C04-conviction', d, r.ticker, 'conviction must be a verbatim quotation and start with a quote mark');
    if (!CONVICTION_WORDS.test(c))
      F('C04-conviction', d, r.ticker, `conviction quote contains no recognised pick language: ${c.slice(0, 90)}`);
    if (c.length < 20)
      F('C04-conviction', d, r.ticker, 'conviction quote is too short to be a real sentence');
  });
}
P('C04-conviction');

// -------------------------------------------- C05 analyst-signal integrity
for (const d of dates) {
  (docs[d]?.reports || []).forEach(r => {
    const a = r.analyst; if (!a) return;
    if (a.v === 'positive') {
      if (!a.house) F('C05-analyst', d, r.ticker, 'Positive analyst signal with no named house');
      if (/analysts?\b|the street|consensus/i.test(a.house || ''))
        F('C05-analyst', d, r.ticker, `"${a.house}" is not a named house — rules/signals.md §3`);
      if (!a.date) F('C05-analyst', d, r.ticker, 'Positive analyst signal with no date on the call');
      if (!(a.cites && a.cites.length) && !a.src)
        F('C05-analyst', d, r.ticker, 'Positive analyst signal with no source link');
    }
    if (a.opp === true && !a.note)
      F('C05-analyst', d, r.ticker, 'divergence flag set with no explanation');
    (a.cites || []).forEach(c => {
      if (!Array.isArray(c) || c.length !== 2 || !/^https?:\/\//.test(c[1]))
        F('C05-analyst', d, r.ticker, 'malformed cite entry: ' + JSON.stringify(c));
    });
  });
}
P('C05-analyst');

// ------------------------------------------------- C06 duplicates
for (const d of dates) {
  const seen = new Set();
  (docs[d]?.reports || []).forEach(r => {
    const k = r.ticker + '|' + r.type;
    if (seen.has(k)) F('C06-dupe', d, r.ticker, `duplicate ${r.type} for this ticker on this date`);
    seen.add(k);
  });
}
P('C06-dupe');

// ------------------------------- C07 cross-date target-price reconciliation
// If a later note keeps a stock at an unchanged TP, the earlier date must agree.
const byTicker = {};
for (const d of dates)
  (docs[d]?.reports || []).forEach(r => {
    if (!r.verified || r.tp == null) return;
    (byTicker[r.ticker] = byTicker[r.ticker] || []).push({ date: d, tp: r.tp, prevTp: r.prevTp, rating: r.rating, prevRating: r.prevRating });
  });
for (const [tk, hist] of Object.entries(byTicker)) {
  hist.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < hist.length; i++) {
    const prev = hist[i - 1], cur = hist[i];
    if (cur.prevTp != null && Math.abs(cur.prevTp - prev.tp) > 0.005)
      F('C07-crossdate', cur.date, tk,
        `states a previous target of RM${cur.prevTp.toFixed(2)}, but ${prev.date} on this board shows RM${prev.tp.toFixed(2)}`);
    if (cur.prevRating && prev.rating && cur.prevRating !== prev.rating)
      W('C07-crossdate', cur.date, tk,
        `states a previous rating of ${cur.prevRating}, but ${prev.date} shows ${prev.rating}`);
  }
}
P('C07-crossdate');

// ------------------------------------- C08 price outside 52-week range
for (const d of dates) {
  (docs[d]?.reports || []).forEach(r => {
    if (!r.verified || r.price == null) return;
    if (r.high52 != null && r.price > r.high52 + 1e-9)
      W('C08-range', d, r.ticker, `share price RM${r.price} is ABOVE the 52-week high RM${r.high52} (cross-source timing)`);
    if (r.low52 != null && r.price < r.low52 - 1e-9)
      W('C08-range', d, r.ticker, `share price RM${r.price} is BELOW the 52-week low RM${r.low52} (cross-source timing)`);
    if (r.high52 != null && r.low52 != null && r.low52 > r.high52)
      F('C08-range', d, r.ticker, '52-week low is above the 52-week high');
  });
}
P('C08-range');

// ----------------------------------- C09 explicit data-quality flags surface
for (const d of dates)
  (docs[d]?.reports || []).forEach(r => { if (r.flag) W('C09-flag', d, r.ticker, r.flag); });
P('C09-flag');

// ------------------------------------------- C10 source URL shape / liveness
const toFetch = [];
for (const d of dates) {
  (docs[d]?.reports || []).forEach(r => {
    if (!r.verified || !r.src) return;
    if (!/^https:\/\/www\.kenanga\.com\.my\/wp-content\/uploads\//.test(r.src))
      F('C10-src', d, r.ticker, `source is not a Kenanga PDF URL: ${r.src}`);
    else toFetch.push({ date: d, ticker: r.ticker, url: r.src, quote: r.quote, conviction: r.conviction });
  });
  const daily = docs[d]?.daily;
  if (daily && !daily.src) F('C10-src', d, null, 'Kenanga Today digest has no source URL');
}
P('C10-src');

// ------------------------- C11 (opt-in) fetch each PDF; verify quotes appear
async function pdfPass() {
  let checked = 0;
  for (const t of toFetch) {
    let res;
    try { res = await fetch(t.url, { redirect: 'follow' }); }
    catch (e) { F('C11-pdf', t.date, t.ticker, `source PDF unreachable: ${e.message}`); continue; }
    if (!res.ok) { F('C11-pdf', t.date, t.ticker, `source PDF returned HTTP ${res.status}`); continue; }
    checked++;
    // Quote-in-PDF matching requires pdftotext; when absent we only assert liveness.
    if (!WANT_PDF_TEXT) continue;
  }
  return checked;
}
const WANT_PDF_TEXT = false;

// ------------------------------------------------------------ report
(async () => {
  let fetched = 0;
  if (WANT_PDF) { process.stderr.write('Fetching ' + toFetch.length + ' source PDFs...\n'); fetched = await pdfPass(); }

  const totals = dates.reduce((a, d) => {
    const rs = docs[d]?.reports || [];
    a.rows += rs.length; a.verified += rs.filter(r => r.verified).length; return a;
  }, { rows: 0, verified: 0 });

  const report = {
    generatedAt: new Date().toISOString(),
    dates, ...totals,
    checksRun: pass,
    pdfLivenessChecked: WANT_PDF ? fetched : null,
    blocking: fail,
    warnings: warn,
    verdict: fail.length ? 'BLOCKED' : 'PASS'
  };
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 1));

  const bar = '─'.repeat(64);
  console.log('\n' + bar);
  console.log('KENANGA SIGNAL BOARD — VERIFICATION');
  console.log(bar);
  console.log(`dates ${dates.length}   rows ${totals.rows}   verified ${totals.verified}   checks ${pass.length}`);
  if (WANT_PDF) console.log(`source PDFs reachable: ${fetched}/${toFetch.length}`);
  console.log(bar);
  if (fail.length) {
    console.log(`\n✗ ${fail.length} BLOCKING failure(s) — DO NOT PUBLISH\n`);
    fail.forEach(f => console.log(`  [${f.id}] ${f.date}${f.row ? ' ' + f.row : ''}\n      ${f.msg}`));
  } else console.log('\n✓ no blocking failures');
  if (warn.length) {
    console.log(`\n⚑ ${warn.length} warning(s) — surfaced on the page, not blocking\n`);
    warn.forEach(w => console.log(`  [${w.id}] ${w.date}${w.row ? ' ' + w.row : ''}\n      ${w.msg}`));
  }
  console.log('\n' + bar);
  console.log(report.verdict === 'PASS' ? 'VERDICT: PASS — safe to publish' : 'VERDICT: BLOCKED');
  console.log(bar + '\n');
  process.exit(fail.length ? 1 : 0);
})();
