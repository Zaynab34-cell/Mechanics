/* ═══════════════════════════════════════════════════════════
   views/quiz.js — quiz modes, timed exam, results analysis
   ═══════════════════════════════════════════════════════════ */
"use strict";

const QUIZ_MODES = [
  { id: "quick", ico: "⚡", name: "Quick Quiz", desc: "Fifteen questions across the whole map. Fast diagnostic of where you stand today.", count: 15 },
  { id: "deep", ico: "🧠", name: "Deep Quiz", desc: "Forty questions covering every domain with progressive difficulty.", count: 40 },
  { id: "mixed", ico: "🎲", name: "Mixed Engineering Quiz", desc: "Twenty-five random questions drawn from the entire mechanics map, all four levels.", count: 25 },
  { id: "timed", ico: "⏱", name: "Timed Exam", desc: "Forty questions, sixty minutes. Simulates a real engineering examination.", count: 40, minutes: 60 },
  { id: "weakness", ico: "🎯", name: "Weakness Mode", desc: "Twenty questions generated from the concepts you previously got wrong. The fastest way to close gaps.", count: 20 },
  { id: "due", ico: "📅", name: "Spaced Review", desc: "The concepts your revision schedule says are due today — up to fifteen per sitting.", count: 15 },
  { id: "mistakes", ico: "↩", name: "Mistakes Retry", desc: "Re-attempt the exact questions you answered incorrectly, up to twenty per sitting.", count: 20 }
];

function ViewQuiz(root, params) {
  const mode = params[0] || null;
  if (mode === "topic" && params[1]) return quizTopicPicker(root, params[1]);
  if (mode && QUIZ_MODES.some(m => m.id === mode)) return startQuiz(root, mode, params[1]);
  quizMenu(root);
}

function quizMenu(root) {
  root.appendChild(el("h1", { class: "page-title", text: "Quiz" }));
  root.appendChild(el("p", { class: "page-sub", text: "Seven ways to test yourself. Every wrong answer produces a full error analysis — your answer, the correct answer, why yours failed, the concept you misunderstood, the correct reasoning chain and a similar example." }));

  const stats = bankStats();
  root.appendChild(el("div", { class: "row mb" }, [
    el("span", { class: "chip", text: stats.curated + " curated questions" }),
    el("span", { class: "chip", text: stats.generators + " parametric generators" }),
    el("span", { class: "chip", text: Object.keys(stats.byType).length + " question types" }),
    el("span", { class: "chip", text: TOPIC_LIST.length + " concepts covered" })
  ]));

  const g = el("div", { class: "grid g3" });
  QUIZ_MODES.forEach(m => {
    if (m.id === "mistakes" && !STATE.mistakes.length) return;
    if (m.id === "due" && !dueConcepts().length) return;
    g.appendChild(el("a", { class: "mode-card", href: "#quiz/" + m.id, style: { textDecoration: "none", color: "inherit" } }, [
      el("h4", { text: m.ico + " " + m.name }),
      el("p", { text: m.desc }),
      el("div", { class: "meta" }, [
        el("span", { class: "chip", text: m.count + " questions" }),
        m.minutes ? el("span", { class: "chip a", text: m.minutes + " min" }) : null,
        m.id === "weakness" ? el("span", { class: "chip i", text: weakConcepts().length + " weak concepts" }) : null
      ])
    ]));
  });
  root.appendChild(g);

  /* topic quizzes */
  root.appendChild(el("div", { class: "section-title", text: "Topic quizzes" }));
  const tg = el("div", { class: "grid g4" });
  Object.values(SECTION_BY_ID).forEach(s => {
    const st = sectionStats(s.id);
    tg.appendChild(el("a", { class: "mode-card", href: "#quiz/topic/" + s.id, style: { textDecoration: "none", color: "inherit" } }, [
      el("h4", { text: s.name }),
      el("p", { text: s.core }),
      el("div", { class: "meta" }, [el("span", { class: "chip", text: s.concepts.length + " concepts" }), el("span", { class: "chip " + (st.mastery >= 75 ? "b" : st.mastery >= 45 ? "i" : "a"), text: st.mastery + "%" })])
    ]));
  });
  root.appendChild(tg);

  /* past results */
  if (STATE.quizzes.length) {
    root.appendChild(el("div", { class: "section-title", text: "Previous quiz results" }));
    const c = el("div", { class: "card tight" });
    STATE.quizzes.slice(0, 8).forEach(q => {
      c.appendChild(el("div", { class: "row spread", style: { padding: "6px 4px", borderBottom: "1px solid var(--line-soft)" } }, [
        el("span", { class: "small", text: q.modeName }),
        el("div", { class: "bar thin", style: { flex: "1", margin: "0 14px" } }, [el("i", { style: { width: q.pct + "%" } })]),
        el("b", { class: "mono small", text: `${q.score}/${q.total} · ${q.pct}%` }),
        el("span", { class: "small muted mono", text: new Date(q.t).toLocaleDateString() })
      ]));
    });
    root.appendChild(c);
  }
}

