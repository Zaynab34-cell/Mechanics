/* ═══════════════════════════════════════════════════════════
   app.js — router, navigation, chrome, animation loop
   ═══════════════════════════════════════════════════════════ */
"use strict";

const NAV = [
  { group: "Overview" },
  { id: "dashboard", ico: "▦", label: "Dashboard" },
  { id: "map", ico: "⬡", label: "Mechanics Map" },
  { group: "Learn" },
  { id: "learn", ico: "◎", label: "Learn" },
  { id: "lab", ico: "⚗", label: "Interactive Lab" },
  { group: "Test" },
  { id: "practice", ico: "▶", label: "Practice" },
  { id: "quiz", ico: "⏱", label: "Quiz" },
  { id: "mistakes", ico: "↩", label: "Mistakes", badge: () => STATE.mistakes.filter(m => !m.resolved).length },
  { group: "Reference" },
  { id: "formulas", ico: "ƒ", label: "Formula Library" },
  { id: "cases", ico: "⚙", label: "Case Studies" },
  { id: "progress", ico: "◔", label: "Progress" }
];

const VIEWS = {
  dashboard: { fn: ViewDashboard, title: "Dashboard" },
  map: { fn: ViewMap, title: "Mechanics Map" },
  learn: { fn: ViewLearn, title: "Learn" },
  lab: { fn: ViewLab, title: "Interactive Lab" },
  practice: { fn: ViewPractice, title: "Practice" },
  quiz: { fn: ViewQuiz, title: "Quiz" },
  mistakes: { fn: ViewMistakes, title: "Mistakes" },
  formulas: { fn: ViewFormulas, title: "Formula Library" },
  cases: { fn: ViewCases, title: "Case Studies" },
  progress: { fn: ViewProgress, title: "Progress" }
};

/* hash routing with an in-memory fallback: in some embedded/sandboxed
   contexts assigning to location.hash is a silent no-op, so we remember
   the route ourselves and route manually */
