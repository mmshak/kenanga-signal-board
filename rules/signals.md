# Kenanga Signal Board — operating rules

**This file is the project's memory.** Every scheduled run starts a fresh session with no
recollection of how these rules were arrived at. Follow this document literally. Where it
conflicts with your own judgment, this document wins — each rule below exists because the
alternative was tried and produced a wrong answer.

---

## 1. Sourcing

### Kenanga (primary)

The Kenanga insights listing page renders its list via JavaScript. **A plain fetch returns
the nav shell, not report content.**

> **Never read company names, tickers or figures off the listing page.** An early build did
> and invented "K-Jokes Technology" for KJTS and "Chee Ding" for CHEEDING. The listing is
> only ever used to enumerate *which* reports exist on a date.

Correct method, in order:

1. Fetch that date's **Kenanga Today** digest PDF. Use its **bundle contents**, not the
   "Ideas of the Day" line — that line enumerates stock ideas only and omits macro
   publications, which under-counts the day.
2. For each report in the bundle, fetch **that report's own PDF** and read figures from it.
3. If a filename 404s, try the known irregular patterns before giving up (see §6).
4. If a report cannot be retrieved, emit it as `pending` — a real row with no figures.
   **Never omit it, and never guess its contents.**

Filename convention:

```
https://www.kenanga.com.my/wp-content/uploads/YYYY/MM/{TICKER}-{YYMMDD}-{PERIOD}-{TYPE}-Kenanga.pdf
```

### Non-Kenanga houses (secondary)

Malaysian broker research is client-only and not publicly retrievable. What *is* retrievable
comes via news reporting of those notes. Permitted sources, in order of preference:

1. **The Edge Malaysia** (`theedgemalaysia.com`) — primary
2. New Straits Times, The Star, The Sun, Business Today, KLSE Screener

**Prohibited as a source for any house call:** i3investor, TradingView, Simply Wall St,
MarketScreener, stockanalysis.com, or any aggregator producing an anonymous consensus.

> An earlier build showed i3investor "street averages". They were removed entirely. The
> counts were anonymous, Kenanga sat inside its own average, and for TGUAN and BPPLAS the
> aggregator displayed an average with **no analyst count behind it** — while Kenanga's own
> note stated it had "sole coverage" of both stocks. The average could not have existed.

Market data (52-week range, dividend yield) comes from stockanalysis.com and is labelled on
the page as **not from Kenanga**.

---

## 2. The Kenanga Signal

A row reads **Positive** if, and only if, the report declares conviction **in Kenanga's own
words** — naming the stock a Top Pick, one of its sector picks, or the most attractive among
peers.

Everything else reads **None stated**.

**Nothing is inferred.** Not from the rating, the target price, the size of a target-price
move, the result against forecast, or the tone of the commentary.

The exact sentence is stored in `conviction` and quoted on the row.

> This replaced a weighted scoring model that combined rating, rating changes, TP moves and
> results. That model labelled every row, but most of it was inference. It also produced
> contradictions: MISC and MBMR were mechanically identical (rating unchanged, ~2% TP raise)
> and received opposite labels. And DPHARMA read *Neutral* while the report called it
> "our Top Pick for the healthcare sector" — because the label had been hand-typed.
>
> **Corollary: never hand-type a field that can be computed.** Hand-typed labels drift.

### Searching for conviction

Search each report for **all** of: `top pick`, `sector pick`, `our pick`, `preferred`,
`most attractive`, `we like`, `favour`, `favourite`.

> A first pass used only "Top Pick" and found one stock. The broader search found six. If
> the narrow search had shipped, five convicted rows would have read None stated.

Borderline language — "we continue to favour X" — is **not** a pick declaration. Record the
call, mark the signal None stated, and say why in the note.

---

## 3. The Analyst Signal

The same rule, applied to every other house. **Positive** only where a **named**
non-Kenanga research house declares conviction in its own words.

Three additional constraints:

1. **The house must be named.** "Analysts say" is not a house.
2. **The call must be dated**, and the date's distance from the Kenanga report beside it
   explained in that row's executive summary — not shown in the column, which stays clean.
3. **Most-recent-statement wins.** Read the house's latest publicly retrievable note, not
   its best-ever one.

> PMETAL is the worked example. RHB named it a top pick on 6 Mar 2026 at RM8.50. Its 15 Jul
> note is Buy at RM9.80 with no pick language. The row reads **None stated**, and both notes
> appear in the detail panel.

**Houses to search** (nine): CIMB Securities, Maybank Investment Bank, RHB Investment Bank,
AmInvestment Bank Research, Hong Leong Investment Bank, Public Investment Bank, TA
Securities, MIDF, Affin Hwang.

Record how many yielded publicly retrievable calls, and state that denominator in the
footnote. **"None stated" means no conviction found in accessible sources — never that no
house holds a view.**

### House divergence

Set `analyst.opp = true` when a named house rates the stock in the **opposite** direction to
Kenanga (Outperform vs Hold/Sell, or Market Perform/Underperform vs Buy/Add/Outperform).
Renders as ⇆ on the ticker. **Set from a verified call only — never inferred from prices.**

---

## 4. Executive summaries

Five takeaways per row, written for a CEO/investor, labelled AI-written on the page.

**Every claim must trace to a line in the cited report.** Not "consistent with" — traceable.

> Three wrong claims shipped and were caught only on a full re-check: KAREX (a planned FY27
> launch written as underway), CHEEDING (a 1,000km route attributed to TNB — it was the
> ASEAN Power Grid), HLBANK (70bps described as idle capital — it was a Basel III CET-1
> uplift).

Where a figure is inferred rather than stated, say so **on the row** and raise a `flag`.

---

## 5. Material context from outside the report

Where a headline fact materially changes how a row reads and Kenanga's note does not carry
it, add it to the cross-check with its own source.

> KLK, 24 Aug: a RM1.62b Synthomer impairment pushed 3QFY26 to a RM1.34b attributable net
> loss. Kenanga's "weaker-than-expected" referred to *core* net profit, which excludes it —
> so the two were not in conflict, but a reader of the row alone would not have known the
> company posted a heavy headline loss.

Kenanga is not wrong in such cases. State both figures and explain the basis difference.

---

## 6. Known data irregularities

- Some Kenanga filenames **reverse field order**: `SCGBHD-260827-RN-2QFY26`
- Some **omit** the `-Kenanga` suffix: ARMADA, TAANN
- At least one is **misdated**: MBMR filed as `260808` for a 28 Aug report
- **25 Aug 2026 has no bundle** — 404 on Kenanga's site, absent from their own listing
- **BIMB (27 Aug)** appears in the digest but not the published bundle; 404 under every
  filename convention. Excluded on the authority of the bundle contents.
- **Excluded by specification**, not by error: Rating Summary and Weekly Technical Review
  are real publications left out because the dropdown is fixed to five report types.

---

## 7. Standing conventions

- Currency MYR unless stated
- Companies referenced by name + Bursa ticker
- Research content is Kenanga's copyright — paraphrase, never reproduce in full, always cite
- Report date and source stated on every row
- **If a number is not in the retrieved source, say so. Never fabricate a figure.**

---

## 8. Verification is not optional

Every claim in §1–§7 above was learned by getting something wrong first. The check suite in
`checks/` encodes the mechanical half. The half it cannot encode is the discipline of
opening the actual PDF.

**A row that has not been verified against its own source PDF is `verified: false`, shows no
figures, and says so on the page.**