function quizTopicPicker(root, sectionId) {
  const s = SECTION_BY_ID[sectionId];
  if (!s) return quizMenu(root);
  startQuiz(root, "topic", sectionId);
}

/* ─────────── build the question set for a mode ─────────── */
function specForMode(mode, arg) {
  switch (mode) {
    case "quick": return { count: 10, name: "Quick Quiz", levels: [1, 2, 2, 3] };
    case "deep": return { count: 25, name: "Deep Quiz", levels: [1, 2, 2, 3, 3, 4] };
    case "mixed": return { count: 15, name: "Mixed Engineering Quiz" };
    case "timed": return { count: 30, name: "Timed Exam", minutes: 45, levels: [2, 2, 3, 3, 4] };
    case "weakness": return { count: 12, name: "Weakness Mode", concepts: weaknessConcepts(12) };
    case "due": return { count: Math.min(10, dueConcepts().length || 10), name: "Spaced Review", concepts: dueConcepts().map(t => t.id) };
    case "topic": return { count: 12, name: (SECTION_BY_ID[arg] ? SECTION_BY_ID[arg].name : "Topic") + " Quiz", concepts: (SECTION_BY_ID[arg] ? SECTION_BY_ID[arg].concepts : null) };
    default: return { count: 10, name: "Quiz" };
  }
}

function startQuiz(root, mode, arg) {
  if (mode === "mistakes") return retryMistakesQuiz(root);
  const spec = specForMode(mode, arg);
  if (mode === "due" && !dueConcepts().length) {
    root.appendChild(el("h1", { class: "page-title", text: "Nothing due for review" }));
    root.appendChild(el("div", { class: "empty" }, [el("span", { class: "ico", text: "✓" }), "No concept is scheduled for review today. Answer more questions to build the schedule, or take a Quick Quiz."]));
    return;
  }
  if (mode === "weakness" && !weakConcepts().length && !STATE.history.length) {
    root.appendChild(el("h1", { class: "page-title", text: "No weakness data yet" }));
    root.appendChild(el("div", { class: "empty" }, [el("span", { class: "ico", text: "◎" }), "Weakness mode needs a few answered questions first. Take a Quick Quiz and come back."]));
    return;
  }
  const questions = buildQuestionSet(spec);
  runQuiz(root, questions, spec);
}

function retryMistakesQuiz(root) {
  const open = STATE.mistakes.filter(m => !m.resolved);
  if (!open.length) {
    root.appendChild(el("div", { class: "empty" }, [el("span", { class: "ico", text: "✓" }), "No unresolved mistakes. Well done."]));
    return;
  }
  const questions = shuffle(open).slice(0, 10).map(m => {
    const t = TOPICS[m.conceptId];
    return questionFor(m.conceptId, m.level) || questionFor(m.conceptId, 2);
  }).filter(Boolean);
  runQuiz(root, questions, { count: questions.length, name: "Mistakes Retry" });
}

/* ─────────── the quiz runner ─────────── */
function runQuiz(root, questions, spec) {
  let idx = 0;
  const results = [];
  const slot = el("div");
  let timerId = null, remaining = spec.minutes ? spec.minutes * 60 : null;

  root.appendChild(el("div", { class: "row spread" }, [
    el("div", {}, [
      el("a", { class: "chip", href: "#quiz", text: "← all quiz modes" }),
      el("h1", { class: "page-title", style: { marginTop: "8px" }, text: spec.name })
    ]),
    remaining !== null ? el("div", { class: "timer", id: "quiz-timer", text: fmtClock(remaining) }) : null
  ]));

  const head = el("div", { class: "quiz-head" });
  const counter = el("b", { class: "mono", text: `1 / ${questions.length}` });
  const bar = el("div", { class: "bar", style: { flex: "1" } }, [el("i", { style: { width: "0%" } })]);
  const scoreChip = el("span", { class: "chip", text: "score 0" });
  head.appendChild(counter); head.appendChild(bar); head.appendChild(scoreChip);
  root.appendChild(head);
  root.appendChild(slot);

  function fmtClock(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }

  function show() {
    slot.innerHTML = "";
    if (idx >= questions.length) return finish();
    const q = questions[idx];
    counter.textContent = `${idx + 1} / ${questions.length}`;
    bar.firstChild.style.width = (100 * idx / questions.length) + "%";
    const rq = renderQuestion(q, {
      mode: "quiz",
      onSubmit: res => {
        recordAnswer({ conceptId: q.conceptId, level: q.level, correct: res.correct, question: q, yourAnswer: res.yourAnswer });
        results.push({ q, res });
        scoreChip.textContent = "score " + results.filter(r => r.res.ok).length;
        App.refreshChrome();
        const nx = el("button", { class: "btn btn-primary mt", text: idx + 1 >= questions.length ? "See results →" : "Next question →", onclick: () => { idx++; show(); } });
        slot.appendChild(nx);
        nx.focus();
      },
      onSkip: () => {
        results.push({ q, res: { ok: false, text: "skipped" }, skipped: true });
        idx++; show();
      }
    });
    slot.appendChild(rq.node);
  }

  function finish() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    App.stopTimer();
    const score = results.filter(r => r.res.ok).length;
    const total = questions.length;
    const pct = Math.round(100 * score / Math.max(total, 1));
    saveQuizResult({ mode: spec.name, score, total, pct });
    slot.innerHTML = "";
    slot.appendChild(quizResults(spec, results, score, total, pct));
    bar.firstChild.style.width = "100%";
    counter.textContent = "complete";
  }

  if (remaining !== null) {
    timerId = setInterval(() => {
      remaining--;
      const node = $("#quiz-timer");
      if (node) { node.textContent = fmtClock(remaining); node.classList.toggle("low", remaining < 300); }
      if (remaining <= 0) finish();
    }, 1000);
    App.stopTimer();
    App.setTimer(timerId);
  }
  show();
}

