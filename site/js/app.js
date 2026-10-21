// 100 Days of AI Engineering: roadmap app.
// Plain ES modules, no build step. Everything shown comes from data/*.json,
// so the site updates whenever scripts/tracker.py updates data/progress.json.

const TOTAL = 100;
const STATUS_LABEL = { todo: "Not started", in_progress: "In progress", done: "Done" };
const COVERAGE_LABEL = { covered: "Covered by CampusX", partial: "Partly covered", gap: "Needs other sources" };

const state = {
  profile: null, roadmap: null, progress: {}, resources: null, projects: null, interview: null,
  days: [],
  pace: 5,
};
const filters = { status: "all", q: "" };

// ---------------------------------------------------------------- helpers
const $ = (sel, root = document) => root.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function h(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  const add = (kid) => {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  };
  kids.forEach(add);
  return node;
}

const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
const fmtDate = (iso) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(
    iso instanceof Date ? iso : new Date(`${iso}T00:00:00`)
  );

// On GitHub Pages the workflow puts data/ next to index.html. Locally the site
// is opened at /site/ and data/ sits one level up, so try that first there.
const DATA_BASES = location.pathname.includes("/site/") ? ["../data/", "data/"] : ["data/", "../data/"];

async function fetchJSON(name) {
  for (const base of DATA_BASES) {
    try {
      const res = await fetch(base + name, { cache: "no-cache" });
      if (res.ok) return await res.json();
    } catch (_) { /* try the next location */ }
  }
  throw new Error(`Could not load ${name}`);
}

// ---------------------------------------------------------------- data
function buildDays(roadmap) {
  const byDay = {};
  for (const unit of roadmap.units) {
    const [first, last] = unit.days;
    const total = last - first + 1;
    for (let d = first; d <= last; d++) {
      if (!byDay[d]) byDay[d] = { n: d, module: roadmap.modules.find((m) => m.id === unit.module), units: [] };
      byDay[d].units.push({ ...unit, partNo: d - first + 1, partTotal: total });
    }
  }
  return Array.from({ length: TOTAL }, (_, i) => {
    const day = byDay[i + 1];
    const [only] = day.units;
    day.title = day.units.length === 1
      ? only.title + (only.partTotal > 1 ? ` (Part ${only.partNo} of ${only.partTotal})` : "")
      : day.units.map((u) => u.title).join(" + ");
    day.unitIds = day.units.map((u) => u.unit).join(" + ");
    day.part = only.part || "";
    return day;
  });
}

const entryOf = (n) => state.progress[String(n)] || {};
const statusOf = (n) => entryOf(n).status || "todo";
const doneCount = () => state.days.filter((d) => statusOf(d.n) === "done").length;
const currentDay = () =>
  state.days.find((d) => statusOf(d.n) === "in_progress") || state.days.find((d) => statusOf(d.n) === "todo") || null;
const moduleDays = (m) => state.days.filter((d) => d.module.id === m.id);
const moduleDone = (m) => moduleDays(m).filter((d) => statusOf(d.n) === "done").length;
const repoUrl = () => `https://github.com/${state.profile.github}/${state.profile.repo}`;

function loadPace() {
  let saved = null;
  try { saved = Number(localStorage.getItem("pace")); } catch (_) { /* storage unavailable */ }
  state.pace = saved >= 1 && saved <= 7 ? saved : state.profile.paceDaysPerWeek || 5;
}
function savePace(value) {
  state.pace = Math.min(7, Math.max(1, value));
  try { localStorage.setItem("pace", String(state.pace)); } catch (_) { /* storage unavailable */ }
}
function finishDate() {
  const remaining = TOTAL - doneCount();
  if (remaining <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil((remaining / state.pace) * 7));
  return date;
}

