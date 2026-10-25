#!/usr/bin/env python3
"""브라우저 CORS 연습용 loopback 전용 페이지/API fixture."""

from __future__ import annotations

import argparse
import json
import threading
import time
from collections import defaultdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


CASES = {"simple-blocked-read", "preflight-denied", "preflight-allowed", "wildcard-credentials"}
COOKIE_NAME = "d11_fixture_session"
COOKIE_VALUE = "DEMO_ONLY"
EVENT_LOCK = threading.Lock()
EVENTS: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
EVENTS_FILE: Path | None = None
PAGE_ORIGIN = ""


PAGE = r'''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>D11 격리 브라우저 fixture</title>
  <style>
    :root { color-scheme: dark; font: 16px/1.5 system-ui, sans-serif; background: #11151b; color: #e8edf4; }
    body { max-width: 1100px; margin: 36px auto; padding: 0 24px; }
    h1, h2 { line-height: 1.2; }
    .scope { color: #aeb9c8; }
    .cases { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    button { text-align: left; color: #f1f5fa; background: #222b36; border: 1px solid #536276; border-radius: 8px; padding: 12px 16px; cursor: pointer; }
    button:hover { background: #2d3948; }
    pre { min-height: 160px; overflow: auto; padding: 16px; border: 1px solid #34404e; border-radius: 8px; background: #0b0e12; white-space: pre-wrap; }
    .dom { display: flex; align-items: start; gap: 12px; margin: 12px 0; }
    #dom-output { min-width: 240px; min-height: 30px; padding: 10px; border: 1px solid #536276; background: #1a2029; }
  </style>
</head>
<body>
  <h1>D11 추가 Python HTTP fixture</h1>
  <p class="scope">합성 데이터 전용 · A/B는 port가 달라 cross-origin이며 같은 loopback host라 same-site입니다. CSRF cross-site 공격 재현이 아닙니다.</p>
  <p>각 버튼은 nonce를 만들어 API 관측을 초기화한 뒤 요청을 보내고, 서버 수신 기록과 브라우저의 응답 읽기 결과를 따로 표시합니다.</p>
  <section class="cases" aria-label="CORS cases">
    <button id="case-simple-blocked-read" type="button">simple-blocked-read — text/plain POST, no ACAO</button>
    <button id="case-preflight-denied" type="button">preflight-denied — JSON + X-D11-Probe, no ACAO</button>
    <button id="case-preflight-allowed" type="button">preflight-allowed — JSON + X-D11-Probe, exact origin allow</button>
    <button id="case-wildcard-credentials" type="button">wildcard-credentials — credentials: include, ACAO *</button>
  </section>
  <h2>서버 수신과 fetch 결과</h2>
  <pre id="case-result" role="status" aria-live="polite">아직 실행하지 않았습니다.</pre>
  <section aria-label="안전한 DOM 관찰">
    <h2>안전한 DOM 관찰</h2>
    <p>입력 문자열은 고정된 <code>&lt;b&gt;주문1002&lt;/b&gt;</code>입니다. 공격 코드, event handler, 외부 URL은 포함하지 않습니다.</p>
    <div class="dom"><div id="dom-output" aria-label="실제 DOM 결과"></div><pre id="dom-result" role="status" aria-live="polite">DOM 실험 전</pre></div>
    <div class="cases">
      <button id="dom-text-content" type="button">textContent로 표시</button>
      <button id="dom-inner-html" type="button">innerHTML로 표시</button>
    </div>
  </section>
  <script>
    const apiOrigin = "__API_ORIGIN__";
    const caseResult = document.getElementById("case-result");
    const caseIds = ["simple-blocked-read", "preflight-denied", "preflight-allowed", "wildcard-credentials"];
    let nonceCounter = 0;
    function runNonce() { nonceCounter += 1; return `${Date.now()}-${nonceCounter}-${Math.random().toString(36).slice(2)}`; }
    async function observations(caseName, run) {
      const url = `${apiOrigin}/observations?case=${encodeURIComponent(caseName)}&run=${encodeURIComponent(run)}`;
      const response = await fetch(url, { mode: "cors", credentials: "omit" });
      return await response.json();
    }
    async function runCase(caseName) {
      const run = runNonce();
      caseResult.textContent = `${caseName}: 실행 중…`;
      const resetURL = `${apiOrigin}/observations?case=${encodeURIComponent(caseName)}&run=${encodeURIComponent(run)}&reset=1`;
      await fetch(resetURL, { mode: "cors", credentials: "omit" });
      let fetchState = { ok: false, errorLabel: "요청이 완료되지 않았습니다." };
      let observedBody = null;
      try {
        const target = `${apiOrigin}/case/${encodeURIComponent(caseName)}?run=${encodeURIComponent(run)}`;
        let response;
        if (caseName === "preflight-denied" || caseName === "preflight-allowed") {
          response = await fetch(target, {
            method: "POST", mode: "cors", credentials: "omit",
            headers: { "Content-Type": "application/json", "X-D11-Probe": "synthetic" },
            body: JSON.stringify({ sample: "synthetic D11 probe" })
          });
        } else if (caseName === "wildcard-credentials") {
          response = await fetch(target, {
            method: "POST", mode: "cors", credentials: "include",
            headers: { "Content-Type": "text/plain" }, body: "synthetic fixture request"
          });
        } else {
          response = await fetch(target, {
            method: "POST", mode: "cors", credentials: "omit",
            headers: { "Content-Type": "text/plain" }, body: "synthetic fixture request"
          });
        }
        const text = await response.text();
        fetchState = { ok: true, status: response.status, errorLabel: null };
        if (caseName === "preflight-allowed") observedBody = text;
      } catch (error) {
        fetchState = { ok: false, errorLabel: `fetch rejected; response body unavailable (${error.name})` };
      }
      let serverObservation;
      try {
        serverObservation = await observations(caseName, run);
      } catch (error) {
        serverObservation = { errorLabel: `관측 API 읽기 실패 (${error.name})`, optionsCount: null, postCount: null, events: [] };
      }
      caseResult.textContent = JSON.stringify({
        source: "additional Python HTTP fixture, not Spring Security",
        pageOrigin: location.origin, apiOrigin,
        sameSiteScope: "different port = cross-origin; same loopback host = same-site; not a cross-site CSRF reproduction",
        case: caseName, run, serverObservation,
        fetch: fetchState,
        observedBody: caseName === "preflight-allowed" && fetchState.ok ? observedBody : null,
        errorLabel: fetchState.ok ? null : fetchState.errorLabel
      }, null, 2);
    }
    for (const caseName of caseIds) {
      document.getElementById(`case-${caseName}`).addEventListener("click", () => runCase(caseName));
    }
    function readDom(label, setter) {
      const target = document.getElementById("dom-output");
      const sample = "<b>주문1002</b>";
      setter(target, sample);
      const childTags = Array.from(target.children, element => element.tagName);
      const result = {
        source: "actual DOM read in this page",
        method: label,
        textContent: target.textContent,
        childTags,
        bCount: target.querySelectorAll("b").length,
        serializedHTML: target.innerHTML
      };
      document.getElementById("dom-result").textContent = JSON.stringify(result, null, 2);
    }
    document.getElementById("dom-text-content").addEventListener("click", () => readDom("textContent", (target, sample) => { target.textContent = sample; }));
    document.getElementById("dom-inner-html").addEventListener("click", () => readDom("innerHTML", (target, sample) => { target.innerHTML = sample; }));
  </script>
</body>
</html>
'''


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")


