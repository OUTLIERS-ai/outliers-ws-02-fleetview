# FleetView: every Claude Code session on a single screen

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview && cd outliers-ws-02-fleetview && python install.py
```

Say yes when it offers to start FleetView, then open **http://localhost:3010/graph.html**. (Or start it yourself any time with `node watcher.js`.)

![FleetView with made-up sessions](guide/img/fleetview-graph.png)

## What it shows

- A dot (a hub) for each of your folders: your second brain, your CRM, your content engine, anything else you name. Sessions from any other folder hang off a hub called **Other**.
- A circle for each Claude Code session running today, hanging off the folder it runs in. Green means working, amber means it has answered and is waiting for you, blue means idle.
- The letter inside is the model: **O** Opus, **S** Sonnet, **F** Fable, **H** Haiku, **?** for a model FleetView does not know.
- The ring round each circle is how full that session's context window is: blue, amber above 60%, red above 85%. A small **1M** tag means a 1,000,000-token window.
- Small satellite circles are subagents that session started in the last 30 minutes.
- Under each circle: the session's title, its API-equivalent cost and its number of turns. Click a circle for the full detail and its last 10 steps.
- Across the top: sessions, how many are active, live subagents, tokens, output tokens, API-equivalent cost, your **5-hour usage window** (used, projected, minutes left) and your **7-day total**. Click either gauge to set your own budget; it turns amber at 70% and red at 90%, and your browser can pop up a notice.
- `http://localhost:3010/` is the original card grid, if you prefer cards.

**About the dollar figures.** They are what the tokens would cost on the paid Claude API at standard rates, checked on 2026-09-22. On a Claude subscription you do not pay them. Use them as a size gauge. A model with no price row shows "price unknown" instead of a guess.

## What it needs

- **Node.js 18 or newer.** Check with `node --version`. Get it from https://nodejs.org or `winget install OpenJS.NodeJS.LTS` (Windows) or `brew install node` (Mac).
- **Python 3** for the installer. Check with `python --version`.
- **Claude Code**, used at least once on this computer.
- Internet for `npm install`, for the grid page (it loads React from unpkg.com) and for the first run of the token panel (it downloads ccusage).

## What it does not do

It adds no hooks, changes no settings and starts no agents. It only reads the log files Claude Code already writes in `~/.claude/projects`. The page is only reachable from this computer (it listens on 127.0.0.1).

## Commands

| Command | What it does |
|---|---|
| `python install.py` | Checks Node.js, installs 2 libraries, asks for your folders, writes `config.json`, offers a hidden logon launcher |
| `python install.py --start` / `--stop` | Starts FleetView in the background with no window / stops the copy it started |
| `python install.py --uninstall` | Stops it and removes the logon launcher it made. Leaves everything else |
| `node watcher.js` | Starts FleetView |
| `npm test` | Runs the JavaScript tests against made-up sessions |
| `python -m pytest -q` | Runs the installer tests in a temp folder |
| `node tools/make-demo.js <empty-folder> --live` | Writes made-up sessions so you can see it working. Then start with `FLEETVIEW_CONFIG=<empty-folder>/fleetview-demo-config.json node watcher.js` |

## Settings (`config.json`)

| Key | Meaning |
|---|---|
| `port` | Web page port, 3010 by default |
| `folders` | Your folders: `[{ "name": "CRM", "path": "..." }]`. The most specific match wins |
| `idle_per_folder` | How many idle sessions to show per folder (3). Add `?all=1` to the address to see everything |
| `hide_paths` | `true` hides full folder paths, for screen-sharing |
| `usage.enabled` | `false` switches the 5-hour and 7-day panel off |
| `projects_dir` | Only if Claude Code keeps its logs somewhere unusual |

Prices live in `lib/prices.json`. Add a row when a new model appears.

## Credit

Built on [Stargx/claude-code-dashboard](https://github.com/Stargx/claude-code-dashboard), MIT, Copyright (c) 2025 Cold Beam Games. Token windows come from [ccusage](https://github.com/ccusage/ccusage), MIT. See `WHAT-I-STOLE.md` and `LICENSE`.

The full guide, including how it was built and 8 ways to fit it to your own setup, is in `guide/GUIDE.md`.