// ---------------------------------------------------------------- shared pieces
function buildGrid() {
  const done = doneCount();
  const grid = h("div", {
    class: "grid", role: "img",
    "aria-label": `Progress grid: ${done} of ${TOTAL} days done. Each square is one day.`,
  });
  for (const day of state.days) {
    const st = statusOf(day.n);
    const cls = "cell" + (st === "done" ? " cell--done" : st === "in_progress" ? " cell--doing" : "");
    grid.append(h("a", {
      class: cls, href: `#/roadmap/${day.module.id}/${day.n}`, tabindex: "-1",
      title: `Day ${day.n}: ${day.title} (${STATUS_LABEL[st]})`, text: String(day.n),
    }));
  }
  return grid;
}

function legend() {
  return h("p", { class: "legend" },
    h("span", {}, h("i", { class: "swatch swatch--done" }), "Done"),
    h("span", {}, h("i", { class: "swatch swatch--doing" }), "In progress"),
    h("span", {}, h("i", { class: "swatch" }), "Not started"));
}

const chip = (st) =>
  h("span", { class: `chip${st === "done" ? " chip--done" : st === "in_progress" ? " chip--doing" : ""}`, text: STATUS_LABEL[st] });

function pageHead(title, sub) {
  return h("div", { class: "wrap page-head" }, h("h1", { tabindex: "-1", text: title }), sub ? h("p", { text: sub }) : null);
}

function dayRange(days) {
  return days[0] === days[1] ? `Day ${days[0]}` : `Days ${days[0]} to ${days[1]}`;
}

// ---------------------------------------------------------------- views
function viewHome() {
  const done = doneCount();
  const doing = state.days.find((d) => statusOf(d.n) === "in_progress");
  const next = currentDay();

  let statusText = `${done} of ${TOTAL} days done.`;
  if (!next) statusText = `All ${TOTAL} days are done.`;
  else if (doing) statusText += ` Working on Day ${doing.n}: ${doing.title}.`;
  else statusText += ` Day ${next.n} is next: ${next.title}.`;

  const hero = h("section", { class: "hero" }, h("div", { class: "wrap hero__cols" },
    h("div", {},
      h("h1", { tabindex: "-1", text: `${state.profile.name}'s 100 days of AI engineering, built in public.` }),
      h("p", { class: "lede", text: "I follow the CampusX roadmap in order, run one experiment a day, and write down what broke." }),
      h("div", { class: "btn-row" },
        h("a", { class: "btn btn--primary", href: "#/roadmap", text: "Open the roadmap" }),
        next ? h("a", { class: "btn btn--ghost", href: `#/roadmap/${next.module.id}/${next.n}`, text: doing ? `Continue Day ${next.n}` : `See Day ${next.n}` }) : null)),
    h("div", {}, buildGrid(), legend(), h("p", { class: "hero__status", text: statusText }))));

  // The bar is decorative (width is days, fill is done); the list under it carries the links.
  const modbar = h("div", {},
    h("ol", { class: "modbar", "aria-hidden": "true" }, state.roadmap.modules.map((m) => {
      const total = moduleDays(m).length;
      return h("li", { class: "modbar__seg", style: `flex: ${total} 1 0` },
        h("div", { class: "modbar__track" },
          h("div", { class: "modbar__fill", style: `width: ${(moduleDone(m) / total) * 100}%` }),
          h("span", { class: "modbar__n", text: String(m.id) })));
    })),
    h("ul", { class: "modlist" }, state.roadmap.modules.map((m) => h("li", {},
      h("a", { href: `#/roadmap/${m.id}` },
        h("strong", { text: `${m.id}. ${m.title}` }),
        h("small", { text: `${dayRange(m.days)}. ${moduleDone(m)} of ${moduleDays(m).length} done.` }))))));

  const steps = [
    ["Study", "A free lesson and the official docs for that day's unit."],
    ["Write notes", "In my own words, then exported as a PDF."],
    ["Run the experiment", "Real numbers: tokens, cost, speed, accuracy."],
    ["Record one failure", "What broke or surprised me, written down honestly."],
    ["Post and push", "One LinkedIn post, then the day goes into the repo."],
  ];

  const posts = state.days
    .filter((d) => safeUrl(entryOf(d.n).post))
    .sort((a, b) => (entryOf(b.n).date || "").localeCompare(entryOf(a.n).date || "") || b.n - a.n)
    .slice(0, 5);

  return h("div", {},
    hero,
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "Six modules, in order" }),
      h("p", { class: "muted", text: "Each segment is as wide as the number of days it takes. The green part is what I've finished." }),
      h("div", { style: "margin-top:22px" }, modbar))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "How each day works" }),
      h("ol", { class: "steps" }, steps.map(([t, d]) => h("li", {}, h("h3", { text: t }), h("p", { text: d })))))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "Latest posts" }),
      posts.length
        ? h("ul", { class: "postlist" }, posts.map((d) => h("li", {},
            h("a", { href: safeUrl(entryOf(d.n).post), rel: "noopener", text: `Day ${d.n} post` }),
            h("span", { text: d.title }),
            h("span", { class: "muted", text: entryOf(d.n).date ? fmtDate(entryOf(d.n).date) : "" }))))
        : h("p", { class: "muted", text: "No posts yet. The first one goes up when Day 1 is done." }),
      h("p", { style: "margin-top:18px" }, h("a", { href: "#/posts", text: "See every post and what is planned" })))));
}

