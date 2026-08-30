# Kenanga Signal Board

An interactive dashboard summarising **Kenanga Investment Bank's** daily research reports.
Currently covers **24–28 August 2026** (four trading days); a scheduled job appends one
trading day per run.

**Live:** https://mmshak.github.io/kenanga-signal-board/
**User guide:** https://mmshak.github.io/kenanga-signal-board/guide/

The Artifact copies (updated nightly, same links every time):
- Dashboard &mdash; https://claude.ai/code/artifact/81a8e72e-d9d8-48f0-af29-95b1051fe6f0
- User guide &mdash; https://claude.ai/code/artifact/750af739-841a-4aec-b453-5ae45ee3fafb

---

## ⚠️ Read this before making the repository public

This dashboard summarises and quotes **third-party copyrighted research**.

**1. Copyright.** The page contains ~60 verbatim sentences quoted from Kenanga research
reports, plus deep links to their PDFs. Short attributed quotation is often defensible, but
a systematic aggregation of one house's research output is a different proposition. Kenanga
may object regardless of the legal position.

**2. Regulatory.** In Malaysia, providing investment advice generally requires a Capital
Markets Services Licence from the Securities Commission. This page presents ratings, target
prices and "5 key takeaways for a CEO/investor". Published privately as a personal research
tool that framing is unremarkable; published publicly it may read differently.

**3. Market data.** 52-week ranges and dividend yields come from stockanalysis.com. Check
their terms before redistributing.

`index.html` ships with `<meta name="robots" content="noindex, nofollow">`, but that is a
courtesy, not a protection — a public repo is itself browsable and searchable.

None of the above is legal advice.

---

## How it's built

Data and presentation are **separate**, so the daily job appends one file and can never
touch the rendering code.

```
data/YYYY-MM-DD.json   one file per trading day — the source of truth
data/index.json        manifest of available dates
rules/signals.md       the operating rules; the project's memory
rules/daily-run.md     the daily procedure and stop conditions
checks/verify.js       Tier-1 verification suite
checks/report.json     last run's results (feeds the on-page strip)
templates/shell.html   presentation only; data injected at build
scripts/build.js       data + shell → dist/
dist/index.html        self-contained page (also copied to /index.html for Pages)
dist/artifact.html     same page, for Artifact publishing
guide/index.html       one-page user guide for the team
```

Adding a day means writing **one new JSON file** and rebuilding. Nothing existing is edited,
and every change is a readable `git diff`.

### Build

```bash
node checks/verify.js     # exit 1 = blocking failure, do not publish
node scripts/build.js     # refuses to run unless verification passed
```

---

## Data accuracy controls

Eleven machine checks run before any build is allowed to publish. **Blocking** failures stop
the build; **warnings** surface on the page as data-quality flags (⚑).

| ID | Check | On failure |
|---|---|---|
| C01 | Every data file is valid JSON | **Block** |
| C02 | Schema: required fields, known ratings and report types, exactly 5 takeaways, positive numeric prices/targets | **Block** |
| C03 | No prohibited aggregator sources (i3investor, TradingView, MarketScreener…) | **Block** |
| C04 | **Every conviction quote is a real quotation containing recognised pick language** | **Block** |
| C05 | Positive Analyst Signals name a house, date the call, and cite a source | **Block** |
| C06 | No duplicate ticker + report type on a date | **Block** |
| C07 | Cross-date reconciliation: a stated prior target matches the earlier date on the board | **Block** |
| C08 | 52-week low is not above the 52-week high | **Block** |
| C08 | Share price outside its 52-week range (cross-source timing) | Warn |
| C09 | Explicit data-quality flags surface on the page | Warn |
| C10 | Every source URL is a Kenanga PDF; the digest has a source | **Block** |
| C11 | `--pdf`: every source PDF is reachable | **Block** |

**C04 is the keystone.** The entire Kenanga Signal rests on the claim that a quoted sentence
appears in the report. The check makes that claim mechanically testable rather than a matter
of trust.

