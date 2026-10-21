# Free Learning Resources

The roadmap points several modules to paid courses. This repo does not use them. Each module below is studied from free sources: lessons on the [CampusX YouTube channel](https://www.youtube.com/@campusx-official), official documentation, and free courses and talks.

**Status key:** `Covered` = a free CampusX playlist matches the module · `Partial` = a playlist covers some days · `Gap` = no matching CampusX playlist, use the other sources.

> These are starting points, mapped at playlist level. When a day starts, the exact video or doc page is checked first and recorded in that day's `README.md`. If something here has moved or changed, fix it here.

## Module 1: LLM Fundamentals (Days 1–6) · Gap

| Use for | Source |
| ------- | ------ |
| How an LLM works end to end | Andrej Karpathy's long-form LLM talks on YouTube |
| Tokens, cost, latency, context limits | Your chosen provider's docs, plus a tokenizer tool to count tokens |
| Images, audio, PDFs | Your provider's vision and document docs |
| Choosing a model | Provider model pages and a public leaderboard to shortlist; your own test questions to decide |

## Module 2: Building with LLM APIs (Days 7–17) · Covered

| Use for | Source |
| ------- | ------ |
| LangChain, messages, templates, streaming, structured output, tools, chains | CampusX **Generative AI using LangChain** course, plus the LangChain docs |
| Open and local models (Day 8) | Ollama docs |
| Retries, fallbacks, batching (Days 15–16) | LangChain docs |
| Tracing and cost (Day 17) | LangSmith docs (free tier) |

## Module 3: Prompt Engineering (Days 18–24) · Gap

| Use for | Source |
| ------- | ------ |
| Prompt structure, system prompts, few-shot, reasoning prompts | Your provider's prompt engineering guide (Anthropic and OpenAI both publish one) |
| Few-shot templates | LangChain docs |
| Automatic prompt improvement (Day 23) | DSPy docs |
| Prompt injection basics (Day 24) | OWASP Top 10 for LLM Applications |

## Module 4: RAG (Days 25–56) · Partial

| Days | Use for | Source |
| ---- | ------- | ------ |
| 25–36 | Build a simple RAG | CampusX **RAG Playlist**, LangChain docs, pgvector docs |
| 28 | Messy document parsing | Docs for Unstructured and Docling |
| 37–44 | Advanced RAG (hybrid, rerank, query transformation, corrective and self-correcting RAG, text-to-SQL, Graph RAG) | LangChain and LangGraph docs, the original papers, free short courses (check availability) |
| 45–51 | Evals and regression tests | CampusX **LLM Evaluation** playlist, DeepEval and RAGAS docs |
| 52–56 | RAG security | OWASP Top 10 for LLM Applications; the DPDP Act summary for Day 55 |

## Module 5: Agents (Days 57–83) · Partial

| Days | Use for | Source |
| ---- | ------- | ------ |
| 57–63 | Agent loop, LangGraph, tools, planning, human approval | CampusX **Agentic AI using LangGraph** playlist, LangGraph docs |
| 64–66 | MCP fundamentals and building servers | CampusX **Model Context Protocol** playlist, official MCP docs |
| 67–68 | Memory | CampusX **Memory in LLMs** playlist, LangGraph memory docs |
| 69–71 | Context engineering | Gap: LangGraph docs, provider docs on caching, engineering blog posts |
| 72 | Harness engineering (study existing coding agents) | CampusX **Agentic Coding using Claude Code** playlist |
| 73–76 | Multi-agent systems and reliability | LangGraph multi-agent docs |
| 77–79 | Agent evals | CampusX **LLM Evaluation** playlist, LangSmith docs |
| 80–83 | Agent security, sandboxing, MCP security | Gap: OWASP LLM Top 10, MCP security guidance, sandbox tool docs |

## Module 6: Shipping to Production (Days 84–100) · Mostly gap

| Days | Use for | Source |
| ---- | ------- | ------ |
| 84 | System design | Gap: the roadmap's design questions, your own design doc |
| 85 | API service | CampusX **FastAPI for Machine Learning** course, FastAPI docs |
| 86 | Frontend | Framework docs for the one you choose |
| 87–88 | Containers and deployment | Docker docs, your chosen host's docs (pick one with a free tier when you reach it) |
| 89 | CI for evals | GitHub Actions docs |
| 90–92 | Safe releases, monitoring | CampusX **100 Days of MLOps** playlist (partial), LangSmith docs |
| 93–94 | Caching, cost, gateways | Provider caching docs; an open-source gateway such as LiteLLM |
| 95 | Serving open models | vLLM docs |
| 96–98 | Fine-tuning, LoRA, distillation | Hugging Face docs (PEFT, TRL), Unsloth notebooks |
| 99 | Incidents and runbooks | Your own runbooks; public postmortem examples |
| 100 | Whole-app security review | OWASP Top 10 for LLM Applications |

## CampusX playlists that are not part of this roadmap

These are valuable but are **not** in the 100-day path, so they are optional and never replace a roadmap day: Maths for Machine Learning, Practical Deep Learning using PyTorch, Deep Learning Optimizers, Reinforcement Learning Crash Course, ML Interview Questions, SQL Interview Questions, the Data Science Mentorship Program, podcasts and success stories.

## Rules for using resources

1. Link to resources; never re-upload videos, paid course material or books.
2. Notes are written in my own words.
3. A resource is only listed in a day's README if I actually used it.
