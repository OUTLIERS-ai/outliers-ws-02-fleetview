---
title: "FleetView: Every Agent Session, Live, on a Single Screen"
subtitle: A browser page showing every Claude Code session on your computer, grouped by your own folders, with the ones that asked you something named first
repo: https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview
piece: 2
---

## What it is

FleetView is a single browser page that shows every Claude Code session running on your computer today, and tells you which of them have asked you something and are waiting on your answer.

Each of your folders is a small dot, called a hub: your second brain, your CRM, the folder where you write your posts (if you have one), and any other folder you name when you install. Every session hangs off the folder it runs in. A folder appears once it has a session today. Sessions from folders you did not name hang off a hub called **Other**.

This is piece 2 of 4 in the agent workspace. Install them in order: 1 agent-flow, 2 FleetView, 3 ProjectForge, 4 Jeeves. Each one also works on its own.

### Words used in this guide

| Word | What it means here |
|---|---|
| Session | 1 conversation with Claude Code, running in 1 terminal window. |
| Terminal | The text window where you type commands: PowerShell on Windows, Terminal on a Mac. |
| Token | The unit Claude's usage is counted in. 1 token is roughly 3 quarters of a word. |
| M, B | Million and billion. 41.3M tokens means 41.3 million tokens. |
| Context window | How much text a session can keep in view at once: 200,000 tokens usually, 1,000,000 on some models. |
| Model | Which Claude model answers: Opus, Sonnet, Fable, Mythos or Haiku. All 5 are Claude models made by Anthropic. |
| Subagent (helper agent) | A second Claude that your session starts to do 1 job and report back, such as finding notes. FleetView's page calls them helpers. |
| Hook | A command Claude Code runs by itself every time a given event happens, such as a tool about to run. Hooks are listed in `settings.json`, Claude Code's settings file. FleetView uses none. |
| Log file | The file where Claude Code writes down every message of a session as it happens. FleetView reads these. |
| 127.0.0.1 and localhost | 2 ways of writing "this computer". An address that starts with either of them opens only on your own computer. |
| Port | The number after the colon in an address such as http://localhost:3010. It picks out which program on your computer answers. In this set of 4: agent-flow 3001, FleetView 3010, ProjectForge 3020, Jeeves 4040. |
| `~` | Short for your home folder. `~/.claude/projects` is the folder `.claude\projects` inside it. |
| Node.js and npm | Node.js is free software that runs FleetView's server. npm is the tool that comes with it and downloads code packages. |
| GitHub, repo, stars | GitHub is the website where the code is kept. A repo is a project's folder of code, kept on GitHub; `git clone` copies it to your computer. Stars are GitHub's count of people who bookmarked a project. |
| Git branch | The named version of the code a session is working on. It only shows for folders that use Git. |

![FleetView with 9 made-up sessions in 4 folders: 2 asked the member something (amber), 1 is waiting on a tool (violet), 2 are working (green), the rest have answered or are idle (blue-grey). The key along the bottom edge explains every mark.](img/fleetview-graph.png)

What each part of the picture means:

- **The circle's colour** is what the session is doing:
  - **Green: working.** Claude is doing something right now.
  - **Amber: it asked you something.** Claude's last message ends in a question and nobody has answered it. This is the one colour that means "go and type".
  - **Darker amber: it asked you over 30 minutes ago.** Still a question for you, but an older one, so it does not shout as loudly as the question you were asked 2 minutes ago.
  - **Violet: it may need your approval.** Claude asked to run a tool and nothing has come back for over 30 seconds. That is either Claude Code asking your permission in that terminal, or a long command such as `npm install`. It is counted on its own, not as "need you".
  - **Blue-grey: nothing for you to do.** Either idle, or Claude answered and asked nothing. The line under the circle says which.
  - **Grey with a white tick: you pressed Mark as done.**
- **"2 need you"** at the top left counts only the amber sessions: the ones that asked you something. A session that answered and asked nothing is never counted, which is why the number stays small enough to act on. A question stops counting after `waiting_hours` (1 hour out of the box) and the session goes blue-grey.
- The **Needs you** strip under it names those sessions, **newest question first**, with how long each has waited. Click a name to open that session. The strip wraps onto more rows as it needs them and never takes more than about 15% of the screen height.
- **The letter inside** is the Claude model the session uses. Anthropic names its models Opus, Sonnet, Fable, Mythos and Haiku: O Opus, S Sonnet, F Fable, M Mythos, H Haiku, and ? for any other model.
- **The ring round the circle** shows how full the session's context window is. The ring is always the same light grey. Over 85% full, a small red **!** appears beside the circle: the circle's own colour stays free for what the session is doing, so the 2 never blur into 1 blob. A small **1M** tag means the session has a 1,000,000-token window instead of the usual 200,000.
- **Under the circle** is the session's title (Claude Code gives every session a title), then 1 line saying where it stands: "asked you 4 min ago", "may need approval · 3 min", "answered 12 min ago · $0.09", or its cost and number of turns. A turn is 1 reply from the model.
- **Small dots beside a circle** are helper agents (subagents) the session started in the last 30 minutes. Hover a dot to read what that helper is doing.
- **The top bar** adds up every session today, whether or not it is drawn: how many need you, how many are working, how many may need approval, sessions, helpers, tokens and cost. Then your **5-hour window**: a Claude subscription limits how much you can use in each 5-hour period, and this shows the tokens used so far in the current period, where you will end up at this rate, and the minutes until it resets. Then your **7-day total**: tokens used in the last 7 days, which Claude also limits. When idle sessions are left off the drawing, the top bar says how many and offers **show all**.
- **The key** along the bottom explains every colour, letter and mark.