The suite was validated by injecting nine deliberate faults — a fabricated conviction quote,
a missing target price, an unnamed house, an undated call, a citation-free Positive signal, a
banned aggregator source, a duplicate row, a cross-date contradiction — and confirming each
was caught. It also independently reproduces all eight data-quality flags that were
originally found by hand.

### On-page verification strip

Each date shows what actually passed: `✓ Verified · 10 automated checks passed · 25 of 25
reports verified against source · ⚑ 7 data-quality flags · Last checked 31 Aug 04:55 MYT`.

Accuracy you can't see isn't a control.

---

## The daily job

**Tuesday–Saturday, 00:00 Malaysia time.** Each run processes the **previous** trading day —
Kenanga publishes in the morning, so a midnight Tuesday run collects Monday's bundle. Tue–Sat
covers Mon–Fri publications. Monday is deliberately excluded: it would find nothing.

Full procedure and stop conditions in `rules/daily-run.md`. A run that hits a blocking
failure publishes nothing and leaves the previous good build live.

---

## What's in it

**Section 1 — Kenanga Today digest.** Corporate news and macro items for each date, taken from that day's compiled *Kenanga Today* PDF. Each row shows Kenanga's own body text; clicking opens five CEO-level takeaways.

**Section 2 — Reports by type.** Every report in that day's published bundle, filterable by Results Note / Company Updates / Sector Updates / Market Strategy / Economic Viewpoint. Clicking a row opens the rating, target price, five takeaways and the source link.

**Kenanga Signal.** Reads **Positive** if and only if the report declares conviction in Kenanga's own words — naming the stock a Top Pick, a sector pick, or the most attractive among peers. The exact sentence is quoted on the row. Everything else reads **None stated**, which is a fact about the report, not a view on the stock. Nothing is inferred from ratings, target-price moves, results or tone.

Six of 57 stock reports carry conviction language: DPHARMA, PBBANK, SIMEPROP, TGUAN, BPPLAS, and KLK's Company Update.

**Analyst Signal.** The same strict rule applied to everyone else: **Positive** only where a **named** non-Kenanga research house declares conviction in its own words — top pick, sector pick, preferred name. Nothing is inferred from a rating, a target price, an upgrade or a favourable tone. The signal reads a house's **most recent** publicly retrievable statement, not its best-ever one.

Eight rows are Positive across the four dates:

| Stock | House(s) | Date of call |
|---|---|---|
| PBBANK | CIMB Securities · AmInvestment | 14 & 22 Jul 2026 |
| HLBANK | CIMB Securities · AmInvestment | 14 & 22 Jul 2026 |
| TENAGA | CIMB Securities | 14 Jul 2026 |
| MPI | CIMB Securities | 14 Jul 2026 |
| QL | CIMB Securities | 14 Jul 2026 |
| ABMB | Hong Leong IB (top pick while downgrading the sector to neutral) | 22 Jul 2026 |
| SUNCON (2 rows) | RHB Investment Bank, TP RM7.32 | 5 Jan 2026 |

**Every call is named and dated, and its age is explained inside that row's executive summary rather than shown in the column** — the grid stays readable and the qualification sits with the reasoning. These are standing sector picks published weeks or months before the Kenanga reports beside them, not same-day reactions. The oldest is RHB's SUNCON pick from 5 January.

**PMETAL shows the rule biting.** RHB named it a top pick on 6 Mar 2026 at RM8.50, but its 15 Jul note is Buy at RM9.80 with no pick language — so the row reads **None stated**, with both notes shown in the detail panel.

### Which houses were searched

CIMB Securities, Maybank IB, RHB IB, AmInvestment, Hong Leong IB, Public Investment Bank, TA Securities, MIDF, Affin Hwang — **nine houses, publicly retrievable calls found for five.**

> Malaysian broker research is client-only. What is retrievable comes almost entirely from **The Edge Malaysia** reporting those houses' notes, plus the *NST* and *The Star* for the KLK results reaction. **"None stated" means no conviction found in accessible sources — not that no house holds a view.** Treat the populated rows as a floor, never a ceiling.

