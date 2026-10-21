# Day 1 · What an LLM Does

**Module 1: LLM Fundamentals** · Unit 1.1 · Started 2026-10-21

## Goal

Explain in two sentences how an LLM produces an answer and why it can sound confident while being wrong, and back it with what actually happens when I send the same prompt five times.

## What I studied

<!-- Link every source you actually used. Prefer official docs and free YouTube lessons. -->

- 

## What I built

[`experiments/same_prompt_5x.py`](experiments/same_prompt_5x.py) sends one prompt to a chat model five times and records every answer, the token counts and the latency, first at temperature 1 and then at temperature 0. Raw results are saved next to the script as `results_t1.json` and `results_t0.json`.

## Results

<!-- Real numbers from today's experiment. Delete rows you don't need. -->

| Setup | Result | Tokens (in / out) | Cost | Latency |
| ----- | ------ | ----------------- | ---- | ------- |
| 5 runs, temperature 1 | _distinct answers: ? of 5_ | | | |
| 5 runs, temperature 0 | _distinct answers: ? of 5_ | | | |

## What broke or surprised me

<!-- At least one honest failure. This is the most useful part of the page. -->

## Interview questions this day touches

<!-- Question numbers from the roadmap's interview prep, answered in your own words in INTERVIEW_PREP.md -->

## Files

- [`notes.md`](notes.md) — theory notes in my own words
- `theory.pdf` — printable version of the notes
- [`linkedin-post.md`](linkedin-post.md) — the post for today
- `experiments/` — code and outputs
- `resources/` — small supporting files only (no copied course material)

## Day checklist

- [ ] Studied the topic and wrote `notes.md` in my own words
- [ ] Ran the experiment and recorded real numbers above
- [ ] Code runs from a clean environment
- [ ] No API keys, personal data or copied course material in this folder
- [ ] `theory.pdf` generated from the notes
- [ ] LinkedIn post drafted and reviewed
- [ ] Post published, then `python scripts/tracker.py done 1 --post <url>`