Hover over any circle and a label says, in words, what it is doing.

![Hovering over the CRM session that asked a question: what it is doing in words, how long ago it asked, its model, its cost and how full its context window is. Made-up data.](img/fleetview-hover.png)

Click any circle and a side panel opens with the full detail and the last 10 entries in the session's log. Each entry is labelled **you typed** (your message), **Claude thinking** (its reasoning) or **Claude used** (a file it read or a command it ran). For a session that asked you something, the panel has a **Mark as done** button: press it when you have dealt with that question another way, so it stops counting. Press Escape to close the panel.

![The side panel for a session that asked you something: when it asked, the Mark as done button, then model, cost, tokens and its last steps. Made-up data: the people and businesses named in it are invented.](img/fleetview-panel.png)

> **Note:** The dollar figures are what those tokens would cost if you paid per token. They are not money taken from your subscription. If you are on a Claude subscription (Pro or Max) you do not pay them. Read them as a size gauge. The page says this once, in its key.

There is also a card view at `http://localhost:3010/cards.html` (3010 is the port), with the same sessions, the same totals and the same colours as cards. It works with no internet.

![The card view of the same made-up sessions: the ones that asked you something first, newest first, each saying when it asked. Each card names its folder once, with the git branch.](img/fleetview-grid.png)

## Why you would want it

Once you run agents, you run several at once. You might have a second brain session tidying notes, a CRM session working out who to follow up and a session drafting posts, each in its own terminal window.

Without FleetView you find out what each is doing by clicking through the windows. You miss the session that finished 20 minutes ago and has been waiting for your answer since. You do not see that a session's context window is 90% full and about to lose track of the start of the conversation. And on a subscription, the question that matters is how close you are to your 5-hour limit, which Claude Code does not show you in a single place.

![Left: 4 terminal windows, 2 of them quietly waiting for an answer. Right: the same 4 sessions on FleetView, with the 2 waiting ones counted and named at the top. Made-up example.](img/why-a-single-page.png)

FleetView answers 3 questions:

1. Which session is waiting for me, and for how long?
2. What is running right now, and in which folder?
3. How much of my 5-hour usage window have I used, and where will I end up?

It only reads the log files Claude Code already writes for every session, in the folder `.claude\projects` inside your home folder (written `~/.claude/projects`). It adds no hooks and changes no settings.

### What it is for

Seeing every Claude Code session on your computer today on 1 screen, which of them asked you a question, and how much of your 5-hour usage allowance is gone.

### Works well when

- **You run 3 or more sessions at once**, each in its own terminal window, and you keep losing track of which one is waiting for you.
- **You are on a Claude subscription** and want to know how close you are to the 5-hour limit before you start a long job.
- **You want to catch a full context window early.** A red **!** beside a session at 85% full is your cue to finish or restart it before it starts forgetting the beginning of the conversation.
- **You came back after an hour away** and want to know what moved, in which folder, without clicking through 6 windows.
- **You want to know where your usage went today**, folder by folder, rather than as 1 total.

### Does not work well when

- **You read the pound and dollar figures as money.** They are the pay-per-token prices for the tokens used. On a Claude subscription no such money leaves your account. Read them as a size gauge, nothing more.
- **You use a model FleetView does not price.** It carries Anthropic's own published price list only. A model with no row is flagged on screen rather than guessed, and you add its prices yourself in `lib/prices.json`.
- **You expect "needs you" to mean "finished".** It means Claude's last message ended in a question. A session grinding through a 40-minute job in silence is not counted at all, so a long quiet job looks the same as a job that finished and asked nothing.
- **You want to know whether the work is any good.** It reports who is running and who is waiting. It cannot judge the output, and it never reads the answer.
- **You are screen-sharing.** The side panel shows folder paths, file names and the start of what you typed. Set `hide_paths` to `true` in `config.json` before you share.

## How we built it

Everything below comes from Ashley's own records. The times on 2026-06-12 are the times of the screenshots saved that day.

### 2026-06-12, afternoon: the single-tab tool that could not merge

That day Ashley installed agent-flow (piece 1 of 4), an open-source tool that draws a live picture of 1 Claude Code session per browser tab, at http://localhost:3001. He wanted all his sessions in a single tab. Claude wrote a change to merge them. The data came through correctly, but agent-flow's drawing code can only put 1 session at the centre of each picture, so the merged sessions piled on top of each other. The change was taken back out. Ashley's verdict: *"that hasn't worked - It's not working at all."*

### The search for a single-screen tool

Claude then tried the other open-source dashboards for Claude Code:

- **Claude-Code-Agent-Monitor** (456 stars at the time) lost first. On its first start it rewrote the hooks in Claude Code's own settings file, `~/.claude/settings.json`, without asking. Then it tried to import Ashley's entire session history, 9.4 GB in 3,842 files. That used about 10 processor cores and crashed its own web server. It was stopped and its hooks were removed.
- **claude-view** lost because it runs on macOS only. 2 other tools lost because they needed Docker (a tool for running programs in a sealed box) or Bash (the Mac and Linux command line), which are awkward on Windows.
- **claude-code-dashboard**, by the GitHub user Stargx, was picked because it needs no hooks. It reads the log files in `~/.claude/projects` directly, so every folder on the computer is covered with no set-up. Its card view, unchanged, was running by 16:56.

