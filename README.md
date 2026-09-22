# FleetView: every Claude Code session on a single screen

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview; cd outliers-ws-02-fleetview; python install.py
```

Say yes when it offers to start FleetView, then open **http://localhost:3010/graph.html**. Later, start it with `python install.py --start` and stop it with `python install.py --stop`.

![FleetView with made-up sessions](guide/img/fleetview-graph.png)

Want to see it before your own sessions exist? `npm install` then `npm run demo`, and open http://localhost:3011/graph.html (made-up sessions, port 3011, Ctrl+C stops it; works in PowerShell, cmd and bash).

## What it shows

- **Who needs you.** "3 need you" at the top, and a **Needs you** strip naming every session whose last word is Claude's finished answer, longest wait first. A session stays amber (waiting) until you answer, up to `waiting_hours` (8 hours; after that it shows as idle). Finished with a session? Open it and press **Mark as done**.
- A dot (a hub) for each of your folders: your second brain, your CRM, your content engine, anything else you name. Sessions from any other folder hang off a hub called **Other**. A folder appears once it has a session today.
- A circle for each Claude Code session today. The circle's fill is its status: green working, amber waiting for you, blue-grey idle. A session that asked to run a tool and got nothing back for 30 seconds shows as waiting with "may need approval".
- The letter inside is the model: **O** Opus, **S** Sonnet, **F** Fable, **M** Mythos, **H** Haiku, **?** any other model.
- The ring round each circle is how full its context window is: light grey, red above 85%. **1M** means a 1,000,000-token window.
- Small dots are helper agents (subagents) started in the last 30 minutes.
- The top bar adds up **every** session today, drawn or not, and says when idle sessions were left off the drawing (with a **show all** link, or add `?all=1` to the address). Then your **5-hour window** and **7-day total**, Claude Code only (from `ccusage claude`). Click either gauge to set a token budget.
- Hover any circle for a label in words; click it for the detail and its last 10 steps. Escape closes the panel.
- If FleetView stops, the page shows a red **FleetView stopped** banner within 4 seconds.
- Above 12 sessions the graph switches to 1 column per folder.
- `http://localhost:3010/cards.html` shows the same sessions and totals as cards. `/` goes to the graph.

**About the dollar figures.** `$` is what these tokens would cost if you paid per token, at the rates checked on 2026-09-22. It is not money taken from your subscription. A model with no price row shows "no price" instead of a guess.

## What it needs

- **Node.js 20.19 or newer** (any v22 or v24). Check with `node --version`. The file watcher it uses (chokidar 5) refuses older versions. Get it from https://nodejs.org, `winget install OpenJS.NodeJS.LTS` (Windows) or `brew install node` (Mac).
- **Python 3** for the installer. Check with `python --version`.
- **Claude Code.** If you have not used it yet, FleetView starts reading its log folder as soon as it appears.
- Internet for `npm install` and the first run of the token panel (it downloads ccusage). The pages need nothing from the internet: React is stored in `public/vendor/`.

## What it does not do

It adds no hooks, changes no settings and starts no agents. It only reads the log files Claude Code already writes in `~/.claude/projects`. The page answers only on this computer (127.0.0.1) and refuses requests that name another website.

## Commands

| Command | What it does |
|---|---|
| `python install.py` | Checks Node.js, downloads 2 code packages, asks for your folders, writes `config.json`, offers a hidden logon start, starts FleetView. Changed answers restart it on the new settings |
| `python install.py --start` | Only starts FleetView, with your saved answers. No questions |
| `python install.py --stop` | Stops FleetView however it was started (installer, logon or by hand). Checks it really is FleetView before stopping it |
| `python install.py --uninstall` | Stops it and removes the logon file it made. Leaves everything else |
| `python install.py --yes --second-brain PATH --crm PATH --folder "NAME=PATH" --port N --no-ccusage --no-launcher --no-start` | Install with no questions |
| `node watcher.js` / `npm start` | Start FleetView in this terminal, showing any error |
| `npm run demo` | Made-up sessions on port 3011 |
| `npm test` | JavaScript tests against made-up sessions |
| `python -m pytest -q` | Installer tests in a temp folder |

## Settings (`config.json`)

| Key | Meaning |
|---|---|
| `port` | Page port, 3010 by default |
| `host` | `127.0.0.1`: only this computer. Leave it |
| `folders` | Your folders: `[{ "name": "CRM", "path": "..." }]`. The most specific match wins |
| `idle_per_folder` | Idle sessions drawn per folder (3). Totals always count every session |
| `waiting_hours` | How many hours an unanswered session stays amber (8). After that it shows as idle (blue-grey) and leaves the Needs you strip |
| `hide_paths` | `true` hides folder paths, file names and the text of recent steps, for screen-sharing |
| `usage.enabled` | `false` switches the 5-hour and 7-day panel off |
| `usage.package` | The ccusage version run (`ccusage@20.0.24`) |
| `projects_dir` | Only if Claude Code keeps its logs somewhere unusual |

After changing `config.json`: `python install.py --stop`, then `python install.py --start`. `config.example.json` shows every setting. FleetView writes `fleetview.pid` (process number and port, for `--stop`) and, when started in the background, `fleetview.log` (read the end of it if it will not start). Terminal settings: `PORT`, `FLEETVIEW_CONFIG`, `CLAUDE_CONFIG_DIR`, `FLEETVIEW_NO_CCUSAGE=1`.

Prices live in `lib/prices.json`. Add a row when a new model appears, then restart.

## Credit

Built on [Stargx/claude-code-dashboard](https://github.com/Stargx/claude-code-dashboard), MIT, Copyright (c) 2025 Cold Beam Games. Token windows come from [ccusage](https://github.com/ccusage/ccusage), MIT. React 18.3.1 (MIT, Copyright (c) Facebook, Inc. and its affiliates) is in `public/vendor/` with its licence. See `WHAT-I-STOLE.md` and `LICENSE`.

The full guide, including how it was built and 8 ways to fit it to your own setup, is in `guide/GUIDE.md`.
