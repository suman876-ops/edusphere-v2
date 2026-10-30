#!/usr/bin/env python3
"""Check the EduSphere site before it ships.

    python3 tools/build.py           # run every check
    python3 tools/build.py --list    # list the checks

There is nothing to compile: the page is static and reads its data from Supabase at
runtime. What this script does is refuse to publish a page that is broken or that
leaks a secret. Exit code 1 means do not deploy.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
CONFIG = ROOT / "assets" / "js" / "config.js"
SKIP_DIRS = {".git", "node_modules", "dist"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def source_files() -> list[Path]:
    return [
        p for p in ROOT.rglob("*")
        if p.is_file() and not any(part in SKIP_DIRS for part in p.parts)
    ]


# ------------------------------------------------------------------ checks

def check_assets() -> list[str]:
    text = read(INDEX)
    problems = []
    for asset in re.findall(r'(?:href|src)="(assets/[^"]+)"', text):
        if not (ROOT / asset).exists():
            problems.append(f"index.html references a missing file: {asset}")
    return problems


def check_icons() -> list[str]:
    text = read(INDEX)
    defined = set(re.findall(r'<g id="i-([a-z]+)"', text))
    used = set(re.findall(r'href="#i-([a-z]+)"', text))
    problems = []
    for name in sorted(used - defined):
        problems.append(f"icon '#i-{name}' is used but not defined in the sprite")
    if not defined:
        problems.append("the icon sprite is empty")
    return problems


def check_no_inline_code() -> list[str]:
    text = read(INDEX)
    problems = []
    if "<style>" in text:
        problems.append("index.html still contains an inline <style> block")
    if re.search(r"<script(?![^>]*\bsrc=)", text):
        problems.append("index.html still contains an inline <script> block")
    return problems


def check_structure() -> list[str]:
    text = read(INDEX)
    problems = []
    for tag in ("<html", "</html>", "<head>", "</head>", "<body>", "</body>", "</main>"):
        if tag not in text:
            problems.append(f"index.html is missing {tag}")
    for script in ("assets/js/config.js", "assets/js/api.js", "assets/js/search.js", "assets/js/app.js"):
        if script not in text:
            problems.append(f"index.html does not load {script}")
    if 'id="module-grid"' not in text:
        problems.append("index.html has no #module-grid container")
    if 'id="enquiry-form"' not in text:
        problems.append("index.html has no #enquiry-form")
    return problems


def check_no_demo_data() -> list[str]:
    """The page must not carry content that pretends to come from a database."""
    text = read(INDEX)
    problems = []
    if (ROOT / "data" / "modules.json").exists():
        problems.append("data/modules.json still exists — modules come from Supabase now")
    for marker in ('data-cat="core"><div class="ico">', "sample snapshot", "lorem ipsum", "TODO"):
        if marker in text:
            problems.append(f"index.html still contains hard-coded placeholder content: {marker!r}")
    if re.search(r'<b id="stat-modules">\s*\d+\s*</b>', text):
        problems.append("the module count is hard-coded instead of read from the API")
    return problems


def check_config() -> list[str]:
    if not CONFIG.exists():
        return ["assets/js/config.js is missing"]

    text = read(CONFIG)
    problems = []
    url = re.search(r'supabaseUrl:\s*"([^"]+)"', text)
    key = re.search(r'supabaseKey:\s*"([^"]+)"', text)

    if not url:
        problems.append("config.js has no supabaseUrl")
    elif not url.group(1).startswith("https://") or ".supabase.co" not in url.group(1):
        problems.append(f"config.js supabaseUrl does not look like a Supabase URL: {url.group(1)}")

    if not key:
        problems.append("config.js has no supabaseKey")
    else:
        value = key.group(1)
        if value.startswith("sb_secret") or value.startswith("sbp_"):
            problems.append("config.js holds a secret key — only publishable keys belong in the browser")
        if value.count(".") == 2:
            try:
                payload = json.loads(base64.urlsafe_b64decode(value.split(".")[1] + "=="))
                role = payload.get("role", "")
                if role not in ("anon",):
                    problems.append(f"config.js JWT carries role '{role}', expected 'anon'")
            except Exception:
                problems.append("config.js key looks like a JWT but could not be decoded")
        elif not value.startswith("sb_publishable_"):
            problems.append("config.js key is neither a publishable key nor an anon JWT")
    return problems


def check_no_secrets() -> list[str]:
    problems = []
    patterns = [
        (re.compile(r'"role"\\s*:\\s*"service_role"'), "a service-role JWT payload appears"),
        (re.compile(r"service_role[_-]?key\\s*[:=]\\s*['\"][^'\"]{8,}", re.I),
         "a service-role credential appears"),
        (re.compile(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"),
         "a raw JWT is committed"),
        (re.compile(r"(?i)(api[_-]?secret|password|private[_-]?key)\s*[:=]\s*['\"][^'\"]{8,}"),
         "a credential-shaped assignment appears"),
    ]
    for path in source_files():
        if path.name == "build.py" or path.suffix in {".zip", ".png", ".jpg"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern, message in patterns:
            for match in pattern.finditer(text):
                snippet = match.group(0)[:60]
                if path.name == "SECURITY.md" and "service_role" in snippet.lower():
                    continue
                problems.append(f"{path.relative_to(ROOT)}: {message} — {snippet!r}")
    return problems


def check_accessibility() -> list[str]:
    text = read(INDEX)
    problems = []
    if not re.search(r'<html lang="[a-z-]+"', text):
        problems.append("index.html has no lang attribute")
    inputs = re.findall(r"<(?:input|select|textarea)[^>]*>", text)
    for tag in inputs:
        if "id=" in tag and "aria-label" not in tag:
            ident = re.search(r'id="([^"]+)"', tag).group(1)
            if f'for="{ident}"' not in text:
                problems.append(f"form control #{ident} has no associated label")
    if 'aria-live' not in text:
        problems.append("no aria-live region for status messages")
    return problems



def check_links() -> list[str]:
    """Every relative link and asset reference must resolve to a real file."""
    problems = []
    pages = [INDEX, ROOT / "console" / "index.html"]
    for page in pages:
        if not page.exists():
            problems.append(f"missing page: {page.relative_to(ROOT)}")
            continue
        text = read(page)
        refs = re.findall(r'(?:href|src)="([^"]+)"', text)
        for ref in refs:
            if ref.startswith(("http://", "https://", "#", "mailto:", "data:", "tel:")):
                continue
            target = (page.parent / ref.split("#")[0].split("?")[0]).resolve()
            if not target.exists():
                problems.append(f"{page.relative_to(ROOT)} links to a missing file: {ref}")
    return problems


def check_console() -> list[str]:
    """The console is a view inside index.html, not a page of its own."""
    text = read(INDEX)
    problems = []
    for script in ("config.js", "resources.js", "console.js", "portal.js"):
        if script not in text:
            problems.append(f"the page does not load {script}")
    for marker, label in (
        ('id="signin-form"', "sign-in form"),
        ('id="record-form"', "record form"),
        ('id="console-view"', "console view"),
        ('id="campus-switch"', "campus switcher"),
    ):
        if marker not in text:
            problems.append(f"the page has no {label}")

    for asset in ("manifest.webmanifest", "sw.js"):
        if not (ROOT / asset).exists():
            problems.append(f"{asset} is missing — the site is not installable")

    stub = ROOT / "console" / "index.html"
    if stub.exists() and "index.html#console" not in read(stub):
        problems.append("console/index.html should redirect to the merged page")
    return problems



# Pictographic emoji only. Dingbats such as the gold star that decorates a section
# label are typography: they render as text in every font stack we use.
EMOJI = re.compile(
    "[" "\U0001F000-\U0001FAFF" "\U0001F1E6-\U0001F1FF" "\uFE0F" "]",
    re.UNICODE,
)


def check_no_emoji() -> list[str]:
    """Icons come from the SVG sprite; an emoji in markup renders differently everywhere."""
    problems = []
    for page in (INDEX, ROOT / "console" / "index.html"):
        if not page.exists():
            continue
        for number, line in enumerate(read(page).splitlines(), 1):
            for match in EMOJI.finditer(line):
                problems.append(f"{page.name}:{number} emoji {match.group(0)!r} in markup")
    return problems


def check_sprite_id() -> list[str]:
    text = read(INDEX)
    if 'id="sprite-defs"' not in text:
        return ['the sprite <defs> has no id="sprite-defs" — the console cannot reuse it']
    return []


CHECKS = [
    ("assets", "every referenced asset exists", check_assets),
    ("icons", "every icon reference resolves to the sprite", check_icons),
    ("inline", "no inline <style> or <script>", check_no_inline_code),
    ("structure", "required sections and scripts are present", check_structure),
    ("demo", "no hard-coded demo content", check_no_demo_data),
    ("config", "publishable key only, valid URL", check_config),
    ("secrets", "no secrets committed", check_no_secrets),
    ("a11y", "labels, lang and live regions", check_accessibility),
    ("links", "every internal link resolves", check_links),
    ("console", "console shell is wired to its scripts", check_console),
    ("emoji", "no emoji left in markup", check_no_emoji),
    ("sprite", "sprite is reusable by the console", check_sprite_id),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the EduSphere site")
    parser.add_argument("--list", action="store_true", help="list the checks and exit")
    parser.add_argument("--check", action="store_true",
                        help="run the checks (this is the default and only mode)")
    args = parser.parse_args()

    if args.list:
        for key, description, _ in CHECKS:
            print(f"  {key:10} {description}")
        return 0

    failed = 0
    for key, description, fn in CHECKS:
        try:
            problems = fn()
        except Exception as error:  # a crashing check is a failing check
            problems = [f"check crashed: {error}"]
        if problems:
            failed += 1
            print(f"  ✗ {key:10} {description}")
            for problem in problems[:8]:
                print(f"      - {problem}")
        else:
            print(f"  ✓ {key:10} {description}")

    print()
    if failed:
        print(f"{failed} check(s) failed — do not deploy.")
        return 1
    print(f"all {len(CHECKS)} checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