**The i3investor consensus figures have been removed entirely.** The counts were anonymous, Kenanga sat inside the average, and for TGUAN and BPPLAS the aggregator showed an average with no analyst count behind it. Named, dated, quotable calls replace them; where none exist, the page says so.

### House divergence (⇆)

Rows where a named house rates the stock the **opposite** way to Kenanga, marked ⇆ on the ticker. Three stocks, four rows:

| Stock | Kenanga | Named house |
|---|---|---|
| KLK (2 rows) | Outperform, RM25.80, stated conviction | **HLIB downgraded to Hold**, RM22.72 (26 Aug) · CIMB Securities Buy, RM24.32 |
| MPI | Market Perform, RM43.70 | **CIMB Securities top pick**, RM57.00 — ~30% above Kenanga |
| PMETAL | Market Perform, RM8.80 — "all positives are already priced in" | **RHB Buy**, RM9.80 |

**KLK also carries context Kenanga's note does not.** On 24 Aug KLK took a **RM1.62b non-cash impairment** on Synthomer, pushing 3QFY26 to a **RM1.34b attributable net loss**. Kenanga's "weaker-than-expected" refers to *core* net profit, which excludes it — so the two are not in conflict, but a reader of the row alone would not know. Both figures now appear on the row.

**Cross-check on conviction.** Where the Kenanga Signal is Positive, that row's executive summary carries the named calls from other houses — house, rating, target, date, quoted line, linked to source. **TGUAN and BPPLAS carry no cross-check, and that is the finding:** Kenanga states it has "sole coverage" of both.

**Filter behaviour.** "Stated conviction" catches a row if *either* signal is Positive — **13 rows** across the four dates.

**PBBANK is the only stock where both signals fire independently** — Kenanga's "this top banking pick", CIMB Securities' 14 July list, AmInvestment's 22 July banking picks. Note CIMB's RM5.50 target sits below Kenanga's RM5.95: the agreement is on the name, not the price.

## Sourcing

| Field | Source |
|---|---|
| Ratings, target prices, share prices, quotes | Kenanga report PDFs, one per row, linked |
| Non-Kenanga house calls | The Edge Malaysia articles, plus NST and The Star for KLK — each linked on the row |
| Index levels, fund flows, news, macro | *Kenanga Today* daily digests |
| 52-week high/low, dividend yield | stockanalysis.com (KLSE market data — **not** Kenanga) |
| Five key takeaways | AI-written, labelled as such; every claim traces to a quoted line in the cited report |

**All 60 reports across the four dates were opened and verified individually.** Coverage: 24 Aug 10/10 · 26 Aug 4/4 · 27 Aug 21/21 · 28 Aug 25/25. Kenanga published no bundle on 25 August.

Eight rows carry a data-quality flag (⚑) — inferred prior ratings, a mis-dated source filename, and share prices falling outside their 52-week range. The flags and their reasoning are documented in the page footer.

## Known limitations

- **A point-in-time snapshot.** Figures are as at the report dates; market data is as at the time it was fetched. Nothing auto-refreshes.
- **52-week ranges and prices come from different dates**, which is why some rows carry a cross-source flag.
- **Not investment advice.** Ratings and target prices are Kenanga's; the takeaways are AI-written interpretation.

## Running it

```bash
node checks/verify.js && node scripts/build.js
open dist/index.html            # works from the filesystem
python3 -m http.server 8000     # or serve it
```

## Technical notes

- Output is a single self-contained file: all CSS and JS inline, no build step to view, no backend
- Only external requests are Google Fonts (with full fallback stacks) and outbound links to source PDFs
- Light and dark themes, following the system setting
- Responsive; no horizontal overflow at 390px
- No cookies, no analytics, no browser storage
- CI (`.github/workflows/verify.yml`) runs the checks on every push and fails if `dist/` is
  out of sync with `data/` — no API key required