function viewRoadmap([mArg, dArg]) {
  const fallback = currentDay();
  const modId = Number(mArg) || (fallback ? fallback.module.id : 1);
  const mod = state.roadmap.modules.find((m) => m.id === modId) || state.roadmap.modules[0];
  const openDay = Number(dArg) || null;

  const rail = h("nav", { class: "rail", "aria-label": "Modules" },
    h("h2", { text: "Modules" }),
    h("ul", {}, state.roadmap.modules.map((m) => h("li", {},
      h("a", { href: `#/roadmap/${m.id}`, "aria-current": m.id === mod.id ? "true" : null },
        `${m.id}. ${m.title}`, h("small", { text: `${moduleDone(m)} of ${moduleDays(m).length} days done` }))))));

  const total = moduleDays(mod).length;
  const head = h("div", { class: "mod-head" },
    h("h1", { tabindex: "-1", text: `Module ${mod.id}: ${mod.title}` }),
    h("p", { text: `${dayRange(mod.days)}. ${mod.goal}` }),
    h("div", { class: "mod-head__meter", role: "img", "aria-label": `${moduleDone(mod)} of ${total} days done` },
      h("span", { style: `width:${(moduleDone(mod) / total) * 100}%` })));

  const list = h("div", { id: "day-list" });
  const search = h("input", {
    class: "search", type: "search", placeholder: "Search this module", "aria-label": "Search days in this module", value: filters.q,
    oninput: (e) => { filters.q = e.target.value; paint(); },
  });
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Filter by status" },
    [["all", "All"], ["done", "Done"], ["in_progress", "In progress"], ["todo", "Not started"]].map(([key, label]) =>
      h("button", {
        type: "button", "aria-pressed": String(filters.status === key), text: label,
        onclick: (e) => {
          filters.status = key;
          seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget)));
          paint();
        },
      })));

  function paint() {
    const q = filters.q.trim().toLowerCase();
    const days = moduleDays(mod).filter((d) =>
      (filters.status === "all" || statusOf(d.n) === filters.status) &&
      (!q || `${d.title} ${d.unitIds} day ${d.n}`.toLowerCase().includes(q)));
    list.replaceChildren();
    if (!days.length) {
      list.append(h("p", { class: "empty", text: "No days match. Clear the search or choose All." }));
      return;
    }
    let part = null;
    let box = null;
    for (const day of days) {
      if (day.part !== part || !box) {
        part = day.part;
        if (part) list.append(h("h2", { class: "part-title", text: part }));
        box = h("div", { class: "days" });
        list.append(box);
      }
      box.append(dayRow(day, day.n === openDay));
    }
  }
  paint();

  const view = h("div", { class: "wrap roadmap" }, rail,
    h("div", {}, head, h("div", { class: "filters" }, seg, search), list));
  view.dataset.openDay = openDay || "";
  return view;
}

