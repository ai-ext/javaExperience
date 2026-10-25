#!/usr/bin/env python3
"""D11 비교 이미지용 추가 SQLite 관측 두 건만 실행한다."""

from __future__ import annotations

import json
import sqlite3
import sys


EXPECTED = {
    "idOnly1002": [{"id": 1002, "owner_id": 7}],
    "uuidUnscoped1003": [{"id": 1003, "owner_id": 8}],
}


def fetch_rows(cursor: sqlite3.Cursor) -> list[dict[str, int]]:
    return [{"id": int(row[0]), "owner_id": int(row[1])} for row in cursor.fetchall()]


def main() -> int:
    connection = sqlite3.connect(":memory:")
    connection.execute(
        "CREATE TABLE orders (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, "
        "title TEXT NOT NULL, created_at INTEGER NOT NULL, public_id TEXT NOT NULL UNIQUE)"
    )
    connection.executemany(
        "INSERT INTO orders (id, owner_id, title, created_at, public_id) VALUES (?, ?, ?, ?, ?)",
        [
            (1002, 7, "내 주문", 1, "00000000-0000-4000-8000-000000001002"),
            (1003, 8, "다른 주문", 2, "00000000-0000-4000-8000-000000001003"),
        ],
    )

    id_only_sql = "SELECT id, owner_id FROM orders WHERE id = ?"
    id_only_binds = [1002]
    id_only_result = fetch_rows(connection.execute(id_only_sql, id_only_binds))

    uuid_sql = "SELECT id, owner_id FROM orders WHERE public_id = ?"
    uuid_binds = ["00000000-0000-4000-8000-000000001003"]
    uuid_result = fetch_rows(connection.execute(uuid_sql, uuid_binds))

    actual = {"idOnly1002": id_only_result, "uuidUnscoped1003": uuid_result}
    assert actual == EXPECTED, json.dumps(
        {"actual": actual, "expected": EXPECTED}, ensure_ascii=False, sort_keys=True
    )

    proof = {
        "source": "additional isolated Python SQLite comparison; two requested queries only",
        "runtime": {"python": sys.version, "sqlite": sqlite3.sqlite_version},
        "schema": "orders(id, owner_id, title, created_at, public_id)",
        "syntheticRows": [
            {"id": 1002, "owner_id": 7, "title": "내 주문", "created_at": 1,
             "public_id": "00000000-0000-4000-8000-000000001002"},
            {"id": 1003, "owner_id": 8, "title": "다른 주문", "created_at": 2,
             "public_id": "00000000-0000-4000-8000-000000001003"},
        ],
        "queries": {
            "idOnly1002": {"sql": id_only_sql, "bindParameters": id_only_binds, "result": id_only_result},
            "uuidUnscoped1003": {"sql": uuid_sql, "bindParameters": uuid_binds, "result": uuid_result},
        },
        "actual": actual,
        "expected": EXPECTED,
        "assertions": "passed",
        "limitation": "SQLite principle observation only; not MySQL/JPA/JDBC or server-side prepare evidence",
    }
    print(json.dumps(proof, ensure_ascii=False, sort_keys=True))
    connection.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
