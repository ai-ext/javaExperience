#!/usr/bin/env python3
"""stdlib HTTP smoke test; checks fixture endpoints/headers, not browser CORS enforcement."""

from __future__ import annotations

import hashlib
import http.client
import json
import signal
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode


HERE = Path(__file__).resolve().parent
FIXTURE = HERE / "browser_fixture.py"
LOGS = HERE.parent / "proof-logs"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def request(origin: str, method: str, path: str, headers: dict[str, str] | None = None,
            body: bytes | None = None) -> tuple[int, dict[str, str], bytes]:
    parsed = origin.removeprefix("http://").split(":")
    connection = http.client.HTTPConnection(parsed[0], int(parsed[1]), timeout=5)
    connection.request(method, path, body=body, headers=headers or {})
    response = connection.getresponse()
    result = (response.status, {key.lower(): value for key, value in response.getheaders()}, response.read())
    connection.close()
    return result


def json_call(origin: str, method: str, path: str, headers: dict[str, str] | None = None,
              body: bytes | None = None) -> tuple[int, dict[str, str], dict[str, object]]:
    status, response_headers, content = request(origin, method, path, headers, body)
    return status, response_headers, json.loads(content.decode("utf-8")) if content else {}


def main() -> int:
    LOGS.mkdir(parents=True, exist_ok=True)
    started_at = datetime.now(timezone.utc).isoformat()
    run_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    events_file = LOGS / f"browser-fixture-smoke-events-{run_stamp}.jsonl"
    argv = [sys.executable, str(FIXTURE), "--port-a", "0", "--port-b", "0", "--events-file", str(events_file)]
    process = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
    startup_line = process.stdout.readline() if process.stdout else ""
    startup = json.loads(startup_line)
    page_origin = startup["pageOrigin"]
    api_origin = startup["apiOrigin"]
    try:
        status, page_headers, page = request(page_origin, "GET", "/")
        assert status == 200
        assert "d11_fixture_session=DEMO_ONLY" in page_headers["set-cookie"]
        page_text = page.decode("utf-8")
        for token in ("case-simple-blocked-read", "case-preflight-denied", "case-preflight-allowed",
                      "case-wildcard-credentials", "dom-text-content", "dom-inner-html", "role=\"status\""):
            assert token in page_text, token

        denied_run = "smoke-denied"
        query = urlencode({"case": "preflight-denied", "run": denied_run})
        json_call(api_origin, "GET", f"/observations?{query}&reset=1", {"Origin": page_origin})
        denied_headers = {
            "Origin": page_origin, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-d11-probe",
        }
        status, response_headers, _ = request(api_origin, "OPTIONS", f"/case/preflight-denied?run={denied_run}", denied_headers)
        assert status == 204 and "access-control-allow-origin" not in response_headers
        status, read_headers, denied = json_call(api_origin, "GET", f"/observations?{query}", {"Origin": page_origin})
        assert status == 200 and read_headers["access-control-allow-origin"] == page_origin
        assert denied["optionsCount"] == 1 and denied["postCount"] == 0

        allowed_run = "smoke-allowed"
        query = urlencode({"case": "preflight-allowed", "run": allowed_run})
        json_call(api_origin, "GET", f"/observations?{query}&reset=1", {"Origin": page_origin})
        status, allowed_options, _ = request(api_origin, "OPTIONS", f"/case/preflight-allowed?run={allowed_run}", denied_headers)
        assert status == 204
        assert allowed_options["access-control-allow-origin"] == page_origin
        assert allowed_options["access-control-allow-methods"] == "POST"
        assert allowed_options["access-control-allow-headers"] == "content-type,x-d11-probe"
        allowed_post_headers = {"Origin": page_origin, "Content-Type": "application/json", "X-D11-Probe": "synthetic"}
        status, allowed_response_headers, allowed_body = request(
            api_origin, "POST", f"/case/preflight-allowed?run={allowed_run}", allowed_post_headers, b'{"sample":"synthetic"}'
        )
        assert status == 200 and allowed_response_headers["access-control-allow-origin"] == page_origin
        assert json.loads(allowed_body)["message"] == "synthetic fixture response"
        _, _, allowed = json_call(api_origin, "GET", f"/observations?{query}", {"Origin": page_origin})
        assert allowed["optionsCount"] == 1 and allowed["postCount"] == 1

        simple_run = "smoke-simple"
        query = urlencode({"case": "simple-blocked-read", "run": simple_run})
        json_call(api_origin, "GET", f"/observations?{query}&reset=1", {"Origin": page_origin})
        status, simple_headers, _ = request(
            api_origin, "POST", f"/case/simple-blocked-read?run={simple_run}",
            {"Origin": page_origin, "Content-Type": "text/plain"}, b"synthetic"
        )
        assert status == 200 and "access-control-allow-origin" not in simple_headers
        _, _, simple = json_call(api_origin, "GET", f"/observations?{query}", {"Origin": page_origin})
        assert simple["optionsCount"] == 0 and simple["postCount"] == 1

        wildcard_run = "smoke-wildcard"
        query = urlencode({"case": "wildcard-credentials", "run": wildcard_run})
        json_call(api_origin, "GET", f"/observations?{query}&reset=1", {"Origin": page_origin})
        status, wildcard_headers, _ = request(
            api_origin, "POST", f"/case/wildcard-credentials?run={wildcard_run}",
            {"Origin": page_origin, "Content-Type": "text/plain", "Cookie": "d11_fixture_session=DEMO_ONLY"}, b"synthetic"
        )
        assert status == 200
        assert wildcard_headers["access-control-allow-origin"] == "*"
        assert wildcard_headers["access-control-allow-credentials"] == "true"
        _, _, wildcard = json_call(api_origin, "GET", f"/observations?{query}", {"Origin": page_origin})
        assert wildcard["optionsCount"] == 0 and wildcard["postCount"] == 1
        assert wildcard["events"][0]["cookieNamePresent"] is True

        event_lines = events_file.read_text(encoding="utf-8").splitlines()
        events = [json.loads(line) for line in event_lines]
        assert len(events) == 5
        assert all(event["method"] in {"OPTIONS", "POST"} for event in events)
        assert all("Cookie" not in event and "cookie" not in event for event in events)
        result = {
            "startedAtUTC": started_at,
            "finishedAtUTC": datetime.now(timezone.utc).isoformat(),
            "source": "additional Python HTTP fixture, not Spring Security",
            "fixture": str(FIXTURE),
            "fixtureSHA256": sha256(FIXTURE),
            "smokeSource": str(Path(__file__).resolve()),
            "smokeSourceSHA256": sha256(Path(__file__).resolve()),
            "python": sys.version,
            "startup": startup,
            "checks": [
                "page HTML/cookie/button presence",
                "denied OPTIONS header and observations: OPTIONS=1 POST=0",
                "allowed OPTIONS/POST headers and observations: OPTIONS=1 POST=1",
                "simple POST response has no ACAO; observations: OPTIONS=0 POST=1",
                "wildcard plus credentials headers and cookie-name presence boolean",
                "JSONL has only five OPTIONS/POST events; control-plane GET is excluded",
            ],
            "eventCount": len(events),
            "eventsFile": str(events_file),
            "events": events,
            "limitation": "http.client checks HTTP responses and fixture counters only; it does not enforce browser CORS or verify DOM interaction",
            "argv": argv,
        }
    finally:
        process.send_signal(signal.SIGINT)
        stdout_tail, stderr = process.communicate(timeout=8)

    result["serverStdoutTail"] = stdout_tail
    result["serverStderr"] = stderr
    result["serverExitCode"] = process.returncode
    assert process.returncode == 0
    log_path = LOGS / ("browser-fixture-smoke-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + ".json")
    log_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"smokeLog": str(log_path), "eventsFile": str(events_file), "fixtureSHA256": result["fixtureSHA256"], "eventCount": result["eventCount"], "exitCode": process.returncode}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
