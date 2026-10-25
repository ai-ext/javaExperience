#!/usr/bin/env python3
"""격리 SQLite에서 객체 권한, 값 바인딩, 정렬 allow-list 원리를 관찰한다."""

from __future__ import annotations

import json
import sqlite3
import sys
from typing import Any


EXPECTED = {
    "objectAccess": {
        "ownScoped": [{"id": 1002, "owner_id": 7}],
        "otherIdOnly": [{"id": 1003, "owner_id": 8}],
        "otherScoped": [],
        "uuidOtherScoped": [],
    },
    "titleSearch": {
        "unsafeConcatenation": [
            {"id": 1002, "owner_id": 7},
            {"id": 1003, "owner_id": 8},
        ],
        "safeBoundOwner7": [],
    },
    "sorting": {
        "createdAtAllowed": [{"id": 1002, "owner_id": 7}],
        "unknownRejectedBeforeExecution": True,
        "owner7Rows": [{"id": 1002, "owner_id": 7}],
    },
    "principalConversionExample": {
        "numericName": 7,
        "textName": "ValueError",
        "scope": "Python int() example only; not Java Authentication or Spring execution",
    },
}


def rows(cursor: sqlite3.Cursor) -> list[dict[str, int]]:
    return [{"id": int(row[0]), "owner_id": int(row[1])} for row in cursor.fetchall()]


def main() -> int:
    connection = sqlite3.connect(":memory:")
    connection.row_factory = None
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

    object_queries: dict[str, dict[str, Any]] = {}
    sql = "SELECT id, owner_id FROM orders WHERE id = ? AND owner_id = ?"
    binds = [1002, 7]
    object_queries["ownScoped"] = {"sql": sql, "bindParameters": binds, "result": None}
    object_queries["ownScoped"]["result"] = rows(connection.execute(sql, binds))

    sql = "SELECT id, owner_id FROM orders WHERE id = ?"
    binds = [1003]
    object_queries["otherIdOnly"] = {"sql": sql, "bindParameters": binds, "result": None}
    object_queries["otherIdOnly"]["result"] = rows(connection.execute(sql, binds))

    sql = "SELECT id, owner_id FROM orders WHERE id = ? AND owner_id = ?"
    binds = [1003, 7]
    object_queries["otherScoped"] = {"sql": sql, "bindParameters": binds, "result": None}
    object_queries["otherScoped"]["result"] = rows(connection.execute(sql, binds))

    sql = "SELECT id, owner_id FROM orders WHERE public_id = ? AND owner_id = ?"
    binds = ["00000000-0000-4000-8000-000000001003", 7]
    object_queries["uuidOtherScoped"] = {"sql": sql, "bindParameters": binds, "result": None}
    object_queries["uuidOtherScoped"]["result"] = rows(connection.execute(sql, binds))

    injected_title = "' OR 1=1 --"
    unsafe_sql = f"SELECT id, owner_id FROM orders WHERE title = '{injected_title}' AND owner_id = 7"
    unsafe_result = rows(connection.execute(unsafe_sql))
    safe_sql = "SELECT id, owner_id FROM orders WHERE title = ? AND owner_id = ?"
    safe_binds = [injected_title, 7]
    safe_result = rows(connection.execute(safe_sql, safe_binds))

    sort_allowlist = {"createdAt": "created_at", "id": "id"}
    requested_sort = "createdAt"
    sort_column = sort_allowlist[requested_sort]
    allowed_sql = f"SELECT id, owner_id FROM orders WHERE owner_id = ? ORDER BY {sort_column}"
    allowed_binds = [7]
    allowed_result = rows(connection.execute(allowed_sql, allowed_binds))

    rejected_sort = "created_at DESC; SELECT * FROM orders"
    query_executions_before_rejection = 0
    try:
        rejected_column = sort_allowlist[rejected_sort]
        rejected_sql = f"SELECT id, owner_id FROM orders WHERE owner_id = ? ORDER BY {rejected_column}"
        query_executions_before_rejection += 1
        connection.execute(rejected_sql, [7])
        rejected = False
    except KeyError:
        rejected = True

    owner_sql = "SELECT id, owner_id FROM orders WHERE owner_id = ? ORDER BY id"
    owner_binds = [7]
    owner_result = rows(connection.execute(owner_sql, owner_binds))

    principal_name = "7"
    numeric_principal_example = int(principal_name)
    text_principal_name = "alice@example.test"
    try:
        int(text_principal_name)
        text_principal_error = None
    except ValueError as error:
        text_principal_error = type(error).__name__

    actual = {
        "objectAccess": {
            "ownScoped": object_queries["ownScoped"]["result"],
            "otherIdOnly": object_queries["otherIdOnly"]["result"],
            "otherScoped": object_queries["otherScoped"]["result"],
            "uuidOtherScoped": object_queries["uuidOtherScoped"]["result"],
        },
        "titleSearch": {
            "unsafeConcatenation": unsafe_result,
            "safeBoundOwner7": safe_result,
        },
        "sorting": {
            "createdAtAllowed": allowed_result,
            "unknownRejectedBeforeExecution": rejected and query_executions_before_rejection == 0,
            "owner7Rows": owner_result,
        },
        "principalConversionExample": {
            "numericName": numeric_principal_example,
            "textName": text_principal_error,
            "scope": "Python int() example only; not Java Authentication or Spring execution",
        },
    }
    assert actual == EXPECTED, json.dumps({"actual": actual, "expected": EXPECTED}, ensure_ascii=False)

    proof = {
        "source": "additional Python SQLite isolation proof; not MySQL/JPA/JDBC server-prepare evidence",
        "runtime": {"python": sys.version, "sqlite": sqlite3.sqlite_version},
        "schema": "orders(id, owner_id, title, created_at, public_id)",
        "syntheticRows": [
            {"id": 1002, "owner_id": 7, "title": "내 주문", "created_at": 1,
             "public_id": "00000000-0000-4000-8000-000000001002"},
            {"id": 1003, "owner_id": 8, "title": "다른 주문", "created_at": 2,
             "public_id": "00000000-0000-4000-8000-000000001003"},
        ],
        "queries": object_queries,
        "titleSearch": {
            "input": injected_title,
            "unsafeConcatenation": {"sql": unsafe_sql, "bindParameters": [], "result": unsafe_result},
            "safeBoundOwner7": {"sql": safe_sql, "bindParameters": safe_binds, "result": safe_result},
        },
        "sorting": {
            "allowlist": sort_allowlist,
            "allowedInput": requested_sort,
            "allowed": {"sql": allowed_sql, "bindParameters": allowed_binds, "result": allowed_result},
            "rejectedInput": rejected_sort,
            "rejectedBeforeExecution": rejected,
            "queryExecutionsForRejectedInput": query_executions_before_rejection,
            "owner7Where": {"sql": owner_sql, "bindParameters": owner_binds, "result": owner_result},
        },
        "principalConversionExample": {
            "numericInput": principal_name,
            "numericResult": numeric_principal_example,
            "textInput": text_principal_name,
            "textException": text_principal_error,
            "scope": "Python int() example only; not Java Authentication or Spring execution",
        },
        "actual": actual,
        "expected": EXPECTED,
        "assertions": "passed",
    }
    print(json.dumps(proof, ensure_ascii=False, sort_keys=True))
    connection.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
