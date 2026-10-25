#!/usr/bin/env python3
"""D12 disposable Linux observations. All mutation is under this container's /tmp."""
import errno
import hashlib
import json
import os
import pathlib
import pwd
import grp
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone

ROOT = pathlib.Path("/tmp/d12-proof")
LAB = "D12_LINUX_PROOF_20261025"
results = []


def run(argv, *, input=None, timeout=8, env=None, preexec_fn=None, cwd=None):
    p = subprocess.run(argv, input=input, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       timeout=timeout, env=env, preexec_fn=preexec_fn, cwd=cwd, text=True)
    return {"argv": argv, "stdout": p.stdout, "stderr": p.stderr, "exit": p.returncode}


def record(case, condition, observations, assertions=None):
    results.append({"case": case, "condition": condition, "observations": observations,
                    "assertions": assertions or {}})


def proc_start(pid):
    raw = pathlib.Path(f"/proc/{pid}/stat").read_text()
    # comm can contain spaces and parentheses; fields after the last ')' begin at field 3.
    fields = raw[raw.rfind(")") + 2:].split()
    return fields[19]  # proc stat field 22 (starttime)


def proc_alive(pid, start):
    try:
        return proc_start(pid) == str(start)
    except (FileNotFoundError, ProcessLookupError):
        return False


def identity(uid, gid):
    def apply():
        os.setgroups([])
        os.setgid(gid)
        os.setuid(uid)
    return apply


def do_streams():
    d = ROOT / "streams"
    d.mkdir(exist_ok=True)
    producer = "{ printf 'out\\n'; printf 'err\\n' >&2; exit 7; }"
    a, b = d / "a.log", d / "b.log"
    a.write_text("stale-a\n"); b.write_text("stale-b\n")
    common = "set +e; "
    one = run(["bash", "--noprofile", "--norc", "-c", common + f"{producer} >{a} 2>&1"])
    two = run(["bash", "--noprofile", "--norc", "-c", common + f"{producer} 2>&1 >{b}"])
    first = {"redirect_stdout_then_stderr": one, "redirect_stderr_then_stdout": two,
             "a_bytes": a.read_text(), "b_bytes": b.read_text()}
    assert first["a_bytes"] == "out\nerr\n" and first["b_bytes"] == "out\n", f"redirection file bytes: a={first['a_bytes']!r}, b={first['b_bytes']!r}, two_stdout={two['stdout']!r}, two_stderr={two['stderr']!r}"
    assert "err\n" in two["stdout"] and "err\n" not in two["stderr"]
    append = run(["bash", "--noprofile", "--norc", "-c", f"printf 'append\\n' >>{a}"])
    overwrite = run(["bash", "--noprofile", "--norc", "-c", f"printf 'replace\\n' >{b}"])
    first.update({"append": append, "overwrite": overwrite, "a_after_append": a.read_text(),
                  "b_after_overwrite": b.read_text()})
    pipe_script = "set +e; (printf 'out\\n'; printf 'err\\n' >&2; exit 7) | cat; snapshot=(\"$?\" \"${PIPESTATUS[@]}\"); printf 'STATUS=%s PIPESTATUS=%s\\n' \"${snapshot[0]}\" \"${snapshot[*]:1}\"; exit \"${snapshot[0]}\""
    basic = run(["bash", "--noprofile", "--norc", "-c", pipe_script])
    pipefail_script = "set -o pipefail; (printf 'out\\n'; printf 'err\\n' >&2; exit 7) | cat; snapshot=(\"$?\" \"${PIPESTATUS[@]}\"); printf 'STATUS=%s PIPESTATUS=%s\\n' \"${snapshot[0]}\" \"${snapshot[*]:1}\"; exit \"${snapshot[0]}\""
    pipefail = run(["bash", "--noprofile", "--norc", "-c", pipefail_script])
    mutant_script = pipefail_script.replace("set -o pipefail; ", "")
    pipefail_mutant = run(["bash", "--noprofile", "--norc", "-c", mutant_script])
    first.update({"pipeline_default": basic, "pipeline_pipefail": pipefail, "pipeline_pipefail_removed_mutant": pipefail_mutant})
    assert basic["exit"] == 0 and "STATUS=0 PIPESTATUS=7 0\n" in basic["stdout"]
    assert pipefail["exit"] == 7 and "STATUS=7 PIPESTATUS=7 0\n" in pipefail["stdout"]
    mutant_rejected = pipefail_mutant["exit"] != 7 or "STATUS=7 PIPESTATUS=7 0\n" not in pipefail_mutant["stdout"]
    assert mutant_rejected, "pipefail-removal mutant unexpectedly matched required status"
    record("streams", {"producer": "stdout out\\n, stderr err\\n, exit 7", "files": str(d)}, first,
           {"redirection_order": first["a_bytes"] == "out\nerr\n" and first["b_bytes"] == "out\n",
            "default_pipeline_status": basic["exit"] == 0 and "STATUS=0 PIPESTATUS=7 0\n" in basic["stdout"],
            "pipefail_pipeline_status": pipefail["exit"] == 7 and "STATUS=7 PIPESTATUS=7 0\n" in pipefail["stdout"],
            "pipefail_removal_mutant_rejected": mutant_rejected})


