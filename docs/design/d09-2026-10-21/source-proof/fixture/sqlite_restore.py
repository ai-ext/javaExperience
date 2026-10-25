"""새 private SQLite 세 파일의 backup/restore toy. 기존 DB와 운영 복구가 아니다."""
from pathlib import Path
import json
import sqlite3
import sys

base = Path(sys.argv[1])
base.mkdir(mode=0o700)
paths = {name: base / (name + '.sqlite') for name in ['source', 'snapshot', 'restored']}
assert all(not path.exists() for path in paths.values())
connections = {name: sqlite3.connect(path) for name, path in paths.items()}
source, snapshot, restored = [connections[name] for name in paths]
try:
    source.execute('CREATE TABLE notes(id INTEGER PRIMARY KEY, body TEXT NOT NULL)')
    source.execute('INSERT INTO notes VALUES(1, ?)', ('seed',))
    source.commit()
    before = source.execute('SELECT id,body FROM notes ORDER BY id').fetchall()
    source.backup(snapshot)
    source.execute('INSERT INTO notes VALUES(2, ?)', ('later',))
    source.commit()
    snapshot.backup(restored)
    rows = {name: connection.execute('SELECT id,body FROM notes ORDER BY id').fetchall() for name, connection in connections.items()}
    integrity = {name: connection.execute('PRAGMA integrity_check').fetchone()[0] for name, connection in connections.items()}
finally:
    for connection in connections.values():
        connection.close()
closed = {}
for name, connection in connections.items():
    try:
        connection.execute('SELECT 1')
        closed[name] = False
    except sqlite3.ProgrammingError:
        closed[name] = True
print(json.dumps({'beforeSnapshot': before, 'rows': rows, 'integrity': integrity,
                  'connectionsClosed': closed, 'sqliteVersion': sqlite3.sqlite_version,
                  'scope': 'additional own-file snapshot/restore; no failure deletion, operational RPO/RTO or service recovery measurement'}))
