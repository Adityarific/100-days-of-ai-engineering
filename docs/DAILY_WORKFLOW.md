# Daily Workflow and Quality Bar

## The loop

| Step | What happens | Output |
| ---- | ------------ | ------ |
| 1. Start | `python scripts/tracker.py new <day>` | Day folder from the template |
| 2. Study | Free lesson + official docs for the unit | Sources linked in the day's README |
| 3. Notes | Write `notes.md` in my own words | Theory notes, then `theory.pdf` |
| 4. Build | Run the unit's experiment | Code in `experiments/`, numbers in the README |
| 5. Reflect | Record one failure or surprise | "What broke" section |
| 6. Post | Draft `linkedin-post.md`, review, publish | Post URL |
| 7. Close | `python scripts/tracker.py done <day> --post <url>` | Tracker and README updated |

## Pace rules

- The **order** of the roadmap never changes. The **calendar** can stretch.
- "Day N" counts completed roadmap days, not calendar days. Missing a calendar day never creates a gap in the numbering.
- A day is done only when the post is published and the repo is pushed.
- Every seventh completed day, take a review session (no new unit): re-run old experiments from a clean environment, fix broken links, and answer the module's interview questions so far.
- If a day takes two sittings, split the work, post once, and keep the day number.

## Quality bar for a day

A day is publishable when all of these are true:

- [ ] The experiment runs from a clean environment with the documented steps.
- [ ] Results contain real numbers, not adjectives.
- [ ] At least one failure or surprise is described honestly.
- [ ] Notes are in my own words; sources are linked, not pasted.
- [ ] No secrets, personal data or copied course material in the folder.
- [ ] I could explain the day's code in an interview without opening it.

## LinkedIn post rules

1. Lead with a concrete finding and a number.
2. Share only what I actually ran.
3. Include one failure or surprise.
4. One link: the day's folder in this repo.
5. Credit the roadmap and tag its creator.
6. Under about 200 words, in my own voice.
7. Reply to every comment in the first day; useful questions become tomorrow's test cases.

## Milestone posts (not daily posts)

| After day | Post |
| --------- | ---- |
| 6, 17, 24, 56, 83, 100 | Module recap: what I built, what the numbers say, what's next |
| 36 | First RAG pipeline demo |
| 51 | "I can't make this app worse without CI noticing": regression suite |
| 83 | Red-team results: attacks tried, attacks blocked |
| 88 | The app is live: link + 2 minute demo video |
| 100 | Full retrospective with total cost, final eval scores and what I'd change |

## Release tags

Tag the repo when a module is complete: `module-1-complete` … `module-6-complete`, then `v1.0` at Day 100. Tags make the progress visible on the Releases page.
