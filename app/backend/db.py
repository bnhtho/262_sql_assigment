"""
Kết nối Microsoft SQL Server cho StationeryStoreDB.
Hỗ trợ cả SQL Authentication (DB_USER/DB_PASSWORD) lẫn Windows Trusted Connection.
"""
from __future__ import annotations

import os
from contextlib import contextmanager
from decimal import Decimal
from datetime import date, datetime
from typing import Any

import pyodbc


def _build_conn_str() -> str:
    driver = os.getenv("MSSQL_DRIVER", "ODBC Driver 17 for SQL Server")
    server = os.getenv("MSSQL_SERVER", "localhost")
    database = os.getenv("MSSQL_DATABASE", "StationeryStoreDB")
    trusted = os.getenv("MSSQL_TRUSTED_CONNECTION", "yes").lower() in ("1", "true", "yes")
    trust_cert = os.getenv("MSSQL_TRUST_SERVER_CERT", "yes")

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
        f"TrustServerCertificate={trust_cert}",
    ]
    if trusted:
        parts.append("Trusted_Connection=yes")
    else:
        user = os.getenv("MSSQL_USER", "sa")
        password = os.getenv("MSSQL_PASSWORD", "")
        parts.append(f"UID={user}")
        parts.append(f"PWD={password}")
    return ";".join(parts)


@contextmanager
def get_connection():
    conn = pyodbc.connect(_build_conn_str(), timeout=10)
    try:
        yield conn
    finally:
        conn.close()


def _serialize_value(val: Any) -> Any:
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return [
            {col: _serialize_value(val) for col, val in zip(columns, row)}
            for row in cursor.fetchall()
        ]


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    rows = fetch_all(sql, params)
    return rows[0] if rows else None
