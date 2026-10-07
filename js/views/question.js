/* ═══════════════════════════════════════════════════════════
   views/question.js — the question component shared by
   Practice, Quiz and Weakness mode. Renders every question
   type, grades the answer and builds the error analysis.
   ═══════════════════════════════════════════════════════════ */
"use strict";

const TYPE_LABEL = {
  mcq: "Multiple choice", num: "Numerical", numeric: "Numerical", tf: "True / False",
  match: "Match concepts", order: "Order the steps", select: "Select the correct answer",
  identify: "Identify", predict: "Predict the effect", fill: "Complete the equation",
  explain: "Engineering explanation"
};

/* ---------- grading ---------- */
function gradeQuestion(q, ans) {
  switch (q.type) {
    case "mcq": case "tf": case "select": case "identify": case "predict":
      return { ok: ans !== null && ans !== undefined && ans === q.answer, text: (q.choices && ans !== null && ans !== undefined) ? q.choices[ans] : "no answer" };
    case "num": case "numeric": {
      const v = parseFloat(ans);
      if (!isFinite(v)) return { ok: false, text: "no answer" };
      return { ok: nearlyEqual(v, q.answer, q.tol || 0.02), text: `${sig(v, 4)} ${q.unit || ""}`.trim() };
    }
    case "match": {
      if (!Array.isArray(ans)) return { ok: false, text: "no answer" };
      const pairs = q._pairs || q.pairs;
      const ok = ans.every((v, i) => v !== null && v !== undefined && pairs[i][1] === v);
      const text = ans.map((v, i) => `${(q._left || pairs.map(p => p[0]))[i]} → ${v || "—"}`).join(" · ");
      return { ok, text };
    }
    case "order": {
      if (!Array.isArray(ans)) return { ok: false, text: "no answer" };
      const ok = ans.length === q.correctOrder.length && ans.every((v, i) => v === q.correctOrder[i]);
      return { ok, text: ans.map(i => q.items[i]).join(" → ") };
    }
    case "fill": {
      if (!Array.isArray(ans)) return { ok: false, text: "no answer" };
      const ok = ans.every((v, i) => String(v || "").trim().toLowerCase() === String(q.answer[i]).trim().toLowerCase());
      return { ok, text: ans.join(" ") };
    }
    case "explain": {
      const txt = String(ans || "");
      const words = txt.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
      const keys = (q.keywords || []).map(k => String(k).toLowerCase());
      const hit = keys.filter(k => txt.toLowerCase().includes(k));
      const sentences = txt.split(/[.!?]+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3);
      const coverage = keys.length ? hit.length / keys.length : 0;
      const length = words.length;
      let score = 0;
      score += Math.min(coverage, 1) * 50;                                   // technical vocabulary
      score += clamp(length / 45, 0, 1) * 30;                                // substance
      score += clamp(sentences.length / 3, 0, 1) * 20;                       // structure
      score = Math.round(score);
      return {
        ok: score >= 55, score,
        text: `${score}/100 — vocabulary ${hit.length}/${keys.length} (${hit.join(", ") || "none of the expected terms"}), ${words.length} words, ${sentences.length} complete sentences`,
        detail: { coverage: Math.round(coverage * 100), words: length, sentences: sentences.length, hit, missing: keys.filter(k => !hit.includes(k)) }
      };
    }
    default: return { ok: false, text: "ungraded" };
  }
}

/* canonical correct answer for any question — used by the validity sweep and "show solution" */
function answerKey(q) {
  switch (q.type) {
    case "match": return (q.pairs || []).map(pr => pr[1]);
    case "order": return (q.correctOrder || []).slice();
    case "explain": {
      const k = q.keywords || [];
      const parts = k.map(w => `The ${w} behaviour is the governing consideration here.`);
      parts.push("In service the component is checked against its allowable limit and every assumption is stated.");
      parts.push(q.explanation || "The physical mechanism, not the formula, explains the observation.");
      return parts.join(" ");
    }
    default: return q.answer;
  }
}

