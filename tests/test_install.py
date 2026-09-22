"""Installer tests. Every run uses a temp home, temp APPDATA and temp config file,
so nothing touches the real ~/.claude, Startup folder or this folder's config.json."""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent.parent
INSTALL = HERE / "install.py"
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def env_for(tmp_path, **extra):
    home = tmp_path / "home"
    (home / ".claude" / "projects").mkdir(parents=True, exist_ok=True)
    env = dict(os.environ)
    env.update({
        "HOME": str(home), "USERPROFILE": str(home),
        "APPDATA": str(tmp_path / "appdata"),
        "CLAUDE_CONFIG_DIR": str(home / ".claude"),
        "FLEETVIEW_CONFIG": str(tmp_path / "config.json"),
    })
    env.update(extra)
    return env


def run(args, env):
    return subprocess.run([sys.executable, str(INSTALL)] + args, env=env, capture_output=True, text=True,
                          creationflags=NO_WINDOW, cwd=str(HERE))


def base_args(tmp_path):
    sb = tmp_path / "vaults" / "Second Brain"
    crm = tmp_path / "vaults" / "CRM"
    ce = tmp_path / "vaults" / "Content Engine"
    for p in (sb, crm, ce):
        p.mkdir(parents=True, exist_ok=True)
    return ["--yes", "--skip-npm", "--second-brain", str(sb), "--crm", str(crm),
            "--folder", "Content Engine=%s" % ce, "--port", "3011"]


def test_writes_config_with_member_folders(tmp_path):
    env = env_for(tmp_path)
    r = run(base_args(tmp_path) + ["--no-launcher"], env)
    assert r.returncode == 0, r.stdout + r.stderr
    cfg = json.loads((tmp_path / "config.json").read_text(encoding="utf-8"))
    assert cfg["port"] == 3011
    assert cfg["host"] == "127.0.0.1"
    assert [f["name"] for f in cfg["folders"]] == ["Second Brain", "CRM", "Content Engine"]
    assert cfg["usage"]["enabled"] is True
    assert "config.json created" in r.stdout


def test_second_run_changes_nothing(tmp_path):
    env = env_for(tmp_path)
    args = base_args(tmp_path) + (["--launcher"] if sys.platform in ("win32", "darwin") else ["--no-launcher"])
    assert run(args, env).returncode == 0
    before = {p: p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    r = run(args, env)
    assert r.returncode == 0
    assert "config.json unchanged" in r.stdout
    after = {p: p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    assert before == after, "second run changed files"
    assert not list(tmp_path.glob("config.json.bak-*"))


def test_changed_answer_backs_up_old_config(tmp_path):
    env = env_for(tmp_path)
    assert run(base_args(tmp_path) + ["--no-launcher"], env).returncode == 0
    args = base_args(tmp_path)
    args[args.index("--port") + 1] = "3012"
    r = run(args + ["--no-launcher"], env)
    assert "config.json updated" in r.stdout
    assert len(list(tmp_path.glob("config.json.bak-*"))) == 1
    assert json.loads((tmp_path / "config.json").read_text(encoding="utf-8"))["port"] == 3012


def test_no_ccusage_flag(tmp_path):
    env = env_for(tmp_path)
    assert run(base_args(tmp_path) + ["--no-launcher", "--no-ccusage"], env).returncode == 0
    assert json.loads((tmp_path / "config.json").read_text(encoding="utf-8"))["usage"]["enabled"] is False


def test_refuses_politely_without_node(tmp_path):
    env = env_for(tmp_path, PATH=str(tmp_path / "empty-path"))
    r = run(base_args(tmp_path) + ["--no-launcher"], env)
    assert r.returncode == 1
    assert "Node.js" in r.stdout and "Nothing was changed" in r.stdout
    assert not (tmp_path / "config.json").exists()


@pytest.mark.skipif(sys.platform != "win32", reason="Windows Startup-folder launcher")
def test_windows_launcher_is_hidden_and_uninstalls(tmp_path):
    env = env_for(tmp_path)
    assert run(base_args(tmp_path) + ["--launcher"], env).returncode == 0
    vbs = tmp_path / "appdata" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / "FleetView.vbs"
    text = vbs.read_bytes().decode("utf-16")
    assert ", 0, False" in text          # 0 = no window, False = do not wait
    assert "watcher.js" in text
    r = run(["--uninstall"], env)
    assert r.returncode == 0
    assert not vbs.exists()


@pytest.mark.skipif(sys.platform != "win32", reason="Windows Startup-folder launcher")
def test_uninstall_leaves_a_launcher_it_did_not_make(tmp_path):
    env = env_for(tmp_path)
    startup = tmp_path / "appdata" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    startup.mkdir(parents=True)
    other = startup / "FleetView.vbs"
    other.write_bytes("' somebody else's file\r\n".encode("utf-16"))
    run(["--uninstall"], env)
    assert other.exists()


@pytest.mark.skipif(not (HERE / "node_modules" / "express").is_dir(), reason="run npm install (or install.py) first")
def test_start_hidden_then_stop(tmp_path):
    import socket, time, urllib.request
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    env = env_for(tmp_path)
    args = base_args(tmp_path)
    args[args.index("--port") + 1] = str(port)
    r = run(args + ["--no-launcher", "--no-ccusage", "--start"], env)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "started in the background" in r.stdout
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/api/meta" % port, timeout=5) as resp:
            assert json.loads(resp.read())["folders"] == ["Second Brain", "CRM", "Content Engine"]
    finally:
        r = run(["--stop"], env)
    assert "Stopped FleetView" in r.stdout
    time.sleep(1)
    with pytest.raises(OSError):
        urllib.request.urlopen("http://127.0.0.1:%d/api/meta" % port, timeout=2)
