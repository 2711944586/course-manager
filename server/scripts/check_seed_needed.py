from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = PROJECT_ROOT / "server" / "data" / "aurora.db"
TABLES_TO_CHECK = ("classes", "teachers", "courses", "students", "enrollments")


def main() -> int:
    if not DATABASE_PATH.exists():
        return 0

    try:
        connection = sqlite3.connect(DATABASE_PATH)
        cursor = connection.cursor()

        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ({})".format(
                ', '.join('?' for _ in TABLES_TO_CHECK),
            ),
            TABLES_TO_CHECK,
        )
        existingTables = {row[0] for row in cursor.fetchall()}

        if not existingTables:
            return 0

        if existingTables != set(TABLES_TO_CHECK):
            return 2

        rowCounts: list[int] = []
        for table_name in TABLES_TO_CHECK:
            cursor.execute(f"SELECT COUNT(1) FROM {table_name}")
            row = cursor.fetchone()
            if row is None:
                return 2
            rowCounts.append(int(row[0]))

        return 0 if all(count == 0 for count in rowCounts) else 1
    except sqlite3.Error:
        return 2
    finally:
        try:
            connection.close()
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())
