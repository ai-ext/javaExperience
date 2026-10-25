#!/usr/bin/env python3
"""Host orchestrator: Docker argv only, captures evidence, removes only nonce-owned containers."""
import json
import hashlib
import os
import pathlib
import secrets
import subprocess
import sys
from datetime import datetime, timezone

HERE=pathlib.Path(__file__).resolve().parent
BASE=HERE.parent
LOGS=BASE/"proof-logs"
LOGS.mkdir(parents=True,exist_ok=True)
nonce=secrets.token_hex(6)
tag=f"javaexperience-d12-proof:20261025-{nonce}"
label=f"javaexperience.d12.proof.nonce={nonce}"
name=f"javaexperience-d12-proof-{nonce}"
marker="D12_LINUX_PROOF_20261025"
records=[]
DOCKER_ENV={k:v for k,v in os.environ.items() if k not in {"DOCKER_HOST","DOCKER_CONTEXT","DOCKER_TLS_VERIFY","DOCKER_CERT_PATH","DOCKER_API_VERSION"}}
DOCKER_SOCKET=None

def call(argv, timeout=600):
    if argv[0]!="docker" or not DOCKER_SOCKET:
        raise RuntimeError("Docker call refused before verified local Unix endpoint")
    fixed_argv=["docker","--host",DOCKER_SOCKET,*argv[1:]]
    p=subprocess.run(fixed_argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout,env=DOCKER_ENV)
    item={"argv":fixed_argv,"stdout":p.stdout,"stderr":p.stderr,"exit":p.returncode}
    records.append(item)
    if p.returncode:
        raise RuntimeError(f"command failed ({p.returncode}): {argv[0]} {argv[1] if len(argv)>1 else ''}")
    return item

def inspect(template):
    return call(["docker","inspect","--format",template,name])