def do_environment():
    d = ROOT / "path-first"; e = ROOT / "path-second"
    d.mkdir(exist_ok=True); e.mkdir(exist_ok=True)
    (d / "demo").write_text("#!/bin/sh\nprintf 'first\\n'\n")
    (e / "demo").write_text("#!/bin/sh\nprintf 'second\\n'\n")
    (d / "demo").chmod(0o755); (e / "demo").chmod(0o755)
    clean = {"PATH": "/usr/bin:/bin", "LC_ALL": "C", "DEMO_HOME": "/tmp/d12-proof"}
    before = run(["bash", "--noprofile", "--norc", "-c", "DEMO_ONLY=synthetic; bash -c 'printf \"child=%s\\n\" \"${DEMO_ONLY-unset}\"'"], env=clean)
    after = run(["bash", "--noprofile", "--norc", "-c", "export DEMO_ONLY=synthetic; bash -c 'printf \"child=%s\\n\" \"${DEMO_ONLY-unset}\"'"], env=clean)
    path1 = run(["bash", "--noprofile", "--norc", "-c", f"PATH={d}:{e} command -v demo; PATH={d}:{e} demo"], env=clean)
    path2 = run(["bash", "--noprofile", "--norc", "-c", f"PATH={e}:{d} command -v demo; PATH={e}:{d} demo"], env=clean)
    cd = run(["bash", "--noprofile", "--norc", "-c", "pwd; type cd; cd /tmp; pwd"], env=clean)
    observed = {"unexported_child": before, "exported_child": after, "path_first_then_second": path1,
                "path_second_then_first": path2, "cd_builtin": cd, "controlled_environment": clean}
    assert "child=unset" in before["stdout"] and "child=synthetic" in after["stdout"]
    assert path1["stdout"].endswith("first\n") and path2["stdout"].endswith("second\n"), f"PATH observations first={path1!r}, second={path2!r}"
    assert "cd is a shell builtin" in cd["stdout"] and cd["stdout"].endswith("/tmp\n")
    record("environment_path_cd", {"host_environment_not_inherited": True, "synthetic_paths": [str(d), str(e)]}, observed,
           {"export_inheritance": True, "path_order": True, "cd_changes_current_shell": True})


