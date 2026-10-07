/* ═══════════════════════════════════════════════════════════
   views/learn.js — the 5-step learning cycle for one concept
   Understand → Visualize → Explore → Practise → Explain
   ═══════════════════════════════════════════════════════════ */
"use strict";

const LEARN_STEPS = [
  { id: "understand", n: 1, label: "Understand" },
  { id: "visualize", n: 2, label: "Visualize" },
  { id: "explore", n: 3, label: "Explore" },
  { id: "practice", n: 4, label: "Practice" },
  { id: "explain", n: 5, label: "Explain in English" }
];

function ViewLearn(root, params) {
  const id = params[0] && TOPICS[params[0]] ? params[0] : "force";
  const t = TOPICS[id];
  const cs = conceptState(id);
  markSeen(id);

  /* ── header ── */
  const m = masteryOf(id), stt = srStatusOf(id);
  root.appendChild(el("div", { class: "row spread" }, [
    el("div", {}, [
      el("div", { class: "row" }, [
        el("a", { class: "chip", href: "#map/" + t.section, text: SECTION_BY_ID[t.section] ? SECTION_BY_ID[t.section].name : t.section }),
        el("span", { class: "chip " + ["", "b", "i", "a", "k"][t.level], text: LEVELS[t.level].icon + " core level " + t.level }),
        stt ? el("span", { class: "chip " + (stt === "g" ? "b" : stt === "y" ? "i" : "a"), text: SR_LABEL[stt] + " · " + m + "%" }) : el("span", { class: "chip", text: "not started" })
      ]),
      el("h1", { class: "page-title", style: { marginTop: "8px" }, text: t.title })
    ]),
    el("div", { class: "row" }, [
      t.lab && SIM_BY_ID[t.lab] ? el("a", { class: "btn", href: "#lab/" + t.lab, text: "⚗ Open in lab" }) : null,
      el("a", { class: "btn", href: "#practice/" + id, text: "▶ Practise now" })
    ])
  ]));
  root.appendChild(el("p", { class: "page-sub", text: t.engineering }));

  /* ── step tabs ── */
  const tabs = el("div", { class: "steps" });
  const body = el("div");
  let active = cs.steps.understand && cs.steps.explain ? "understand" : "understand";
  function paint() {
    tabs.innerHTML = "";
    LEARN_STEPS.forEach(s => {
      tabs.appendChild(el("button", {
        class: "step " + (s.id === active ? "active" : "") + (cs.steps[s.id] ? " done" : ""),
        onclick: () => { active = s.id; paint(); renderStep(); }
      }, [el("span", { class: "n", text: String(s.n) }), el("span", { text: s.label })]));
    });
  }
  function renderStep() {
    body.innerHTML = "";
    ({ understand: stepUnderstand, visualize: stepVisualize, explore: stepExplore, practice: stepPractice, explain: stepExplain })[active](body, t);
    markStep(id, active);
    cs.steps = conceptState(id).steps;
    paint();
  }
  root.appendChild(tabs);
  root.appendChild(body);
  paint();
  renderStep();
}

/* ─────────── STEP 1: UNDERSTAND ─────────── */
function stepUnderstand(root, t) {
  const g = el("div", { class: "grid g-2-1" });
  const left = el("div", { class: "grid" });

  const defs = el("div", { class: "card def-block" });
  [["Simple definition", t.simple], ["Engineering definition", t.engineering], ["Physical meaning", t.meaning]].forEach(([k, v]) => {
    defs.appendChild(el("div", { class: "def-item" }, [el("h5", { text: k }), el("p", { text: v })]));
  });
  left.appendChild(defs);

  if (t.formula) {
    const fb = el("div", { class: "card" });
    fb.appendChild(el("div", { class: "formula-box" }, [
      el("div", { class: "f", html: math(t.formula) }),
      t.formulaNote ? el("div", { class: "cap", text: t.formulaNote }) : null
    ]));
    const vt = el("table", { class: "var-table mt" });
    vt.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Symbol" }), el("th", { text: "Meaning" }), el("th", { text: "SI unit" })])]));
    const tb = el("tbody");
    t.vars.forEach(v => tb.appendChild(el("tr", {}, [el("td", { text: v[0] }), el("td", { text: v[1] }), el("td", { text: v[2] })])));
    vt.appendChild(tb);
    fb.appendChild(vt);
    left.appendChild(fb);
  }

  const ex = el("div", { class: "card" });
  ex.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Worked example" }));
  ex.appendChild(el("p", { class: "small", text: t.example }));
  ex.appendChild(el("div", { class: "section-title", text: "Assumptions behind the model" }));
  ex.appendChild(el("p", { class: "small", text: t.assumptions }));
  left.appendChild(ex);
  g.appendChild(left);

  /* right: 7 pedagogical questions */
  const q7 = el("div", { class: "card" });
  q7.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Never learn a formula without these 7" }));
  const q7w = el("div", { class: "q7 mt-s" });
  t.q7.forEach(([k, v]) => q7w.appendChild(el("div", { class: "q7-item" }, [el("b", { text: k }), el("span", { text: v })])));
  q7.appendChild(q7w);
  g.appendChild(q7);
  root.appendChild(g);

  /* formula card if linked */
  if (t.formulaId && FORMULA_BY_ID[t.formulaId]) {
    root.appendChild(el("div", { class: "section-title", text: "Formula library entry" }));
    const c = el("div");
    c.appendChild(formulaCard(FORMULA_BY_ID[t.formulaId]));
    root.appendChild(c);
  }
}

