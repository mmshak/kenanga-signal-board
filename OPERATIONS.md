# Operating the daily job — plain-English guide

This is a reference for running and maintaining the automation, not for reading the
dashboard itself (see `guide/index.html` for that). No engineering background assumed.

---

## What this actually is

A robot that wakes up most nights, reads the newest Kenanga research, checks its own
work, and updates the live site — without you doing anything.

Two systems are involved, doing different jobs:

- **GitHub** hosts and schedules the whole thing. It spins up a temporary computer,
  runs the job on it, then throws that computer away. This is why it doesn't matter
  whether your laptop is on.
- **Claude** does the one step that needs judgment: reading the PDFs, deciding what
  counts as a "top pick," writing the summary. Everything before and after that step —
  scheduling, double-checking the work, publishing — is plain GitHub automation, not AI.

## What happens on a normal night

Tuesday through Saturday, at midnight Malaysia time:

1. Claude fetches the previous day's Kenanga reports and writes up the findings.
2. An independent script re-checks that work against 11 fixed rules (no invented
   numbers, no unquoted "conviction" claims, no duplicate rows, etc.) — Claude's own
   opinion that it did a good job doesn't count; this check does.
3. If it passes, the page is rebuilt and the changes are pushed live automatically.
4. If it doesn't pass, **nothing is published** and the site quietly stays on
   yesterday's good version. That's the system working correctly, not a bug.

Some nights nothing gets published at all — a holiday, a weekend, or a day Kenanga
didn't release a bundle. That's expected, not a failure.

**You don't need to do anything on a normal night.** The site just updates.

## How to check on it

Open the [Actions tab](https://github.com/mmshak/kenanga-signal-board/actions) →
"Daily run". Each row is one night:

- ✅ green check — ran fine (whether or not it found anything to publish)
- ❌ red X — something failed; worth a look

A quiet week could mean "nothing to report" or "silently broken" — they look the same
from a distance, so an occasional glance is worth it.

## The one thing that *will* eventually need you: the token

The automation authenticates as you using a token that **expires after about a year.**
When it does, every run will fail at the same step, right at the start.

**To fix it:**
1. On your own computer, run `claude setup-token` and complete the login it walks you
   through. It prints a token (starts with `sk-ant-oat01-...`).
2. Go to the repo's Settings → Secrets and variables → Actions →
   `CLAUDE_CODE_OAUTH_TOKEN` → **Update secret**.
3. Paste in just the token — nothing else, no extra spaces or line breaks.
4. Re-run the workflow once by hand (Actions tab → "Daily run" → **Run workflow**) to
   confirm it's fixed.

If you ever generate a token and it ends up visible somewhere it shouldn't (pasted into
a chat, a screenshot, etc.), treat it as burned and generate a fresh one — it costs
nothing to redo and the old one still has a year of validity left for whoever might see it.

## If a run fails for some other reason

Click into the failed run → the job → the step with the red X → read the error at the
bottom. Three failures we've already hit and fixed, in case they resurface (e.g. after
the action updates itself and changes behaviour again):

- **"Could not fetch an OIDC token"** — the workflow was missing `id-token: write`
  under `permissions:`. Already fixed; if it reappears, check that permission is still
  present in `.github/workflows/daily.yml`.
- **"Claude Code is not installed on this repository"** — the Claude GitHub App itself
  needs to be installed on the repo (separate from the token), at
  [github.com/apps/claude](https://github.com/apps/claude). This is a one-time setup
  step, already done, but would need redoing if the app were ever uninstalled.
- **`git push` fails with "Invalid username or token"** — the research step leaves the
  repository's git credentials in a used-up state when it finishes. The commit step
  now resets them itself right before pushing (see `.github/workflows/daily.yml`), so
  this shouldn't recur unless that step is edited.

For anything else, the error message at the bottom of the failed step is usually
specific enough to search or reason about directly — the failures above were the
non-obvious ones.

## Quick FAQ

**Is this running on Claude or on GitHub?** Both — GitHub runs and schedules the job;
Claude is the one step inside it that does the research and writing.

**Does this cost extra, separate from my Claude subscription?** No — it draws on your
existing Claude subscription via the token, not a metered API key.

**What if I want to run it manually, right now, instead of waiting for the schedule?**
Actions tab → "Daily run" → **Run workflow**.

**What if the schedule seems to have stopped firing on its own?** GitHub disables
scheduled jobs on public repos after 60 days with no commits to the repo at all. A
working daily job commits often enough to never hit this, but an extended quiet
stretch (rare, given daily market publications) is worth checking for.
