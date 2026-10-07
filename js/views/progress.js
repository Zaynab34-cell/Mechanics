/* ═══════════════════════════════════════════════════════════
   views/progress.js — full progress report
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewProgress(root) {
  const om = overallMastery();
  const attempted = TOPIC_LIST.filter(t => conceptState(t.id).attempts > 0);
  const totalAns = STATE.history.length;

  root.appendChild(el("h1", { class: "page-title", text: "Progress Report" }));
  root.appendChild(el("p", { class: "page-sub", text: "Mastery is computed from your results at every difficulty level, weighted so that industrial-level questions count most. A concept is only mastered when you can apply it, analyse it and reason about it in an industrial context." }));

  /* ── overview ── */
  const ov = el("div", { class: "grid g-1-2 mb" });
  const ringCard = el("div", { class: "card center" });
  const R = 62, C = 2 * Math.PI * R;
  ringCard.appendChild(el("div", { style: { position: "relative", width: "160px", height: "160px", margin: "0 auto" } }, [
    svg("svg", { viewBox: "0 0 160 160", width: "160", height: "160" }, [
      svg("circle", { cx: 80, cy: 80, r: R, fill: "none", stroke: "#e5ecf4", "stroke-width": 12 }),
      svg("circle", { cx: 80, cy: 80, r: R, fill: "none", stroke: om >= 75 ? "#16a34a" : om >= 45 ? "#d97706" : "#0284c7", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": `${C * om / 100} ${C}`, transform: "rotate(-90 80 80)" }),
      svg("text", { x: 80, y: 76, "text-anchor": "middle", fill: "#0f172a", "font-size": "34", "font-family": "var(--mono)", "font-weight": "800", text: om + "%" }),
      svg("text", { x: 80, y: 98, "text-anchor": "middle", fill: "#35597f", "font-size": "11", "letter-spacing": "2", text: "MASTERY" })
    ])
  ]));
  ringCard.appendChild(el("div", { class: "row spread mt" }, [
    el("div", { class: "stat" }, [el("b", { text: String(attempted.length) }), el("span", { text: "concepts started" })]),
    el("div", { class: "stat" }, [el("b", { text: String(totalAns) }), el("span", { text: "answers logged" })]),
    el("div", { class: "stat" }, [el("b", { text: String(STATE.xp) }), el("span", { text: "XP" })])
  ]));
  ov.appendChild(ringCard);

  /* module bars */
  const mb = el("div", { class: "card" });
  mb.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Domain mastery" }));
  MODULES.forEach(m => {
    mb.appendChild(el("div", { class: "small muted mt-s", style: { letterSpacing: ".1em", fontWeight: "700" }, text: m.code + " · " + m.name.toUpperCase() }));
    m.sections.forEach(s => {
      const st = sectionStats(s.id);
      mb.appendChild(el("div", { class: "module-row" }, [
        el("span", { class: "nm", text: s.name }),
        el("div", { class: "bar " + (st.mastery >= 75 ? "g" : st.mastery >= 45 ? "a" : "r") }, [el("i", { style: { width: st.mastery + "%" } })]),
        el("div", { class: "pc", text: st.mastery + "%" })
      ]));
    });
  });
  ov.appendChild(mb);
  root.appendChild(ov);

  /* ── status distribution ── */
  const counts = { g: 0, y: 0, r: 0, n: 0 };
  TOPIC_LIST.forEach(t => { const s = srStatusOf(t.id); counts[s || "n"]++; });
  root.appendChild(el("div", { class: "section-title", text: "Spaced-repetition status" }));
  const sg = el("div", { class: "grid g4" });
  [["g", "Mastered", "≥ 75% mastery"], ["y", "Needs revision", "45–74% mastery"], ["r", "Weak", "< 45% mastery"], ["n", "Not started", "no attempts yet"]].forEach(([k, name, desc]) => {
    sg.appendChild(el("div", { class: "card" }, [
      el("div", { class: "row" }, [el("span", { class: "status-dot " + (k === "n" ? "" : k) }), el("b", { class: "mono", style: { fontSize: "22px" }, text: String(counts[k]) })]),
      el("div", { class: "small", text: name }), el("div", { class: "small muted", text: desc })
    ]));
  });
  root.appendChild(sg);

  /* ── by level ── */
  root.appendChild(el("div", { class: "section-title", text: "Performance by difficulty level" }));
  const lg = el("div", { class: "grid g4" });
  ALL_LEVELS.forEach(lv => {
    let a = 0, c = 0;
    STATE.history.forEach(h => { if (h.level === lv) { a++; if (h.correct) c++; } });
    const p = a ? Math.round(100 * c / a) : 0;
    lg.appendChild(el("div", { class: "card" }, [
      el("div", { class: "small muted", text: LEVELS[lv].icon + " " + LEVELS[lv].name }),
      el("b", { class: "mono", style: { fontSize: "24px" }, text: a ? p + "%" : "—" }),
      el("div", { class: "bar mt-s " + (p >= 75 ? "g" : p >= 45 ? "a" : "r") }, [el("i", { style: { width: p + "%" } })]),
      el("div", { class: "small muted mt-s", text: a ? c + " correct of " + a : "no attempts" })
    ]));
  });
  root.appendChild(lg);

  /* ── concept table ── */
  root.appendChild(el("div", { class: "section-title", text: "Concept-by-concept" }));
  MODULES.forEach(m => m.sections.forEach(s => {
    const card = el("div", { class: "card mb" });
    card.appendChild(el("div", { class: "row spread" }, [
      el("b", { text: s.name }),
      el("span", { class: "small muted", text: sectionStats(s.id).mastery + "% domain mastery" })
    ]));
    const tbl = el("table", { class: "var-table mt-s" });
    const tb = el("tbody");
    s.concepts.forEach(cid => {
      const t = TOPICS[cid], cs = conceptState(cid), m0 = masteryOf(cid), stt = srStatusOf(cid);
      tb.appendChild(el("tr", {}, [
        el("td", {}, [el("a", { href: "#learn/" + cid, text: t.title })]),
        el("td", { text: cs.attempts ? cs.correct + " / " + cs.attempts + " correct" : "—" }),
        el("td", { html: `<span class="status-dot ${stt || ""}" style="display:inline-block;margin-right:6px"></span>${stt ? SR_LABEL[stt] : "not started"}` }),
        el("td", { text: cs.sr && cs.sr.due ? "due " + cs.sr.due : "—" }),
        el("td", { html: `<div class="bar thin ${m0 >= 75 ? "g" : m0 >= 45 ? "a" : m0 > 0 ? "r" : ""}" style="min-width:80px"><i style="width:${m0}%"></i></div>` }),
        el("td", { text: m0 + "%" })
      ]));
    });
    tbl.appendChild(tb);
    card.appendChild(tbl);
    root.appendChild(card);
  }));

  /* ── activity chart ── */
  root.appendChild(el("div", { class: "section-title", text: "Activity — last 21 days" }));
  root.appendChild(activityChart());

  /* ── quiz history ── */
  if (STATE.quizzes.length) {
    root.appendChild(el("div", { class: "section-title", text: "Quiz history" }));
    const qc = el("div", { class: "card tight" });
    STATE.quizzes.forEach(q => {
      qc.appendChild(el("div", { class: "row spread", style: { padding: "6px 4px", borderBottom: "1px solid var(--line-soft)" } }, [
        el("span", { class: "small", text: q.mode }),
        el("div", { class: "bar thin", style: { flex: "1", margin: "0 14px" } }, [el("i", { style: { width: q.pct + "%" } })]),
        el("b", { class: "mono small", text: q.score + "/" + q.total }),
        el("span", { class: "small muted mono", text: new Date(q.t).toLocaleString() })
      ]));
    });
    root.appendChild(qc);
  }

  root.appendChild(el("div", { class: "row mt" }, [
    el("a", { class: "btn btn-primary", href: "#quiz/quick", text: "⚡ Test yourself again" }),
    el("button", { class: "btn btn-danger btn-ghost", text: "Reset all progress", onclick: () => {
      if (confirm("This permanently deletes all mastery data, mistakes and quiz history. Continue?")) { Store.reset(); App.navigate("dashboard"); toast("Progress reset.", "ok"); }
    } })
  ]));
}

function activityChart() {
  const days = 21, W = 700, H = 120, pad = 24;
  const buckets = new Array(days).fill(0).map(() => ({ n: 0, ok: 0 }));
  STATE.history.forEach(h => {
    const d = daysBetween(dayKey(h.t), todayKey());
    if (d >= 0 && d < days) { const i = days - 1 - d; buckets[i].n++; if (h.correct) buckets[i].ok++; }
  });
  const max = Math.max(1, ...buckets.map(b => b.n));
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto" });
  const bw = (W - pad * 2) / days;
  buckets.forEach((b, i) => {
    const x = pad + i * bw, hTot = (H - 34) * b.n / max, hOk = (H - 34) * b.ok / max;
    s.appendChild(svg("rect", { x: x + 2, y: H - 22 - hTot, width: bw - 5, height: hTot, fill: "#dbe6f2", rx: 2 }));
    s.appendChild(svg("rect", { x: x + 2, y: H - 22 - hOk, width: bw - 5, height: hOk, fill: "#16a34a", rx: 2 }));
    if (i % 3 === 0) s.appendChild(svg("text", { x: x + bw / 2, y: H - 6, "text-anchor": "middle", fill: "#35597f", "font-size": "9", text: dayKey(Date.now() - (days - 1 - i) * DAY).slice(5) }));
  });
  s.appendChild(svg("text", { x: pad, y: 12, fill: "#35597f", "font-size": "10", text: "green = correct, dark = total answers" }));
  const frame = svg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" });
  Array.from(s.childNodes).forEach(n => frame.appendChild(n));
  const wrap = el("div", { class: "card" });
  wrap.appendChild(frame);
  return wrap;
}
