"""python-jose has no release that fixes GHSA-3qf3-8w2g-rqmx (CVE-2026-85394).

PyPI 3.5.0 is still inside the affected range. This repository never imported
jose, so the dependency is removed instead of swapped for PyJWT or joserfc.
Those libraries would only add an unused JWT implementation.
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
        assert offenders == [], f"{name} still depends on python-jose: {offenders}"


def test_backend_source_does_not_import_jose():
    hits = []
    for path in (ROOT / "backend").rglob("*.py"):
        for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            code = raw.split("#", 1)[0]
            if "jose" in code:
                hits.append(f"{path.relative_to(ROOT)}:{lineno}: {raw.strip()}")
    assert hits == []
