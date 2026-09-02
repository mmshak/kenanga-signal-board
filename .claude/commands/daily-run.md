---
description: Run the daily Kenanga Signal Board research and data-entry procedure
argument-hint: "[previous|today]"
---

Target date mode: **$ARGUMENTS** (if blank, treat as `previous`).

- `previous` — the default, guaranteed nightly behavior: the previous trading day, per the
  table in `rules/daily-run.md` step 2.
- `today` — the current Malaysia calendar date. Used by the intraday poll, which only
  invokes you once it has already confirmed today's Kenanga Today page is live, so treat
  "not yet published" here as a normal, expected outcome, not a stop condition — check, and
  if it genuinely isn't out yet, stop and report that plainly rather than retrying or
  guessing. If `data/<today's date>.json` already exists, there is nothing to do — stop
  immediately without re-fetching anything.

Follow `rules/daily-run.md` literally, step by step, substituting the target date above for
step 2's date-selection logic. Before doing anything else, read `rules/signals.md` in full —
it encodes decisions this project has already made the hard way, and a fresh session has no
memory of them.

Do the research and write the one new `data/YYYY-MM-DD.json` file (plus regenerated
`data/index.json`) exactly as that procedure describes. Run `node checks/verify.js` and,
if it exits 0, `node scripts/build.js`.

**Stop there. Do not `git add`, `git commit`, or `git push` anything.** The workflow that
invoked you re-runs verification independently and owns the commit — your own belief that
verification passed is not the gate.

If any stop condition in `rules/daily-run.md` applies — digest unreachable, more than a
quarter of report PDFs 404, a blocking verification failure, an unresolved contradiction
with an earlier date, or anything that would require inventing a number — stop and report
it instead of guessing. A missing day is recoverable; a wrong one published to a live team
link is not.

Finish with the report described in step 13: date processed, reports found, reports
verified, blocking failures, warnings raised, and anything that needed judgment. Say
explicitly if anything was inferred rather than read.