let MEM_HASH = "";
function getHash() {
  const real = String(window.location.hash || "").replace(/^#/, "");
  return real || MEM_HASH;
}
function setHash(h) {
  h = String(h);
  let applied = false;
  try {
    window.location.hash = h;
    applied = String(window.location.hash || "").replace(/^#/, "") === h;
  } catch (e) { applied = false; }
  if (!applied) { MEM_HASH = h; App.route(); }
}

const App = {
  current: null, anims: [], rafId: null, timerId: null,

  init() {
    Store.load();
    this.buildNav();
    window.addEventListener("hashchange", () => this.route());
    /* route internal links ourselves so navigation also works where
       location.hash writes are disabled (sandboxed iframes, srcdoc) */
    document.addEventListener("click", e => {
      const t = e.target;
      const a = t && t.closest ? t.closest("a[href^=\"#\"]") : null;
      if (!a) return;
      e.preventDefault();
      setHash(a.getAttribute("href").slice(1));
    });
    $("#btn-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#btn-reset").addEventListener("click", () => {
      if (confirm("Reset all progress? This cannot be undone.")) { Store.reset(); this.navigate("dashboard"); toast("Progress reset.", "ok"); }
    });
    $("#modal-backdrop").addEventListener("click", e => { if (e.target.id === "modal-backdrop") this.closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.closeModal(); });
    Bus.on("progress", () => this.refreshChrome());
    Bus.on("mistakes-changed", () => this.refreshChrome());
    this.refreshChrome();
    if (!getHash()) setHash("dashboard");
    this.route();
    this.loop();
  },

  buildNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    let g = 0;
    NAV.forEach(item => {
      if (item.group) { g++; nav.appendChild(el("div", { class: "nav-group-label grp-" + g, text: item.group })); return; }
      const a = el("a", { class: "nav-item grp-" + g, href: "#" + item.id, dataset: { view: item.id } }, [
        el("span", { class: "ico", text: item.ico }), el("span", { text: item.label })
      ]);
      if (item.badge) {
        const n = item.badge();
        if (n) a.appendChild(el("span", { class: "badge", text: String(n) }));
      }
      nav.appendChild(a);
    });
  },

  /* arg: a string, or an array of path segments (["force", "q-12"] -> #practice/force/q-12) */
  navigate(view, arg) {
    const tail = Array.isArray(arg) ? arg.filter(Boolean).join("/") : arg;
    setHash(tail ? view + "/" + tail : view);
  },

  route() {
    const raw = getHash() || "dashboard";
    if (raw === this._lastRaw) return;
    this._lastRaw = raw;
    const parts = raw.split("/").filter(Boolean);
    const viewId = parts[0] in VIEWS ? parts[0] : "dashboard";
    const params = parts.slice(1);
    const view = $("#view");

    this.stopAnims();
    view.innerHTML = "";
    this.current = viewId;

    /* sidebar state */
    $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === viewId));
    $("#sidebar").classList.remove("open");

    /* breadcrumbs */
    const crumbs = $("#crumbs");
    crumbs.innerHTML = "";
    const push = (txt, href) => {
      if (crumbs.children.length) crumbs.appendChild(el("span", { class: "sep", text: "/" }));
      crumbs.appendChild(href ? el("a", { href, class: "cur", style: { color: "inherit", textDecoration: "none" }, text: txt }) : el("span", { class: "cur", text: txt }));
    };
    push("Mechanics Mastery", "#dashboard");
    push(VIEWS[viewId].title, "#" + viewId);
    if (params[0]) {
      let label = params[0];
      if (viewId === "learn" && TOPICS[params[0]]) label = TOPICS[params[0]].title;
      if (viewId === "lab" && SIM_BY_ID[params[0]]) label = SIM_BY_ID[params[0]].title;
      if (viewId === "practice" && TOPICS[params[0]]) label = TOPICS[params[0]].title;
      if (viewId === "map" && SECTION_BY_ID[params[0]]) label = SECTION_BY_ID[params[0]].name;
      if (viewId === "formulas" && FORMULA_BY_ID[params[0]]) label = FORMULA_BY_ID[params[0]].name;
      if (viewId === "cases" && CASE_BY_ID[params[0]]) label = CASE_BY_ID[params[0]].title;
      if (viewId === "quiz" && params[0] === "topic" && SECTION_BY_ID[params[1]]) label = SECTION_BY_ID[params[1]].name + " quiz";
      if (viewId === "quiz" && QUIZ_MODES.some(m => m.id === params[0])) label = QUIZ_MODES.find(m => m.id === params[0]).name;
      push(label);
    }

    try {
      VIEWS[viewId].fn(view, params);
    } catch (err) {
      console.error(err);
      view.appendChild(el("div", { class: "empty" }, [el("span", { class: "ico", text: "⚠" }), "This view failed to render: " + err.message]));
    }
    view.focus();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    this.refreshChrome();
  },

  refreshChrome() {
    const om = overallMastery();
    const pct = $("#mastery-pct"), ring = $("#ring-fg"), sub = $("#mastery-sub");
    if (pct) pct.textContent = om + "%";
    if (ring) ring.style.strokeDashoffset = String(97.4 * (1 - om / 100));
    if (sub) {
      const started = TOPIC_LIST.filter(t => conceptState(t.id).attempts > 0).length;
      sub.textContent = started ? `${started}/${TOPIC_LIST.length} concepts started` : "start with the map";
    }
    const due = dueConcepts().length;
    const dc = $("#due-count"); if (dc) dc.textContent = String(due);
    const chip = $("#due-chip"); if (chip) chip.style.opacity = due ? "1" : ".5";
    const xp = $("#xp-count"); if (xp) xp.textContent = String(STATE.xp);
    const sn = $("#streak-num"); if (sn) sn.textContent = String(STATE.streak || 0);
    this.buildNav();
    $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === this.current));
  },

  /* animations */
  registerAnim(inst) { this.anims.push({ inst, last: 0 }); },
  stopAnims() { this.anims = []; },
  loop() {
    const step = ts => {
      this.anims = this.anims.filter(a => a.inst && a.inst._svg && document.body.contains(a.inst._svg));
      this.anims.forEach(a => {
        if (!a.inst.animate) return;
        if (ts - a.last < 33) return;         // ~30 fps
        a.last = ts;
        a.inst._t = (a.inst._t || 0) + (ts - (a._prev || ts)) / 1000;
        a._prev = ts;
        if (a.inst._redraw) { try { a.inst._redraw(); } catch (e) { /* keep the loop alive */ } }
      });
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  },
  setTimer(id) { this.timerId = id; },
  stopTimer() { if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } },

  /* modal */
  openModal(node) {
    const m = $("#modal");
    m.innerHTML = "";
    m.appendChild(node);
    const bd = $("#modal-backdrop");
    bd.hidden = false;
    bd.classList.add("open");
  },
  closeModal() {
    const bd = $("#modal-backdrop");
    bd.hidden = true;
    bd.classList.remove("open");
    $("#modal").innerHTML = "";
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());

/* publish the module globals on window (top-level const/let are lexically
   scoped even in classic scripts, so they are not window properties) */
try { Object.assign(window, {
  MODULES, SECTION_BY_ID, TOPICS, TOPIC_LIST, LEVELS,
  FORMULAS, FORMULA_BY_ID, FIELD_LABELS, parseVars,
  makeQuestion, QUESTION_BANK, GEN_TEMPLATES, ALL_LEVELS, questionFor, randomQuestion, bankStats, weaknessConcepts,
  CASES, CASE_BY_ID,
  SIMS, SIM_BY_ID, SIM_GROUPS,
  Store, Bus, STATE, conceptState, masteryOf, srStatusOf, SR_LABEL, recordAnswer, answerText,
  sectionStats, moduleStats, overallMastery, dueConcepts, weakConcepts, recentHistory, accuracyLast,
  nextConceptToStudy, saveQuizResult, resolveMistake, clearResolvedMistakes,
  el, esc, svg, svgDefs, math, sig, fmt, clamp, todayKey, dayKey, daysBetween, DAY,
  gradeQuestion, answerKey, renderQuestion, buildFeedback, buildQuestionSet, TYPE_LABEL,
  ViewDashboard, ViewMap, ViewLearn, ViewLab, ViewPractice, ViewQuiz, ViewMistakes, ViewFormulas, ViewCases, ViewProgress,
  QUIZ_MODES, NAV, VIEWS, App,
  getHash, setHash
}); } catch (e) { console.error("EXPORT FAILED:", e && e.message); }
