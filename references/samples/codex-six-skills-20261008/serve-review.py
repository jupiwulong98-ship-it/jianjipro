"""Local-only evidence preview with byte ranges for browser video seeking."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        self.remaining = None
        if self.path.split('?', 1)[0] != '/source/reference.mp4':
            return super().send_head()
        path = ROOT / 'source/reference.mp4'
        size = path.stat().st_size
        start, end = 0, size - 1
        byte_range = self.headers.get('Range')
        if byte_range:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', byte_range)
            if not match or not any(match.groups()):
                self.send_error(416, 'Unsupported byte range')
                return None
            a, b = match.groups()
            if a:
                start = int(a)
                end = min(int(b), end) if b else end
            else:
                start = max(0, size - int(b))
            if start >= size or start > end:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        f = path.open('rb')
        f.seek(start)
        self.remaining = end - start + 1
        self.send_response(206 if byte_range else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(self.remaining))
        if byte_range:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if self.remaining is None:
            return super().copyfile(source, outputfile)
        remaining = self.remaining
        try:
            while remaining:
                data = source.read(min(65536, remaining))
                if not data:
                    break
                outputfile.write(data)
                remaining -= len(data)
        except (BrokenPipeError, ConnectionResetError):
            pass  # A seeking browser can cancel an earlier range request.

print('http://127.0.0.1:5293/review.html', flush=True)
ThreadingHTTPServer(('127.0.0.1', 5293), Handler).serve_forever()