function dayRow(day, open) {
  const st = statusOf(day.n);
  const entry = entryOf(day.n);
  const sources = (state.resources.modules.find((m) => m.module === day.module.id)?.sources || [])
    .filter((s) => day.n >= s.days[0] && day.n <= s.days[1]);
  const group = state.interview.groups.find((g) => g.module === day.module.id);
  const folder = entry.folder ? `${repoUrl()}/tree/main/${entry.folder}` : null;
  const post = safeUrl(entry.post);

  const body = h("div", { class: "day__body" });
  if (sources.length) {
    body.append(h("h4", { text: "Where I learn it for free" }),
      h("ul", {}, sources.map((s) => h("li", {}, h("strong", { text: `${s.use}: ` }), s.where))));
  }
  if (group) {
    body.append(h("p", { class: "muted" }, `Interview questions for this module: ${group.from} to ${group.to}. `,
      h("a", { href: "#/interview", text: "See the tracker" })));
  }
  if (st === "done" && entry.date) body.append(h("p", { class: "muted", text: `Completed ${fmtDate(entry.date)}.` }));
  else if (entry.started) body.append(h("p", { class: "muted", text: `Started ${fmtDate(entry.started)}.` }));
  if (st === "todo") {
    body.append(h("p", { class: "muted" }, "Not started. When I begin: ", h("code", { text: `python scripts/tracker.py new ${day.n}` })));
  }
  if (folder || post) {
    body.append(h("div", { class: "day__links" },
      folder ? h("a", { href: folder, rel: "noopener", text: "Open the day's folder on GitHub" }) : null,
      post ? h("a", { href: post, rel: "noopener", text: "Read the LinkedIn post" }) : null));
  }

  return h("details", { class: "day", id: `day-${day.n}`, open: open },
    h("summary", {},
      h("span", { class: "day__n", text: String(day.n) }),
      h("span", { class: "day__title" }, day.title, h("span", { class: "day__unit", text: `Unit ${day.unitIds}` })),
      chip(st)),
    body);
}

function viewProgress() {
  const done = doneCount();
  const doing = state.days.filter((d) => statusOf(d.n) === "in_progress");
  const finish = finishDate();

  const paceBox = h("div", { class: "pace" },
    h("span", { id: "pace-label", text: "Days a week I can do:" }),
    h("div", { class: "stepper", role: "group", "aria-labelledby": "pace-label" },
      h("button", { type: "button", "aria-label": "One fewer day a week", text: "−", onclick: () => { savePace(state.pace - 1); rerender(); } }),
      h("output", { "aria-live": "polite", text: String(state.pace) }),
      h("button", { type: "button", "aria-label": "One more day a week", text: "+", onclick: () => { savePace(state.pace + 1); rerender(); } })));

  const doneDays = state.days.filter((d) => statusOf(d.n) === "done")
    .sort((a, b) => (entryOf(b.n).date || "").localeCompare(entryOf(a.n).date || "") || b.n - a.n);

  return h("div", {},
    pageHead("Progress"),
    h("div", { class: "wrap section", style: "padding-top:12px" },
      h("p", { class: "summary-line", text: finish ? `${done} of ${TOTAL} days done. At ${state.pace} days a week I finish around ${fmtDate(finish)}.` : `All ${TOTAL} days are done.` }),
      finish ? paceBox : null,
      doing.length ? h("p", { style: "margin-top:18px" }, "In progress: ", doing.map((d, i) => [i ? ", " : "", h("a", { href: `#/roadmap/${d.module.id}/${d.n}`, text: `Day ${d.n}, ${d.title}` })])) : null),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "By module" }),
      h("ul", { class: "rows" }, state.roadmap.modules.map((m) => {
        const total = moduleDays(m).length;
        const dn = moduleDone(m);
        return h("li", {},
          h("a", { href: `#/roadmap/${m.id}`, text: `${m.id}. ${m.title}` }),
          h("div", { class: "bar", role: "img", "aria-label": `${dn} of ${total} days done` }, h("span", { style: `width:${(dn / total) * 100}%` })),
          h("span", { text: `${dn} of ${total}` }));
      })))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "Finished days" }),
      doneDays.length
        ? h("div", { class: "table-wrap" }, h("table", {},
            h("thead", {}, h("tr", {}, ["Day", "Topic", "Completed", "Post"].map((t) => h("th", { scope: "col", text: t })))),
            h("tbody", {}, doneDays.map((d) => h("tr", {},
              h("td", {}, h("a", { href: `#/roadmap/${d.module.id}/${d.n}`, text: String(d.n) })),
              h("td", { text: d.title }),
              h("td", { text: entryOf(d.n).date ? fmtDate(entryOf(d.n).date) : "" }),
              h("td", {}, safeUrl(entryOf(d.n).post) ? h("a", { href: safeUrl(entryOf(d.n).post), rel: "noopener", text: "Read" }) : ""))))))
        : h("p", { class: "muted", text: "Nothing finished yet. Day 1 will be the first row." }))));
}