def do_permissions():
    base = ROOT / "permissions"; base.mkdir(exist_ok=True)
    f = base / "owned-640"; f.write_text("fixture\n"); f.chmod(0o640); os.chown(f, 1000, 2000)
    os.chmod(base, 0o755)
    def probes(path, uid, gid):
        code = ("import os,json,errno; p=" + repr(str(path)) + "; out={}; "
                "\nfor name,flags in [('read',os.O_RDONLY),('write',os.O_WRONLY)]:\n"
                " try:\n  fd=os.open(p,flags); os.close(fd); out[name]={'ok':True}\n"
                " except OSError as e: out[name]={'ok':False,'errno':e.errno,'error':e.strerror}\n"
                "print(json.dumps({'uid':os.getuid(),'gid':os.getgid(),'groups':os.getgroups(),'checks':out},sort_keys=True))")
        return run([sys.executable, "-c", code], env={"PATH":"/usr/bin:/bin", "LC_ALL":"C"}, preexec_fn=identity(uid,gid))
    matrix = {"owner_uid1000_gid2000": probes(f,1000,2000), "group_uid1001_gid2000": probes(f,1001,2000),
              "other_uid1002_gid3000": probes(f,1002,3000)}
    nox = base / "no-x"; nox.mkdir(exist_ok=True); (nox / "known").write_text("x\n"); (nox / "known").chmod(0o644)
    nox.chmod(0o700)
    parent_no_x = run(["cat", str(nox / "known")], env={"PATH":"/usr/bin:/bin","LC_ALL":"C"}, preexec_fn=identity(1002,3000))
    no_read = base / "x-no-read"; no_read.mkdir(exist_ok=True); (no_read / "known").write_text("known\n")
    no_read.chmod(0o711)
    path_read = run(["cat", str(no_read / "known")], env={"PATH":"/usr/bin:/bin","LC_ALL":"C"}, preexec_fn=identity(1002,3000))
    listing = run(["ls", str(no_read)], env={"PATH":"/usr/bin:/bin","LC_ALL":"C"}, preexec_fn=identity(1002,3000))
    deldir = base / "entry-delete"; deldir.mkdir(exist_ok=True); os.chown(deldir,1002,3000); deldir.chmod(0o700)
    protected = deldir / "readonly-entry"; protected.write_text("still fixture\n"); protected.chmod(0o444)
    unlinked = run(["rm", str(protected)], env={"PATH":"/usr/bin:/bin","LC_ALL":"C"}, preexec_fn=identity(1002,3000))
    root_probe = probes(f,0,0)
    st = f.stat()
    observed = {"file_stat": {"uid":st.st_uid,"gid":st.st_gid,"mode":oct(st.st_mode & 0o777)}, "640_matrix":matrix,
                "parent_without_x_known_file_644":parent_no_x,"parent_x_without_r_read_known_path":path_read,
                "parent_x_without_r_listing":listing,"dir_wx_unlink_file_444":unlinked,
                "entry_exists_after_unlink":protected.exists(),"root_uid0_separate":root_probe}
    print(json.dumps({"partial_case":"permissions","observations":observed},sort_keys=True),file=sys.stderr)
    owner=json.loads(matrix["owner_uid1000_gid2000"]["stdout"]); group=json.loads(matrix["group_uid1001_gid2000"]["stdout"]); other=json.loads(matrix["other_uid1002_gid3000"]["stdout"])
    assert owner["checks"]["read"]["ok"] and owner["checks"]["write"]["ok"], f"640 owner probe: {owner!r}"
    assert group["checks"]["read"]["ok"] and not group["checks"]["write"]["ok"]
    assert not other["checks"]["read"]["ok"] and not other["checks"]["write"]["ok"]
    assert parent_no_x["exit"] != 0 and path_read["exit"] == 0 and listing["exit"] != 0
    assert unlinked["exit"] == 0 and not protected.exists()
    record("permissions", {"fixture_scope":str(base),"nonroot_ids":[[1000,2000,[]],[1001,2000,[]],[1002,3000,[]]],"root_separate":True}, observed,
           {"640_matrix":True,"directory_search_vs_listing":True,"directory_entry_delete_vs_file_mode":True})


