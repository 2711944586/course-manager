from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = SERVER_ROOT.parent
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.services.seed_loader import load_workspace_seed_from_file  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Import Aurora workspace seed JSON into the backend database.')
    parser.add_argument(
        '--input',
        default=str(PROJECT_ROOT / 'scripts' / 'seed' / 'output' / 'standard-workspace.json'),
        help='Path to the workspace JSON file to import.',
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    with SessionLocal() as session:
        result = load_workspace_seed_from_file(session, args.input)

    summary = ', '.join(f'{key}={value}' for key, value in result.items())
    print(f'Seed import completed: {summary}')


if __name__ == '__main__':
    main()
