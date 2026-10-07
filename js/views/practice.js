/* ═══════════════════════════════════════════════════════════
   views/practice.js — deliberate practice on one concept,
   with the "explain your reasoning" mode
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewPractice(root, params) {
  const id = params[0] && TOPICS[params[0]] ? params[0] : null;
  if (!id) { practicePicker(root); return; }
  practiceConcept(root, TOPICS[id], params[1] || null);   /* params[1] pins one question */
}

function practicePicker(root) {
  root.appendChild(el("h1", { class: "page-title", text: "Practice" }));
  root.appendChild(el("p", { class: "page-sub", text: "Choose a concept to practise deliberately, or generate a mixed set. Practice mode gives full error analysis after every answer — this is where the reasoning is built." }));

  const quick = el("div", { class: "grid g3 mb" });
  [["Weakness drill", "Questions on the concepts you most often get wrong.", "#quiz/weakness", "⚡"],
   ["Mixed engineering set", "Random questions across the whole mechanics map.", "#quiz/mixed", "🎲"],
   ["Due for review", "Spaced repetition — the concepts scheduled for today.", "#quiz/due", "⏰"]
  ].forEach(([title, desc, href, ico]) => {
    quick.appendChild(el("a", { class: "mode-card", href, style: { textDecoration: "none", color: "inherit" } }, [
      el("h4", { text: ico + " " + title }), el("p", { text: desc })
    ]));
  });
  root.appendChild(quick);

  MODULES.forEach(m => {
    m.sections.forEach(s => {
      root.appendChild(el("div", { class: "section-title", text: s.name }));
      const grid = el("div", { class: "concept-grid" });
      s.concepts.forEach(cid => {
        const t = TOPICS[cid], m0 = masteryOf(cid), stt = srStatusOf(cid);
        const cs = conceptState(cid);
        grid.appendChild(el("a", { class: "concept-tile", href: "#practice/" + cid }, [
          el("div", { class: "t" }, [el("span", { class: "status-dot " + (stt || "") }), el("span", { text: t.title })]),
          el("div", { class: "m" }, [
            el("div", { class: "bar thin " + (m0 >= 75 ? "g" : m0 >= 45 ? "a" : m0 > 0 ? "r" : "") }, [el("i", { style: { width: m0 + "%" } })]),
            el("span", { class: "v", text: cs.attempts ? cs.correct + "/" + cs.attempts : "—" })
          ])
        ]));
      });
      root.appendChild(grid);
    });
  });
}

function practiceConcept(root, t, pinnedId) {
  const id = t.id;
  let level = t.level || 2;
  let session = { asked: 0, correct: 0 };

  root.appendChild(el("div", { class: "row spread" }, [
    el("div", {}, [
      el("div", { class: "row" }, [
        el("a", { class: "chip", href: "#practice", text: "← all concepts" }),
        el("a", { class: "chip", href: "#learn/" + id, text: "◎ Lesson" }),
        t.lab && SIM_BY_ID[t.lab] ? el("a", { class: "chip", href: "#lab/" + t.lab, text: "⚗ Lab" }) : null
      ]),
      el("h1", { class: "page-title", style: { marginTop: "8px" }, text: "Practice: " + t.title })
    ]),
    el("div", { class: "card tight", style: { minWidth: "210px" } }, [
      el("div", { class: "row spread small" }, [el("span", { class: "muted", text: "Mastery" }), el("b", { class: "mono", id: "pm-" + id, text: masteryOf(id) + "%" })]),
      el("div", { class: "bar mt-s" }, [el("i", { id: "pb-" + id, style: { width: masteryOf(id) + "%" } })]),
      el("div", { class: "row spread small mt-s" }, [el("span", { class: "muted", text: "This session" }), el("b", { class: "mono", id: "ps-" + id, text: "0 / 0" })])
    ])
  ]));
  root.appendChild(el("p", { class: "page-sub", text: t.simple }));

  /* level selector */
  const lvRow = el("div", { class: "pill-tabs mb" });
  const slot = el("div");
  function paintLevels() {
    lvRow.innerHTML = "";
    ALL_LEVELS.forEach(lv => {
      lvRow.appendChild(el("button", {
        class: "pill " + (lv === level ? "active" : ""),
        onclick: () => { level = lv; paintLevels(); next(); }
      }, [el("span", { text: LEVELS[lv].icon + " " + LEVELS[lv].name })]));
    });
    lvRow.appendChild(el("button", { class: "pill", text: "🎲 Mixed levels", onclick: () => { level = 0; paintLevels(); next(); } }));
  }

  function next() {
    slot.innerHTML = "";
    const lv = level || pick(ALL_LEVELS);
    let q = null;
    if (pinnedId) {                       /* deep link: "practice this concept again" */
      const bank = QUESTION_BANK[id];
      [1, 2, 3, 4].forEach(l => (bank && bank[l] || []).forEach(x => { if (x.id === pinnedId) q = x; }));
      pinnedId = null;
    }
    if (!q) q = questionFor(id, lv);
    if (!q) { slot.appendChild(el("div", { class: "empty", text: "No question available at this level." })); return; }

    const g = el("div", { class: "grid g-2-1" });
    const rq = renderQuestion(q, {
      mode: "practice",
      onSubmit: res => {
        recordAnswer({ conceptId: id, level: lv, correct: res.correct, question: q, yourAnswer: res.yourAnswer });
        session.asked++; if (res.correct) session.correct++;
        const pb = $("#pb-" + id), pm = $("#pm-" + id), ps = $("#ps-" + id);
        if (pb) pb.style.width = masteryOf(id) + "%";
        if (pm) pm.textContent = masteryOf(id) + "%";
        if (ps) ps.textContent = session.correct + " / " + session.asked;
        App.refreshChrome();
      }
    });
    g.appendChild(rq.node);

    /* reasoning coach */
    const coach = el("div", { class: "card" });
    coach.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Explain your reasoning first" }));
    coach.appendChild(el("p", { class: "small muted", text: "Before calculating, work down this list. It is the same sequence the case studies use, and the sequence shown in the answer feedback." }));
    const prompts = [
      "What principle governs this problem?",
      "What information is given, and what is missing?",
      "What assumptions are you making, and are they justified?",
      "Which equation follows from the principle?",
      "What is the numerical result, with units?",
      "Does the result make physical sense, and is the component safe?"
    ];
    const areas = [];
    prompts.forEach((p, i) => {
      const ta = el("textarea", { style: { minHeight: "46px" }, placeholder: "…" });
      areas.push(ta);
      coach.appendChild(el("label", { class: "fld mt-s" }, [(i + 1) + ". " + p, ta]));
    });
    coach.appendChild(el("button", { class: "btn btn-sm mt", text: "Compare with the model reasoning", onclick: () => {
      const box = el("div", { class: "reveal mt-s" });
      box.appendChild(el("b", { text: "Model reasoning for this question:" }));
      const s = el("div", { class: "steps-reason mt-s" });
      (q.reasoning && q.reasoning.length ? q.reasoning : prompts.map(() => "See the feedback panel after submitting.")).forEach(x => s.appendChild(el("div", { text: x })));
      box.appendChild(s);
      if (!coach.querySelector(".reveal")) coach.appendChild(box);
    } }));
    g.appendChild(coach);
    slot.appendChild(g);
  }

  paintLevels();
  next();
  root.appendChild(lvRow);
  root.appendChild(slot);
  root.appendChild(el("div", { class: "row mt" }, [el("button", { class: "btn", text: "↻ Next question", onclick: next })]));
}
