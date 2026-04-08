from __future__ import annotations

import importlib.util
import sqlite3
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / 'scripts' / 'check_seed_needed.py'
MODULE_SPEC = importlib.util.spec_from_file_location('check_seed_needed', MODULE_PATH)
assert MODULE_SPEC and MODULE_SPEC.loader
check_seed_needed = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(check_seed_needed)


def create_database(
    database_path: Path,
    row_counts: dict[str, int] | None = None,
    *,
    missing_tables: set[str] | None = None,
) -> None:
    counts = row_counts or {}
    skipped_tables = missing_tables or set()

    connection = sqlite3.connect(database_path)
    try:
        cursor = connection.cursor()
        for table_name in check_seed_needed.TABLES_TO_CHECK:
            if table_name in skipped_tables:
                continue

            cursor.execute(f'CREATE TABLE {table_name} (id INTEGER PRIMARY KEY)')
            for _ in range(counts.get(table_name, 0)):
                cursor.execute(f'INSERT INTO {table_name} DEFAULT VALUES')
        connection.commit()
    finally:
        connection.close()


def test_check_seed_needed_returns_zero_when_database_is_missing(monkeypatch) -> None:
    missing_database = MODULE_PATH.parent / 'missing-test-db.sqlite3'
    monkeypatch.setattr(check_seed_needed, 'DATABASE_PATH', missing_database)

    assert check_seed_needed.main() == 0


def test_check_seed_needed_returns_zero_when_all_core_tables_are_empty(
    monkeypatch,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / 'aurora-empty.sqlite3'
    create_database(database_path)
    monkeypatch.setattr(check_seed_needed, 'DATABASE_PATH', database_path)

    assert check_seed_needed.main() == 0


def test_check_seed_needed_returns_one_when_any_core_table_contains_data(
    monkeypatch,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / 'aurora-seeded.sqlite3'
    create_database(database_path, {'teachers': 1})
    monkeypatch.setattr(check_seed_needed, 'DATABASE_PATH', database_path)

    assert check_seed_needed.main() == 1


def test_check_seed_needed_returns_two_when_core_tables_are_incomplete(
    monkeypatch,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / 'aurora-incomplete.sqlite3'
    create_database(database_path, missing_tables={'enrollments'})
    monkeypatch.setattr(check_seed_needed, 'DATABASE_PATH', database_path)

    assert check_seed_needed.main() == 2