function quizResults(spec, results, score, total, pct) {
  const wrap = el("div");
  const verdict = pct >= 85 ? "Outstanding — you are reasoning like an engineer."
    : pct >= 70 ? "Solid. Focus on the concepts listed below to reach mastery."
      : pct >= 50 ? "Working knowledge, but the gaps are real. Review the error analyses and re-practise."
        : "This domain needs systematic study. Work through the lessons, then re-test.";

  wrap.appendChild(el("div", { class: "card result-hero" }, [
    el("div", { class: "lbl", text: spec.name }),
    el("div", { class: "big", style: { color: pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)" }, text: pct + "%" }),
    el("div", { class: "muted", text: `${score} correct of ${total}` }),
    el("p", { class: "mt-s", text: verdict })
  ]));

  /* by concept */
  const byConcept = {};
  results.forEach(r => {
    const k = r.q.conceptId;
    byConcept[k] = byConcept[k] || { ok: 0, n: 0 };
    byConcept[k].n++; if (r.res.ok) byConcept[k].ok++;
  });
  wrap.appendChild(el("div", { class: "section-title", text: "Breakdown by concept" }));
  const bc = el("div", { class: "card tight" });
  Object.entries(byConcept).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).forEach(([cid, v]) => {
    const t = TOPICS[cid]; if (!t) return;
    const p = Math.round(100 * v.ok / v.n);
    bc.appendChild(el("div", { class: "module-row" }, [
      el("a", { class: "nm", href: "#learn/" + cid, text: t.title }),
      el("div", { class: "bar " + (p >= 75 ? "g" : p >= 45 ? "a" : "r") }, [el("i", { style: { width: p + "%" } })]),
      el("div", { class: "pc", text: v.ok + "/" + v.n })
    ]));
  });
  wrap.appendChild(bc);

  /* by level */
  const byLevel = {};
  results.forEach(r => { byLevel[r.q.level] = byLevel[r.q.level] || { ok: 0, n: 0 }; byLevel[r.q.level].n++; if (r.res.ok) byLevel[r.q.level].ok++; });
  wrap.appendChild(el("div", { class: "section-title", text: "Breakdown by difficulty" }));
  const lg = el("div", { class: "grid g4" });
  ALL_LEVELS.forEach(lv => {
    const v = byLevel[lv];
    lg.appendChild(el("div", { class: "card tight center" }, [
      el("div", { class: "small muted", text: LEVELS[lv].icon + " " + LEVELS[lv].name }),
      el("b", { class: "mono", style: { fontSize: "19px" }, text: v ? Math.round(100 * v.ok / v.n) + "%" : "—" }),
      el("div", { class: "small muted", text: v ? v.ok + "/" + v.n : "not tested" })
    ]));
  });
  wrap.appendChild(lg);

  /* wrong answers */
  const wrong = results.filter(r => !r.res.ok);
  if (wrong.length) {
    wrap.appendChild(el("div", { class: "section-title", text: "Error analysis" }));
    wrong.forEach(r => {
      const c = el("div", { class: "card mb" });
      c.appendChild(el("div", { class: "q-meta" }, [
        el("span", { class: "chip n", text: TYPE_LABEL[r.q.type] }),
        el("span", { class: "chip " + ["", "b", "i", "a", "k"][r.q.level], text: LEVELS[r.q.level].name }),
        TOPICS[r.q.conceptId] ? el("a", { class: "chip", href: "#learn/" + r.q.conceptId, text: "◎ " + TOPICS[r.q.conceptId].title }) : null
      ]));
      c.appendChild(el("p", { class: "q-text", html: math(r.q.prompt) }));
      c.appendChild(buildFeedback(r.q, r.res, {}));
      wrap.appendChild(c);
    });
  }

  wrap.appendChild(el("div", { class: "row mt" }, [
    el("a", { class: "btn btn-primary", href: "#quiz", text: "Another quiz" }),
    wrong.length ? el("a", { class: "btn", href: "#mistakes", text: "↩ Open mistake log" }) : null,
    el("a", { class: "btn btn-ghost", href: "#progress", text: "View progress" })
  ]));
  return wrap;
}
