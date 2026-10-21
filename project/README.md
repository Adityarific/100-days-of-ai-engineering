# The Running Project

The roadmap builds on one assistant that you extend module by module. This folder is that project; day folders hold the experiments and lessons, and finished work is merged here.

## Decision needed by Day 6

| Question | Decision |
| -------- | -------- |
| Domain (who is the user, what documents do they have?) | _TBD_ |
| Document collection (30+ public or synthetic documents, license checked) | _TBD_ |
| First model and provider (free tier or local) | _TBD_ |
| Name | _TBD_ |

Rules: the domain needs real documents, real questions and a task the assistant can act on (for example, creating a request). Do not use private or personal documents, since this repo is public.

## How the project grows

| Module | What gets added |
| ------ | --------------- |
| 1 | Task definition, 10 project questions, model shortlist |
| 2 | LangChain assistant: conversation, streaming, structured output, tools, retries, tracing |
| 3 | Versioned system prompt and prompt test set |
| 4 | RAG pipeline with citations, advanced retrieval patterns, evals, regression tests, security tests |
| 5 | Agent with tools, MCP server, memory, approval gates, sandbox, agent evals and attacks |
| 6 | API, frontend, deployment, CI gate, monitoring, caching, optional fine-tune, security review |

## Target structure

```
project/
├── app/             application code
├── evals/           test sets, judges, regression runner
├── security/        attack sets and results
├── data/            documents (public or synthetic only)
└── docs/            design doc, decisions, results
```

Folders are created when the module that needs them starts.

## Status

Not started.