def main():
    global DOCKER_SOCKET
    if os.name!="posix" or not str(HERE).endswith("/source-proof"):
        raise SystemExit("guard refused: unexpected host or source-proof path")
    context=subprocess.run(["docker","context","show"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,check=True,env=DOCKER_ENV)
    context_name=context.stdout.strip()
    endpoint=subprocess.run(["docker","context","inspect",context_name,"--format","{{json .Endpoints.docker.Host}}"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,check=True,env=DOCKER_ENV)
    endpoint_url=json.loads(endpoint.stdout)
    if not isinstance(endpoint_url,str) or not endpoint_url.startswith("unix://") or not endpoint_url[7:]:
        raise SystemExit("guard refused: Docker endpoint is not a local Unix socket")
    DOCKER_SOCKET=endpoint_url
    base={"schema":"d12-docker-proof-run-v1","startedAtUTC":datetime.now(timezone.utc).isoformat(),
          "nonce":nonce,"dockerContext":context_name,"dockerEndpointKind":"local-unix","dockerSocket":DOCKER_SOCKET,
          "removedDockerOverrideEnvKeys":["DOCKER_HOST","DOCKER_CONTEXT","DOCKER_TLS_VERIFY","DOCKER_CERT_PATH","DOCKER_API_VERSION"],
          "sourceBuildContext":str(HERE),"imageTag":tag,"label":label,"containerName":name,
          "timezone":"UTC","hostRunner":{"argvMode":"subprocess argv, shell=False","hostEnvironmentDumped":False},
          "sourceSha256":{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [BASE/"Dockerfile",HERE/"proof.py",HERE/"run_proof.py",BASE/"source-manifest.json",BASE/"../../knowledge/D12-linux-terminal-basics.md"]}}
    try:
        pull=call(["docker","pull","python:3.12-slim"])
        base["pull"]=pull
        di=call(["docker","image","inspect","python:3.12-slim","--format","{{json .}}"])
        base["officialBaseImageInspect"]=json.loads(di["stdout"])
        digest=(base["officialBaseImageInspect"].get("RepoDigests") or [None])[0]
        platform={k:base["officialBaseImageInspect"].get(k) for k in ("Os","Architecture","Variant","Id","RepoDigests")}
        base["resolvedBaseImage"]=platform
        base["baseImageDigest"]=digest
        if not digest: raise RuntimeError("python base image did not expose a RepoDigest")
        build=call(["docker","build","--pull","--label",label,"--tag",tag,"--file",str(BASE/"Dockerfile"),str(HERE)],timeout=900)
        base["build"]=build
        own=call(["docker","image","inspect",tag,"--format","{{json .}}"])
        own_info=json.loads(own["stdout"])
        base["ownedImage"]={k:own_info.get(k) for k in ("Id","RepoDigests","Size","Os","Architecture","Config")}
        create=call(["docker","create","--name",name,"--label",label,"--network","none","--read-only",
            "--cpus=1","--memory=256m","--pids-limit=128","--tmpfs","/tmp:rw,exec,nosuid,size=128m",
            "--mount",f"type=bind,src={HERE},dst=/proof,readonly","--env",f"D12_LAB_MARKER={marker}",tag])
        container_id=create["stdout"].strip()
        base["containerId"]=container_id
        # Make container identity exact before starting it; no host PID/network/root/socket mounts exist.
        inspect=call(["docker","inspect","--format","{{json .}}",container_id])
        ci=json.loads(inspect["stdout"])
        mounts=[{"Type":m.get("Type"),"Destination":m.get("Destination"),"RW":m.get("RW")} for m in ci.get("Mounts",[])]
        labels=ci.get("Config",{}).get("Labels",{})
        if ci.get("Id")!=container_id or labels.get("javaexperience.d12.proof.nonce")!=nonce:
            raise RuntimeError("owned container identity/nonce mismatch; refusing to start/cleanup")
        if any(m.get("RW") for m in mounts if m.get("Destination")=="/proof"):
            raise RuntimeError("proof source mount unexpectedly writable")
        base["containerBeforeStart"]={"id":ci.get("Id"),"state":ci.get("State"),"labels":labels,"mounts":mounts,
            "privileged":ci.get("HostConfig",{}).get("Privileged"),"pidMode":ci.get("HostConfig",{}).get("PidMode"),
            "networkMode":ci.get("HostConfig",{}).get("NetworkMode"),"readonlyRootfs":ci.get("HostConfig",{}).get("ReadonlyRootfs"),
            "capAdd":ci.get("HostConfig",{}).get("CapAdd"),"devices":ci.get("HostConfig",{}).get("Devices")}
        run=call(["docker","start","--attach",name],timeout=90)
        base["linuxFixtureOutput"]=run
        base["linuxActual"]=json.loads(run["stdout"])
        base["linuxCommandArgv"]=next(c["argv"] for c in records if c["argv"][0:2]==["docker","--host"] and c["argv"][3:5]==["start","--attach"] and c["argv"][-1]==name)
        base["independentExpected"]={"redirection":{"stdout_then_stderr_file":"out\\nerr\\n","stderr_then_stdout_file":"out\\n","producer_exit":7},
            "pipe":{"default_status":0,"pipefail_status":7,"PIPESTATUS":[7,0]},
            "environment":{"unexported_child":"unset","exported_child":"synthetic","PATH":"first path then second path wins"},
            "permissions":{"640":{"owner":[True,True],"group":[True,False],"other":[False,False]},"directory_x_without_r":{"known_path_read":True,"listing":False}},
            "signals":{"TERM_handler_ack_before_release":True,"KILL_Popen_returncode":-9},
            "network":{"loopback_only":True,"http_before_ready":503,"http_after_ready":200},
            "disk":{"write_bytes":8388608,"df_before_write":True,"df_after_write":True,"unlinked_path_absent_while_open":True,"filesystem_blocks_retained_until_close":True},
            "rsync":{"dry_run":True,"destination_hashes_unchanged":True}}
        base["containerExit"] = call(["docker","inspect","--format","{{.State.ExitCode}}",name])["stdout"].strip()

        # Separate own idle container demonstrates actual PID 1 and docker logs/exec behavior.
        idle=f"{name}-idle"
        idle_create=call(["docker","create","--name",idle,"--label",label,"--network","none","--read-only",
                          "--cpus=1","--memory=256m","--pids-limit=128","--tmpfs","/tmp:rw,nosuid,size=16m",
                          "--entrypoint","/bin/sh",tag,"-c","printf 'D12 synthetic bootline\\n'; exec sleep 300"])
        idle_id=idle_create["stdout"].strip()
        base["idleContainer"]={"name":idle,"id":idle_id}
        probe=call(["docker","inspect","--format","{{json .}}",idle_id])
        idle_ci=json.loads(probe["stdout"])
        if idle_ci["Id"]!=idle_id or idle_ci.get("Config",{}).get("Labels",{}).get("javaexperience.d12.proof.nonce")!=nonce:
            raise RuntimeError("idle container identity/nonce mismatch; refusing to start/cleanup")
        call(["docker","start",idle])
        logs=call(["docker","logs","--tail","20",idle])
        pid1=call(["docker","exec",idle,"cat","/proc/1/comm"])
        cmd1=call(["docker","exec",idle,"sh","-c","tr '\\000' ' ' </proc/1/cmdline; printf '\\n'"])
        extra=call(["docker","exec",idle,"sh","-c","printf 'exec_pid=%s\\n' $$; sleep 0.2"])
        pid1_after=call(["docker","exec",idle,"cat","/proc/1/comm"])
        base["idleContainer"].update({"logs":logs,"pid1Comm":pid1,"pid1Cmdline":cmd1,"execProcess":extra,"pid1AfterExec":pid1_after,
                                      "pid1IsSystemdAssumed":False,"hostPidNamespace":False})
        base["idleUnchangedPid1"]=pid1["stdout"]==pid1_after["stdout"]
        if not base["idleUnchangedPid1"]: raise RuntimeError("PID 1 changed during docker exec observation")
        base["cleanup"]="finally: only nonce-owned containers by exact name/id; image retained for reproduction"
    except Exception as exc:
        base["failure"]={"type":type(exc).__name__,"message":str(exc)}
        raise
    finally:
        # Remove only exact container IDs after verifying their ID and nonce label.
        for cid in [locals().get("container_id"),locals().get("idle_id")]:
            if not cid: continue
            check=subprocess.run(["docker","--host",DOCKER_SOCKET,"inspect","--format","{{json .}}",cid],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=DOCKER_ENV)
            if check.returncode==0:
                try:
                    obj=json.loads(check.stdout)
                    owned=(obj.get("Id")==cid and obj.get("Config",{}).get("Labels",{}).get("javaexperience.d12.proof.nonce")==nonce)
                    if owned:
                        rm_argv=["docker","--host",DOCKER_SOCKET,"rm","--force",cid]
                        removed=subprocess.run(rm_argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=DOCKER_ENV)
                        records.append({"argv":rm_argv,"stdout":removed.stdout,"stderr":removed.stderr,"exit":removed.returncode})
                    else:
                        records.append({"argv":["docker","--host",DOCKER_SOCKET,"rm","--force",cid],"stdout":"","stderr":"ownership check failed; cleanup withheld\n","exit":125})
                except Exception as cleanup_error:
                    records.append({"argv":["docker","--host",DOCKER_SOCKET,"rm","--force",cid],"stdout":"","stderr":str(cleanup_error),"exit":125})
        base["finishedAtUTC"]=datetime.now(timezone.utc).isoformat()
        base["commands"]=records
        out=LOGS/f"attempt-{nonce}.json"
        out.write_text(json.dumps(base,indent=2,sort_keys=True)+"\n")
        print(f"evidence={out}")
    # The raw JSON from the Linux fixture is embedded in docker stdout; preserve it separately verbatim.
    if records and not base.get("failure"):
        raw=base["linuxFixtureOutput"]["stdout"]
        raw_path=LOGS/f"linux-output-{nonce}.json"
        raw_path.write_text(raw)
        print(f"linux_raw={raw_path}")
        print(f"base_digest={digest} own_image_id={own_info.get('Id')} size={own_info.get('Size')} platform={own_info.get('Os')}/{own_info.get('Architecture')}")

if __name__=="__main__": main()