function viewProjects() {
  const rp = state.profile.runningProject || {};
  const p = state.projects;
  return h("div", {},
    pageHead("Projects", "One assistant grows through all six modules. After Day 100 I build two or three separate projects that each show a different skill."),
    h("section", { class: "section", style: "padding-top:24px" }, h("div", { class: "wrap" },
      h("h2", { text: "The running project" }),
      rp.name
        ? h("p", { class: "prose" }, h("strong", { text: rp.name }), `. ${rp.domain}`)
        : h("p", { class: "muted prose", text: `Not chosen yet. I pick the domain and 30 or more public or synthetic documents by Day ${rp.decideByDay || 6}.` }),
      h("h3", { style: "margin:26px 0 6px", text: "What each module adds" }),
      h("ol", { class: "list-rows" }, p.growth.map((g) => h("li", {},
        h("span", { class: "num", text: String(g.module) }),
        h("div", {}, h("strong", { text: state.roadmap.modules.find((m) => m.id === g.module).title }), h("p", { class: "muted", text: g.adds }))))))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "After Day 100" }),
      h("p", { class: "prose muted", text: p.afterDay100.intro }),
      h("p", { class: "prose", style: "margin-top:10px", text: p.afterDay100.picked.length ? `My picks: ${p.afterDay100.picked.join(", ")}.` : "I haven't picked yet. I choose after Day 100, based on the role I'm aiming for." }),
      p.afterDay100.roles
        ? h("div", { style: "margin-top:26px" },
            h("h3", { style: "margin-bottom:6px", text: "Which projects fit which role" }),
            h("ul", { class: "role-list" }, p.afterDay100.roles.map((r) =>
              h("li", {}, h("strong", { text: r.label }), `: projects ${r.picks.join(", ")}.`))))
        : null,
      h("ul", { class: "list-rows", style: "margin-top:18px" }, p.afterDay100.items.map((it) => h("li", {},
        h("span", { class: "num", text: String(it.id) }),
        h("div", {},
          h("strong", { class: p.afterDay100.picked.includes(it.id) ? "picked" : "", text: it.title }),
          h("p", { text: it.summary }),
          h("p", { class: "muted", text: `${it.level}. Builds on module${it.modules.length > 1 ? "s" : ""} ${it.modules.join(", ")}.` }))))))));
}

