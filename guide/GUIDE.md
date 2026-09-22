---
title: FleetView — Every Agent Session, Live, on a Single Screen
subtitle: A browser page showing every Claude Code session on your computer, grouped by your own folders, with your 5-hour usage window
repo: https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview
piece: 2
---

## What it is

FleetView is a single browser page that shows every Claude Code session running on your computer today.

Each of your folders is a small dot, called a hub: your second brain, your CRM, your content engine, and any other folder you name. Every session hangs off the folder it runs in. Sessions from folders you did not name hang off a hub called **Other**.

![FleetView with 6 made-up sessions across 4 folders. The Second Brain session on the left is working and has 1 subagent running. All names and numbers are made up.](img/fleetview-graph.png)

What each part of the picture means:

- **The circle's colour** is what the session is doing. Green means working. Amber means it has answered and is waiting for you. Blue means idle.
- **The letter inside** is the model: O for Opus, S for Sonnet, F for Fable, H for Haiku, and ? for a model FleetView has no price for.
- **The ring round the circle** shows how full the session's context window is. The context window is how much text the model can keep in view at once. The ring is blue, then amber above 60%, then red above 85%. A small **1M** tag means the session has a 1,000,000-token window instead of the usual 200,000. A token is roughly 3 quarters of a word.
- **Under the circle** is the session's title (Claude Code gives every session a title), its cost and its number of turns. A turn is 1 reply from the model.
- **Small satellite circles** are subagents: helper agents that session started in the last 30 minutes. The label under a satellite is the agent's type.
- **The top bar** adds everything up: sessions, how many are active, live subagents, tokens, output tokens and cost. At the right are your **5-hour window** (tokens used, projected total, minutes left) and your **7-day total**.

Click any circle and a side panel opens with the full detail and the session's last 10 steps.

![The side panel for the Second Brain session: model, cost, tokens, context, its subagent, the files it touched and its last steps.](img/fleetview-panel.png)

> **Note:** The dollar figures are what those tokens would cost on the paid Claude API at standard rates. If you are on a Claude subscription (Pro or Max) you do not pay them. Read them as a size gauge. The page says this in its bottom bar.

There is also a card view at `http://localhost:3010/`, the original page this project was built on.

![The card view of the same made-up sessions.](img/fleetview-grid.png)

## Why you would want it

Once you run agents, you run several at once. A second brain session tidying notes. A CRM session working out who to follow up. A content session drafting posts. Each one lives in its own terminal window.

Without FleetView you find out what each one is doing by clicking through the windows. You miss the one that finished 20 minutes ago and has been waiting for your answer since. You do not see that one session's context window is 90% full and about to lose track of the start of the conversation. And on a subscription, the question that matters most is not "what did this cost" but "how close am I to my 5-hour limit", which Claude Code does not show you in a single place.

FleetView answers 3 questions at a glance:

1. What is running right now, and in which folder?
2. Which session is waiting for me?
3. How much of my 5-hour usage window have I used, and where will I end up?

It does this without changing anything in Claude Code. It adds no hooks (a hook is a command Claude Code runs on every event), changes no settings and starts no agents. It only reads the log files Claude Code already writes to `~/.claude/projects` for every session.

## How we built it

Everything below comes from Ashley's own records. The times on 2026-06-12 are the times of the screenshots saved that day.

### 2026-06-12, afternoon: the one-tab tool that could not merge

That day Ashley installed agent-flow, an open-source tool that draws a live picture of 1 Claude Code session per browser tab, on port 3001. He wanted all his sessions in a single tab. Claude wrote a change to merge them. The data came through correctly, but agent-flow's drawing code can only draw 1 starting point per picture, so the merged sessions piled on top of each other. The change was taken back out. Ashley's verdict: *"that hasn't worked - It's not working at all."*

### The search for a single-screen tool

Claude then tried the other open-source dashboards for Claude Code:

- **Claude-Code-Agent-Monitor** (hoangsonww, 456 stars at the time) lost first. On its first start it rewrote the hooks in `~/.claude/settings.json` without asking. Then it tried to import Ashley's entire session history, 9.4 GB in 3,842 files. That used about 10 processor cores and crashed its own web server. It was stopped and its hooks were removed.
- **claude-view** lost because it runs on macOS only. 2 other tools lost because they needed Docker or Bash, which are awkward on Windows.
- **Stargx/claude-code-dashboard** won, for a single reason: it needs no hooks. It reads the log files in `~/.claude/projects` directly, so every folder on the computer is covered with no set-up. The stock card view was running by 16:56.

