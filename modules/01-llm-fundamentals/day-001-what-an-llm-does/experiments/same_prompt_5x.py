#!/usr/bin/env python3
"""Day 1 experiment: send the same prompt several times and see how the answers vary.

Works with any OpenAI-compatible chat endpoint (a local Ollama server, Groq, Gemini's
OpenAI-compatible endpoint, OpenAI, OpenRouter, ...). Standard library only, so there is
nothing to install.

Configuration comes from environment variables or a `.env` file in the repo root.
Never put a key in this file.

    LLM_BASE_URL   Ollama (local, free):  http://localhost:11434/v1
                   Groq:                  https://api.groq.com/openai/v1
                   Others: use the "OpenAI-compatible" base URL from your provider's docs
    LLM_MODEL      the model name your provider lists, for example llama3.2 for Ollama
    LLM_API_KEY    leave empty for a local server

Examples (run from the repo root):

    python modules/01-llm-fundamentals/day-001-what-an-llm-does/experiments/same_prompt_5x.py
    python ...same_prompt_5x.py --temperature 0
    python ...same_prompt_5x.py --prompt "Your own question" --runs 5

Each run writes results_t<temperature>.json next to this script: the raw answers, tokens
and latency, so the numbers in the README can be checked.
"""

import argparse
import difflib
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[3]

DEFAULT_PROMPT = (
    "Suggest a name for a coffee shop run entirely by robots, "
    "and explain the choice in one sentence."
)


def load_dotenv(path: Path) -> None:
    """Tiny .env reader so no extra package is needed. Existing variables win."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def ask(base_url: str, model: str, api_key: str, prompt: str, temperature: float, max_tokens: int) -> dict:
    """One request. Returns the answer text, token counts and wall-clock seconds."""
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
    ).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(f"{base_url.rstrip('/')}/chat/completions", data=body, headers=headers)

    started = time.perf_counter()
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    seconds = time.perf_counter() - started

    usage = payload.get("usage") or {}
    return {
        "text": payload["choices"][0]["message"]["content"].strip(),
        "prompt_tokens": usage.get("prompt_tokens"),
        "completion_tokens": usage.get("completion_tokens"),
        "seconds": round(seconds, 3),
    }


def normalise(text: str) -> str:
    return " ".join(text.lower().split())


def mean_similarity(texts: list) -> float:
    """Average pairwise similarity, 1.0 = identical answers, near 0 = nothing in common."""
    ratios = [
        difflib.SequenceMatcher(None, a, b).ratio()
        for i, a in enumerate(texts)
        for b in texts[i + 1 :]
    ]
    return round(statistics.mean(ratios), 3) if ratios else 1.0


def main() -> int:
    parser = argparse.ArgumentParser(description="Send the same prompt N times and compare the answers.")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--max-tokens", type=int, default=200)
    parser.add_argument("--out", help="where to write the JSON results (default: next to this script)")
    args = parser.parse_args()

    if args.runs < 1:
        parser.error("--runs must be at least 1")

    load_dotenv(REPO_ROOT / ".env")
    base_url = os.environ.get("LLM_BASE_URL", "").strip()
    model = os.environ.get("LLM_MODEL", "").strip()
    api_key = os.environ.get("LLM_API_KEY", "").strip()
    if not base_url or not model:
        print(
            "Set LLM_BASE_URL and LLM_MODEL (and LLM_API_KEY if your provider needs one) "
            "in your environment or in .env. See the top of this file for examples.",
            file=sys.stderr,
        )
        return 2

    runs = []
    for i in range(1, args.runs + 1):
        try:
            result = ask(base_url, model, api_key, args.prompt, args.temperature, args.max_tokens)
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", errors="replace")[:300]
            print(f"Run {i}: the server answered HTTP {err.code}. {detail}", file=sys.stderr)
            return 1
        except (urllib.error.URLError, TimeoutError) as err:
            print(f"Run {i}: could not reach {base_url} ({err}). Is the server running?", file=sys.stderr)
            return 1
        result["run"] = i
        runs.append(result)
        print(f"\n--- Run {i}  ({result['seconds']}s, "
              f"{result['prompt_tokens']} in / {result['completion_tokens']} out tokens)")
        print(result["text"])

    texts = [r["text"] for r in runs]
    seconds = [r["seconds"] for r in runs]
    summary = {
        "runs": len(runs),
        "distinct_answers": len({normalise(t) for t in texts}),
        "mean_pairwise_similarity": mean_similarity([normalise(t) for t in texts]),
        "mean_seconds": round(statistics.mean(seconds), 3),
        "total_prompt_tokens": sum(r["prompt_tokens"] or 0 for r in runs),
        "total_completion_tokens": sum(r["completion_tokens"] or 0 for r in runs),
    }

    out_path = Path(args.out) if args.out else HERE / f"results_t{args.temperature:g}.json"
    out_path.write_text(
        json.dumps(
            {
                "when": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "model": model,
                "temperature": args.temperature,
                "prompt": args.prompt,
                "summary": summary,
                "runs": runs,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print("\n=== Summary")
    print(f"model {model} | temperature {args.temperature:g} | {summary['runs']} runs")
    print(f"distinct answers: {summary['distinct_answers']} of {summary['runs']}")
    print(f"mean pairwise similarity: {summary['mean_pairwise_similarity']} (1.0 = identical)")
    print(f"mean latency: {summary['mean_seconds']}s")
    print(f"tokens: {summary['total_prompt_tokens']} in / {summary['total_completion_tokens']} out")
    print(f"saved: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
