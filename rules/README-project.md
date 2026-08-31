# Where everything lives

**Single live copy:** https://mmshak.github.io/kenanga-signal-board/
**User guide:** https://mmshak.github.io/kenanga-signal-board/guide/

There is deliberately **one** published copy. Earlier builds also published to a
claude.ai Artifact; that path has been retired to avoid two copies drifting apart.

## The runner

**GitHub Actions**, `.github/workflows/daily.yml`, Tue-Sat 00:00 Malaysia time.
It runs on GitHub's machines, so it does not depend on any laptop being awake, and it
pushes to this repository natively.

Two other runners were considered and rejected:

- **A Cowork scheduled task** — works, always on, but cannot push to GitHub
  (anthropics/claude-code#84581 blocks repository write access from cloud sessions) and
  so could only publish to an Artifact, which would have been a second live copy.
- **Claude Code under launchd on a Mac** — pushes fine, but `launchd` does not catch up
  runs missed while the machine is asleep, and a laptop at midnight is asleep. Days
  would go silently missing.

## Requirements

One repository secret: **`CLAUDE_CODE_OAUTH_TOKEN`**, generated locally with

```bash
claude setup-token
```

This is tied to the Claude subscription, not a metered API key. **It expires in about a
year** — set a reminder, because an expired token looks exactly like a broken job.

## The system, and why it is portable

```
rules/signals.md      operating rules -- the project's memory
rules/daily-run.md    the daily procedure and stop conditions
.claude/commands/daily-run.md   what the scheduled run executes
checks/verify.js      Tier-1 verification suite
scripts/build.js      data + shell -> self-contained page
templates/shell.html  presentation only, no data
data/YYYY-MM-DD.json  one file per trading day -- source of truth
```

The runner is disposable; this system is not. Any runner that can execute
`node checks/verify.js && node scripts/build.js` and push produces the same result.
Swapping runners is a config change, not a rebuild.

## Failure behaviour

The workflow verifies **twice** — once inside the agent's run, once independently before
the commit step. A blocking failure means nothing is committed and the site stays on the
last good build. That is the correct outcome, not an outage.

**Watch for silence.** GitHub disables scheduled workflows on public repos after 60 days
of repository inactivity. Daily commits keep this alive, but a job that breaks and stops
committing will have its schedule quietly switched off two months later.
