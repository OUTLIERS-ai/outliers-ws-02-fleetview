#!/usr/bin/env python3
"""FleetView installer.

    python install.py              ask a few questions, install, write config.json
    python install.py --stop       stop a FleetView the installer started
    python install.py --uninstall  stop it and remove the logon launcher this installer made

What it does, in order:
  1. Checks Node.js 18 or newer and npm are installed. If not, it says how to get
     them and stops without changing anything.
  2. Runs `npm install` in this folder (downloads 2 small libraries).
  3. Asks where your second brain vault, your CRM vault and any other project
     folders are, and which port to use (3010 unless you say otherwise).
  4. Writes config.json. An existing config.json is backed up first.
  5. Offers a hidden launcher so FleetView starts when you log in
     (Windows: a .vbs file in your Startup folder, no window; Mac: a launchd file).

It never touches Claude Code's settings, hooks or agents. It only reads the log
files Claude Code already writes.

Running it twice with the same answers changes nothing the second time.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONFIG = Path(os.environ["FLEETVIEW_CONFIG"]) if os.environ.get("FLEETVIEW_CONFIG") else HERE / "config.json"
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
PID_FILE = CONFIG.with_name("fleetview.pid")
LAUNCHER_MARK = "FleetView logon launcher (made by install.py)"
MAC_LABEL = "com.outliers.fleetview"


def say(msg=""):
    print(msg, flush=True)


def ask(question, default=None, interactive=True):
    if not interactive:
        return default or ""
    say("")
    say("  " + question)
    prompt = "  > " if not default else "  [%s] > " % default
    try:
        answer = input(prompt).strip()
    except EOFError:
        answer = ""
    return answer or (default or "")


def ask_yes(question, default=True, interactive=True):
    if not interactive:
        return default
    a = ask(question + (" (Y/n)" if default else " (y/N)"), interactive=True).strip().lower()
    if not a:
        return default
    return a.startswith("y")


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, creationflags=NO_WINDOW, **kw)


# ---------- 1. prerequisites ----------
def check_node():
    node = shutil.which("node")
    npm = shutil.which("npm")
    if not node:
        return None, None, "Node.js is not installed (or not on your PATH)."
    try:
        out = run([node, "--version"]).stdout.strip()
    except OSError as e:
        return None, None, "Node.js would not start: %s" % e
    m = re.match(r"v(\d+)", out)
    if not m or int(m.group(1)) < 18:
        return None, None, "Node.js %s is too old. FleetView needs version 18 or newer." % (out or "(unknown)")
    if not npm:
        return None, None, "npm (it comes with Node.js) is not on your PATH."
    return node, npm, out


def how_to_get_node():
    say("")
    say("  How to get Node.js (free, about 2 minutes):")
    if sys.platform == "win32":
        say("    Windows:  winget install OpenJS.NodeJS.LTS")
        say("              or download the LTS installer from https://nodejs.org")
    elif sys.platform == "darwin":
        say("    Mac:      brew install node")
        say("              or download the LTS installer from https://nodejs.org")
    else:
        say("    Linux:    use your package manager, or https://nodejs.org")
    say("  Then close this terminal, open a new one, and run  python install.py  again.")


# ---------- 3. finding folders ----------
def find_vaults():
    """Obsidian vaults (folders with a .obsidian folder) in the usual places, 2 levels deep."""
    found = []
    home = Path.home()
    for base in (home / "Documents", home):
        if not base.is_dir():
            continue
        try:
            level1 = [p for p in base.iterdir() if p.is_dir() and not p.name.startswith(".")]
        except OSError:
            continue
        for p in level1:
            if (p / ".obsidian").is_dir() and p not in found:
                found.append(p)
    return found


def guess(vaults, words, fallback):
    for v in vaults:
        if any(w in v.name.lower() for w in words):
            return str(v)
    return str(fallback) if Path(fallback).is_dir() else ""


def projects_dir():
    base = os.environ.get("CLAUDE_CONFIG_DIR") or str(Path.home() / ".claude")
    return Path(base) / "projects"


# ---------- 4. config ----------
def load_existing():
    try:
        return json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def write_config(cfg):
    """Returns 'unchanged', 'created' or 'updated'. Never a truncating write."""
    text = json.dumps(cfg, indent=2) + "\n"
    if CONFIG.exists():
        if CONFIG.read_bytes().decode("utf-8", errors="replace") == text:
            return "unchanged"
        backup = CONFIG.with_name("config.json.bak-" + time.strftime("%Y%m%d-%H%M%S"))
        shutil.copy2(CONFIG, backup)
        state = "updated"
    else:
        state = "created"
    tmp = CONFIG.with_name("config.json.tmp")
    tmp.write_bytes(text.encode("utf-8"))
    os.replace(tmp, CONFIG)
    return state


# ---------- 5. launcher ----------
def startup_dir():
    appdata = os.environ.get("APPDATA")
    if not appdata:
        return None
    return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"


def launcher_path():
    if sys.platform == "win32":
        d = startup_dir()
        return d / "FleetView.vbs" if d else None
    if sys.platform == "darwin":
        return Path.home() / "Library" / "LaunchAgents" / (MAC_LABEL + ".plist")
    return None


def launcher_text(node):
    watcher = HERE / "watcher.js"
    if sys.platform == "win32":
        # 0 = no window, False = do not wait. Starts once at logon.
        cmd = '"""%s"" ""%s"""' % (node, watcher)
        return (
            "' %s\r\n"
            "' Starts FleetView with no window. Remove with: python install.py --uninstall\r\n"
            "Set sh = CreateObject(\"WScript.Shell\")\r\n"
            "sh.CurrentDirectory = \"%s\"\r\n"
            "sh.Run %s, 0, False\r\n" % (LAUNCHER_MARK, HERE, cmd)
        )
    if sys.platform == "darwin":
        log = HERE / "fleetview.log"
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!-- %s -->\n'
            '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
            '<plist version="1.0"><dict>\n'
            '  <key>Label</key><string>%s</string>\n'
            '  <key>ProgramArguments</key><array><string>%s</string><string>%s</string></array>\n'
            '  <key>WorkingDirectory</key><string>%s</string>\n'
            '  <key>RunAtLoad</key><true/>\n'
            '  <key>StandardOutPath</key><string>%s</string>\n'
            '  <key>StandardErrorPath</key><string>%s</string>\n'
            '</dict></plist>\n' % (LAUNCHER_MARK, MAC_LABEL, node, watcher, HERE, log, log)
        )
    return None


def launcher_encoding():
    # Windows Script Host reads UTF-16 files with a byte-order mark, so folder
    # names with accents still work. "utf-16" writes and strips that mark.
    return "utf-16" if sys.platform == "win32" else "utf-8"


def install_launcher(node):
    path = launcher_path()
    text = launcher_text(node)
    if not path or text is None:
        say("  No automatic launcher for this system. Start FleetView with:  node \"%s\"" % (HERE / "watcher.js"))
        return "skipped"
    if path.exists():
        old = path.read_bytes().decode(launcher_encoding(), errors="replace")
        if old == text:
            return "unchanged"
        if LAUNCHER_MARK not in old:
            say("  %s already exists and was not made by this installer. Leaving it alone." % path)
            return "skipped"
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(text.encode(launcher_encoding()))  # bytes: keep the exact line endings
    os.replace(tmp, path)
    if sys.platform == "darwin":
        say("  To start it now without logging out, run:  launchctl load -w \"%s\"" % path)
    return "written"


def port_in_use(port):
    import socket
    s = socket.socket()
    s.settimeout(0.5)
    try:
        return s.connect_ex(("127.0.0.1", port)) == 0
    finally:
        s.close()


def start_hidden(node):
    """Start the server in the background with no window, then wait up to 10 seconds for it."""
    flags = NO_WINDOW | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
    kw = {"creationflags": flags} if sys.platform == "win32" else {"start_new_session": True}
    log = open(CONFIG.with_name("fleetview.log"), "ab")
    try:
        proc = subprocess.Popen([node, str(HERE / "watcher.js")], cwd=str(HERE), stdout=log, stderr=log,
                                stdin=subprocess.DEVNULL, **kw)
    finally:
        log.close()
    tmp = PID_FILE.with_name(PID_FILE.name + ".tmp")
    tmp.write_text(str(proc.pid), encoding="utf-8")
    os.replace(tmp, PID_FILE)
    cfg = load_existing()
    port = int(os.environ.get("PORT") or cfg.get("port") or 3010)
    for _ in range(40):
        if port_in_use(port):
            return True
        time.sleep(0.25)
    return False


def stop():
    """Stop a FleetView this installer started (it keeps the process number in fleetview.pid)."""
    try:
        pid = int(PID_FILE.read_text(encoding="utf-8").strip())
    except (OSError, ValueError):
        say("  No FleetView started by this installer is on record. If one is running, end the 'node' process in Task Manager.")
        return 0
    try:
        os.kill(pid, 15)
        say("  Stopped FleetView (process %d)." % pid)
    except OSError:
        say("  FleetView (process %d) was not running." % pid)
    try:
        PID_FILE.unlink()
    except OSError:
        pass
    return 0


def uninstall():
    path = launcher_path()
    say("FleetView uninstall")
    if path and path.exists():
        text = path.read_bytes().decode(launcher_encoding(), errors="replace")
        if LAUNCHER_MARK in text:
            if sys.platform == "darwin":
                say("  First run:  launchctl unload -w \"%s\"" % path)
            path.unlink()
            say("  Removed the logon launcher: %s" % path)
        else:
            say("  %s was not made by this installer; left alone." % path)
    else:
        say("  No logon launcher found. Nothing to remove.")
    say("  If you started FleetView by hand with node watcher.js, close that terminal to stop it.")
    say("  Your config.json and this folder are left as they are. Delete the folder yourself if you want it gone.")
    return 0


# ---------- main ----------
def main(argv=None):
    ap = argparse.ArgumentParser(description="Install FleetView.")
    ap.add_argument("--uninstall", action="store_true", help="remove the logon launcher this installer made")
    ap.add_argument("--stop", action="store_true", help="stop a FleetView this installer started")
    ap.add_argument("--yes", action="store_true", help="no questions; use the flags and the defaults found")
    ap.add_argument("--second-brain", help="path to your second brain vault")
    ap.add_argument("--crm", help="path to your CRM vault")
    ap.add_argument("--folder", action="append", default=[], metavar="NAME=PATH", help="another project folder (repeatable)")
    ap.add_argument("--port", type=int, help="web page port (default 3010)")
    ap.add_argument("--projects-dir", help="where Claude Code keeps its logs (default ~/.claude/projects)")
    ap.add_argument("--no-ccusage", action="store_true", help="switch off the 5-hour and 7-day token panel")
    ap.add_argument("--launcher", dest="launcher", action="store_true", default=None, help="add the hidden logon launcher")
    ap.add_argument("--no-launcher", dest="launcher", action="store_false", help="do not add the logon launcher")
    ap.add_argument("--start", dest="start", action="store_true", default=None, help="start FleetView now, with no window")
    ap.add_argument("--no-start", dest="start", action="store_false", help="do not start it now")
    ap.add_argument("--skip-npm", action="store_true", help=argparse.SUPPRESS)
    a = ap.parse_args(argv)

    if a.stop:
        return stop()
    if a.uninstall:
        stop()
        return uninstall()

    interactive = not a.yes
    say("FleetView installer")
    say("  FleetView shows every Claude Code session on this computer on one page.")
    say("  It only reads the log files Claude Code already writes. It changes nothing in Claude Code.")

    # 1
    node, npm, info = check_node()
    if not node:
        say("")
        say("  Stopping: " + info)
        how_to_get_node()
        say("  Nothing was changed.")
        return 1
    say("  Node.js %s found." % info)

    logs = Path(a.projects_dir) if a.projects_dir else projects_dir()
    if not logs.is_dir():
        say("  Note: %s does not exist yet. That is normal if you have not used Claude Code on this" % logs)
        say("  computer. Run Claude Code once; FleetView will pick the sessions up.")

    # 2
    if not a.skip_npm:
        if (HERE / "node_modules" / "express").is_dir() and (HERE / "node_modules" / "chokidar").is_dir():
            say("  Libraries already installed.")
        else:
            say("  Installing 2 libraries with npm (needs internet, about 20 seconds)...")
            r = run([npm, "install", "--no-audit", "--no-fund"], cwd=str(HERE))
            if r.returncode != 0:
                say("  npm install failed:")
                say("  " + (r.stderr or r.stdout).strip()[-800:])
                say("  Check your internet connection and run  python install.py  again. config.json was not changed.")
                return 1
            say("  Libraries installed.")

    # 3
    old = load_existing()
    old_folders = {f.get("name"): f.get("path") for f in old.get("folders", []) if isinstance(f, dict)}
    vaults = find_vaults()
    home = Path.home()
    sb_default = a.second_brain or old_folders.get("Second Brain") or guess(vaults, ["brain", "second"], home / "Documents" / "Second Brain")
    crm_default = a.crm or old_folders.get("CRM") or guess(vaults, ["crm"], home / "CRM")

    say("")
    say("  FleetView groups your sessions by the folder they ran in. Tell it your folders.")
    say("  Press Enter to accept the suggestion in brackets, or type '-' to skip one.")
    sb = ask("Where is your second brain vault?", sb_default, interactive)
    crm = ask("Where is your CRM vault?", crm_default, interactive)

    folders = []
    for name, p in (("Second Brain", sb), ("CRM", crm)):
        if p and p != "-":
            if not Path(p).is_dir():
                say("  Note: %s does not exist on this computer. Kept anyway; fix it in config.json if it is wrong." % p)
            folders.append({"name": name, "path": str(Path(p))})

    extra = []
    for item in a.folder:
        if "=" in item:
            n, p = item.split("=", 1)
            extra.append((n.strip(), p.strip()))
    if interactive and not a.folder:
        for n, p in old_folders.items():
            if n not in ("Second Brain", "CRM"):
                extra.append((n, p))
        if extra:
            say("  Keeping your other folders from last time: " + ", ".join(n for n, _ in extra))
        say("")
        say("  Any other project folders? For example your content engine. One at a time; Enter on its own to finish.")
        while True:
            p = ask("Folder path (Enter to finish):", None, True)
            if not p:
                break
            n = ask("Short name for it:", Path(p).name, True)
            extra.append((n, p))
    elif not interactive and not a.folder:
        for n, p in old_folders.items():
            if n not in ("Second Brain", "CRM"):
                extra.append((n, p))
    seen = {f["name"] for f in folders}
    for n, p in extra:
        if n and p and n not in seen:
            folders.append({"name": n, "path": str(Path(p))})
            seen.add(n)

    port_default = a.port or old.get("port") or 3010
    port_s = ask("Which port should the page use?", str(port_default), interactive)
    try:
        port = int(port_s)
        assert 1024 <= port <= 65535
    except (ValueError, AssertionError):
        say("  '%s' is not a usable port; using 3010." % port_s)
        port = 3010

    usage_on = not a.no_ccusage
    if interactive and not a.no_ccusage:
        say("")
        say("  The token panel uses ccusage, a free open-source tool, run through npx. The first run")
        say("  downloads it (needs internet). It runs only while a FleetView page is open.")
        usage_on = ask_yes("Switch on the 5-hour and 7-day token panel?", old.get("usage", {}).get("enabled", True), True)

    cfg = {
        "port": port,
        "host": "127.0.0.1",
        "folders": folders,
        "idle_per_folder": old.get("idle_per_folder", 3),
        "hide_paths": old.get("hide_paths", False),
        "usage": {"enabled": bool(usage_on), "package": old.get("usage", {}).get("package", "ccusage@20")},
    }
    if a.projects_dir or old.get("projects_dir"):
        cfg["projects_dir"] = str(a.projects_dir or old.get("projects_dir"))

    # 4
    state = write_config(cfg)
    say("")
    say("  config.json %s." % state)

    # 5
    want = a.launcher
    if want is None:
        want = ask_yes("Start FleetView automatically, with no window, when you log in?", True, interactive) if interactive else False
    if want:
        res = install_launcher(node)
        say("  Logon launcher: %s (%s)." % (res, launcher_path()))

    started = False
    if port_in_use(port):
        say("  Something is already answering on port %d (FleetView already running?). Not starting a second copy." % port)
    else:
        start_now = a.start if a.start is not None else (ask_yes("Start FleetView now, with no window?", True, interactive) if interactive else False)
        if start_now:
            started = start_hidden(node)
            say("  FleetView %s." % ("started in the background" if started else "could not be started; run  node watcher.js  to see why"))

    say("")
    if started:
        say("  Done. Open  http://localhost:%d/graph.html  in your browser." % port)
        say("  To stop it:  python install.py --stop")
    else:
        say("  Done. Start it with:")
        say("      node watcher.js")
        say("  then open  http://localhost:%d/graph.html" % port)
    say("  Dollar figures on the page are what the tokens would cost on the paid API, not money spent on a subscription.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
