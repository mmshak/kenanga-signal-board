# Daily run — operating procedure

**Schedule:** Tuesday–Saturday, 00:00 Malaysia time (UTC+8) = `0 16 * * 1-5` UTC.

**Each run processes the PREVIOUS trading day.** Kenanga publishes its bundle in the
morning, so a run at midnight Tuesday MYT collects **Monday's** reports. Tue–Sat therefore
covers Mon–Fri publications. A Monday run would find nothing and is deliberately excluded.

| Run (MYT) | Processes |
|---|---|
| Tue 00:00 | Monday |
| Wed 00:00 | Tuesday |
| Thu 00:00 | Wednesday |
| Fri 00:00 | Thursday |
| Sat 00:00 | Friday |

---

## Procedure

### 1. Read the rules first
Open `rules/signals.md` and follow it literally. It encodes decisions that were reached by
getting things wrong; a fresh session has no memory of them.

### 2. Determine the target date
Previous calendar day. If it is a Malaysian public holiday or a weekend, or if Kenanga
published no bundle, **stop and write nothing.** A missing date is correct; an invented one
is not. 25 Aug 2026 is the precedent: no bundle, no file.

### 3. Fetch the Kenanga Today digest
Get that date's digest PDF. Take the day's report line-up from the **bundle contents**, not
the "Ideas of the Day" line. Extract index close, change, percentage, institutional / retail
/ foreign flows, corporate news and macro items.

### 4. Fetch every report PDF individually
One fetch per report. Read rating, previous rating, target price, previous target price,
share price, the result against forecast, and the quoted line **from the PDF itself**.

- Never read figures off the listing page.
- If a filename 404s, try the irregular patterns in `rules/signals.md` §6.
- If a report cannot be retrieved, emit `{"ticker":"X","type":"Y","verified":false}`.
  Never omit it. Never guess.

### 5. Search each report for conviction language
All of: `top pick`, `sector pick`, `our pick`, `preferred`, `most attractive`, `we like`,
`favour`. Store the verbatim sentence in `conviction`, or leave it `null`.
**Never infer conviction from a rating or a target-price move.**

### 6. Write five takeaways per row
Every claim traceable to a line in that PDF. Where a figure is inferred, say so on the row
and set `flag`.

### 7. Fetch market data
52-week high/low and dividend yield from stockanalysis.com. Label as not-from-Kenanga.

### 8. Check for non-Kenanga coverage
Only for stocks where it is worth the fetch (Kenanga-Positive rows, and any stock with a
notable result). The Edge Malaysia first. Apply the §3 rule: named house, dated call,
most-recent statement wins. **Never use an aggregator.**

### 9. Write the data file
`data/YYYY-MM-DD.json`, schema 1:

```json
{ "date": "YYYY-MM-DD", "schema": 1, "daily": { ... }, "reports": [ ... ] }
```

Then regenerate `data/index.json`.

**Only ever create one new file. Never modify an existing date's file** unless correcting a
identified error, and then say so in the commit message.

### 10. Verify — this gate is not optional
```bash
node checks/verify.js
```
Exit 0 → continue. **Exit 1 → stop. Do not publish.** Report the blocking failures and
leave the live site on the previous good build.

### 11. Build
```bash
node scripts/build.js
```
Refuses to run unless verification passed.

### 12. Publish
- **Artifact:** republish `dist/artifact.html` to the existing artifact URL.
- **GitHub:** commit `data/`, `checks/report.json`, `dist/` and push. Pages redeploys.

If push access is unavailable (see README), deliver `dist/index.html` to the user instead
and say it needs uploading.

### 13. Report
State: date processed, reports found, reports verified, blocking failures, warnings raised,
and anything that needed judgment. **If something was inferred rather than read, say so.**

---

## Stop conditions

Stop and report rather than guess if:

- The digest PDF is unreachable
- More than a quarter of the day's report PDFs 404
- Verification returns a blocking failure
- A figure contradicts an earlier date and you cannot establish which is right
- Anything requires inventing a number

**A missing day is recoverable. A wrong day published to a live team link is not.**