/* ---------- rendering ---------- */
/* opts: {mode:'practice'|'quiz', onSubmit(result), showConcept:boolean} */
function renderQuestion(q, opts = {}) {
  const wrap = el("div", { class: "q-card" });
  const t = TOPICS[q.conceptId];
  let answer = null, submitted = false;

  /* meta row */
  const meta = el("div", { class: "q-meta" }, [
    el("span", { class: "chip n", text: TYPE_LABEL[q.type] || q.type }),
    el("span", { class: "chip " + ["", "b", "i", "a", "k"][q.level], text: `${LEVELS[q.level].icon} ${LEVELS[q.level].name}` }),
    t ? el("a", { class: "chip", href: "#learn/" + q.conceptId, text: "◎ " + t.title }) : null,
    q.english ? el("span", { class: "chip k", text: "Engineering English" }) : null
  ]);
  wrap.appendChild(meta);
  wrap.appendChild(el("p", { class: "q-text", html: math(q.prompt) }));
  if (q.context) wrap.appendChild(el("div", { class: "q-context", text: q.context }));

  const feedbackSlot = el("div");
  const actions = el("div", { class: "row mt" });

  /* ── type-specific body ─────────────────────────── */
  const body = el("div");
  wrap.appendChild(body);

  const getAnswer = () => answer;

  switch (q.type) {
    case "mcq": case "select": case "identify": case "predict": {
      const list = el("div", { class: "choices" });
      q.choices.forEach((c, i) => {
        const row = el("div", { class: "choice", onclick: () => { if (submitted) return; answer = i; $$(".choice", list).forEach(n => n.classList.remove("sel")); row.classList.add("sel"); } },
          [el("span", { class: "k", text: "ABCD"[i] }), el("span", { html: math(c) })]);
        list.appendChild(row);
      });
      body.appendChild(list);
      break;
    }
    case "tf": {
      const list = el("div", { class: "tf-row" });
      ["True", "False"].forEach((c, i) => {
        const row = el("div", { class: "choice", onclick: () => { if (submitted) return; answer = i; $$(".choice", list).forEach(n => n.classList.remove("sel")); row.classList.add("sel"); } },
          [el("span", { text: c })]);
        list.appendChild(row);
      });
      body.appendChild(list);
      break;
    }
    case "num": case "numeric": {
      const inp = el("input", { type: "number", step: "any", placeholder: "your value" });
      const row = el("div", { class: "num-row" }, [
        el("label", { class: "fld" }, ["Answer", inp]),
        el("span", { class: "unit-tag", text: q.unit || "(dimensionless)" }),
        el("span", { class: "unit-tag", text: `±${((q.tol || 0.02) * 100).toFixed(0)}% tolerance` })
      ]);
      body.appendChild(row);
      q.getAnswer = () => inp.value;
      break;
    }
    case "match": {
      const left = shuffle(q.pairs.map(p => p[0]));
      const right = shuffle(q.pairs.map(p => p[1]));
      q._left = left;
      const sel = { l: null, r: null };
      const chosen = new Array(left.length).fill(null);
      const grid = el("div", { class: "match-grid" });
      const lc = el("div", { class: "match-col" }), rc = el("div", { class: "match-col" });
      q._leftEls = [];
      const used = new Set();
      left.forEach((txt, i) => {
        const it = el("div", { class: "match-item" }, [el("span", { class: "tag", text: (i + 1) + "." }), txt]);
        it.onclick = () => {
          if (submitted || it.classList.contains("locked")) return;
          $$(".match-item", lc).forEach(n => n.classList.remove("sel"));
          it.classList.add("sel"); sel.l = i; tryPair();
        };
        lc.appendChild(it); q._leftEls[i] = it;
      });
      right.forEach((txt) => {
        const it = el("div", { class: "match-item", text: txt });
        it.onclick = () => {
          if (submitted || used.has(txt)) return;
          $$(".match-item", rc).forEach(n => n.classList.remove("sel"));
          it.classList.add("sel"); sel.r = txt; tryPair();
        };
        rc.appendChild(it);
      });
      function tryPair() {
        if (sel.l === null || sel.r === null) return;
        const l = sel.l, r = sel.r;
        chosen[l] = r; used.add(r);
        const li = lc.children[l];
        li.classList.remove("sel"); li.classList.add("locked");
        li.innerHTML = "";
        li.appendChild(el("span", { class: "tag", text: (l + 1) + "." }));
        li.appendChild(document.createTextNode(left[l] + " → " + r));
        const ri = Array.from(rc.children).find(n => n.textContent === r);
        if (ri) { ri.classList.remove("sel"); ri.classList.add("locked"); ri.style.opacity = ".45"; }
        sel.l = sel.r = null;
        answer = chosen.slice();
      }
      grid.appendChild(lc); grid.appendChild(rc);
      body.appendChild(grid);
      q.getAnswer = () => chosen.slice();
      break;
    }
    case "order": {
      const order = q.items.map((_, i) => i);
      const list = el("div", { class: "dnd-list" });
      function paint() {
        list.innerHTML = "";
        order.forEach((itemIdx, pos) => {
          const row = el("div", { class: "dnd-item", draggable: "true", dataset: { pos: String(pos) } }, [
            el("span", { class: "h", text: "⋮⋮" }),
            el("span", { class: "idx", text: String(pos + 1) }),
            el("span", { text: q.items[itemIdx] }),
            el("span", { class: "dnd-updown" }, [
              el("button", { text: "▲", onclick: e => { e.stopPropagation(); if (pos > 0) { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; paint(); answer = order.slice(); } } }),
              el("button", { text: "▼", onclick: e => { e.stopPropagation(); if (pos < order.length - 1) { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; paint(); answer = order.slice(); } } })
            ])
          ]);
          row.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(pos)); row.style.opacity = ".5"; });
          row.addEventListener("dragend", () => { row.style.opacity = "1"; });
          row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("drag-over"); });
          row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
          row.addEventListener("drop", e => {
            e.preventDefault(); row.classList.remove("drag-over");
            const from = +e.dataTransfer.getData("text/plain");
            if (Number.isNaN(from) || from === pos) return;
            const moved = order.splice(from, 1)[0];
            order.splice(pos, 0, moved);
            paint(); answer = order.slice();
          });
          list.appendChild(row);
        });
      }
      paint();
      body.appendChild(list);
      q.getAnswer = () => order.slice();
      break;
    }
    case "fill": {
      const line = el("div", { class: "q-text" });
      const inputs = [];
      q.items.forEach(part => {
        if (part === "_") {
          const inp = el("input", { type: "text", placeholder: "?" });
          inputs.push(inp);
          line.appendChild(el("span", { class: "fill" }, [inp]));
        } else line.appendChild(el("span", { html: math(part) }));
      });
      body.appendChild(line);
      q.getAnswer = () => inputs.map(i => i.value);
      break;
    }
    case "explain": {
      const ta = el("textarea", { placeholder: "Explain in English, 2–4 sentences. Use the technical vocabulary of this domain." });
      body.appendChild(ta);
      if (q.keywords && q.keywords.length) {
        body.appendChild(el("div", { class: "mt-s small muted", text: "Terms the examiner is looking for: " + q.keywords.join(", ") }));
      }
      q.getAnswer = () => ta.value;
      break;
    }
  }

  /* ── submit + feedback ─────────────────────────── */
  wrap.appendChild(feedbackSlot);

  const submitBtn = el("button", { class: "btn btn-primary", text: "Check answer", onclick: () => {
    if (submitted) return;
    const raw = q.getAnswer ? q.getAnswer() : getAnswer();
    if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.some(x => x === null))) {
      if (!(q.type === "explain" && String(raw || "").trim().length > 0)) { toast("Provide an answer first.", "err"); return; }
    }
    submitted = true;
    const res = gradeQuestion(q, raw);
    const result = { question: q, conceptId: q.conceptId, level: q.level, correct: res.ok, yourAnswer: res.text, grade: res };
    submitBtn.disabled = true;
    submitBtn.textContent = res.ok ? "Correct" : "Incorrect";
    submitBtn.classList.remove("btn-primary");
    submitBtn.classList.add(res.ok ? "on" : "btn-danger");
    /* mark choices */
    $$(".choice", body).forEach((n, i) => {
      n.classList.remove("sel");
      if (i === q.answer) n.classList.add("ok");
      else if (q.type !== "num" && raw === i) n.classList.add("no");
    });
    if (q.type === "order") {
      $$(".dnd-item", body).forEach((n, pos) => {
        const itemIdx = q.getAnswer()[pos];
        n.classList.add(q.correctOrder[pos] === itemIdx ? "ok" : "no");
      });
    }
    if (q.type === "match" && q._leftEls) {
      const pairs = q._pairs || q.pairs;
      const got = q.getAnswer ? q.getAnswer() : answer;
      q._leftEls.forEach((node, i) => { if (node) node.classList.add(got && got[i] === pairs[i][1] ? "ok" : "no"); });
    }
    feedbackSlot.appendChild(buildFeedback(q, res, opts));
    if (opts.onSubmit) opts.onSubmit(result);
  } });
  actions.appendChild(submitBtn);
  if (opts.onSkip) actions.appendChild(el("button", { class: "btn btn-ghost", text: "Skip", onclick: opts.onSkip }));
  wrap.appendChild(actions);

  /* keyboard: Enter submits for numeric/text */
  wrap.addEventListener("keydown", e => {
    if (e.key === "Enter" && !submitted && (q.type === "num" || q.type === "fill")) { e.preventDefault(); submitBtn.click(); }
  });
  /* number keys select MCQ options */
  wrap.tabIndex = 0;
  return { node: wrap, submit: submitBtn, getState: () => ({ answer, submitted }) };
}