/* ─────────── STEP 2: VISUALIZE ─────────── */
function stepVisualize(root, t) {
  const simId = t.lab && SIM_BY_ID[t.lab] ? t.lab : null;
  if (!simId) {
    root.appendChild(el("div", { class: "empty" }, [el("span", { class: "ico", text: "⚗" }), "No dedicated simulation for this concept yet. Try a related one from the Interactive Lab."]));
    return;
  }
  root.appendChild(el("p", { class: "page-sub", text: "Watch the physics respond to your inputs. Ask yourself: which parameter dominates the result, and why?" }));
  const sim = SIM_BY_ID[simId];
  const grid = el("div", { class: "lab-grid" });
  const stage = el("div", { class: "sim-stage" });
  const ui = el("div", { class: "card" });
  grid.appendChild(stage); grid.appendChild(ui);
  root.appendChild(grid);
  const inst = sim.mount(stage, ui);
  App.registerAnim(inst);
  const note = el("div", { class: "sim-note mt" });
  note.textContent = "Try this: change one parameter at a time and predict the outcome before the diagram updates. Prediction is what builds engineering intuition.";
  root.appendChild(note);
  root.appendChild(el("div", { class: "row mt" }, [el("a", { class: "btn", href: "#lab/" + simId, text: "⚗ Open the full lab page" })]));
}

/* ─────────── STEP 3: EXPLORE ─────────── */
function stepExplore(root, t) {
  const g = el("div", { class: "grid g2" });

  /* connections */
  const c1 = el("div", { class: "card" });
  c1.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Where this concept connects" }));
  const cw = el("div", { class: "chain mt-s" });
  (t.chain || []).forEach((part, i) => {
    cw.appendChild(el("span", { class: "chain-node", style: part.toLowerCase() === t.title.toLowerCase() ? { borderColor: "var(--accent)", color: "var(--accent-2)" } : {}, text: part }));
    if (i < t.chain.length - 1) cw.appendChild(el("span", { class: "chain-arrow", text: "→" }));
  });
  c1.appendChild(cw);
  c1.appendChild(el("div", { class: "section-title", text: "Directly related concepts" }));
  const rel = el("div", { class: "vocab" });
  (t.connections || []).forEach(cid => {
    if (!TOPICS[cid]) return;
    const tt = TOPICS[cid];
    rel.appendChild(el("a", { class: "w", href: "#learn/" + cid, title: tt.simple }, [el("b", { text: tt.title }), el("i", { text: " · " + tt.sectionName })]));
  });
  c1.appendChild(rel);
  g.appendChild(c1);

  /* vocabulary */
  const c2 = el("div", { class: "card" });
  c2.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Key vocabulary (engineering English)" }));
  const voc = el("div", { class: "vocab mt-s" });
  (t.vocab || []).forEach(([w, d]) => voc.appendChild(el("span", { class: "w", title: d }, [el("b", { text: w }), el("i", { text: " — " + d })])));
  c2.appendChild(voc);
  c2.appendChild(el("div", { class: "section-title", text: "Core question of this domain" }));
  c2.appendChild(el("p", { class: "small", text: SECTION_BY_ID[t.section] ? SECTION_BY_ID[t.section].core : "" }));
  g.appendChild(c2);
  root.appendChild(g);

  /* parameter sensitivity table */
  const sens = el("div", { class: "card mt" });
  sens.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "What happens if a parameter changes?" }));
  const rows = [
    ["Load / force ↑", "Stress and deformation rise proportionally; fatigue life falls sharply if the load is cyclic."],
    ["Geometry (area, section) ↑", "Stress falls with area; deflection falls with the cube or fourth power of depth — geometry is the most powerful lever."],
    ["Span / length ↑", "Bending moment and deflection grow rapidly (L² and L⁴). Shortening the span is usually the cheapest fix."],
    ["Temperature ↑", "Yield strength and modulus fall; creep and thermal stress appear; viscosity of liquids falls."],
    ["Cycle count ↑", "Fatigue damage accumulates even at stresses far below yield — the governing case for rotating machinery."],
    ["Speed ↑", "Inertia loads grow with ω²; fluid losses grow with v²; compressibility appears above M ≈ 0.3."]
  ];
  const tab = el("table", { class: "var-table mt-s" });
  const tb = el("tbody");
  rows.forEach(([k, v]) => tb.appendChild(el("tr", {}, [el("td", { text: k }), el("td", { text: v })])));
  tab.appendChild(tb);
  sens.appendChild(tab);
  root.appendChild(sens);

  root.appendChild(el("div", { class: "row mt" }, [
    el("a", { class: "btn btn-primary", href: "#practice/" + t.id, text: "▶ Go to practice" }),
    t.lab ? el("a", { class: "btn", href: "#lab/" + t.lab, text: "⚗ Explore in the lab" }) : null
  ]));
}