function viewPosts() {
  const posts = state.days.filter((d) => safeUrl(entryOf(d.n).post))
    .sort((a, b) => (entryOf(b.n).date || "").localeCompare(entryOf(a.n).date || "") || b.n - a.n);
  const li = safeUrl(state.profile.linkedin);
  const milestones = state.milestones.milestones;
  const nextUp = milestones.find((m) => statusOf(m.after_day) !== "done");

  return h("div", {},
    pageHead("LinkedIn posts", "One post for every finished day, each with a real number and one thing that broke. Milestone posts mark the end of a module and the big moments."),
    li ? h("div", { class: "wrap", style: "padding-top:16px" }, h("a", { href: li, rel: "noopener", text: "Follow along on LinkedIn" })) : null,
    h("section", { class: "section", style: "padding-top:24px" }, h("div", { class: "wrap" },
      h("h2", { text: "Daily posts" }),
      posts.length
        ? h("ul", { class: "postlist" }, posts.map((d) => h("li", {},
            h("a", { href: safeUrl(entryOf(d.n).post), rel: "noopener", text: `Day ${d.n} post` }),
            h("span", { text: d.title }),
            h("span", { class: "muted", text: entryOf(d.n).date ? fmtDate(entryOf(d.n).date) : "" }))))
        : h("p", { class: "muted", text: "No posts yet. The first one goes up when Day 1 is done." }))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "Milestone posts" }),
      h("p", { class: "muted prose", text: "Bigger posts that go up after a set day. The number is the day that unlocks it." }),
      h("ol", { class: "list-rows", style: "margin-top:18px" }, milestones.map((m) => {
        const reached = statusOf(m.after_day) === "done";
        const isNext = m === nextUp;
        return h("li", {},
          h("span", { class: "num", "aria-label": `After day ${m.after_day}`, text: String(m.after_day) }),
          h("div", {},
            h("strong", { text: m.title }),
            h("p", { class: "muted", text: m.note }),
            h("span", { class: `chip${reached ? " chip--done" : isNext ? " chip--doing" : ""}`, text: reached ? "Ready to post" : isNext ? "Next milestone" : `After Day ${m.after_day}` })));
      })))));
}

function viewResources() {
  const r = state.resources;
  const channel = safeUrl(state.profile.channelUrl);
  return h("div", {},
    pageHead("Free resources", "The roadmap points to paid courses in places. I don't use them. Every module is studied from free sources, and each day's page records what I actually used."),
    h("div", { class: "wrap", style: "padding-top:16px" },
      h("p", { class: "muted prose", text: r.note }),
      channel ? h("p", { style: "margin-top:10px" }, h("a", { href: channel, rel: "noopener", text: "CampusX YouTube channel" })) : null),
    h("div", { class: "wrap", style: "padding-bottom:40px" }, r.modules.map((m) => {
      const mod = state.roadmap.modules.find((x) => x.id === m.module);
      return h("section", { class: "section", style: "padding:34px 0" },
        h("div", { class: "cov" }, h("h3", { text: `Module ${mod.id}: ${mod.title}` }),
          h("span", { class: `chip${m.coverage === "covered" ? " chip--done" : m.coverage === "partial" ? " chip--doing" : ""}`, text: COVERAGE_LABEL[m.coverage] })),
        h("p", { class: "muted prose", text: m.summary }),
        h("ul", { class: "src", style: "margin-top:10px" }, m.sources.map((s) => h("li", {},
          h("span", { class: "days-col", text: s.days[0] === s.days[1] ? `Day ${s.days[0]}` : `Days ${s.days[0]}–${s.days[1]}` }),
          h("div", {}, h("strong", { text: s.use }), h("div", { text: s.where }))))));
    })),
    h("div", { class: "wrap", style: "padding-bottom:64px" }, h("h2", { text: "Not part of the 100 days" }), h("p", { class: "prose muted", text: r.outsideRoadmap })));
}

