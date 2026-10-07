/* ═══════════════════════════════════════════════════════════
   views/formulas.js — searchable Engineering Formula Library
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewFormulas(root, params) {
  const focusId = params[0] && FORMULA_BY_ID[params[0]] ? params[0] : null;

  root.appendChild(el("h1", { class: "page-title", text: "Engineering Formula Library" }));
  root.appendChild(el("p", { class: "page-sub", text: FORMULAS.length + " formulas, each with its physical meaning, variables, SI units, assumptions, an industrial application, a worked example and the formulas it connects to. Search by name, symbol or application." }));

  if (focusId) {
    const c = el("div", { class: "mb" });
    c.appendChild(formulaCard(FORMULA_BY_ID[focusId], true));
    root.appendChild(c);
    root.appendChild(el("a", { class: "btn btn-sm", href: "#formulas", text: "← back to the library" }));
    return;
  }

  /* search + filters */
  let field = "all", query = "";
  const tools = el("div", { class: "row mb" });
  const search = el("input", { type: "text", placeholder: "Search: moment, τ, Bernoulli, buckling, NPSH…", oninput: e => { query = e.target.value.trim().toLowerCase(); paint(); } });
  tools.appendChild(el("div", { class: "search-wrap", style: { flex: "1", maxWidth: "460px" } }, [el("span", { class: "ico", text: "⌕" }), search]));
  const pills = el("div", { class: "pill-tabs" });
  tools.appendChild(pills);
  root.appendChild(tools);

  const list = el("div", { class: "grid g2" });
  const count = el("div", { class: "small muted mb" });
  root.appendChild(count);
  root.appendChild(list);

  function paintPills() {
    pills.innerHTML = "";
    [["all", "All"], ...Object.entries(FIELD_LABELS)].forEach(([k, lbl]) => {
      pills.appendChild(el("button", { class: "pill " + (field === k ? "active" : ""), text: lbl, onclick: () => { field = k; paintPills(); paint(); } }));
    });
  }
  function paint() {
    list.innerHTML = "";
    let n = 0;
    FORMULAS.forEach(f => {
      if (field !== "all" && f.field !== field) return;
      const hay = (f.name + " " + f.expr + " " + f.exprFull + " " + f.meaning + " " + f.vars + " " + f.application + " " + f.example).toLowerCase();
      if (query && !hay.includes(query)) return;
      n++;
      list.appendChild(formulaCard(f, false, query));
    });
    count.textContent = n + " formula" + (n === 1 ? "" : "s") + (query ? ` matching “${query}”` : "") + (field !== "all" ? " in " + FIELD_LABELS[field] : "");
    if (!n) list.appendChild(el("div", { class: "empty", text: "No formula matches that search. Try a symbol (σ, τ, Re), a quantity (torque) or an application (pump)." }));
  }
  paintPills(); paint();
}

function formulaCard(f, expanded, query) {
  const card = el("div", { class: "fcard" });
  const top = el("div", { class: "ftop" }, [
    el("span", { class: "fname", html: hl(f.name, query) }),
    el("span", { class: "chip", text: FIELD_LABELS[f.field] }),
    el("a", { class: "fexpr", href: "#formulas/" + f.id, html: math(f.expr) })
  ]);
  card.appendChild(top);
  if (f.exprFull && f.exprFull !== f.expr) card.appendChild(el("div", { class: "small mono", style: { color: "var(--txt-3)", marginTop: "3px" }, html: math(f.exprFull) }));
  card.appendChild(el("div", { class: "fmean", html: hl(f.meaning, query) }));

  const det = el("details");
  if (expanded) det.open = true;
  det.appendChild(el("summary", { text: "Variables · units · assumptions · application · example · related" }));
  const body = el("div", { class: "fbody" });

  /* variables table */
  const vt = el("table", { class: "var-table" });
  const tb = el("tbody");
  parseVars(f.vars).forEach(v => tb.appendChild(el("tr", {}, [
    el("td", { html: math(v.s) }), el("td", { text: v.d }), el("td", { text: v.u })
  ])));
  vt.appendChild(tb);
  body.appendChild(vt);

  const line = (k, v) => body.appendChild(el("div", { class: "fl" }, [el("b", { text: k }), el("span", { html: hl(v, query) })]));
  line("Assumptions", f.assumptions);
  line("Application", f.application);
  line("Worked example", f.example);
  if (f.intuition) line("Intuition", f.intuition);
  if (f.related && f.related.length) {
    const rw = el("div", { class: "vocab" });
    f.related.forEach(rid => {
      const rf = FORMULA_BY_ID[rid];
      rw.appendChild(rf ? el("a", { class: "w", href: "#formulas/" + rid }, [el("b", { text: rf.name })]) : el("span", { class: "w", text: rid }));
    });
    body.appendChild(el("div", { class: "fl" }, [el("b", { text: "Related" }), rw]));
  }
  /* which concepts use it */
  const users = TOPIC_LIST.filter(t => t.formulaId === f.id);
  if (users.length) {
    const uw = el("div", { class: "vocab" });
    users.forEach(t => uw.appendChild(el("a", { class: "w", href: "#learn/" + t.id }, [el("b", { text: t.title })])));
    body.appendChild(el("div", { class: "fl" }, [el("b", { text: "Taught in" }), uw]));
  }
  det.appendChild(body);
  card.appendChild(det);
  return card;
}

function hl(text, q) {
  const safe = esc(text);
  if (!q || q.length < 2) return safe;
  try {
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  } catch (e) { return safe; }
}
