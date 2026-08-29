# Kenanga Signal Board

An interactive dashboard summarising **Kenanga Investment Bank's** daily research reports for **24–28 August 2026** (four trading days).

Single self-contained HTML file. No build step, no dependencies, no backend.

---

## ⚠️ Read this before making the repository public

This dashboard summarises and quotes **third-party copyrighted research**. Three things are worth deciding on deliberately rather than by default:

**1. Copyright.** The page contains ~60 verbatim sentences quoted from Kenanga research reports, plus deep links to their PDFs. Short attributed quotation is often defensible, but a systematic aggregation of one house's research output is a different proposition. Kenanga may object regardless of the legal position.

**2. Regulatory.** In Malaysia, providing investment advice generally requires a Capital Markets Services Licence from the Securities Commission. This page presents ratings, target prices and "5 key takeaways for a CEO/investor". Published privately as a personal research tool that framing is unremarkable; published publicly it may read differently. Take your own view, and get advice if the answer isn't obvious to you.

**3. Market data.** 52-week ranges and dividend yields come from stockanalysis.com. Check their terms before redistributing.

**The low-risk default is a private repository.** GitHub Pages on a private repo requires a paid plan; alternatively keep the repo private and just open `index.html` locally — it works identically from the filesystem. `index.html` ships with `<meta name="robots" content="noindex, nofollow">` so it will not be indexed by search engines even if published, but that is a courtesy, not a protection.

None of the above is legal advice.

---

## What's in it

**Section 1 — Kenanga Today digest.** Corporate news and macro items for each date, taken from that day's compiled *Kenanga Today* PDF. Each row shows Kenanga's own body text; clicking opens five CEO-level takeaways.

**Section 2 — Reports by type.** Every report in that day's published bundle, filterable by Results Note / Company Updates / Sector Updates / Market Strategy / Economic Viewpoint. Clicking a row opens the rating, target price, five takeaways and the source link.

**Note signal.** Reads **Positive** if and only if the report declares conviction in Kenanga's own words — naming the stock a Top Pick, a sector pick, or the most attractive among peers. The exact sentence is quoted on the row. Everything else reads **None stated**, which is a fact about the report, not a view on the stock. Nothing is inferred from ratings, target-price moves, results or tone.

Six of 57 stock reports carry conviction language: DPHARMA, PBBANK, SIMEPROP, TGUAN, BPPLAS, and KLK's Company Update.

## Sourcing

| Field | Source |
|---|---|
| Ratings, target prices, share prices, quotes | Kenanga report PDFs, one per row, linked |
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

Open `index.html` in any browser. That's it — it works from the filesystem, from a local server, or from GitHub Pages.

```bash
# optional local server
python3 -m http.server 8000
```

## Technical notes

- Self-contained: all CSS and JS inline, no build step
- Only external requests are Google Fonts (with full fallback stacks — the page is fully legible if fonts fail to load) and outbound links to source PDFs
- Light and dark themes, following the system setting
- Responsive; no horizontal overflow at 390px
- No cookies, no analytics, no browser storage
