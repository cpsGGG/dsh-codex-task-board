First public release. A cross-project **task board** for DeepSeek Harness: every DSH session becomes a task card across **待处理 / 处理中 / 待审阅**.

![Task board — dark](https://raw.githubusercontent.com/cpsGGG/dsh-task-board/main/preview/board-dark.png)

## Install

```sh
dsh plugin --profile <your-profile> add git+https://github.com/cpsGGG/dsh-task-board.git#v1.0.0
```

Then restart DSH and open **任务面板** at the bottom of the sidebar.

No build step and no install scripts run — `lib/client.js` ships in the repo.

## Features

- **Three columns** derived from live host facts: `running`, `completed` (finished but not yet opened), and unanswered interactions.
- **Priority stars** on a 16-colour palette. A colour is assigned **once** and remembered, surviving filtering, sorting, unstarring and removal.
- **Stable in-progress ordering** — progress, timestamps, titles and stars never reorder the column; new arrivals append at the end.
- **One-page adaptive layout** — busy columns gain horizontal lanes instead of shrinking text. Font size is never reduced.
- **Native turn duration**, folded from the session's own `turn/start` → `turn/end` events.
- **Add-session picker**, panel search, pause/resume, complete-with-undo.
- **Light and dark**, following the shell's resolved colour scheme.

## A native plugin, not an injection

The board registers into the shell's own global-panel seats — `sidebar.panellist` (the nav icon) and `main` (the panel body, keyed by the same id). That is the same mechanism DSH's built-in Schedules page uses, so the board is a first-class destination: selecting it swaps the centre column, and returning to the Conversation does not change the current session.

## Verified

- DSH **0.2.0-rc.2**, verified against the installed app rather than a source checkout.
- **50 tests pass** — 34 logic tests over framework-free `src/core.mjs`, plus 16 that execute the real built bundle through `apply()` and assert the rendered tree.
- Installed from this repository into a clean profile and booted end to end: nav entry, panel and stylesheet all load from the served bundle.

## Notes

Two behaviours are constrained by DSH's session model:

1. **Resume sends a real message** — DSH rejects empty prompts and has no session-level resume, so the card sends a minimal instruction (`继续`).
2. **Blank sessions stay off the board** — DSH reuses one empty New-session draft per workspace, so it is a scratch slot rather than a task.

MIT licensed. Not affiliated with DeepSeek AI.