def query_values(path: str) -> tuple[str, str, dict[str, list[str]]]:
    parsed = urlparse(path)
    values = parse_qs(parsed.query, keep_blank_values=True)
    return parsed.path, values.get("case", [""])[0], values


def append_event(event: dict[str, object]) -> None:
    key = (str(event["case"]), str(event["run"]))
    with EVENT_LOCK:
        EVENTS[key].append(event)
        if EVENTS_FILE:
            with EVENTS_FILE.open("a", encoding="utf-8") as log:
                log.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")


class PageHandler(BaseHTTPRequestHandler):
    server_version = "D11PageFixture/1.0"

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        if urlparse(self.path).path != "/":
            self.send_error(404)
            return
        page = PAGE.replace("__API_ORIGIN__", self.server.api_origin).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(page)))
        self.send_header("Set-Cookie", f"{COOKIE_NAME}={COOKIE_VALUE}; Path=/; SameSite=Lax")
        self.end_headers()
        self.wfile.write(page)


class APIHandler(BaseHTTPRequestHandler):
    server_version = "D11API Fixture/1.0"

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def send_json(self, status: int, value: object, *, allow_origin: bool = False,
                  wildcard: bool = False, credentials: bool = False) -> None:
        body = json_bytes(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if allow_origin:
            self.send_header("Access-Control-Allow-Origin", PAGE_ORIGIN)
        if wildcard:
            self.send_header("Access-Control-Allow-Origin", "*")
        if credentials:
            self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802 - stdlib handler API
        path, _query_case, values = query_values(self.path)
        case_name = path.removeprefix("/case/")
        run = values.get("run", [""])[0]
        if path != "/case/" + case_name or case_name not in CASES or not run:
            self.send_error(404)
            return
        append_event({
            "atUTC": datetime.now(timezone.utc).isoformat(), "method": "OPTIONS",
            "case": case_name, "run": run, "origin": self.headers.get("Origin"),
            "cookieNamePresent": False,
        })
        self.send_response(204)
        if case_name == "preflight-allowed" and self.headers.get("Origin") == PAGE_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", PAGE_ORIGIN)
            self.send_header("Access-Control-Allow-Methods", "POST")
            self.send_header("Access-Control-Allow-Headers", "content-type,x-d11-probe")
            self.send_header("Access-Control-Max-Age", "0")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
        path, _query_case, values = query_values(self.path)
        case_name = path.removeprefix("/case/")
        run = values.get("run", [""])[0]
        if path != "/case/" + case_name or case_name not in CASES or not run:
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length:
            self.rfile.read(length)
        cookie_present = any(
            part.strip().startswith(COOKIE_NAME + "=")
            for part in self.headers.get("Cookie", "").split(";")
        )
        append_event({
            "atUTC": datetime.now(timezone.utc).isoformat(), "method": "POST",
            "case": case_name, "run": run, "origin": self.headers.get("Origin"),
            "cookieNamePresent": cookie_present,
        })
        response = {"case": case_name, "message": "synthetic fixture response"}
        if case_name == "preflight-allowed":
            self.send_json(200, response, allow_origin=self.headers.get("Origin") == PAGE_ORIGIN)
        elif case_name == "wildcard-credentials":
            self.send_json(200, response, wildcard=True, credentials=True)
        else:
            self.send_json(200, response)

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        path, case_name, values = query_values(self.path)
        run = values.get("run", [""])[0]
        if path != "/observations" or case_name not in CASES or not run:
            self.send_error(404)
            return
        key = (case_name, run)
        with EVENT_LOCK:
            if values.get("reset", [""])[0] == "1":
                EVENTS[key] = []
            events = list(EVENTS.get(key, []))
        observation = {
            "case": case_name, "run": run,
            "optionsCount": sum(event["method"] == "OPTIONS" for event in events),
            "postCount": sum(event["method"] == "POST" for event in events),
            "events": events,
        }
        self.send_json(200, observation, allow_origin=self.headers.get("Origin") == PAGE_ORIGIN)


class FixtureHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> int:
    global EVENTS_FILE, PAGE_ORIGIN
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port-a", type=int, default=0, help="page port; 0 chooses an available ephemeral port")
    parser.add_argument("--port-b", type=int, default=0, help="API port; 0 chooses an available ephemeral port")
    parser.add_argument("--events-file", type=Path, help="optional JSONL controlled-event log owned by this fixture")
    args = parser.parse_args()
    EVENTS_FILE = args.events_file.resolve() if args.events_file else None
    if EVENTS_FILE:
        EVENTS_FILE.parent.mkdir(parents=True, exist_ok=True)

    page_server = FixtureHTTPServer(("127.0.0.1", args.port_a), PageHandler)
    api_server = FixtureHTTPServer(("127.0.0.1", args.port_b), APIHandler)
    page_origin = f"http://127.0.0.1:{page_server.server_port}"
    api_origin = f"http://127.0.0.1:{api_server.server_port}"
    PAGE_ORIGIN = page_origin
    page_server.api_origin = api_origin
    api_server.page_origin = page_origin
    threads = [threading.Thread(target=server.serve_forever, name=f"d11-{label}", daemon=True)
               for label, server in (("page", page_server), ("api", api_server))]
    for thread in threads:
        thread.start()

    startup = {
        "source": "additional Python HTTP fixture, not Spring Security",
        "pageURL": page_origin + "/",
        "apiURL": api_origin,
        "pageOrigin": page_origin,
        "apiOrigin": api_origin,
        "pid": __import__("os").getpid(),
        "policy": {
            "bind": "127.0.0.1",
            "sameSiteScope": "different ports are cross-origin; same loopback host is same-site",
            "cases": sorted(CASES),
            "cookie": {"name": COOKIE_NAME, "valueLogged": False, "logged": "presence boolean only"},
            "eventsFile": str(EVENTS_FILE) if EVENTS_FILE else None,
            "noBrowserCorsEnforcementInPythonSmoke": True,
        },
    }
    print(json.dumps(startup, ensure_ascii=False, separators=(",", ":")), flush=True)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for server in (page_server, api_server):
            server.shutdown()
            server.server_close()
        for thread in threads:
            thread.join(timeout=2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
