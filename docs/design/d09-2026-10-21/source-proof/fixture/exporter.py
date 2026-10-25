"""추가 stdlib toy. 원문 Actuator가 아니며 /metrics 조회는 업무 요청을 세지 않는다."""
import argparse
import collections
import datetime
import json
import os
import signal
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=0)
parser.add_argument('--port-file', required=True)
parser.add_argument('--events-file', required=True)
args = parser.parse_args()
counts = collections.Counter(success=0, failure=0, excluded=0)
valid_count = success_count = valid_http_200_count = 0
CASES = {
    'success': (200, True, True),
    'httpfail': (500, False, True),
    'badpayload': (200, False, True),
    'invalid': (400, False, False),
}

def metrics():
    lines = ['# HELP d09_business_requests_total Additional toy business requests by bounded outcome.',
             '# TYPE d09_business_requests_total counter']
    for outcome in ['success', 'failure', 'excluded']:
        lines.append('d09_business_requests_total{outcome="' + outcome + '"} ' + str(counts[outcome]))
    for name, value in [('d09_valid_business_requests_total', valid_count),
                        ('d09_business_successes_total', success_count),
                        ('d09_valid_http_200_total', valid_http_200_count)]:
        lines.extend(['# TYPE ' + name + ' counter', name + ' ' + str(value)])
    return '\n'.join(lines) + '\n'

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, content_type, body):
        data = body.encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        global valid_count, success_count, valid_http_200_count
        url = urlsplit(self.path)
        if url.path == '/metrics':
            self.reply(200, 'text/plain; version=0.0.4; charset=utf-8', metrics())
            return
        case = parse_qs(url.query).get('case', [''])[0]
        if url.path != '/business' or case not in CASES:
            self.reply(404, 'application/json', json.dumps({'error': 'unmapped toy route'}))
            return
        status, business_ok, valid = CASES[case]
        outcome = 'excluded' if not valid else 'success' if business_ok else 'failure'
        counts[outcome] += 1
        valid_count += int(valid)
        success_count += int(valid and business_ok)
        valid_http_200_count += int(valid and status == 200)
        event = {'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                 'request_id': 'd09-' + case, 'case': case, 'method': 'GET',
                 'http_status': status, 'business_ok': business_ok, 'valid': valid, 'outcome': outcome}
        with Path(args.events_file).open('a') as stream:
            stream.write(json.dumps(event, separators=(',', ':')) + '\n')
        print(json.dumps(event, separators=(',', ':')), flush=True)
        self.reply(status, 'application/json', json.dumps(event))

    def log_message(self, format, *arguments):
        pass

class Server(HTTPServer):
    allow_reuse_address = True

server = Server(('127.0.0.1', args.port), Handler)
Path(args.port_file).write_text(json.dumps({'host': '127.0.0.1', 'port': server.server_port, 'pid': os.getpid()}))
def stop(signum, frame):
    threading.Thread(target=server.shutdown).start()
signal.signal(signal.SIGTERM, stop)
try:
    server.serve_forever(poll_interval=0.05)
finally:
    server.server_close()
