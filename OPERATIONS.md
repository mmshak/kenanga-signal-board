# Operating the daily job — plain-English guide

This is a reference for running and maintaining the automation, not for reading the
dashboard itself (see `guide/index.html` for that). No engineering background assumed.

---

## What this actually is

A robot that reads the newest Kenanga research (usually the same day it's published),
checks its own work, and updates the live site — without you doing anything.

Two systems are involved, doing different jobs:

- **GitHub** hosts and schedules the whole thing — one workflow file
  (`.github/workflows/daily.yml`) with three jobs inside it: `decide` (cheap, no AI —
  figures out whether anything needs doing), `research` (the real pipeline), and
  `rebuild` (rebuild-only, no AI, for when a plain code/data push needs republishing).
  GitHub spins up a temporary computer, runs the job on it, then throws that computer
  away — this is why it doesn't matter whether your laptop is on. (You may also see a
  `pages-build-deployment` entry in the Actions list — that's GitHub's own automatic
  Pages deployment, not something this project defines; it runs on its own whenever
  `index.html` changes, regardless of this workflow.)
- **Claude** does the one step that needs judgment: reading the PDFs, deciding what
  counts as a "top pick," writing the summary. It runs on Anthropic's most capable model
  (`--model opus` in the workflow). Everything before and after that step — scheduling,
  the cheap "has today's edition even been published yet" check, double-checking the
  work, publishing — is plain GitHub automation, no AI involved.

## What happens on a normal day

**During the day (the fast path), at 09:00 and 21:00 Malaysia time, Monday to Friday:**
the `decide` job runs a cheap check (plain web request, no AI, effectively free) for
whether Kenanga has published today's edition yet, at its predictable page URL. Most
checks find nothing yet and stop immediately — nothing else runs. The moment one finds
today's edition live, the `research` job picks it up:

1. Claude fetches today's Kenanga reports and writes up the findings.
2. An independent script re-checks that work against 11 fixed rules (no invented
   numbers, no unquoted "conviction" claims, no duplicate rows, etc.) — Claude's own
   opinion that it did a good job doesn't count; this check does.
3. If it passes, the page is rebuilt and the changes are pushed live automatically —
   same day as publication, within 12 hours of it going out (worst case: published
   just after the 09:00 check, caught by the 21:00 one instead).
4. If it doesn't pass, **nothing is published** and the site quietly stays on the
   previous good version. That's the system working correctly, not a bug.

Once a day's file exists, the other check that same day sees it's already done and
skips — Claude only actually runs once per day, not once per check.

**At midnight (the guaranteed fallback), Tuesday through Saturday:** the same pipeline
runs again, but always targeting the *previous* day regardless of what the daytime
checks already caught. If that day's file already exists, this run finds nothing new
to push and no-ops. This exists purely as a safety net in case the daytime check ever
misses a day (e.g. Kenanga changes their page-naming pattern) — you shouldn't normally
notice it doing anything.

On a day Kenanga didn't release a bundle at all (a holiday, a weekend), no *new* data
is added — but the midnight run still usually produces a small "Daily update" commit
with no real content change, just a refreshed "last verified" timestamp, since
verification re-checks all existing data every time it runs regardless of whether
there's anything new. A genuinely new trading day is recognisable by an actual new
file appearing under `data/`.

**You don't need to do anything on a normal day.** The site updates itself, usually
the same day Kenanga publishes.

## How to check on it

Open the [Actions tab](https://github.com/mmshak/kenanga-signal-board/actions) →
**"Daily run"**. You'll see a few more rows than days (two intraday checks plus the
nightly run) — most will be a quick green check that found nothing yet and stopped
(`decide` only, no `research` or `rebuild` job underneath it), which is normal, not a
problem. Only a red X is worth looking closely at.

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
- **"Reached maximum number of turns"** — Claude ran out of allowed steps before
  finishing a busy day (a full bundle can be 25 individual report PDFs, each needing
  several tool calls). The turn budget in `claude_args` (`--max-turns`) has been raised
  once already; if it happens again, raise it further rather than assuming something
  else broke — check the job's own `timeout-minutes` has enough headroom to match.

For anything else, the error message at the bottom of the failed step is usually
specific enough to search or reason about directly — the failures above were the
non-obvious ones.

**A residual risk worth knowing about, not a failure to fix reactively:** the `decide`
job's intraday check assumes Kenanga's daily page always follows the pattern
`kenanga-today-{day}-{month name}-{year}` (e.g. `kenanga-today-2-september-2026`) —
confirmed against several real dates, but not guaranteed forever. If Kenanga ever
changes that pattern, the intraday check would just quietly never find a match — no
error, same-day updates would simply stop happening — until the midnight fallback
(which doesn't depend on this pattern) catches it that night instead. So a same-day
update going missing for one day, followed by it appearing at the next midnight run,
is the specific symptom to watch for if this pattern ever drifts.

**A display issue, not a data or pipeline bug:** the report-type tab (Results Note /
Company Updates / Sector Updates / etc.) and the "Stated conviction" filter are
independent controls. A Positive row filed under a type you're not currently viewing
used to look like "nothing positive today" with no indication otherwise — this
happened once, for a Sector Update naming a stock outside its own day's bundle. Fixed
in `templates/shell.html`: the page now shows a small note pointing you to the other
type when this happens. If a positive-seeming claim ("nothing positive today") ever
looks suspicious again, check every report-type tab before trusting it, in case this
class of issue has resurfaced in some other form.

## Quick FAQ

**Is this running on Claude or on GitHub?** Both — GitHub runs and schedules the job;
Claude is the one step inside it that does the research and writing.

**Does this cost extra, separate from my Claude subscription?** No — it draws on your
existing Claude subscription via the token, not a metered API key.

**What if I want to run it manually, right now, instead of waiting?** Actions tab →
"Daily run" → **Run workflow** → choose `today` (today's bundle, if it's out) or
`previous` (default; yesterday's).

**Does the twice-daily check cost extra?** No — each check is a single free web
request, and Claude only actually runs once a day: either the intraday check that
finds a new edition, or the nightly fallback if neither check did. The frequency was
picked mainly to keep the Actions history readable, not for cost — GitHub Actions
minutes are unlimited on a public repo either way.

**What if the schedule seems to have stopped firing on its own?** GitHub disables
scheduled jobs on public repos after 60 days with no commits to the repo at all. A
working daily job commits often enough to never hit this, but an extended quiet
stretch (rare, given daily market publications) is worth checking for.

**Someone changed `templates/shell.html` or a script — does that need a full research
run to go live?** No. Pushing to `templates/`, `scripts/build.js`, `checks/verify.js`,
or `data/` runs the same workflow's `rebuild` job — no AI involved, just the
verify-and-build scripts. This is also how a one-off data correction gets published
without waiting for the next scheduled run.
