/* ═══════════════════════════════════════════════════════════
   views/dashboard.js
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewDashboard(root) {
  const om = overallMastery();
  const answered = TOPIC_LIST.reduce((a, t) => a + (STATE.concepts[t.id] ? STATE.concepts[t.id].attempts : 0), 0);
  const correct = TOPIC_LIST.reduce((a, t) => a + (STATE.concepts[t.id] ? STATE.concepts[t.id].correct : 0), 0);
  const due = dueConcepts();
  const acc = accuracyLast(25);
  const next = nextConceptToStudy();
  const nt = TOPICS[next];

  /* ── hero ── */
  root.appendChild(el("div", { class: "hero" }, [
    el("svg", { class: "hero-glyph", viewBox: "0 0 200 200" }, [
      svg("circle", { cx: 100, cy: 100, r: 78, fill: "none", stroke: "#0284c7", "stroke-width": 2, "stroke-dasharray": "6 8" }),
      svg("circle", { cx: 100, cy: 100, r: 46, fill: "none", stroke: "#0284c7", "stroke-width": 3 }),
      svg("path", { d: "M100 22 v34 M100 144 v34 M22 100 h34 M144 100 h34", stroke: "#0284c7", "stroke-width": 4 }),
      svg("path", { d: "M40 160 L160 40", stroke: "#0ea5e9", "stroke-width": 2, "stroke-dasharray": "4 6" })
    ]),
    el("h1", { text: "Mechanical Engineering Thinking Trainer" }),
    el("p", { text: "Explore the knowledge map, visualise the physics, then prove you can reason like an engineer. Every concept follows the same cycle: understand → visualise → explore → practise → explain." }),
    el("div", { class: "cta" }, [
      el("a", { class: "btn btn-primary btn-lg", href: "#learn/" + next, text: `▶ Continue: ${nt.title}` }),
      el("a", { class: "btn btn-lg", href: "#quiz", text: "⏱ Start a quiz" }),
      el("a", { class: "btn btn-lg btn-ghost", href: "#lab", text: "⚗ Interactive lab" })
    ])
  ]));

  /* ── stats ── */
  const stats = el("div", { class: "grid g4 mt" });
  [["Overall mastery", om + "%"], ["Accuracy (last 25)", acc === null ? "—" : acc + "%"],
   ["Questions answered", String(answered)], ["Concepts started", TOPIC_LIST.filter(t => STATE.concepts[t.id] && STATE.concepts[t.id].attempts).length + " / " + TOPIC_LIST.length]
  ].forEach(([k, v]) => stats.appendChild(el("div", { class: "card" }, [el("div", { class: "stat" }, [el("b", { text: v }), el("span", { text: k })])])));
  root.appendChild(stats);

  /* ── mastery by topic + SR panel ── */
  const g = el("div", { class: "grid g-2-1 mt" });

  const masteryCard = el("div", { class: "card" });
  masteryCard.appendChild(el("div", { class: "row spread" }, [
    el("div", { class: "section-title", style: { margin: 0 }, text: "Mastery by domain" }),
    el("a", { class: "btn btn-sm btn-ghost", href: "#progress", text: "Full report →" })
  ]));
  MODULES.forEach(m => {
    m.sections.forEach(s => {
      const st = sectionStats(s.id);
      const cls = st.mastery >= 75 ? "g" : st.mastery >= 45 ? "a" : "r";
      masteryCard.appendChild(el("div", { class: "module-row mod-" + m.id }, [
        el("a", { class: "nm", href: "#map/" + s.id, text: s.name }),
        el("div", { class: "bar " + cls }, [el("i", { style: { width: st.mastery + "%" } })]),
        el("div", { class: "pc", text: st.mastery + "%" })
      ]));
    });
  });
  g.appendChild(masteryCard);

  const side = el("div", { class: "grid" });
  /* spaced repetition */
  const sr = el("div", { class: "card" });
  sr.appendChild(el("div", { class: "section-title", style: { margin: "0 0 8px" }, text: "Spaced repetition" }));
  sr.appendChild(el("p", { class: "small muted", text: "Reviews are scheduled at 1, 2, 4, 7, 14 and 30 days. Correct answers push the interval forward; a mistake resets it to one day." }));
  if (due.length) {
    sr.appendChild(el("div", { class: "row spread mt-s" }, [
      el("b", { class: "mono", text: due.length + " concept" + (due.length > 1 ? "s" : "") + " due" }),
      el("a", { class: "btn btn-sm btn-primary", href: "#practice/" + due[0].id, text: "Review now" })
    ]));
    const list = el("div", { class: "vocab mt-s" });
    due.slice(0, 8).forEach(t => list.appendChild(el("a", { class: "w", href: "#learn/" + t.id, title: t.simple }, [el("b", { text: t.title })])));
    sr.appendChild(list);
  } else {
    sr.appendChild(el("div", { class: "small mt-s", text: answered ? "✓ Nothing due right now. Keep studying to build the schedule." : "Answer a few questions to start the review schedule." }));
  }
  side.appendChild(sr);

  /* weak concepts */
  const weak = weakConcepts().slice(0, 6);
  const wc = el("div", { class: "card" });
  wc.appendChild(el("div", { class: "section-title", style: { margin: "0 0 8px" }, text: "Needs work" }));
  if (weak.length) {
    weak.forEach(t => {
      const m = masteryOf(t.id);
      wc.appendChild(el("div", { class: "module-row" }, [
        el("a", { class: "nm", href: "#learn/" + t.id, text: t.title }),
        el("div", { class: "bar " + (m >= 45 ? "a" : "r") }, [el("i", { style: { width: m + "%" } })]),
        el("div", { class: "pc", text: m + "%" })
      ]));
    });
    wc.appendChild(el("a", { class: "btn btn-sm mt-s", href: "#quiz/weakness", text: "⚡ Weakness quiz" }));
  } else {
    wc.appendChild(el("div", { class: "small", text: answered ? "✓ No weak concepts recorded yet — excellent." : "Weak concepts will appear here after your first mistakes." }));
  }
  side.appendChild(wc);
  g.appendChild(side);
  root.appendChild(g);

  /* ── modules strip ── */
  root.appendChild(el("div", { class: "section-title", text: "The mechanics knowledge map" }));
  const mg = el("div", { class: "grid g3" });
  MODULES.forEach(m => {
    const ms = moduleStats(m.id);
    const card = el("a", { class: "card accent mod-" + m.id, href: "#map/" + m.id, style: { textDecoration: "none", color: "inherit" } });
    card.appendChild(el("div", { class: "row" }, [el("span", { class: "chip n", text: m.code }), el("h4", { style: { margin: 0, fontSize: "15px" }, text: m.name })]));
    card.appendChild(el("p", { class: "small muted mt-s", text: m.blurb }));
    card.appendChild(el("div", { class: "bar mt-s" + (ms.mastery >= 75 ? " g" : ms.mastery >= 45 ? " a" : " r") }, [el("i", { style: { width: ms.mastery + "%" } })]));
    card.appendChild(el("div", { class: "row spread mt-s small muted" }, [
      el("span", { text: `${ms.started}/${ms.total} concepts started` }), el("b", { class: "mono", text: ms.mastery + "%" })
    ]));
    mg.appendChild(card);
  });
  root.appendChild(mg);

  /* ── recent activity ── */
  const hist = recentHistory(8);
  if (hist.length) {
    root.appendChild(el("div", { class: "section-title", text: "Recent activity" }));
    const hc = el("div", { class: "card tight" });
    hist.forEach(h => {
      hc.appendChild(el("div", { class: "row spread", style: { padding: "6px 4px", borderBottom: "1px solid var(--line-soft)" } }, [
        el("span", { class: "small" }, [el("span", { text: h.correct ? "✓ " : "✗ ", style: { color: h.correct ? "var(--green)" : "var(--red)" } }), el("a", { href: "#learn/" + h.conceptId, text: h.title })]),
        el("span", { class: "chip " + ["", "b", "i", "a", "k"][h.level], text: LEVELS[h.level].name }),
        el("span", { class: "small mono muted", text: new Date(h.t).toLocaleString() })
      ]));
    });
    root.appendChild(hc);
  }

  /* ── thinking chain ── */
  root.appendChild(el("div", { class: "section-title", text: "The reasoning habit this app trains" }));
  const chain = el("div", { class: "card" });
  const steps = ["What is the system?", "What type of mechanics applies?", "What are the loads / inputs?", "What assumptions can I make?",
    "What physical law governs it?", "What equations describe it?", "What is the result?", "Does the result make physical sense?",
    "Is the component safe?", "What happens in the real industrial case?"];
  const cw = el("div", { class: "chain" });
  steps.forEach((s, i) => {
    cw.appendChild(el("span", { class: "chain-node", text: s }));
    if (i < steps.length - 1) cw.appendChild(el("span", { class: "chain-arrow", text: "→" }));
  });
  chain.appendChild(cw);
  chain.appendChild(el("p", { class: "sim-note", text: "This is the sequence used by the case studies and by the reasoning steps shown after every graded question. Memorise the sequence, not the formulas." }));
  root.appendChild(chain);
}