function viewInterview() {
  const iv = state.interview;
  const answered = new Set(iv.answered);
  const cells = Array.from({ length: TOTAL }, (_, i) =>
    h("span", { class: `qcell${answered.has(i + 1) ? " qcell--done" : ""}`, title: `Question ${i + 1}${answered.has(i + 1) ? " answered" : ""}` }));
  const link = safeUrl(state.profile.roadmapUrl);
  return h("div", {},
    pageHead("Interview prep", "The roadmap ends with 100 interview questions. I don't copy them here. This page tracks which ones I've answered out loud, in my own words, with evidence from my own experiments."),
    h("section", { class: "section", style: "padding-top:24px" }, h("div", { class: "wrap" },
      h("p", { class: "summary-line", text: `${answered.size} of ${TOTAL} answered.` }),
      h("div", { class: "qgrid", role: "img", "aria-label": `${answered.size} of ${TOTAL} interview questions answered` }, cells),
      link ? h("p", { class: "muted", style: "margin-top:10px" }, "Question list: ", h("a", { href: `${link}../interview-prep/`.replace("/100-days/../", "/100-days/"), rel: "noopener", text: "roadmap interview prep" })) : null)),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "By group" }),
      h("ul", { class: "rows" }, iv.groups.map((g) => {
        const total = g.to - g.from + 1;
        let dn = 0;
        for (let q = g.from; q <= g.to; q++) if (answered.has(q)) dn++;
        return h("li", {},
          h("span", {}, h("strong", { text: g.label }), h("span", { class: "muted", text: `  Questions ${g.from} to ${g.to}` })),
          h("div", { class: "bar", role: "img", "aria-label": `${dn} of ${total} answered` }, h("span", { style: `width:${(dn / total) * 100}%` })),
          h("span", { text: `${dn} of ${total}` }));
      })))),
    h("section", { class: "section" }, h("div", { class: "wrap" },
      h("h2", { text: "How I practise" }),
      h("ol", { class: "steps", style: "grid-template-columns:repeat(auto-fit,minmax(220px,1fr))" }, iv.practice.map((t) => h("li", {}, h("p", { style: "color:var(--ink)", text: t })))))));
}

function viewAbout() {
  const p = state.profile;
  const li = safeUrl(p.linkedin);
  return h("div", {},
    pageHead("About this log"),
    h("div", { class: "wrap section", style: "padding-top:16px" },
      h("div", { class: "prose" },
        h("p", { text: `I'm ${p.fullName}, a BTech student building toward an AI engineering role. This site and the repository behind it are my public record of working through the CampusX 100 Days of AI Engineering roadmap, in order, with free resources.` }),
        h("p", { text: "Every day ends with an experiment, real measurements and at least one honest failure. If a day isn't finished, it isn't marked done." })),
      h("dl", { class: "facts", style: "margin-top:32px" },
        h("dt", { text: "Roadmap" }), h("dd", {}, h("a", { href: safeUrl(p.roadmapUrl), rel: "noopener", text: "100 Days of AI Engineering by CampusX" })),
        h("dt", { text: "Repository" }), h("dd", {}, h("a", { href: repoUrl(), rel: "noopener", text: `${p.github}/${p.repo}` })),
        li ? [h("dt", { text: "LinkedIn" }), h("dd", {}, h("a", { href: li, rel: "noopener", text: "My profile and daily posts" }))] : null,
        h("dt", { text: "Rules" }), h("dd", { text: "No API keys, no personal data, no copied course material. CI scans every push for secrets." }),
        h("dt", { text: "AI assistance" }), h("dd", { text: "I write the notes and code with AI help for structure and review. I run, break and understand every experiment I publish." }),
        h("dt", { text: "Credit" }), h("dd", { text: "The roadmap and its videos belong to CampusX. This log links to them and adds my own notes and results." }))));
}

const VIEWS = { home: viewHome, roadmap: viewRoadmap, progress: viewProgress, projects: viewProjects, posts: viewPosts, resources: viewResources, interview: viewInterview, about: viewAbout };
const TITLES = { home: "100 Days of AI Engineering", roadmap: "Roadmap", progress: "Progress", projects: "Projects", posts: "LinkedIn posts", resources: "Free resources", interview: "Interview prep", about: "About" };

// ---------------------------------------------------------------- router
function rerender() { render(false); }

function render(resetScroll = true, moveFocus = true) {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const name = VIEWS[parts[0]] ? parts[0] : "home";
  const view = $("#view");
  view.replaceChildren(VIEWS[name](parts.slice(1)));
  document.title = name === "home" ? TITLES.home : `${TITLES[name]} | 100 Days of AI Engineering`;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  closeMenu();
  const target = name === "roadmap" && parts[2] ? $(`#day-${Number(parts[2])}`, view) : null;
  if (target) {
    target.scrollIntoView({ block: "center" });
  } else if (resetScroll) {
    window.scrollTo(0, 0);
    // Move focus to the heading after in-app navigation only. On first load it
    // would skip the keyboard user past the skip link and the navigation.
    if (moveFocus) $("h1", view)?.focus({ preventScroll: true });
  }
}

