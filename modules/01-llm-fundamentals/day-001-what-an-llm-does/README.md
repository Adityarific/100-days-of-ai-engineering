# Day 1 · What an LLM Does

**Module 1: LLM Fundamentals** · Unit 1.1 · Started 2026-10-21

## Goal

Explain in two sentences how an LLM produces an answer and why it can sound confident while being wrong, and back it with what actually happens when I send the same prompt five times.

## What I studied

Andrej Karpathy — Intro to Large Language Models (YouTube).
https://huggingface.co/learn/llm-course/chapter1/1?utm_source=chatgpt.com
https://platform.openai.com/docs/concepts?utm_source=chatgpt.com

## What I built

[`experiments/same_prompt_5x.py`](experiments/same_prompt_5x.py) sends one prompt to a chat model five times and records every answer, the token counts and the latency, first at temperature 1 and then at temperature 0. Raw results are saved next to the script as `results_t1.json` and `results_t0.json`.


## What broke or surprised me

My first experiment attempt returned HTTP 429 (rate limit exceeded). This reminded me that using an API involves practical constraints, not just writing code. I still need a successful run to compare the actual outputs and measurements.

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
