# Kenanga Signal Board — where everything lives

**Live dashboard (the link your team uses):**
https://claude.ai/code/artifact/81a8e72e-d9d8-48f0-af29-95b1051fe6f0

The nightly job republishes to that same URL. The link never changes.

---

## Why the Project, not GitHub

A scheduled run starts a **fresh session with an empty workspace** — nothing from a previous
run survives on disk. It also cannot push to GitHub: a known Cowork bug
(anthropics/claude-code#84581) blocks repository write access from cloud sessions, and there
is no UI to grant it.

So this Claude Project is the durable store. Every nightly run reads the system from here,
appends one day, and writes the new data file back here.

```
kenanga-board/rules/signals.md      operating rules — the project's memory
kenanga-board/rules/daily-run.md    the daily procedure and stop conditions
kenanga-board/checks/verify.js      Tier-1 verification suite
kenanga-board/scripts/build.js      data + shell → self-contained page
kenanga-board/templates/shell.html  presentation only, no data
kenanga-board/data/YYYY-MM-DD.json  one file per trading day — source of truth
kenanga-board/data/index.json       manifest of available dates
```

## How a nightly run works

1. Read `rules/signals.md` and `rules/daily-run.md` from this Project — **before anything else**
2. Reconstruct the working tree from the Project docs into the session workspace
3. Fetch and verify the previous trading day's Kenanga reports
4. Write `data/YYYY-MM-DD.json`
5. `node checks/verify.js` — **exit 1 stops the run and publishes nothing**
6. `node scripts/build.js`
7. Republish `dist/artifact.html` (also kept at /tmp/kenanga-site/artifact-body.html for in-place republish) to the artifact URL above, passing it as `url` so it
   updates in place rather than creating a new artifact
8. Write the new data file and `checks/report.json` back to this Project
9. Report what happened

## GitHub

`https://github.com/mmshak/kenanga-signal-board` still hosts a copy at
`mmshak.github.io/kenanga-signal-board`, but it can only be updated by manual upload while
#84581 is open. **The Artifact link is the live one.** If the GitHub bug is fixed, the job
can push there too — nothing else needs to change.