function closeMenu() {
  $("#site-nav").classList.remove("is-open");
  $("#menu-btn").setAttribute("aria-expanded", "false");
}

// ---------------------------------------------------------------- loading screen
async function runLoader(dataReady) {
  const loader = $("#loader");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    loader.classList.add("is-gone");
    await dataReady.catch(() => {});
    return;
  }
  let seen = false;
  try { seen = sessionStorage.getItem("seen") === "1"; } catch (_) { /* storage unavailable */ }

  const gridEl = $("#loader-grid");
  const cells = Array.from({ length: TOTAL }, (_, i) => {
    const c = h("span", { class: "cell", text: String(i + 1) });
    gridEl.append(c);
    return c;
  });
  const num = $("#loader-num");
  const caption = $("#loader-caption");

  const duration = seen ? 450 : 1900;
  const t0 = performance.now();
  let lit = 0;
  await new Promise((resolve) => {
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const n = Math.floor(p * TOTAL);
      while (lit < n) cells[lit++].classList.add("is-lit");
      num.textContent = String(n);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });

  let ok = true;
  try { await dataReady; } catch (_) { ok = false; }

  if (ok) {
    // Settle on the real progress: done days stay lit, the rest fall back to empty.
    cells.forEach((c, i) => {
      const st = statusOf(i + 1);
      c.classList.toggle("is-lit", st !== "todo");
      c.classList.toggle("cell--doing", st === "in_progress");
      c.classList.toggle("is-dim", st === "todo");
    });
    const done = doneCount();
    num.textContent = String(done);
    const next = currentDay();
    caption.textContent = !next ? "All 100 days are done." : done === 0 ? "Day 1 is next." : `Day ${next.n} is next.`;
    await sleep(seen ? 350 : 950);
  } else {
    caption.textContent = "The roadmap data didn't load.";
    await sleep(500);
  }
  loader.classList.add("is-leaving");
  await sleep(650);
  loader.classList.add("is-gone");
  try { sessionStorage.setItem("seen", "1"); } catch (_) { /* storage unavailable */ }
}

// ---------------------------------------------------------------- boot
async function loadAll() {
  const [profile, roadmap, progress, resources, projects, interview, milestones] = await Promise.all(
    ["profile.json", "roadmap.json", "progress.json", "resources.json", "projects.json", "interview.json", "milestones.json"].map(fetchJSON));
  Object.assign(state, { profile, roadmap, progress, resources, projects, interview, milestones });
  state.days = buildDays(roadmap);
  loadPace();
  $("#repo-link").href = repoUrl();
  const roadmapLink = safeUrl(profile.roadmapUrl);
  if (roadmapLink) $("#foot-roadmap").href = roadmapLink;
}

function showError() {
  $("#view").replaceChildren(h("div", { class: "wrap", style: "padding:64px var(--gutter)" },
    h("h1", { tabindex: "-1", text: "The roadmap data didn't load." }),
    h("p", { class: "lede", text: "Check your connection and reload the page. If it keeps failing, the data files may be missing from the site." }),
    h("div", { class: "btn-row" }, h("button", { class: "btn btn--primary", type: "button", onclick: () => location.reload(), text: "Reload" }))));
}

async function boot() {
  $("#menu-btn").addEventListener("click", () => {
    const open = $("#site-nav").classList.toggle("is-open");
    $("#menu-btn").setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("hashchange", () => render());
  $("#replay").addEventListener("click", () => {
    try { sessionStorage.removeItem("seen"); } catch (_) { /* storage unavailable */ }
    location.reload();
  });

  const dataReady = loadAll();
  await runLoader(dataReady);
  try {
    await dataReady;
    render(true, false);
  } catch (err) {
    console.error(err);
    showError();
  }
}

boot();