What was kept from it, unchanged: the code that watches the log files and reads new lines as they arrive, the rules for working, waiting and idle, and the card page. Its port was changed from 3001 to 3010, because agent-flow already used 3001. (Its README said a `PORT` setting worked; its code did not read it.)

### 2026-06-12, evening: the graph

A second search of GitHub found nothing that draws all live sessions as a single graph on Windows. The nearest tools either looked back at sessions after the fact or showed 1 project only. So Claude added a new data route to the server, `/api/graph`, and a new hand-drawn page, `graph.html`, with no libraries. It shows today's sessions, subagents active in the last 30 minutes and each session's last 10 log lines, and trims idle sessions to the 3 most recent per folder. The first version was on screen at 18:55.

![Ashley's first FleetView graph, 2026-06-12 18:55. His real folders, Nexus and Second Brain, with 9 sessions. The top bar had no token counts yet.](img/history-2026-06-12-first-graph.png)

Later that evening:

- **The price table was corrected.** The original table charged Opus 4.6 at $15 per million input tokens and $75 per million output, and cache writes at 0.25 times the input rate. Both were wrong. The table also had no rows for Fable or Opus 4.8, so it priced them at Sonnet rates, below their real rates. The June fix added them.
- **22:25, token counts.** Ashley is on a subscription, so tokens matter more than dollars. The top bar gained a total token count and an output token count.
- **22:34, the 5-hour window.** Ashley: *"fix it"*. A new route, `/api/usage`, runs ccusage, a free open-source tool that works out Claude's 5-hour usage windows from the same log files. It shows used, projected and minutes left.

![The first 5-hour window gauge, 2026-06-12 22:34: 170.87M tokens used, 189.08M projected, 26 minutes left.](img/history-2026-06-12-5h-window.png)

- **22:45 to 23:06, budgets and alarms.** Ashley: *"make all this so"*. A 7-day total was added. Both gauges became click-to-set budgets: green under 70%, amber from 70% to 90%, red at 90% and over. A browser notice fires once when the 5-hour projection passes the budget. No plan limit was invented; Ashley typed his own.

![Budgets set, 2026-06-12 22:45: the 5-hour window in red at 197.65M of a 200.00M budget.](img/history-2026-06-12-budgets.png)

The same evening Claude also added a map of all 73 of Ashley's agents (FleetMap) and a view of agents passing work between his apps (Comms Mesh), and a hidden file in his Startup folder so the server started at logon. On 2026-07-02 a 3D video view (Fleet Cinema) was added to the same server. None of those are in your download: they were built around Ashley's own agents and apps.

### 2026-06-21: the ruling against separate dashboards

9 days later Ashley ruled against the direction. On a page that streamed events as they happened: *"I hate seeing a stream of info - It just means nothing."* On a second standalone dashboard: *"I'd rather have this as part of Project Forge frankly."* ProjectForge is his work board. The ruling: views of the agents belong as a tab inside the work board, never as another program on another port.

### Since then: quiet

- **2026-07-27:** Ashley's tool register moved the Stargx dashboard from "ship" to "watch": 10 stars, no change since 2026-03-09, "fine for us because we can fix it", but too thin to put in front of the 6 paying members at the time.
- **2026-08-12:** the last sign in the record that it was running.
- **2026-09-22:** nothing answered on port 3010, although the Startup file was still there. Why the logon start stopped working is not recorded. Started by hand, it came up in about 2 seconds.

### 2026-09-22: making it fit for you

For this download we took the original plus only the graph, the token panel and the price fix, and fixed what we found wrong on the day:

- Ashley's copy grouped sessions by the folder name after `\Documents\`, which only fits his habits. Yours groups by the folders you name when you install.
- His copy had no price for Opus 5, the model every session used that day, so it priced them at Sonnet 4.6 rates. Prices now come from a table checked on 2026-09-22 against Anthropic's pricing page, and a model with no price row shows "price unknown" instead of a guess.
- His copy assumed every session had a 200,000-token context window. A session on a 1,000,000-token window showed 100% full. FleetView now switches to 1,000,000 when the model name ends in `[1m]` or a turn goes over 200,000.
- A Haiku subagent inside an Opus session was priced as Opus, and its turns overwrote the session's context ring. Each reply is now priced with its own model.
- The original server listened on every network connection, so anyone on the same wifi could open it. Yours only answers on this computer.
- His copy ran ccusage every 60 seconds all day. Yours runs it only while a FleetView page is open.

## Pros and cons

| | Pros | Cons |
|---|---|---|
| Set-up | Reads files Claude Code already writes. No hooks, no settings changes, no database. Safe to try and safe to delete. | Needs Node.js, which you may not have. |
| Cost in tokens | Uses 0 Claude tokens. It is plain code reading files. | None. |
| Cost in time | About 5 minutes to install. Starts in seconds; Ashley's 3.2 GB history answered in about 2 seconds. | The first read of a very large history takes longer and uses some processor time. |
| What it shows | Every session in a single tab, including ones started before FleetView. The 5-hour gauge answers the question subscription users actually have. | It shows who is running, not what they are achieving. Ashley's 2026-06-21 view was that a stream of events "means nothing". |
| Accuracy | Prices checked on 2026-09-22; unknown models are flagged, not guessed. | Prices go out of date with every new model, and you must add the row yourself. The context window is a best estimate (see When it goes wrong). |
| Upkeep | Small: 1 server file and 1 page. Your own Claude can change it in minutes. | The project it is built on is thin: 13 stars and no change since 2026-03-09 (checked 2026-09-22). You are the maintainer now. |
| Privacy | Only reachable from your own computer. | The side panel shows folder paths and file names. Careful when screen-sharing; set `hide_paths` (see Fit it to your own AI system). |

### The free ready-made alternative

If you would rather have a bigger, polished tool that someone else maintains, look at **Claude-Code-Agent-Monitor** (https://github.com/hoangsonww/Claude-Code-Agent-Monitor, MIT licence). On 2026-09-22 it had 1,012 stars and a change the day before. It is a full React app on port 4820 with a database, charts of how your agents work, a Windows and Mac desktop app with a tray icon, and 5 languages.

> **Warning:** Its set-up (`npm run setup`, then `npm run install-hooks`) adds its own hooks to `~/.claude/settings.json`, and its desktop app installs those hooks on first start. It also imports your whole session history when it first starts. On Ashley's computer on 2026-06-12 that import used about 10 processor cores and crashed it. Before you try it, copy `~/.claude/settings.json` somewhere safe, and expect 1 extra process to start on every hook event.

## Before you start

| You need | How to check | How to get it |
|---|---|---|
| Node.js 18 or newer | Open a terminal and type `node --version`. You should see `v18` or higher. | Windows: `winget install OpenJS.NodeJS.LTS`, or the LTS installer from https://nodejs.org. Mac: `brew install node`. Then open a new terminal. |
| Python 3 | `python --version` (on a Mac, `python3 --version`) | https://www.python.org |
| Git | `git --version` | https://git-scm.com |
| Claude Code, used at least once | Look for the folder `.claude\projects` in your home folder | You have this from the earlier sessions. |
| Internet | | Needed for the install, for the card page (it loads a library called React from the internet) and for the first run of the 5-hour gauge. |

## Install it

1. Open a terminal in the folder where you keep your projects (for example `Documents`).
2. Copy the program to your computer and start the installer:

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview
cd outliers-ws-02-fleetview
python install.py
```

3. The installer checks Node.js. If it is missing or too old it tells you how to get it and stops without changing anything.
4. It downloads 2 small libraries with `npm install`. This needs internet and takes under a minute.
5. It asks where your **second brain vault** is, then your **CRM vault**. It looks for Obsidian vaults in your Documents and home folders and suggests the likely vault in brackets. Press Enter to accept, type a different path, or type `-` to skip.
6. It asks for **any other project folders**, one at a time. Add your content engine folder here and give it a short name such as `Content Engine`. Press Enter on an empty line to finish.
7. It asks for the **port**. Press Enter for 3010, unless something else on your computer already uses 3010.
8. It asks whether to switch on the **5-hour and 7-day token panel**. Say yes unless you have no internet.
9. It asks whether to start FleetView **automatically when you log in, with no window**. On Windows this puts a small file called `FleetView.vbs` in your Startup folder. On a Mac it writes a launchd file (Apple's way of starting programs at login) and prints the 1 command to switch it on now.
10. It asks whether to **start FleetView now**, with no window. Say yes.
11. Open **http://localhost:3010/graph.html** in your browser.

![What the installer looks like, answered by hand. The folder paths are made up.](img/install-output.png)

When it has worked you see your folders as hubs with today's sessions hanging off them, like the picture at the start of this guide. If you have no Claude Code session today, the page says so; start a session and it appears within 2 seconds.

> **Note:** The 5-hour gauge says "checking…" for up to a minute the first time, while your computer downloads ccusage. After that it updates every 15 seconds while the page is open.

Running the installer again with the same answers changes nothing. If you change an answer, it saves your old settings as `config.json.bak-<date>` first.

To stop FleetView: `python install.py --stop`. To remove the logon start as well: `python install.py --uninstall`. To remove it completely, uninstall and then delete the folder.

## Using it day to day

- **Leave the tab open.** Pin `http://localhost:3010/graph.html` in your browser. It refreshes itself every 2 seconds.
- **Look for amber.** An amber circle has finished and is waiting for you. That is the session to switch to.
- **Watch the rings.** A red ring means that session's context window is over 85% full. Start a fresh session for the next task, or ask it to summarise and continue.
- **Set your budgets once.** Click **5h window** in the top bar and type a token number, such as `100M`. Do the same for **7d**. Allow browser notifications when asked. The gauge turns amber at 70% and red at 90%, and you get 1 notice when the projection passes your budget. The budgets are saved in this browser only.
- **See everything.** The graph shows today's sessions and the 3 most recent idle ones per folder. Add `?all=1` to the address to see every session it knows about.
- **2 different totals.** The top-bar tokens and cost add up only the sessions on screen. The 5-hour gauge counts every session in your account's current window. When they differ, the 5-hour gauge is the one that matches your usage limit.
- **New model released?** Open `lib/prices.json`, add a row with the rates from https://platform.claude.com/docs/en/about-claude/pricing, and restart FleetView. Until you do, that model shows "price unknown".

## Fit it to your own AI system

Each change below is a prompt you can paste into Claude Code, opened in your FleetView folder. Claude reads the code and makes the change. Test with `npm test` afterwards.

### 1. Put your CRM's today list beside the graph

Your CRM writes a ranked `Today.md` page each morning. Seeing it next to your sessions tells you whether your CRM agent has done its job yet.

```
In this FleetView folder, add a collapsible panel on the left of public/graph.html that shows my CRM's Today.md page. Add a "crm_today" path to config.json and config.example.json, add a GET /api/crm-today route in watcher.js that reads that file (read-only, never write to my CRM) and returns its text, and show the first 15 lines in the panel with the file's last-changed time. If the file is missing, show "No Today page yet". Add a test in tests/ using a made-up Today.md.
```

### 2. A plain line per session: what is it doing?

The circles say who is running. This makes them say what each one is working on.

```
In this FleetView folder, change lib/sessions.js to keep the most recent message I typed in each session (type "user", not a subagent), cut to 60 characters, and send it in the /api/graph data as "lastAsk". In public/graph.html, draw it in small grey text under each session's title. Keep the tests passing and add one for lastAsk.
```

### 3. An alarm that reaches you with the browser closed

Today the budget alarm only fires while the page is open.

```
In this FleetView folder, add a server-side budget check to watcher.js: read "budget_5h_tokens" from config.json, and when the ccusage 5-hour projection passes it, show a Windows notification (or a macOS notification on a Mac) once per window. Every subprocess call must pass windowsHide: true so no window appears. Only check while the server is running, never on a separate timer or scheduled task. Add the setting to config.example.json and explain it in README.md.
```

### 4. Cost per folder per week

See which part of your system uses the most: second brain, CRM or content engine.

```
In this FleetView folder, add a GET /api/by-folder route to watcher.js that adds up tokens and API-equivalent cost per folder group for the last 7 days, using the sessions already read and lib/groups.js. Add a small table at the bottom of public/graph.html, opened by clicking "by folder" in the bottom bar. Label the dollar column "API-equivalent, not money spent". Add a test with the made-up sessions from tools/make-demo.js.
```

### 5. Colour subagents by what your agents do

Your agents live in `~/.claude/agents` and in your vault's `.claude/agents`. Each file has a description.

```
In this FleetView folder, read every agent file in ~/.claude/agents and in the .claude/agents folder of each folder listed in config.json (read-only). Sort them into up to 6 colour groups using simple keywords from each agent's description (for example: research, writing, CRM, vault upkeep, content, other). Colour each subagent satellite on public/graph.html by its group and add the groups to the bottom bar as a key. Do not hard-code any agent names.
```

### 6. Flag sessions working in your content engine's drafts

When a content session is writing drafts, you usually want to review them straight after.

```
In this FleetView folder, add a "watch_folders" list to config.json, for example the drafts folder of my content engine. When a session in /api/graph has touched a file inside one of those folders in the last 30 minutes, add "touchedWatched": true, and draw a small star next to that session on public/graph.html. When the session then goes amber (waiting), make the star pulse. Add a test with made-up sessions.
```

### 7. Hide folder paths for screen-sharing

The side panel shows full folder paths and file names. If you share your screen on calls, switch them off with 1 click instead of editing a file.

```
In this FleetView folder, add a "hide paths" button to the bottom bar of public/graph.html and public/index.html. When pressed, the pages hide full folder paths and file names and show only the folder group name. Remember the choice in the browser's localStorage, wrapped in try/catch. The existing hide_paths setting in config.json should still work and should win when it is true.
```

### 8. Put it where you already look

Ashley's own ruling was that views like this belong inside the page you already work from, not in yet another tab.

```
In this FleetView folder, make public/graph.html work when shown inside another page: add a "compact=1" address option that hides the bottom bar, shrinks the top bar to sessions, active, 5h window and 7d, and fits the graph to a small area. Then tell me the exact address to use, and how to add it to my second brain's home note or my work board as an embedded web page.
```

## When it goes wrong

| What you see | Why | The fix |
|---|---|---|
| "Port 3010 is already in use" | Another program, or a second copy of FleetView, is using that port. On 2026-06-12 agent-flow was on 3001, which is why FleetView moved to 3010. | Open http://localhost:3010/graph.html; if FleetView is there, it is already running. If not, run `python install.py` again and choose another port. |
| The logon start is there but the page does not open | It happened on Ashley's computer: the Startup file was present but nothing answered on 3010 on 2026-09-22. The reason was never recorded. | Run `node watcher.js` in a terminal in the FleetView folder and read the error it prints. Then `python install.py --start`. |
| A session shows "price unknown" | Its model has no row in `lib/prices.json`. Ashley's June copy had no Opus 5 row and silently used Sonnet 4.6 rates, which made every cost wrong. | Add the model's row from https://platform.claude.com/docs/en/about-claude/pricing and restart. |
| A ring sits at 100% on a long session | The session has a 1,000,000-token window but FleetView had not seen evidence of it yet. Ashley's copy always assumed 200,000. | FleetView now switches to 1,000,000 when the model name ends in `[1m]` or a turn passes 200,000. The side panel says which rule it used ("assumed", "model id" or "seen above 200k"). Until one of those happens, a ring on a 1M session reads high. |
| 5-hour gauge shows "n/a" | ccusage could not run: no internet on the first run, or npx is blocked. | Hover over the gauge to see the reason. Check your internet, or switch the panel off in `config.json` (`"usage": {"enabled": false}`). |
| The card page at `/` is blank | It loads React from unpkg.com, which needs internet. | Use `/graph.html`, which needs nothing from the internet. |
| Top-bar cost and the 5-hour gauge disagree | They count different sessions: the top bar only the sessions on screen, the gauge your whole account's current window. Ashley's notes also record that the original dashboard's cost disagreed with agent-flow's token numbers for the same session. | Trust the 5-hour gauge for your limit. Treat the top bar as "these sessions". |
| Another dashboard filled your `settings.json` with hooks | That was Claude-Code-Agent-Monitor on 2026-06-12, not FleetView. FleetView never touches `settings.json`. | Restore the copy of `settings.json` you made before installing it. |

## Download

The code, this guide's source and the tests: **https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview**

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview && cd outliers-ws-02-fleetview && python install.py
```

FleetView is built on Stargx/claude-code-dashboard (MIT licence, Copyright (c) 2025 Cold Beam Games) and uses ccusage (MIT licence) for the 5-hour and 7-day gauges. Prices were checked on 2026-09-22.
