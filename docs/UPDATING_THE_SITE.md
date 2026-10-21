# Updating the roadmap site

The site has no database and no build step. It only displays the files in [`data/`](../data/), so updating the site means updating those files and pushing. A GitHub Actions workflow (`Deploy roadmap site`) redeploys it within about a minute of a push that touches `site/` or `data/`.

Work in one place: run `git pull` before you start and `git push` when you finish, so your laptop and GitHub never drift apart.

## 1. The daily loop (automatic)

The tracker edits the data files for you. You never type into `data/progress.json`.

| When | Command | What changes on the site |
| ---- | ------- | ------------------------ |
| Starting a day | `python scripts/tracker.py new 5` | Day 5 shows as in progress; the day folder is created from the template |
| Finishing a day | `python scripts/tracker.py done 5 --post <linkedin-post-url>` | Day 5 is marked done, the grid and module bars fill, the pace estimate updates, the post appears in the Posts tab |
| After answering interview questions | `python scripts/tracker.py answer 1-12` | The Interview tab counts them |
| Anything looks stale | `python scripts/tracker.py sync` | Regenerates `PROGRESS.md`, the README progress block and the module pages (the commands above already run it) |

Then commit and push:

```bash
git add -A
git commit -m "Day 5: <what you built>"
git push
```

## 2. Things you edit by hand (rarely)

| File | What to change | Where it shows up |
| ---- | -------------- | ----------------- |
| `data/profile.json` | `paceDaysPerWeek`, `linkedin`, `runningProject` (`name`, `domain`) | Progress tab estimate, LinkedIn links on the Posts and About tabs, Projects tab |
| `data/projects.json` | `afterDay100.picked`: the ids of the portfolio projects you choose | Projects tab |
| `data/resources.json` | A source that moved or a better one you found | Resources tab and `RESOURCES.md` |
| `data/milestones.json` | A milestone post's title or note | Posts tab |

Do not edit `data/roadmap.json` casually: it is the order of the whole path. Layout, colours and wording live in `site/`.

## 3. Check before you push

```bash
python scripts/tracker.py sync --check      # generated files are up to date
python -m http.server                       # then open http://localhost:8000/site/
```

The local preview reads `../data/`, the same files the deployed site gets.

## 4. After you push

1. Open the repository's **Actions** tab and wait for **Deploy roadmap site** and **CI** to go green.
2. Open the live site and hard-refresh (`Ctrl+Shift+R`). The loading screen plays once per browser tab session, so open a new tab to see it again, or use "Replay the intro" in the footer.

A push that only changes day notes under `modules/` does not redeploy the site, which is fine because the site does not display them. Finishing a day always touches `data/progress.json`, so it always redeploys.