What was kept from it: the code that watches the log files and reads new lines as they arrive, the first version of the working, waiting and idle rules, and the card page. Its port was changed from 3001 to 3010, because agent-flow already used 3001. (Its instructions file said you could choose the port with a setting called `PORT`; the code ignored that setting.)

### 2026-06-12, evening: the graph

A second search of GitHub found nothing that draws all live sessions as a single graph on Windows. The nearest tools either looked back at sessions after the fact or showed 1 project only. So Claude added a new address on the server, `/api/graph`, that hands the page its data, and a new page, `graph.html`, written from scratch with no borrowed code. It shows today's sessions, helper agents active in the last 30 minutes and each session's last 10 log lines, and trims idle sessions to the 3 most recent per folder. The first version was on screen at 18:55.

![Ashley's first FleetView graph, 2026-06-12 18:55. His real folders, his CRM (a folder named Nexus) and his second brain, with 9 sessions. The top bar had no token counts yet.](img/history-2026-06-12-first-graph.png)

Later that evening:

- **The price table was corrected.** The original table priced Opus 4.6 at $15 per million tokens sent to the model (input) and $75 per million tokens it wrote back (output), and priced text saved for Claude to re-read later (cache writes) at a quarter of the input price. The Opus prices and the cache-write price were both wrong. The table also had no rows for Fable or Opus 4.8, so it priced them at Sonnet rates, below their real rates. The fix that evening added prices for both.
- **22:25, token counts.** Ashley is on a subscription, so tokens matter more than dollars. The top bar gained a total token count and an output token count.
- **22:34, the 5-hour window.** Ashley asked for his usage limit to be shown: *"fix it"*. A new address on the server, `/api/usage`, runs ccusage, a free open-source tool that works out Claude's 5-hour usage windows from the same log files. It shows used, projected and minutes left.

![The first 5-hour window gauge, 2026-06-12 22:34: 170.87M (million) tokens used, 189.08M projected, 26 minutes left.](img/history-2026-06-12-5h-window.png)

- **22:45 to 23:06, budgets and alarms.** Ashley asked for all of it to be built: *"make all this so"*. A 7-day total was added. Both gauges became click-to-set budgets: green under 70%, amber from 70% to 90%, red at 90% and over. A browser notice fires once when the 5-hour projection passes the budget. Anthropic does not publish the exact token limit for each plan, so FleetView does not guess one; Ashley typed in his own figure.

![Budgets set, 2026-06-12 22:45: the 5-hour window in red at 197.65M of a 200.00M budget.](img/history-2026-06-12-budgets.png)

### The same evening: the other views on the same server

The same evening Claude also added a map of all 73 of Ashley's agents, called FleetMap, and a view of agents passing work between his apps, called Comms Mesh. A small hidden file in the Windows Startup folder (programs in it start when you log in) started the server at logon. On 2026-07-02 a 3D video view, Fleet Cinema, was added to the same server; its Vault Galaxy view draws every note in his second brain as a star. None of these are in your download: they were built around Ashley's own agents and apps. They are shown here as Ashley built them.

![Ashley's real FleetMap on 2026-06-12: 73 agents in coloured teams, with Ashley in the centre and a key at the bottom left.](img/original-fleetmap-2026-06-12.png)

![Ashley's real Comms Mesh, 2026-06-12: agents in his work board (orange) and his LinkedIn app (pink), with each hand-off between them listed along the bottom.](img/original-comms-mesh-2026-06-12.png)

![Vault Galaxy from Ashley's Fleet Cinema, captured 2026-09-22: 835 notes and 1,619 links drawn as a star field, with the panel that turns it into a video.](img/original-vault-galaxy.png)

### 2026-06-21: the ruling against separate dashboards

9 days later Ashley ruled against the direction. On a page that streamed events as they happened: *"I hate seeing a stream of info - It just means nothing."* On a second standalone dashboard: *"I'd rather have this as part of Project Forge frankly."* ProjectForge is his work board. He ruled that views of the agents belong as a tab inside the work board, never as another program on another port.

### 2026-07-27 to 2026-09-22: it stopped running

- **2026-07-27:** Ashley's list of outside tools he tracks moved the Stargx dashboard from "give to members" to "keep an eye on": 10 stars, no change since 2026-03-09, "fine for us because we can fix it", but too thin to put in front of the 6 people paying for his Outliers programme at the time.
- **2026-08-12:** the last sign in the record that it was running.
- **2026-09-22:** nothing answered on port 3010, although the Startup file was still there. Why the logon start stopped working is not recorded. A copy started by hand from a temporary folder came up in about 2 seconds.

![Ashley's real FleetView on 2026-09-22, from that copy: 7 sessions round 4 of his folders: Nexus (his CRM), The Observatory (a research folder), SB and Second Brain (2 second-brain folders); the 5-hour window at 340.84M used, 374.00M projected, 26 minutes left; 7 days 3.44B (billion). The rings use blue, amber and red, the same colours as the status, which is 1 of the faults fixed for your copy.](img/original-fleetview-2026-09-22.png)

### 2026-09-22: making it fit for you

For this download we took Stargx's dashboard plus 3 of Ashley's additions (the graph page, the 5-hour and 7-day panel, and the corrected prices), and fixed what we found wrong on the day. It was checked 3 ways before you got it: a run-through of this guide by a tester who had never seen it, following only the words on the page, a usability review of the pages, and a security review of the code. What they found is fixed:

- **Amber did not last, and then it never stopped.** The original kept a session amber for 15 seconds after Claude answered, then turned it blue, so a session that asked you a question 4 minutes ago looked the same as a session nobody had touched since breakfast. (Claude Code writes a few bookkeeping lines to its log after each reply, and those were resetting the colour.) The first fix went the other way: every finished reply counted, so on a 30-session day 18 circles were amber and the colour told you nothing. The rule you have is the narrow one: a session is amber only when Claude's last message asked you something. "Done, saved." is not a question, so that session sits quietly in blue-grey and says "answered 12 min ago".
- **The 7-day figure counted other AI tools.** ccusage adds up every AI coding tool it finds on your computer unless it is asked for Claude only. Yours asks for Claude Code only (`ccusage claude`, checked with ccusage 20.0.24 on 2026-09-22).
- **The totals disagreed.** The graph added up only the sessions it drew, and the card page hid others. Both pages now show the same totals for every session today, and say when some are not drawn.
- **A stopped server looked alive.** If FleetView stopped, the page froze and kept a session pulsing green. Yours shows a red **FleetView stopped** banner within 4 seconds.
- **A first run before any Claude Code session saw nothing until restarted.** Yours starts reading the log folder as soon as Claude Code creates it.
- Ashley's copy grouped sessions by the folder name after `\Documents\`, which only fits his habits. Yours groups by the folders you name when you install.
- His copy had no price for Opus 5, the model every session used that day, so it priced them at Sonnet 4.6 rates. Prices now come from a table checked on 2026-09-22 against Anthropic's pricing page, and a model with no price row shows "no price" instead of a guess.
- His copy assumed every session had a 200,000-token context window. A session on a 1,000,000-token window showed 100% full. FleetView now switches to 1,000,000 when the model name ends in `[1m]` (the label Claude Code adds to a model running with the 1,000,000-token window) or a turn goes over 200,000.
- A Haiku helper inside an Opus session was priced as Opus, and its turns overwrote the session's context ring. Each reply is now priced with its own model.
- The original server listened on every network connection, so anyone on the same wifi could open it. Yours only answers on this computer, and refuses requests that name another website, so a web page you visit cannot reach FleetView and read your session titles, folder paths and what you typed.
- His copy ran ccusage every 60 seconds all day. Yours runs it only while a FleetView page is open.
- The card page loaded its drawing library, React, from the internet. Yours carries a copy, so it works offline.

## Pros and cons

| | Pros | Cons |
|---|---|---|
| Set-up | Reads files Claude Code already writes. No hooks, no settings changes, no database. Deleting the folder removes it completely. | Needs Node.js (free software that runs FleetView's server) version 22 or newer, and Python 3.11 or newer, which you may not have. |
| Cost in tokens | Uses 0 Claude tokens. It is plain code reading files. | None. |
| Cost in time | About 5 minutes to install. Starts in seconds; Ashley's 3.2 GB history answered in about 2 seconds. | The first read of a very large history takes longer and uses some processor time. |
| What it shows | Every session in a single tab, including sessions started before FleetView, with the waiting ones first. The 5-hour gauge answers the question subscription users actually have. | It shows who is running and who is waiting. It cannot tell you whether the work is any good. Ashley's 2026-06-21 view was that a stream of events "means nothing". |
| Waiting | Amber stays until you answer, and the Needs you strip says how long each has waited. | Every session whose last word is Claude's counts as waiting, including sessions you have simply finished with. Press Mark as done on those. |
| Accuracy | Prices checked on 2026-09-22; unknown models are flagged, not guessed. | Prices go out of date with every new model, and you must add each new model's prices to `lib/prices.json` yourself. The context window is a best estimate (see When it goes wrong). |
| Upkeep | Small: 1 server file and 2 pages. Your own Claude can change it in minutes. | The project it is built on is thin: 13 stars and no change since 2026-03-09 (checked 2026-09-22). If it breaks, you and your own Claude fix it. |
| Privacy | Only reachable from your own computer. | The side panel shows folder paths, file names and the start of what you typed. Careful when screen-sharing: set `hide_paths` to `true` in `config.json` (see Every command and setting). |

![What FleetView reads and what it never touches.](img/what-it-reads.png)

### The free ready-made alternative

If you would rather have a bigger, polished tool that someone else maintains, look at **Claude-Code-Agent-Monitor** (https://github.com/hoangsonww/Claude-Code-Agent-Monitor, MIT licence: free to use and change, as long as the credit stays). On 2026-09-22 it had 1,012 stars and a change the day before. It is a full app you open at http://localhost:4820, with a database, charts of how your agents work, a Windows and Mac desktop app with a tray icon, and 5 languages.

> **Warning:** Its set-up (`npm run setup`, then `npm run install-hooks`) adds its own hooks to `~/.claude/settings.json`, and its desktop app installs those hooks on first start. It also imports your whole session history when it first starts. On Ashley's computer on 2026-06-12 that import used about 10 processor cores and crashed it. Before you try it, copy `~/.claude/settings.json` somewhere safe, and expect 1 extra program to start every time Claude Code fires a hook, which happens on every tool use and every reply.

## Before you start

| You need | How to check | How to get it |
|---|---|---|
| Node.js 22 or newer | Open a terminal and type `node --version`. You should see v22 or higher. Node 18 stopped getting security fixes on 2025-04-30 and Node 20 on 2026-04-30, so the installer refuses anything older. | The LTS installer (LTS means long-term support, the steady version) from https://nodejs.org. On Windows you can instead type `winget install OpenJS.NodeJS.LTS` (the Windows installer tool). On a Mac, `brew install node` if you have Homebrew. Then open a new terminal. |
| Python 3.11 or newer | `python --version` (on a Mac, `python3 --version`). Python 3.10 and older stop getting security fixes, so the installer refuses them. | https://www.python.org. On Windows, if typing `python` opens the Microsoft Store, install Python from python.org and tick "Add python.exe to PATH" (this lets you type `python` in any terminal), or type `py` instead of `python` in every command below. |
| Git (the tool that copies the code from GitHub to your computer) | `git --version` | https://git-scm.com |
| Claude Code, used at least once | Look for the folder `.claude\projects` in your home folder | You have this from the earlier sessions. If not, FleetView still installs and starts reading the folder as soon as it appears. |
| Internet | | Needed for the install and for the first run of the 5-hour gauge (it downloads ccusage). The pages themselves need nothing from the internet. |

![The 4 checks in a terminal, with what a good answer looks like, and underneath, a Node.js and a Python that are too old. The version numbers are examples.](img/before-you-start.png)

## Install it

1. Open a terminal. Windows: press the Windows key, type `PowerShell`, press Enter. Mac: open Terminal. It opens in your home folder, which is where all 4 downloads in this set go.
2. Copy the program to your computer and start the installer (on a Mac, type `python3` instead of `python` in every command in this guide):

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview
cd outliers-ws-02-fleetview
python install.py
```

3. The installer checks Python and Node.js. If Python is older than 3.11, or Node.js is missing or older than 22, it tells you how to get it and stops without changing anything.
4. It downloads 2 small add-on code packages FleetView needs, using npm (the download tool that comes with Node.js). This needs internet and takes under a minute.
5. It asks where your **second brain vault** is, then your **CRM vault**. It looks for Obsidian vaults in your Documents and home folders and suggests the likely vault in brackets. Press Enter to accept, type a different path, or type `-` to skip.
6. It asks for **any other project folders**, 1 at a time. If you keep a folder where you write your posts, add it here and give it a short name such as `Content Engine`. Press Enter on an empty line to finish.
7. It asks for the **port**: the number at the end of the page's address (3010 gives http://localhost:3010). Press Enter for 3010, unless something else on your computer already uses 3010.
8. It asks whether to switch on the **5-hour and 7-day token panel**. Say yes unless you have no internet.
9. It asks whether to start FleetView **automatically when you log in, with no window**. On Windows this puts a small file called `FleetView.vbs` in your Startup folder. On a Mac it writes a launchd file (Apple's way of starting programs at login) and prints the command to switch it on now.
10. It asks whether to **start FleetView now**, with no window. Say yes.
11. Open **http://localhost:3010/graph.html** in your browser. (`http://localhost:3010/` takes you there too.)

![What the installer looks like, answered by hand. Your answers are in amber; the folder paths are examples. (Y/n) means pressing Enter gives yes.](img/install-output.png)

When it has worked you see your folders as hubs with today's sessions hanging off them, like the picture at the start of this guide. If you have no Claude Code session today, the page says so; start a session and it appears within 2 seconds.

> **Note:** The 5-hour gauge says "first check" for up to a minute the first time, while your computer downloads ccusage. After that it updates about once a minute while the page is open, and the 7-day total about every 5 minutes.

Running the installer again with the same answers changes nothing, and if FleetView is running it says so. If you change an answer, it saves your old settings as `config.json.bak-<date>` first, stops the running FleetView and starts it again on the new settings, so there is never more than 1 copy running.

These commands run inside the FleetView folder. In a new terminal, type `cd outliers-ws-02-fleetview` first.

- To stop FleetView: `python install.py --stop`. This finds it however it was started, including at logon.
- To start it again: `python install.py --start`. This only starts it, with your saved answers. It asks no questions.
- To remove the logon start as well: `python install.py --uninstall`. This stops FleetView and removes the Startup file it made.
- To remove it completely: uninstall, then delete the folder.

> **Tip:** Want to see FleetView working before your own sessions exist? In the FleetView folder run `npm run demo`, then open http://localhost:3011/graph.html. It draws 6 made-up sessions on port 3011, so it never clashes with your own copy on 3010. The same command works in PowerShell, Command Prompt and a Mac terminal. Press Ctrl+C to stop it.

## Using it day to day

- **Leave the tab open.** Pin `http://localhost:3010/graph.html` in your browser. It refreshes itself every 2 seconds, and "updated 0s ago" at the top tells you it is alive.
- **Look at the Needs you strip first.** It names every session that asked you something, newest question first, and wraps onto more rows when there are more of them. Click a name to open it, then switch to that terminal and answer.

![The top of the page: "2 need you", and the Needs you strip naming each session that asked a question, newest first, with how long ago it asked. Made-up data.](img/needs-strip.png)

- **Dealt with a question another way? Press Mark as done.** Open the session and press **Mark as done**; the circle turns grey, gets a white tick and its line reads "done · was waiting 12 min", so you can see you dealt with it rather than never opened it. The choice is kept in this browser. If Claude writes again in that session, it comes back.
- **"May need approval" is its own colour.** If a session asked to run a tool and nothing has come back for 30 seconds, it turns violet and is counted under **may need approval** in the top bar, not under "need you". Claude Code may be asking your permission in that terminal, or a long command such as `npm install` is running. Check the terminal.
- **Watch for the red !** beside a circle. It means that session's context window is over 85% full. Start a fresh session for the next task, or ask it to summarise and carry on.
- **Set your budgets once.** Click **5-hour window** in the top bar and type a token number, such as `100M` (100 million). Do the same for **7 days**. Allow browser notifications when asked. With no budget the gauge stays grey; with a budget it turns amber at 70% and red at 90% of the projected total, and you get 1 notice when the projection passes your budget. The budgets are saved in this browser only. If FleetView cannot read what you typed, it says so and keeps your old budget.
- **See everything.** The graph draws every working and waiting session, plus the 3 most recent idle ones per folder. When some idle sessions are left out, the top bar says how many and offers **show all**, and each folder hub says "+2 idle not drawn". You can also open http://localhost:3010/graph.html?all=1 to draw every session.
- **Busy days.** As soon as any 1 folder has more than 4 sessions, or you have more than 12 in total, the graph switches to 1 column per folder, with the sessions that asked you something at the top. 30 sessions stay readable on a laptop screen: measured on a 1366x768 window, 58 labels, none of them touching.  Each column heading says how many sessions it has and how many need you.

![30 made-up sessions: 1 column per folder, the ones that asked you something at the top. Of the 30, 5 asked a question, 3 are waiting on a tool, 5 are working and the rest have answered or are idle.](img/thirty-sessions.png)

- **2 different totals.** The top-bar tokens and cost add up every session today on this computer. The 5-hour gauge counts your account's current 5-hour window, which can start yesterday evening and includes sessions no longer on screen. When they differ, the 5-hour gauge is the one that matches your usage limit.
- **Tokens that are mostly re-reads.** Most of the token total is usually "re-read context" (cache reads): Claude re-reading text it was already sent, the cheapest kind. Hover over **tokens** to see the share.
- **New model released?** Open `lib/prices.json`, add a row with the rates from https://platform.claude.com/docs/en/about-claude/pricing, then restart FleetView (`python install.py --stop`, then `python install.py --start`). Until you do, that model shows "no price" and its tokens appear in grey as "tokens with no price", left out of the dollar total. The table you have was read off that page on 2026-09-22, the day Claude Opus 5.5 came out, and it carries Opus 5.5 at $4 per million tokens in and $20 out. `npm test` reads your own logs from the last 7 days and fails if a model in them has no row, so a new model cannot go unpriced without you being told.

## Fit it to your own AI system

This download is a starting point, not a finished product. It is yours now: change it until it matches how you work. FleetView is the clearest example in this set of 4, because it did not start as Ashley's at all. It started as somebody else's free dashboard, published with its code open to read, that showed 1 card per session and nothing more. Ashley moved it off port 3001 so it would stop clashing with agent-flow, replaced its price table after finding the rates were wrong by 5 times for 2 models, and then wrote the graph page you are looking at from scratch, in plain code with no libraries. That same evening he added the 5-hour and 7-day usage gauges, budget alarms you set by clicking a gauge (green under 70%, amber to 90%, red above, with a browser alert when the projection passes what you set), and a second page that drew all 87 of his agents as a map. By the end of the day almost nothing on his screen had come with the original.

Each change below is a prompt you can paste into Claude Code, opened in your FleetView folder. Claude reads the code and makes the change. Then run `npm test`, which runs FleetView's own checks; every line should say it passed. Then restart FleetView with `python install.py --stop` and `python install.py --start`.

![Which file each paste-in prompt below changes.](img/where-to-change.png)

### 1. Put your CRM's today list beside the graph

If your CRM vault writes a daily list of who to contact (in Ashley's it is a page called `Today.md`), this puts it beside your sessions, so you can see whether your CRM agent has made today's list yet.

```
In this FleetView folder, add a collapsible panel on the left of public/graph.html that shows my CRM's Today.md page. Add a "crm_today" path to config.json and config.example.json, add a GET /api/crm-today route in watcher.js that reads that file (read-only, never write to my CRM) and returns its text, and show the first 15 lines in the panel with the file's last-changed time. If the file is missing, show "No Today page yet". Add a test in tests/ using a made-up Today.md.
```

### 2. A plain line per session: what did I ask it?

This adds, under each circle, the last message you typed in that session.

```
In this FleetView folder, change lib/sessions.js to keep the most recent message I typed in each session (type "user", not a subagent), cut to 60 characters, and send it in the /api/graph data as "lastAsk". In public/graph.html, draw it in small grey text under each session's title, and add it to the hover label. Keep the tests passing and add a test for lastAsk.
```

### 3. An alarm that reaches you with the browser closed

Today the budget alarm and the waiting list only work while the page is open.

```
In this FleetView folder, add a server-side check to watcher.js: read "budget_5h_tokens" and "notify_waiting_minutes" from config.json. When the ccusage 5-hour projection passes the budget, or a session has been waiting for longer than notify_waiting_minutes, show a Windows notification (or a macOS notification on a Mac) once. Every subprocess call must pass windowsHide: true so no window appears. Only check while the server is running, never on a separate timer or scheduled task. Add the settings to config.example.json and explain them in README.md.
```

### 4. Cost per folder per week

See which of your folders uses the most: second brain, CRM or any other folder you named.

```
In this FleetView folder, add a GET /api/by-folder route to watcher.js that adds up tokens and cost per folder group for the last 7 days, using the sessions already read and lib/groups.js. Add a small table at the bottom of public/graph.html, opened by clicking "by folder" in the key. Label the dollar column "$ if paid per token". Add a test with the made-up sessions from tools/make-demo.js.
```

### 5. Colour helper agents by what your agents do

Your agents live in `~/.claude/agents` and in your vault's `.claude/agents`. Each file has a description.

```
In this FleetView folder, read every agent file in ~/.claude/agents and in the .claude/agents folder of each folder listed in config.json (read-only). Sort them into up to 6 colour groups using simple keywords from each agent's description (for example: research, writing, CRM, vault upkeep, content, other). Colour each helper-agent dot on public/graph.html by its group and add the groups to the key along the bottom. Do not hard-code any agent names.
```

### 6. Flag sessions that write into a drafts folder

When a session is writing post drafts into a folder you review, you usually want to read them straight after.

```
In this FleetView folder, add a "watch_folders" list to config.json, for example the folder where my post drafts are saved. When a session in /api/graph has touched a file inside one of those folders in the last 30 minutes, add "touchedWatched": true, and draw a small star next to that session on public/graph.html. When the session is then waiting for me, put it first in the Needs you strip with the words "drafts ready". Add a test with made-up sessions.
```

### 7. Hide paths with 1 click for screen-sharing

The `hide_paths` setting hides folder paths, file names and what you typed, but you have to edit a file and restart. This puts it on a button.

```
In this FleetView folder, add a "hide details" button to the key of public/graph.html and public/cards.html. When pressed, the pages hide full folder paths, file names and the text of the recent steps, and show only the folder group name. Remember the choice in the browser's localStorage, wrapped in try/catch. The existing hide_paths setting in config.json should still work and should win when it is true.
```

### 8. Put it where you already look

Ashley's own ruling was that views like this belong inside the page you already work from, not in yet another tab.

```
In this FleetView folder, make public/graph.html work when shown inside another page: add a "compact=1" address option that hides the key, shrinks the top bar to "need you", working, 5h window and 7 days, and fits the graph to a small area. Then tell me the exact address to use, and how to add it to my second brain's home note or my work board as an embedded web page.
```

## Every command and setting

### Commands

| Command | What it does |
|---|---|
| `python install.py` | Checks Node.js, downloads 2 code packages, asks for your folders, writes `config.json`, offers the hidden logon start, starts FleetView |
| `python install.py --start` | Starts FleetView in the background with your saved answers. No questions. Says so if it is already running |
| `python install.py --stop` | Stops FleetView, however it was started. It checks it is really FleetView first, so it never ends another program |
| `python install.py --uninstall` | Stops FleetView and removes the logon file it made. Leaves your settings and this folder |
| `python install.py --yes` | Installs with no questions, using the options below (the words starting with `--`) and the defaults it finds |
| `--second-brain PATH`, `--crm PATH`, `--folder "NAME=PATH"` | Give your folders on the command line (`--folder` can be repeated) |
| `--port 3010`, `--projects-dir PATH`, `--no-ccusage` | Choose the port, a different Claude Code log folder, or switch the token panel off |
| `--launcher` / `--no-launcher`, `--no-start` | Add or skip the logon start; do not start FleetView now |
| `node watcher.js` or `npm start` | Start FleetView in this terminal, showing any error it hits. Ctrl+C stops it |
| `npm run demo` | Made-up sessions on port 3011 (see the tip in Install it) |
| `node tools/make-demo.js <folder> --sessions 30` | Writes a made-up busy day of 30 sessions into a folder you name, to see what a full screen looks like |
| `npm test` | Runs the JavaScript tests against made-up sessions |
| `python -m pytest -q` | Runs the installer's own checks in a temporary folder, using pytest (a Python testing tool; install it with `pip install pytest`) |

### Settings in `config.json`

![Every setting in config.json, with what it does. The folder paths are examples.](img/config-settings.png)

| Setting | What it does |
|---|---|
| `port` | The page's port, 3010 by default |
| `host` | `127.0.0.1`: only this computer can open the page. Leave it |
| `folders` | Your folders: `[{ "name": "CRM", "path": "..." }]`. A session belongs to the folder whose path matches most closely, so a sub-folder you name wins over its parent |
| `idle_per_folder` | How many idle sessions to draw per folder (3). The totals always count every session |
| `waiting_hours` | How many hours an unanswered question stays amber (1). After that the session turns blue-grey and leaves the Needs you list. Raise it if you want yesterday evening's question still showing this morning |
| `fresh_minutes` | Under this many minutes a question is drawn in the bright amber; older ones get the darker amber (30) |
| `hide_paths` | `true` hides folder paths, file names and the text of the recent steps, for screen-sharing |
| `usage.enabled` | `false` switches the 5-hour and 7-day panel off |
| `usage.package` | The ccusage version FleetView runs (`ccusage@20.0.24`, checked 2026-09-22). Change it only on purpose |
| `projects_dir` | Only if Claude Code keeps its logs somewhere unusual |

After any change, restart FleetView: `python install.py --stop`, then `python install.py --start`. `config.example.json` shows every setting with an example.

### Files FleetView makes

- `fleetview.pid`: the running FleetView's process number and port, so `--stop` can find it. Removed when it stops.
- `fleetview.log`: what FleetView printed when it was started in the background. If it will not start, the reason is at the end of this file.
- `config.json.bak-<date>`: your old settings, saved whenever the installer changed them.

### Advanced: settings from the terminal

`PORT` overrides the port, `FLEETVIEW_CONFIG` points at a different settings file, `CLAUDE_CONFIG_DIR` points at a different Claude Code folder, and `FLEETVIEW_NO_CCUSAGE=1` switches the token panel off. These are environment variables: set a variable in PowerShell with `$env:PORT=3012` before `npm start`, or on a Mac with `PORT=3012 npm start`. (Do not pick 3020: ProjectForge, piece 3 of 4, uses it.) To see the raw data the pages read, open http://localhost:3010/api/graph (and `/api/usage`, `/api/meta`) in your browser.

## When it goes wrong

![What the page looks like when FleetView has stopped: a red banner with the command to start it again, and a top bar that has gone quiet with it — the count reads "2 needed you at 00:16" instead of pretending to be live. Made-up data.](img/fleetview-stopped.png)

![The top of the page when `config.json` cannot be read: an amber banner naming the fault and saying the folder names and port are the defaults until it is fixed. Made-up data.](img/config-broken.png)

| What you see | Why | The fix |
|---|---|---|
| A red **FleetView stopped** banner | The FleetView program is no longer running, so the page is not getting updates. On Ashley's computer on 2026-09-22 the logon start had stopped working; the reason was never recorded. | Run `python install.py --start` in the FleetView folder. The page picks up by itself. If it will not start, read the end of `fleetview.log`, or run `node watcher.js` to see the error. |
| "Port 3010 is already in use" | Another program is using that port. On 2026-06-12 another tool, agent-flow (piece 1 of 4), was already on 3001, which is why FleetView moved to 3010. | Open http://localhost:3010/graph.html; if FleetView is there, it is already running. If not, run `python install.py` again and choose another port. |
| The logon start is there but the page does not open after a restart | The Startup file points at Node.js by its full address. If you reinstalled Node.js in another folder, the file still points at the old folder. | Run `python install.py` again and press Enter at each question; it rewrites the logon file. |
| `python` opens the Microsoft Store | Windows ships a shortcut that points at the Store until Python is installed. | Install Python from python.org and tick "Add python.exe to PATH" (this lets you type `python` in any terminal), or type `py` instead of `python`. |
| The installer says Node.js is too old | FleetView needs Node.js 22 or newer. | Install the LTS version from https://nodejs.org, open a new terminal, run `python install.py` again. |
| The installer says Python is too old | FleetView needs Python 3.11 or newer. | Install it from https://python.org, tick "Add python.exe to PATH", open a new terminal, run `python install.py` again. |
| Nothing is amber, but you know a session is waiting | Amber means Claude's last message asked you something. A session that stopped on a statement ("Done, saved.") is blue-grey and reads "answered 12 min ago". A question older than `waiting_hours` (1 hour) has also stopped counting. | Nothing to fix: open the session from its folder column. To keep older questions counting, raise `waiting_hours` in `config.json`. |
| A session sits on "may need approval" for a long time | Claude asked to run a tool and nothing has come back. Either Claude Code is asking your permission in that terminal, or the command really is that long. | Look at that terminal and answer the permission question, or leave it: the violet circle is not counted in "need you". |
| **A wide amber banner: "Your settings file could not be read"** | `config.json` is damaged. Saving it from Notepad or PowerShell adds an invisible mark at the start of the file; a comma after the last item, a `//` comment, or a half-saved file do the same. FleetView is then running on the default settings: none of your folder names and the port it was started on. | The banner names the line. Fix that line, or run `python install.py` to write the file again. `python install.py --start` refuses to start at all on a damaged file, so your settings are never quietly thrown away. |
| A session shows "no price" | Its model has no row in `lib/prices.json`. Ashley's June copy had no Opus 5 row and silently used Sonnet 4.6 rates, which made every cost wrong. | Add the model's row from https://platform.claude.com/docs/en/about-claude/pricing and restart. |
| A red **!** beside a circle | That session's context window is over 85% full. | Start a fresh session for the next task, or ask this one to summarise and carry on. |
| A ring sits at 100% on a long session | The session has a 1,000,000-token window but FleetView had not seen evidence of it yet. Ashley's copy always assumed 200,000. | FleetView switches to 1,000,000 when the model name ends in `[1m]` or a turn passes 200,000. The side panel says which rule it used. Until then, a ring on a session with the 1,000,000-token window reads too full. |
| 5-hour gauge shows "not available" | ccusage could not run: no internet on the first run, or npx (the tool that downloads and runs ccusage) is blocked by your computer's security settings. | Hover over the gauge to see the reason. Check your internet, or switch the panel off in `config.json` (`"usage": {"enabled": false}`). |
| A session you just started does not appear | Before your first Claude Code session the log folder does not exist. | Wait a few seconds: FleetView looks for the folder every 3 seconds and starts reading as soon as it appears. The empty page tells you which folder it is waiting for. |
| Top-bar cost and the 5-hour gauge disagree | They count different sessions: the top bar every session today, the gauge your account's current 5-hour window. | Trust the 5-hour gauge for your limit. Treat the top bar as "today on this computer". |
| Another dashboard filled your `settings.json` with hooks | That was Claude-Code-Agent-Monitor on 2026-06-12, not FleetView. FleetView never touches `settings.json`. | Restore the copy of `settings.json` you made before installing it. |

## Download

The code, this guide's source and the tests: **https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview**

```
git clone https://github.com/OUTLIERS-ai/outliers-ws-02-fleetview; cd outliers-ws-02-fleetview; python install.py
```

![What is in the download.](img/whats-in-the-download.png)

FleetView is built on Stargx/claude-code-dashboard (MIT licence, Copyright (c) 2025 Cold Beam Games), uses ccusage (MIT licence) for the 5-hour and 7-day gauges, and carries React 18.3.1 (MIT licence) for the card page. Prices were checked on 2026-09-22.