/* ---------- error analysis / feedback ---------- */
function buildFeedback(q, res, opts = {}) {
  const fb = el("div", { class: "feedback " + (res.ok ? "ok" : "no") });
  fb.appendChild(el("h4", {}, [
    el("span", { text: res.ok ? "✓ Correct" : "✗ Not correct" }),
    q.type === "explain" ? el("span", { class: "chip k", text: `Score ${res.score}/100` }) : null
  ]));

  const grid = el("div", { class: "fb-grid" });
  const row = (k, v, cls) => grid.appendChild(el("div", { class: "fb-row" }, [el("b", { text: k }), el("div", { class: "v " + (cls || ""), html: math(v) })]));

  row("Your answer", res.text || "—", "you");
  if (!res.ok || q.type === "explain") {
    row("Correct answer", answerText(q), "right");
    if (res.ok === false) {
      if (q.wrongWhy) row("Why your answer is incorrect", q.wrongWhy);
      if (q.misconception) row("Concept you may have misunderstood", q.misconception);
    }
  }
  if (q.explanation) row("Engineering explanation", q.explanation);
  if (q.reasoning && q.reasoning.length) {
    const steps = el("div", { class: "steps-reason" });
    q.reasoning.forEach(s => steps.appendChild(el("div", { text: s })));
    grid.appendChild(el("div", { class: "fb-row" }, [el("b", { text: "Correct engineering reasoning" }), steps]));
  }
  if (res.ok === false && q.similar) row("Similar example", q.similar);
  if (q.type === "explain" && res.detail) {
    row("Vocabulary used", res.detail.hit.length ? res.detail.hit.join(", ") : "none of the expected terms");
    if (res.detail.missing.length) row("Vocabulary missing", res.detail.missing.join(", "));
    row("Clarity", `${res.detail.words} words, ${res.detail.sentences} complete sentences — aim for 2–4 clear sentences with the governing principle named first.`);
  }
  fb.appendChild(grid);

  const t = TOPICS[q.conceptId];
  const act = el("div", { class: "row mt" });
  if (!res.ok && t) {
    act.appendChild(el("button", { class: "btn btn-primary btn-sm", text: "↻ Practice this concept again", onclick: () => { setHash("practice/" + q.conceptId + (q.id ? "/" + q.id : "")); } }));
    act.appendChild(el("button", { class: "btn btn-sm", text: "◎ Study the lesson", onclick: () => { setHash("learn/" + q.conceptId); } }));
  }
  if (t && t.lab && SIM_BY_ID[t.lab]) {
    act.appendChild(el("button", { class: "btn btn-sm", text: "⚗ Open the lab simulation", onclick: () => { setHash("lab/" + t.lab); } }));
  }
  if (res.ok && t) act.appendChild(el("span", { class: "small muted", text: `+${10 * q.level} XP · review scheduled by spaced repetition` }));
  fb.appendChild(act);
  return fb;
}

