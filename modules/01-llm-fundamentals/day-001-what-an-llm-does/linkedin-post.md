**Day 1/100 of AI Engineering: What an LLM Does**

One thing I learned today: an LLM predicts the next token repeatedly to generate an answer, but a fluent answer isn't necessarily a correct one.

**What I did:**
→ Studied how next-token prediction works.
→ Wrote notes on temperature, tokenization, and hallucinations.
→ Started a Python experiment to compare five responses to the same prompt at different temperature settings.

**What broke or surprised me:**
My first API experiment returned HTTP 429 (rate limit exceeded), so I couldn't yet collect reliable results.

**The number that mattered:**
5 planned runs per temperature setting. Actual output differences, token usage, cost, and latency are still pending.

Notes, code and a theory PDF for this day:
https://github.com/Adityarific/100-days-of-ai-engineering/tree/main/modules/01-llm-fundamentals/day-001-what-an-llm-does

Following the 100 Days of AI Engineering roadmap by CampusX.
Module 1 of 6: LLM Fundamentals.

#AIEngineering #LLM #100DaysOfAIEngineering