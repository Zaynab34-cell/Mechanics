/* ═══════════════════════════════════════════════════════════
   views/mistakes.js — the error log
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewMistakes(root) {
  const open = STATE.mistakes.filter(m => !m.resolved);
  root.appendChild(el("h1", { class: "page-title", text: "Mistake Log" }));
  root.appendChild(el("p", { class: "page-sub", text: "Every wrong answer is recorded with a full analysis. A mistake is only closed when you have re-studied the concept and answered correctly — that is what makes revision efficient." }));

  if (!STATE.mistakes.length) {
    root.appendChild(el("div", { class: "empty" }, [
      el("span", { class: "ico", text: "✓" }),
      "No mistakes recorded yet. Take a quiz or practise a concept — every wrong answer will be analysed here."
    ]));
    root.appendChild(el("div", { class: "row mt" }, [el("a", { class: "btn btn-primary", href: "#quiz/quick", text: "⚡ Take a quick quiz" })]));
    return;
  }

  /* summary */
  const byConcept = {};
  STATE.mistakes.forEach(m => { byConcept[m.conceptId] = (byConcept[m.conceptId] || 0) + 1; });
  const worst = Object.entries(byConcept).sort((a, b) => b[1] - a[1]).slice(0, 8);
  root.appendChild(el("div", { class: "grid g4 mb" }, [
    statCard(String(STATE.mistakes.length), "total mistakes"),
    statCard(String(open.length), "still open"),
    statCard(String(worst.length), "concepts affected"),
    statCard(String(masteryOf(worst[0] ? worst[0][0] : "force")) + "%", "mastery of worst concept")
  ]));

  if (worst.length) {
    root.appendChild(el("div", { class: "section-title", text: "Concepts that cost you the most" }));
    const wc = el("div", { class: "card tight mb" });
    worst.forEach(([cid, n]) => {
      const t = TOPICS[cid]; if (!t) return;
      wc.appendChild(el("div", { class: "module-row" }, [
        el("a", { class: "nm", href: "#learn/" + cid, text: t.title }),
        el("div", { class: "bar r" }, [el("i", { style: { width: clamp(n * 12, 8, 100) + "%" } })]),
        el("div", { class: "pc", text: n + "×" })
      ]));
    });
    wc.appendChild(el("div", { class: "row mt-s" }, [
      el("a", { class: "btn btn-sm btn-primary", href: "#quiz/weakness", text: "⚡ Weakness quiz" }),
      el("button", { class: "btn btn-sm", text: "Mark resolved entries cleared", onclick: () => { clearResolvedMistakes(); App.navigate("mistakes"); } })
    ]));
    root.appendChild(wc);
  }

  /* filters */
  let filter = "open";
  const tabs = el("div", { class: "pill-tabs mb" });
  const list = el("div");
  const paintTabs = () => {
    tabs.innerHTML = "";
    [["open", `Open (${open.length})`], ["all", `All (${STATE.mistakes.length})`], ["resolved", "Resolved"]].forEach(([k, lbl]) => {
      tabs.appendChild(el("button", { class: "pill " + (filter === k ? "active" : ""), text: lbl, onclick: () => { filter = k; paintTabs(); paintList(); } }));
    });
  };
  const paintList = () => {
    list.innerHTML = "";
    const items = STATE.mistakes.filter(m => filter === "all" ? true : filter === "open" ? !m.resolved : m.resolved);
    if (!items.length) { list.appendChild(el("div", { class: "empty", text: "Nothing in this view." })); return; }
    items.forEach(m => {
      const realIdx = STATE.mistakes.indexOf(m);
      const card = el("div", { class: "card mb" });
      card.appendChild(el("div", { class: "q-meta" }, [
        el("span", { class: "chip n", text: TYPE_LABEL[m.type] }),
        el("span", { class: "chip " + ["", "b", "i", "a", "k"][m.level], text: LEVELS[m.level].name }),
        el("a", { class: "chip", href: "#learn/" + m.conceptId, text: "◎ " + m.title }),
        el("span", { class: "chip mono", text: new Date(m.t).toLocaleString() }),
        m.resolved ? el("span", { class: "chip b", text: "resolved" }) : null
      ]));
      card.appendChild(el("p", { class: "q-text", html: math(m.prompt) }));
      const q = makeQuestion({
        conceptId: m.conceptId, level: m.level, type: m.type || "mcq", prompt: m.prompt,
        explanation: m.explanation, wrongWhy: m.wrongWhy, misconception: m.misconception,
        reasoning: m.reasoning, similar: m.similar, choices: null, answer: null
      });
      const fb = el("div", { class: "feedback no" });
      const grid = el("div", { class: "fb-grid" });
      const row = (k, v, cls) => grid.appendChild(el("div", { class: "fb-row" }, [el("b", { text: k }), el("div", { class: "v " + (cls || ""), html: math(String(v == null ? "—" : v)) })]));
      row("Your answer", m.your, "you");
      row("Correct answer", m.right, "right");
      if (m.wrongWhy) row("Why your answer was incorrect", m.wrongWhy);
      if (m.misconception) row("Concept you misunderstood", m.misconception);
      if (m.explanation) row("Engineering explanation", m.explanation);
      if (m.reasoning && m.reasoning.length) {
        const steps = el("div", { class: "steps-reason" });
        m.reasoning.forEach(s => steps.appendChild(el("div", { text: s })));
        grid.appendChild(el("div", { class: "fb-row" }, [el("b", { text: "Correct reasoning" }), steps]));
      }
      if (m.similar) row("Similar example", m.similar);
      fb.appendChild(grid);
      card.appendChild(fb);
      card.appendChild(el("div", { class: "row mt" }, [
        el("a", { class: "btn btn-sm btn-primary", href: "#practice/" + m.conceptId, text: "↻ Practise this concept again" }),
        el("a", { class: "btn btn-sm", href: "#learn/" + m.conceptId, text: "◎ Re-read the lesson" }),
        TOPICS[m.conceptId] && TOPICS[m.conceptId].lab ? el("a", { class: "btn btn-sm", href: "#lab/" + TOPICS[m.conceptId].lab, text: "⚗ Lab" }) : null,
        m.resolved ? null : el("button", { class: "btn btn-sm btn-ghost", text: "Mark resolved", onclick: () => { resolveMistake(realIdx); App.navigate("mistakes"); } })
      ]));
      list.appendChild(card);
    });
  };
  paintTabs(); paintList();
  root.appendChild(tabs); root.appendChild(list);
}
function statCard(v, k) { return el("div", { class: "card" }, [el("div", { class: "stat" }, [el("b", { text: v }), el("span", { text: k })])]); }
