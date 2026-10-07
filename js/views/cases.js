/* ═══════════════════════════════════════════════════════════
   views/cases.js — industrial case studies
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewCases(root, params) {
  const id = params[0] && CASE_BY_ID[params[0]] ? params[0] : null;
  if (id) return caseDetail(root, CASE_BY_ID[id]);

  root.appendChild(el("h1", { class: "page-title", text: "Industrial Case Studies" }));
  root.appendChild(el("p", { class: "page-sub", text: "Realistic scenarios with incomplete information, exactly as they arrive in industry. Write your own answer to every question before revealing the model answer — the reasoning, not the recall, is what is being trained." }));

  const g = el("div", { class: "grid g2" });
  CASES.forEach(c => {
    const st = STATE.cases[c.id] || { answered: [] };
    const done = st.answered.length, total = c.questions.length;
    g.appendChild(el("a", { class: "case-card", href: "#cases/" + c.id, style: { textDecoration: "none", color: "inherit", display: "block" } }, [
      el("header", {}, [
        el("span", { style: { fontSize: "20px" }, text: c.icon }),
        el("div", {}, [el("h4", { text: c.title }), el("div", { class: "small muted", text: c.domain })]),
        el("span", { class: "chip k", style: { marginLeft: "auto" }, text: "⚫ level " + c.difficulty })
      ]),
      el("div", { class: "body" }, [
        el("p", { class: "small", text: c.scenario.split("\n")[0].trim() + "…" }),
        el("div", { class: "row spread mt-s" }, [
          el("span", { class: "chip", text: total + " guided questions" }),
          el("div", { class: "bar thin", style: { width: "90px" } }, [el("i", { style: { width: (100 * done / total) + "%" } })])
        ])
      ])
    ]));
  });
  root.appendChild(g);

  root.appendChild(el("div", { class: "section-title", text: "How to work a case study" }));
  const how = el("div", { class: "card" });
  const steps = el("div", { class: "steps-reason" });
  ["Read the scenario twice. On the second pass, list every number, every symptom and every missing piece of data.",
    "Define the system boundary and identify which mechanics domain governs (rigid body, deformable body, or fluid).",
    "State your assumptions explicitly — in industry they are what your answer is judged on.",
    "Answer each guided question in writing before revealing the model answer.",
    "Finish with the checklist: what would you inspect, measure or change on the real component?"].forEach(s => steps.appendChild(el("div", { text: s })));
  how.appendChild(steps);
  root.appendChild(how);
}

function caseDetail(root, c) {
  const st = STATE.cases[c.id] || (STATE.cases[c.id] = { answered: [] });

  root.appendChild(el("div", { class: "row spread" }, [
    el("div", {}, [
      el("a", { class: "chip", href: "#cases", text: "← all case studies" }),
      el("h1", { class: "page-title", style: { marginTop: "8px" }, text: c.icon + "  " + c.title })
    ]),
    el("span", { class: "chip k", text: c.domain })
  ]));

  root.appendChild(el("div", { class: "card mb" }, [
    el("div", { class: "section-title", style: { margin: 0 }, text: "Scenario" }),
    el("div", { class: "case-scenario mt-s", text: c.scenario })
  ]));

  c.questions.forEach((q, i) => {
    const box = el("div", { class: "case-q" });
    box.appendChild(el("div", { class: "cq" }, [el("span", { class: "n", text: "Q" + (i + 1) }), el("span", { text: q.q })]));
    const ta = el("textarea", { placeholder: "Write your answer before revealing the model answer…" });
    box.appendChild(ta);
    const revealBtn = el("button", { class: "btn btn-sm mt-s", text: "Reveal model answer" });
    const slot = el("div");
    revealBtn.onclick = () => {
      slot.innerHTML = "";
      const rv = el("div", { class: "reveal" });
      rv.appendChild(el("b", { text: "Model answer" }));
      rv.appendChild(el("div", { class: "mt-s", text: q.a }));
      if (q.concepts && q.concepts.length) {
        const voc = el("div", { class: "vocab mt-s" });
        q.concepts.forEach(cid => { if (TOPICS[cid]) voc.appendChild(el("a", { class: "w", href: "#learn/" + cid }, [el("b", { text: TOPICS[cid].title })])); });
        rv.appendChild(el("div", { class: "small muted mt-s", text: "Concepts involved:" }));
        rv.appendChild(voc);
      }
      slot.appendChild(rv);
      if (!st.answered.includes(i)) {
        st.answered.push(i);
        Store.save();
        /* a case study question counts as an industrial-level attempt on each concept */
        (q.concepts || []).filter(cid => TOPICS[cid]).slice(0, 3).forEach(cid => {
          recordAnswer({ conceptId: cid, level: 4, correct: true, question: makeQuestion({ conceptId: cid, level: 4, type: "explain", prompt: q.q, explanation: q.a }), yourAnswer: ta.value || "case study answer" });
        });
        App.refreshChrome();
      }
    };
    box.appendChild(revealBtn);
    box.appendChild(slot);
    root.appendChild(box);
  });

  /* checklist */
  root.appendChild(el("div", { class: "section-title", text: "Engineering checklist" }));
  const cl = el("div", { class: "card" });
  const steps = el("div", { class: "steps-reason" });
  c.checklist.forEach(s => steps.appendChild(el("div", { text: s })));
  cl.appendChild(steps);
  root.appendChild(cl);

  root.appendChild(el("div", { class: "section-title", text: "Applicable standards & codes" }));
  const sc = el("div", { class: "card" });
  const voc = el("div", { class: "vocab" });
  c.standards.forEach(s => voc.appendChild(el("span", { class: "w" }, [el("b", { text: s })])));
  sc.appendChild(voc);
  sc.appendChild(el("p", { class: "sim-note mt-s", text: "Standards define the allowable stress, the weld joint efficiency, the inspection regime and the safety factors. In professional practice they are not optional — and they usually govern before your own calculation does." }));
  root.appendChild(sc);

  root.appendChild(el("div", { class: "row mt" }, [
    el("a", { class: "btn btn-primary", href: "#cases", text: "← Other case studies" }),
    el("a", { class: "btn", href: "#quiz/mixed", text: "🎲 Test the whole map" })
  ]));
}