/* ─────────── STEP 4: PRACTICE ─────────── */
function stepPractice(root, t) {
  root.appendChild(el("p", { class: "page-sub", text: "Four levels of difficulty. Level 4 questions have incomplete information on purpose — state your assumptions explicitly, as you would in industry." }));
  const grid = el("div", { class: "grid g2" });
  ALL_LEVELS.forEach(lv => {
    const col = el("div", { class: "card" });
    col.appendChild(el("div", { class: "row spread" }, [
      el("div", {}, [
        el("b", { text: `${LEVELS[lv].icon} Level ${lv} — ${LEVELS[lv].name}` }),
        el("div", { class: "small muted", text: LEVELS[lv].desc })
      ]),
      el("span", { class: "chip mono", text: progressText(t.id, lv) })
    ]));
    const slot = el("div", { class: "mt" });
    const load = () => {
      slot.innerHTML = "";
      const q = questionFor(t.id, lv);
      if (!q) { slot.appendChild(el("div", { class: "small muted", text: "No question available." })); return; }
      const rq = renderQuestion(q, {
        mode: "practice",
        onSubmit: res => {
          recordAnswer({ conceptId: t.id, level: lv, correct: res.correct, question: q, yourAnswer: res.yourAnswer });
          App.refreshChrome();
        }
      });
      slot.appendChild(rq.node);
    };
    load();
    col.appendChild(slot);
    col.appendChild(el("button", { class: "btn btn-sm btn-ghost mt", text: "↻ Another question at this level", onclick: load }));
    grid.appendChild(col);
  });
  root.appendChild(grid);
}
function progressText(id, lv) {
  const bl = conceptState(id).byLevel[lv];
  return bl && bl.a ? `${bl.c}/${bl.a} correct` : "no attempts";
}

/* ─────────── STEP 5: EXPLAIN IN ENGLISH ─────────── */
function stepExplain(root, t) {
  root.appendChild(el("p", { class: "page-sub", text: "Explaining a concept out loud in your own words is the strongest test of understanding. Your answer is assessed on technical correctness, engineering vocabulary, grammar and clarity." }));
  const g = el("div", { class: "grid g-1-2" });

  const side = el("div", { class: "card" });
  side.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Key vocabulary to use" }));
  const voc = el("div", { class: "vocab mt-s" });
  (t.vocab || []).forEach(([w, d]) => voc.appendChild(el("span", { class: "w", title: d }, [el("b", { text: w })])));
  side.appendChild(voc);
  side.appendChild(el("div", { class: "section-title", text: "Useful sentence frames" }));
  [
    `“${t.title} describes …”`,
    "It is governed by … because …",
    "The key assumption is …",
    "If the load increases, then …",
    "In industry this appears in …"
  ].forEach(s => side.appendChild(el("p", { class: "small mono", style: { margin: "4px 0" }, text: s })));
  g.appendChild(side);

  const main = el("div", { class: "card" });
  main.appendChild(el("b", { text: "Explain this concept in English, in 2–3 sentences." }));
  const ta = el("textarea", { class: "mt-s", placeholder: `What is ${t.title}? Why does it matter, and where would you meet it in a real machine?` });
  main.appendChild(ta);
  const out = el("div");
  main.appendChild(el("div", { class: "row mt" }, [
    el("button", { class: "btn btn-primary", text: "Evaluate my answer", onclick: () => {
      const txt = ta.value.trim();
      if (txt.length < 20) { toast("Write at least a couple of sentences.", "err"); return; }
      const keys = (t.vocab || []).map(v => v[0].toLowerCase()).concat(t.title.toLowerCase().split(/\s+/));
      const q = makeQuestion({ conceptId: t.id, level: 4, type: "explain", english: true, prompt: "Explain “" + t.title + "” in 2–3 sentences.", keywords: keys, explanation: t.meaning, reasoning: ["Name the concept and its physical meaning.", "State the governing relation and its assumptions.", "Give an industrial application."], misconception: "Describing the formula without explaining the physics." });
      const res = gradeQuestion(q, txt);
      out.innerHTML = "";
      out.appendChild(buildFeedback(q, res, {}));
      recordAnswer({ conceptId: t.id, level: 4, correct: res.ok, question: q, yourAnswer: res.text });
      App.refreshChrome();
    } })
  ]));
  main.appendChild(out);
  g.appendChild(main);
  root.appendChild(g);
}
