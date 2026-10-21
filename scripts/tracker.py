#!/usr/bin/env python3
"""Progress tracker for the 100 Days of AI Engineering repository.

Standard library only. Run from anywhere inside the repo:

    python scripts/tracker.py status            # where am I?
    python scripts/tracker.py new 1             # create today's folder from the template
    python scripts/tracker.py done 1 --post URL # mark a day done after publishing the post
    python scripts/tracker.py answer 1 2 5-9    # mark interview questions as answered
    python scripts/tracker.py sync              # regenerate PROGRESS.md, README block, module pages
    python scripts/tracker.py sync --check      # exit 1 if generated files are out of date (CI)

Source of truth:
    data/roadmap.json   day -> module/unit mapping (do not edit casually)
    data/progress.json  status per day (edited by this script)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROADMAP_FILE = ROOT / "data" / "roadmap.json"
PROGRESS_FILE = ROOT / "data" / "progress.json"
TEMPLATE_DIR = ROOT / "templates" / "day"
README_FILE = ROOT / "README.md"
PROGRESS_MD = ROOT / "PROGRESS.md"
INTERVIEW_FILE = ROOT / "data" / "interview.json"
INTERVIEW_MD = ROOT / "INTERVIEW_PREP.md"
MODULES_DIR = ROOT / "modules"

BLOCK_START = "<!-- PROGRESS:START -->"
BLOCK_END = "<!-- PROGRESS:END -->"
IV_START = "<!-- INTERVIEW:START -->"
IV_END = "<!-- INTERVIEW:END -->"
TOTAL_DAYS = 100
ICON = {"todo": "⬜", "in_progress": "🟡", "done": "✅"}
LABEL = {"todo": "Not started", "in_progress": "In progress", "done": "Done"}


# --------------------------------------------------------------------------
# Loading and validation
# --------------------------------------------------------------------------
@dataclass
class Day:
    number: int
    module: dict
    units: list  # [(unit_dict, part_no, part_total), ...]

    @property
    def title(self) -> str:
        if len(self.units) == 1:
            unit, part, total = self.units[0]
            return unit["title"] + (f" (Part {part} of {total})" if total > 1 else "")
        return " + ".join(u["title"] for u, _, _ in self.units)

    @property
    def unit_ids(self) -> str:
        return " + ".join(u["unit"] for u, _, _ in self.units)

    @property
    def part_label(self) -> str:
        return self.units[0][0].get("part", "")

    @property
    def folder_prefix(self) -> str:
        return f"day-{self.number:03d}"

    @property
    def module_dir(self) -> Path:
        return MODULES_DIR / f"{self.module['id']:02d}-{self.module['slug']}"

    @property
    def folder_name(self) -> str:
        return f"{self.folder_prefix}-{slugify(self.title)}"

    def existing_folder(self) -> Path | None:
        if not self.module_dir.exists():
            return None
        matches = sorted(self.module_dir.glob(f"{self.folder_prefix}-*"))
        return matches[0] if matches else None


def slugify(text: str, max_len: int = 48) -> str:
    text = text.lower().replace("'", "")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    if len(text) > max_len:
        text = text[:max_len].rsplit("-", 1)[0]
    return text


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_roadmap() -> tuple[list[dict], dict[int, Day]]:
    data = json.loads(ROADMAP_FILE.read_text(encoding="utf-8"))
    modules = {m["id"]: m for m in data["modules"]}
    days: dict[int, Day] = {}
    for unit in data["units"]:
        module = modules[unit["module"]]
        first, last = unit["days"]
        lo, hi = module["days"]
        if not (lo <= first <= last <= hi):
            fail(f"unit {unit['unit']} days {first}-{last} fall outside module {module['id']} ({lo}-{hi})")
        total = last - first + 1
        for d in range(first, last + 1):
            day = days.setdefault(d, Day(d, module, []))
            day.units.append((unit, d - first + 1, total))
    missing = [d for d in range(1, TOTAL_DAYS + 1) if d not in days]
    extra = [d for d in days if d < 1 or d > TOTAL_DAYS]
    if missing or extra:
        fail(f"roadmap.json must cover days 1-{TOTAL_DAYS}; missing={missing} extra={extra}")
    return data["modules"], days


def load_progress() -> dict[str, dict]:
    if not PROGRESS_FILE.exists():
        return {}
    return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))


def save_progress(progress: dict[str, dict]) -> None:
    ordered = {k: progress[k] for k in sorted(progress, key=int)}
    PROGRESS_FILE.write_text(json.dumps(ordered, indent=2) + "\n", encoding="utf-8")


def status_of(progress: dict, day: int) -> str:
    return progress.get(str(day), {}).get("status", "todo")


# --------------------------------------------------------------------------
# Rendering helpers
# --------------------------------------------------------------------------
def rel(path: Path, base: Path) -> str:
    return Path(os.path.relpath(path, base)).as_posix()


def post_cell(entry: dict) -> str:
    return f"[post]({entry['post']})" if entry.get("post") else ""


def render_progress_md(modules, days, progress) -> str:
    done = sum(1 for d in days if status_of(progress, d) == "done")
    lines = [
        "# Progress Tracker",
        "",
        "> Generated by `python scripts/tracker.py sync`. Do not edit by hand.",
        "",
        f"**{done} of {TOTAL_DAYS} days complete.**",
        "",
        "| Day | Module | Unit | Topic | Status | Completed | Post |",
        "| --: | ------ | ---- | ----- | ------ | --------- | ---- |",
    ]
    for n in range(1, TOTAL_DAYS + 1):
        day = days[n]
        entry = progress.get(str(n), {})
        status = status_of(progress, n)
        folder = day.existing_folder()
        topic = day.title
        if folder is not None:
            topic = f"[{topic}]({rel(folder, ROOT)}/)"
        completed = entry.get("date", "") if status == "done" else ""
        lines.append(
            f"| {n} | M{day.module['id']} | {day.unit_ids} | {topic} | "
            f"{ICON[status]} {LABEL[status]} | {completed} | {post_cell(entry)} |"
        )
    return "\n".join(lines) + "\n"


def render_readme_block(modules, days, progress) -> str:
    done = sum(1 for d in days if status_of(progress, d) == "done")
    active = sum(1 for d in days if status_of(progress, d) == "in_progress")
    filled = done * 20 // TOTAL_DAYS
    bar = "█" * filled + "░" * (20 - filled)
    lines = [
        BLOCK_START,
        f"![Progress](https://img.shields.io/badge/progress-{done}%2F{TOTAL_DAYS}-bef23c?labelColor=14201a)",
        "",
        f"`{bar}` **{done} / {TOTAL_DAYS} days complete**"
        + (f" · {active} in progress" if active else ""),
        "",
        "| Module | Days | Complete | Page |",
        "| ------ | ---- | -------- | ---- |",
    ]
    for m in modules:
        lo, hi = m["days"]
        n_done = sum(1 for d in range(lo, hi + 1) if status_of(progress, d) == "done")
        page = f"modules/{m['id']:02d}-{m['slug']}/README.md"
        lines.append(f"| {m['id']}. {m['title']} | {lo}–{hi} | {n_done}/{hi - lo + 1} | [Open]({page}) |")
    lines += ["", "Full day-by-day table: [PROGRESS.md](PROGRESS.md)", BLOCK_END]
    return "\n".join(lines)


def render_module_readme(module, days, progress) -> str:
    lo, hi = module["days"]
    n_done = sum(1 for d in range(lo, hi + 1) if status_of(progress, d) == "done")
    lines = [
        f"# Module {module['id']}: {module['title']}",
        "",
        f"Days {lo}–{hi} · {n_done}/{hi - lo + 1} days complete",
        "",
        module["goal"],
        "",
        "> Generated by `python scripts/tracker.py sync`. Do not edit by hand.",
        "",
    ]
    current_part = None
    table_header = [
        "| Day | Unit | Topic | Status | Post |",
        "| --: | ---- | ----- | ------ | ---- |",
    ]
    in_table = False
    for n in range(lo, hi + 1):
        day = days[n]
        part = day.part_label
        if part and part != current_part:
            if lines[-1] != "":
                lines.append("")
            lines += [f"### {part}", ""]
            in_table = False
        current_part = part or current_part
        if not in_table:
            lines += table_header
            in_table = True
        entry = progress.get(str(n), {})
        status = status_of(progress, n)
        folder = day.existing_folder()
        topic = day.title
        if folder is not None:
            topic = f"[{topic}]({folder.name}/)"
        lines.append(f"| {n} | {day.unit_ids} | {topic} | {ICON[status]} {LABEL[status]} | {post_cell(entry)} |")
    lines += ["", "[← Back to the full tracker](../../PROGRESS.md)"]
    return "\n".join(lines) + "\n"


def load_interview() -> dict:
    return json.loads(INTERVIEW_FILE.read_text(encoding="utf-8"))


def render_interview_block() -> str:
    data = load_interview()
    answered = set(data["answered"])
    lines = [
        IV_START,
        f"**{len(answered)} of 100 questions answered.**",
        "",
        "| Group | Questions | Answered |",
        "| ----- | --------- | -------- |",
    ]
    for g in data["groups"]:
        total = g["to"] - g["from"] + 1
        n = sum(1 for q in range(g["from"], g["to"] + 1) if q in answered)
        lines.append(f"| {g['label']} | {g['from']}–{g['to']} | {n}/{total} |")
    lines.append(IV_END)
    return "\n".join(lines)


# --------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------
def write_if_changed(path: Path, content: str, check: bool, changed: list[Path]) -> None:
    existing = path.read_text(encoding="utf-8") if path.exists() else None
    if existing != content:
        changed.append(path)
        if not check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")


def sync(check: bool = False) -> int:
    modules, days = load_roadmap()
    progress = load_progress()
    changed: list[Path] = []

    write_if_changed(PROGRESS_MD, render_progress_md(modules, days, progress), check, changed)
    for module in modules:
        path = MODULES_DIR / f"{module['id']:02d}-{module['slug']}" / "README.md"
        write_if_changed(path, render_module_readme(module, days, progress), check, changed)

    readme = README_FILE.read_text(encoding="utf-8")
    if BLOCK_START not in readme or BLOCK_END not in readme:
        fail(f"README.md must contain {BLOCK_START} and {BLOCK_END}")
    pattern = re.compile(re.escape(BLOCK_START) + r".*?" + re.escape(BLOCK_END), re.DOTALL)
    new_readme = pattern.sub(lambda _: render_readme_block(modules, days, progress), readme)
    write_if_changed(README_FILE, new_readme, check, changed)

    iv_text = INTERVIEW_MD.read_text(encoding="utf-8")
    if IV_START not in iv_text or IV_END not in iv_text:
        fail(f"INTERVIEW_PREP.md must contain {IV_START} and {IV_END}")
    iv_pattern = re.compile(re.escape(IV_START) + r".*?" + re.escape(IV_END), re.DOTALL)
    write_if_changed(INTERVIEW_MD, iv_pattern.sub(lambda _: render_interview_block(), iv_text), check, changed)

    if check:
        if changed:
            print("Generated files are out of date. Run: python scripts/tracker.py sync")
            for p in changed:
                print(f"  - {p.relative_to(ROOT)}")
            return 1
        print("Generated files are up to date.")
        return 0
    print(f"Synced ({len(changed)} file(s) updated).")
    return 0


def parse_day(value: str) -> int:
    try:
        n = int(value)
    except ValueError:
        fail(f"day must be a number between 1 and {TOTAL_DAYS}")
    if not 1 <= n <= TOTAL_DAYS:
        fail(f"day must be between 1 and {TOTAL_DAYS}")
    return n


def parse_date(value: str | None) -> str:
    if not value:
        return date.today().isoformat()
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        fail("--date must look like 2026-10-19")


def cmd_new(args) -> int:
    modules, days = load_roadmap()
    progress = load_progress()
    n = parse_day(args.day)
    day = days[n]

    if n > 1 and status_of(progress, n - 1) != "done":
        print(f"note: Day {n - 1} is not marked done. The roadmap is meant to be followed in order.")
    if day.existing_folder() is not None:
        fail(f"{day.existing_folder().relative_to(ROOT)} already exists")

    folder = day.module_dir / day.folder_name
    folder.mkdir(parents=True)
    started = parse_date(args.date)
    values = {
        "day": str(n),
        "day_title": day.title,
        "module_num": str(day.module["id"]),
        "module_title": day.module["title"],
        "unit_ids": day.unit_ids,
        "date": started,
        "day_path": folder.relative_to(ROOT).as_posix(),
    }
    for template in sorted(TEMPLATE_DIR.iterdir()):
        text = template.read_text(encoding="utf-8")
        for key, value in values.items():
            text = text.replace("{{" + key + "}}", value)
        (folder / template.name).write_text(text, encoding="utf-8")
    for sub in ("experiments", "resources"):
        (folder / sub).mkdir()
        (folder / sub / ".gitkeep").write_text("", encoding="utf-8")

    progress[str(n)] = {"status": "in_progress", "started": started, "folder": folder.relative_to(ROOT).as_posix()}
    save_progress(progress)
    sync()
    print(f"Created {folder.relative_to(ROOT)}/")
    return 0


def cmd_done(args) -> int:
    modules, days = load_roadmap()
    progress = load_progress()
    n = parse_day(args.day)
    day = days[n]
    if day.existing_folder() is None:
        fail(f"no folder for Day {n} yet. Run: python scripts/tracker.py new {n}")
    if args.post and not args.post.startswith(("http://", "https://")):
        fail("--post must be a full URL")
    entry = progress.get(str(n), {})
    entry["status"] = "done"
    entry["date"] = parse_date(args.date)
    if args.post:
        entry["post"] = args.post
    progress[str(n)] = entry
    save_progress(progress)
    sync()
    print(f"Day {n} marked done.")
    return 0


def cmd_status(_args) -> int:
    modules, days = load_roadmap()
    progress = load_progress()
    done = [d for d in days if status_of(progress, d) == "done"]
    active = [d for d in days if status_of(progress, d) == "in_progress"]
    print(f"{len(done)}/{TOTAL_DAYS} days done")
    if active:
        for d in active:
            print(f"In progress: Day {d} · {days[d].title} (Module {days[d].module['id']})")
    nxt = next((d for d in range(1, TOTAL_DAYS + 1) if status_of(progress, d) == "todo"), None)
    if nxt is not None:
        print(f"Next up:     Day {nxt} · {days[nxt].title} (Module {days[nxt].module['id']})")
    else:
        print("All 100 days complete.")
    return 0


def parse_questions(tokens: list[str]) -> set[int]:
    out: set[int] = set()
    for token in tokens:
        m = re.fullmatch(r"(\d+)(?:-(\d+))?", token)
        if not m:
            fail(f"'{token}' is not a question number or a range like 5-9")
        first, last = int(m.group(1)), int(m.group(2) or m.group(1))
        if not 1 <= first <= last <= 100:
            fail("question numbers must be between 1 and 100")
        out.update(range(first, last + 1))
    return out


def cmd_answer(args) -> int:
    iv = load_interview()
    chosen = parse_questions(args.questions)
    current = set(iv["answered"])
    current = current - chosen if args.undo else current | chosen
    iv["answered"] = sorted(current)
    INTERVIEW_FILE.write_text(json.dumps(iv, indent=2) + "\n", encoding="utf-8")
    sync()
    print(f"{len(current)} of 100 interview questions answered.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p_new = sub.add_parser("new", help="create a day folder from the template")
    p_new.add_argument("day")
    p_new.add_argument("--date", help="start date, YYYY-MM-DD (default: today)")
    p_new.set_defaults(func=cmd_new)

    p_done = sub.add_parser("done", help="mark a day done")
    p_done.add_argument("day")
    p_done.add_argument("--post", help="URL of the published LinkedIn post")
    p_done.add_argument("--date", help="completion date, YYYY-MM-DD (default: today)")
    p_done.set_defaults(func=cmd_done)

    p_sync = sub.add_parser("sync", help="regenerate PROGRESS.md, module pages and the README block")
    p_sync.add_argument("--check", action="store_true", help="fail if generated files are out of date")
    p_sync.set_defaults(func=lambda a: sync(check=a.check))

    p_answer = sub.add_parser("answer", help="mark interview questions answered, e.g. answer 1 2 5-9")
    p_answer.add_argument("questions", nargs="+")
    p_answer.add_argument("--undo", action="store_true", help="unmark them instead")
    p_answer.set_defaults(func=cmd_answer)

    p_status = sub.add_parser("status", help="show progress and the next day")
    p_status.set_defaults(func=cmd_status)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
