"""이 worktree의 개념 학습과 필요한 공개 화면 자산만 loopback으로 제공한다."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[3]
PREFIXES = (
    '/docs/knowledge/', '/tools/site/',
    '/docs/design/p09-2026-10-20/images/',
    '/docs/design/p04-2026-10-20/images/',
    '/docs/design/p16-2026-10-20/images/',
    '/docs/design/w09-2026-10-20/images/',
    '/docs/design/p19-2026-10-20/images/',
    '/docs/design/p20-2026-10-20/images/',
    '/docs/design/s09-2026-10-20/images/',
    '/docs/design/s08-2026-10-20/images/',
    '/docs/design/w11-2026-10-20/images/',
    '/docs/design/r03-2026-10-20/images/',
    '/docs/design/r04-2026-10-20/images/',
    '/docs/design/w15-2026-10-20/images/',
    '/docs/design/v04-2026-10-20/images/',
    '/docs/design/b01-2026-10-20/images/',
    '/docs/design/d01-2026-10-20/images/',
    '/docs/design/d02-2026-10-20/images/',
    '/docs/design/d03-2026-10-20/images/',
    '/docs/design/d04-2026-10-21/images/',
    '/docs/design/d05-2026-10-21/images/',
    '/docs/design/d06-2026-10-21/images/',
    '/docs/design/d07-2026-10-21/images/',
    '/docs/design/d08-2026-10-21/images/',
    '/docs/design/d09-2026-10-21/images/',
    '/docs/design/d10-2026-10-21/images/',
    '/docs/design/mockups-2026-10-15-batch2/',
    '/docs/design/mockups-2026-10-15-batch8/',
    '/docs/design/mockups-2026-10-15-batch6/',
    '/docs/design/mockups-2026-10-15-batch9/',
    '/docs/design/mockups-2026-10-15-batch11/',
    '/docs/design/mockups-2026-10-15-batch13/',
    '/docs/design/mockups-2026-10-15-batch14/',
    '/docs/design/mockups-2026-10-16-batch41/',
)

class ConceptPreview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def allowed(self):
        path = unquote(urlsplit(self.path).path)
        parts = Path(path).parts
        try:
            inside = (ROOT / path.lstrip('/')).resolve().is_relative_to(ROOT)
        except (ValueError, OSError):
            return False
        return inside and path.startswith(PREFIXES) and not any(
            part.startswith('.') or part == 'node_modules' for part in parts
        )

    def do_GET(self):
        if not self.allowed():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if not self.allowed():
            self.send_error(404)
            return
        super().do_HEAD()

    def do_POST(self):
        self.send_error(405)

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    print(f'Concept preview: http://127.0.0.1:8769 · {ROOT}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8769), ConceptPreview).serve_forever()