/* ---------- question set builders ---------- */
function buildQuestionSet(spec) {
  /* spec: {mode, count, concepts:[], levels:[], minutes} */
  const concepts = spec.concepts && spec.concepts.length ? spec.concepts : TOPIC_LIST.map(t => t.id);
  const levels = spec.levels && spec.levels.length ? spec.levels : [1, 2, 3, 4];
  const out = [];
  const usedIds = [];
  for (let i = 0; i < spec.count; i++) {
    const lvl = levels[i % levels.length];
    const cid = concepts[i % concepts.length];
    let q = questionFor(cid, lvl, { excludeIds: usedIds });
    let guard = 0;
    while ((!q || usedIds.includes(q.id)) && guard++ < 6) q = questionFor(concepts[(i + guard) % concepts.length], lvl, { excludeIds: usedIds });
    if (!q) continue;
    if (usedIds.includes(q.id)) q.id = q.id + "_" + i;
    usedIds.push(q.id);
    out.push(q);
  }
  return shuffle(out);
}

function weaknessConcepts(limit = 12) {
  const list = weakConcepts();
  if (list.length) return list.slice(0, limit).map(t => t.id);
  /* nothing recorded yet — fall back to untested concepts in map order */
  return TOPIC_LIST.filter(t => !STATE.concepts[t.id] || !STATE.concepts[t.id].attempts).slice(0, limit).map(t => t.id);
}