def do_signals():
    d=ROOT/"signals"; d.mkdir(exist_ok=True); ack=d/"term-ack"; release=d/"release"
    child_code = "import os,signal,time,pathlib; a=pathlib.Path(os.environ['ACK']); r=pathlib.Path(os.environ['REL']); signal.signal(signal.SIGTERM,lambda *_:(a.write_text('ack\\n'))); print('ready',flush=True); exec('while not r.exists(): time.sleep(0.02)')"
    env={"PATH":"/usr/bin:/bin","LC_ALL":"C","ACK":str(ack),"REL":str(release)}
    p=subprocess.Popen([sys.executable,"-c",child_code],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
    try:
        assert p.stdout.readline().strip()=="ready"
        start=proc_start(p.pid)
        before=run(["ps","-o","pid=,ppid=,stat=,comm=","-p",str(p.pid)])
        safe=proc_alive(p.pid,start)
        sent=run(["kill","-TERM",str(p.pid)]) if safe else {"argv":["kill","-TERM",str(p.pid)],"stdout":"","stderr":"PID identity mismatch; signal withheld","exit":125}
        deadline=time.monotonic()+3
        while time.monotonic()<deadline and not ack.exists(): time.sleep(.02)
        alive_after_ack=proc_alive(p.pid,start)
        ps_after=run(["ps","-o","pid=,ppid=,stat=,comm=","-p",str(p.pid)])
        release.write_text("release\n")
        out,err=p.communicate(timeout=3)
        observed={"pid":p.pid,"proc_starttime":start,"ps_before":before,"pre_signal_identity_match":safe,"kill_term":sent,
                  "handler_ack":ack.read_text() if ack.exists() else None,"alive_after_ack_before_release":alive_after_ack,
                  "ps_after_ack":ps_after,"release_file":str(release),"child_stdout_after_ready":out,"child_stderr":err,"parent_returncode":p.returncode}
        assert safe and sent["exit"]==0 and alive_after_ack and p.returncode==0
    finally:
        if p.poll() is None:
            release.write_text("cleanup\n"); p.wait(timeout=3)
    killed=subprocess.Popen(["sleep","30"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env={"PATH":"/usr/bin:/bin","LC_ALL":"C"})
    try:
        kstart=proc_start(killed.pid); same=proc_alive(killed.pid,kstart)
        kcmd=run(["kill","-KILL",str(killed.pid)]) if same else {"argv":["kill","-KILL",str(killed.pid)],"stdout":"","stderr":"PID identity mismatch; signal withheld","exit":125}
        _,kerr=killed.communicate(timeout=3)
        observed["kill_kill"]={"pid":killed.pid,"proc_starttime":kstart,"identity_match_before_signal":same,
                                "kill_command":kcmd,"python_popen_returncode":killed.returncode,"stderr":kerr,
                                "python_negative_nine_means_signal_9":killed.returncode==-signal.SIGKILL}
        assert same and kcmd["exit"]==0 and killed.returncode==-signal.SIGKILL
    finally:
        if killed.poll() is None: killed.kill(); killed.wait(timeout=3)
    record("signals", {"only_self_started_children":True,"pid_starttime_checked_before_signal":True,"TERM_child_waits_for_release_file":True}, observed,
           {"term_request_not_exit":True,"kill_cleanup_unavailable":True})


def do_network():
    d=ROOT/"network"; d.mkdir(exist_ok=True); ready=d/"ready"
    server = """import http.server, socketserver, pathlib, sys
ready=pathlib.Path(sys.argv[1])
class H(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  code=200 if ready.exists() else 503; body=b'ready\\n' if code==200 else b'warming\\n'
  self.send_response(code); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
 def log_message(self,*args): pass
class S(socketserver.TCPServer): allow_reuse_address=True
with S(('127.0.0.1',0),H) as s:
 print(s.server_address[1],flush=True); s.serve_forever()
"""
    p=subprocess.Popen([sys.executable,"-u","-c",server,str(ready)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env={"PATH":"/usr/bin:/bin","LC_ALL":"C"})
    try:
        port=int(p.stdout.readline().strip()); start=proc_start(p.pid)
        alive=proc_alive(p.pid,start)
        ss=run(["ss","-lnt","sport",f"= :{port}"])
        tcp=run(["nc","-z","-v","-w","2","127.0.0.1",str(port)])
        curl503=run(["curl","--silent","--show-error","--max-time","2","-w","\\nHTTP_STATUS=%{http_code}\\n",f"http://127.0.0.1:{port}/"])
        ready.write_text("controlled-ready\n")
        curl200=run(["curl","--silent","--show-error","--max-time","2","-w","\\nHTTP_STATUS=%{http_code}\\n",f"http://127.0.0.1:{port}/"])
        observed={"pid":p.pid,"proc_starttime":start,"loopback_address":"127.0.0.1","ephemeral_port":port,
                  "proc_alive_before_probes":alive,"ss_listen":ss,"nc_tcp":tcp,"curl_before_ready":curl503,
                  "ready_flag":ready.read_text(),"curl_after_ready":curl200}
        assert alive and ss["exit"]==0 and str(port) in ss["stdout"] and tcp["exit"]==0
        assert "HTTP_STATUS=503" in curl503["stdout"] and "warming" in curl503["stdout"]
        assert "HTTP_STATUS=200" in curl200["stdout"] and "ready" in curl200["stdout"]
    finally:
        p.terminate()
        try: p.wait(timeout=3)
        except subprocess.TimeoutExpired: p.kill(); p.wait(timeout=3)
    record("network_readiness", {"server":"self-started Python HTTP fixture","bind":"127.0.0.1","external_network":"disabled","not_systemd":True}, observed,
           {"process_socket_tcp_http_observed_separately":True,"503_to_200_controlled_transition":True})


def do_disk():
    d=ROOT/"disk"; d.mkdir(exist_ok=True); f=d/"8m.bin"
    df_before_write=run(["df","-B1",str(d)])
    before=os.statvfs(d)
    with f.open("wb") as out:
        chunk=b"D12-proof-bytes-0123456789abcdef"*4096
        remaining=8*1024*1024
        while remaining:
            part=chunk[:min(len(chunk),remaining)]; out.write(part); remaining-=len(part)
        out.flush(); os.fsync(out.fileno())
    fd=os.open(f,os.O_RDONLY); st=os.fstat(fd)
    du_before=run(["du","-B1",str(f)])
    df_after_write=run(["df","-B1",str(d)])
    mid=os.statvfs(d); f.unlink()
    du_after=run(["du","-B1",str(f)])
    after_unlink=os.statvfs(d)
    df_unlink=run(["df","-B1",str(d)])
    os.close(fd); after_close=os.statvfs(d); df_close=run(["df","-B1",str(d)])
    observed={"written_bytes":st.st_size,"stat_blocks_512b_units":st.st_blocks,"du_file_before_unlink":du_before,
              "df_before_write":df_before_write,"df_after_write":df_after_write,
              "statvfs_before_write":{"blocks":before.f_blocks,"bfree":before.f_bfree,"bavail":before.f_bavail},
              "statvfs_after_write":{"blocks":mid.f_blocks,"bfree":mid.f_bfree,"bavail":mid.f_bavail},
              "unlink_while_fd_open":True,"du_path_after_unlink":du_after,"df_after_unlink_open_fd":df_unlink,
              "statvfs_after_unlink_open_fd":{"bfree":after_unlink.f_bfree,"bavail":after_unlink.f_bavail},
              "df_after_close":df_close,"statvfs_after_close":{"bfree":after_close.f_bfree,"bavail":after_close.f_bavail}}
    assert st.st_size==8*1024*1024 and "No such file" in du_after["stderr"]
    assert df_before_write["exit"]==0 and df_after_write["exit"]==0
    assert mid.f_bfree<before.f_bfree and after_unlink.f_bfree==mid.f_bfree and after_close.f_bfree>=after_unlink.f_bfree
    record("disk_df_du_deleted_open", {"filesystem":"container /tmp tmpfs","payload":"8 MiB actual writes; no truncate/sparse allocation","scope_limit":"not host APFS or production disk"}, observed,
           {"write_consumed_blocks":True,"unlinked_open_fd_retains_blocks":True,"close_releases_or_preserves_no_more_blocks":True})


def do_rsync():
    base=ROOT/"rsync"; src=base/"src"; dst=base/"dst"; src.mkdir(parents=True,exist_ok=True); dst.mkdir(exist_ok=True)
    (src/"new.txt").write_bytes(b"synthetic new payload\n"); (src/"same.txt").write_bytes(b"same\n")
    (dst/"same.txt").write_bytes(b"same\n"); (dst/"old.txt").write_bytes(b"old\n")
    def snap(path): return {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(path.iterdir()) if p.is_file()}
    before=snap(dst); dry=run(["rsync","-av","--dry-run",str(src)+"/",str(dst)+"/"]); after=snap(dst)
    assert before==after and "new.txt" in dry["stdout"]
    record("local_rsync_dry_run", {"source":str(src),"destination":str(dst),"ssh_or_remote":False,"remote_transfer_performed":False},
           {"dry_run":dry,"destination_sha256_before":before,"destination_sha256_after":after},
           {"destination_bytes_unchanged":before==after,"new_file_listed":True})


def main():
    if not pathlib.Path("/.dockerenv").exists() or os.environ.get("D12_LAB_MARKER") != LAB or sys.platform != "linux":
        raise SystemExit("guard refused: expected Linux disposable container with explicit lab marker")
    if not pathlib.Path("/proof/proof.py").is_file() or not pathlib.Path("/proof/proof.py").stat().st_mode & 0o444:
        raise SystemExit("guard refused: proof script absent or unreadable")
    ROOT.mkdir(mode=0o700, exist_ok=True)
    os.chmod(ROOT, 0o755)
    env_allow={k:os.environ.get(k) for k in ("PATH","LANG","LC_ALL","D12_LAB_MARKER") if k in os.environ}
    system={"os_release":pathlib.Path("/etc/os-release").read_text(),"kernel":run(["uname","-a"]),
            "python":run(["python3","--version"]),"bash":run(["bash","--version"]),"uid_gid_groups":run(["id"]),
            "package_versions":run(["dpkg-query","-W","-f=${Package}=${Version}\\n","bash","coreutils","findutils","grep","sed","procps","iproute2","curl","netcat-openbsd","rsync","util-linux"]),
            "mount_tmp":run(["findmnt","-T","/tmp","-o","TARGET,FSTYPE,OPTIONS"]),"container_pid1":run(["ps","-p","1","-o","pid=,comm=,args="]),
            "allowlisted_environment":env_allow,"working_directory":os.getcwd(),"timezone":"UTC"}
    started=datetime.now(timezone.utc).isoformat()
    for fn in (do_streams,do_environment,do_permissions,do_signals,do_network,do_disk,do_rsync):
        fn()
    doc={"schema":"d12-linux-proof-v1","startedAtUTC":started,"finishedAtUTC":datetime.now(timezone.utc).isoformat(),
         "labMarker":LAB,"system":system,"cases":results,
         "scope":{"linux_container_only":True,"host_environment_dumped":False,"source_command_fixtures_distinguished":True,
                  "systemd_not_run":True,"ssh_not_run":True,"network_none":True}}
    out=pathlib.Path("/tmp/proof-result.json")
    out.write_text(json.dumps(doc,indent=2,sort_keys=True)+"\n")
    print(out.read_text())


if __name__=="__main__": main()
