"""python-jose has no release that fixes GHSA-3qf3-8w2g-rqmx.

PyPI 3.5.0 is still inside the affected range. This repository never
imported jose, so the dependency is removed instead of swapped for
PyJWT or joserfc. Those libraries would only add an unused JWT stack.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIREMENT_FILES = ("requirements.txt", "requirements-ai.txt")


def _active_requirement_lines(path: Path) -> list[str]:
    lines = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip().lower()
        if line:
            lines.append(line)
    return lines


def test_requirements_do_not_depend_on_python_jose():
    for name in REQUIREMENT_FILES:
        lines = _active_requirement_lines(ROOT / name)
        offenders = [line for line in lines if "jose" in line]
        assert offenders == [], name


def test_backend_source_does_not_import_jose():
    hits = []
    backend = ROOT / "backend"
    for path in backend.rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        for lineno, raw in enumerate(text.splitlines(), start=1):
            code = raw.split("#", 1)[0]
            if "jose" in code:
                rel = path.relative_to(ROOT)
                hits.append(f"{rel}:{lineno}")
    assert hits == []
