/* ═══════════════════════════════════════════════════════════
   util.js — DOM helpers, SVG builder, expression evaluator,
   number formatting, unit conversion. No dependencies.
   ═══════════════════════════════════════════════════════════ */
"use strict";

/* ---------- tiny DOM ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(n.dataset, v);
    else n.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined || c === false) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function toast(msg, kind = "") {
  const wrap = $("#toasts"); if (!wrap) return;
  const t = el("div", { class: "toast " + kind, text: msg });
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 320); }, 3200);
}

/* ---------- number formatting ---------- */
function sig(x, n = 3) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= 6 || e <= -4) return x.toExponential(Math.max(0, n - 1));
  const d = Math.max(0, n - 1 - e);
  return (Math.round(x * 10 ** d) / 10 ** d).toString();
}
function fmt(x, unit = "", n = 3) { return unit ? `${sig(x, n)} ${unit}` : sig(x, n); }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function nearlyEqual(a, b, tol) {
  if (!isFinite(a) || !isFinite(b)) return false;
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return Math.abs(a - b) <= tol * scale || Math.abs(a - b) < 1e-9;
}

/* ---------- expression evaluator (shunting-yard) ----------
   supports + - * / ^ ( ) and variables, plus functions.   */
const MATH_FNS = {
  sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, log: Math.log,
  log10: Math.log10, pi: () => Math.PI
};
function tokenizeExpr(src) {
  const out = []; const s = String(src).replace(/\s+/g, "");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.eE]/.test(s[j]) && !(s[j] === "e" && j + 1 < s.length && (s[j + 1] === "+" || s[j + 1] === "-") && /[0-9.]/.test(s[j - 1]) === false)) j++; out.push({ t: "num", v: parseFloat(s.slice(i, j)) }); i = j; continue; }
    if (/[a-zA-Z_]/.test(c)) { let j = i; while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++; out.push({ t: "id", v: s.slice(i, j) }); i = j; continue; }
    if ("+-*/^(),".includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error("bad char: " + c);
  }
  return out;
}
function evalExpr(src, vars = {}) {
  const toks = tokenizeExpr(src);
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };
  const rightAssoc = { "^": true };
  const out = [], ops = [];
  const applyOp = () => {
    const op = ops.pop();
    if (op === "u-") { const a = out.pop(); out.push(-a); return; }
    const b = out.pop(), a = out.pop();
    if (a === undefined || b === undefined) throw new Error("malformed");
    switch (op) {
      case "+": out.push(a + b); break;
      case "-": out.push(a - b); break;
      case "*": out.push(a * b); break;
      case "/": out.push(a / b); break;
      case "^": out.push(Math.pow(a, b)); break;
    }
  };
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    if (tk.t === "num") out.push(tk.v);
    else if (tk.t === "id") {
      if (i + 1 < toks.length && toks[i + 1].t === "(") { ops.push("fn:" + tk.v); }
      else {
        const name = tk.v.toLowerCase();
        if (name === "pi") out.push(Math.PI);
        else if (name in vars) out.push(Number(vars[name]));
        else throw new Error("unknown symbol: " + tk.v);
      }
    } else if (tk.t === "(") ops.push("(");
    else if (tk.t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") applyOp();
      if (!ops.length) throw new Error("paren mismatch");
      ops.pop();
      if (ops.length && String(ops[ops.length - 1]).startsWith("fn:")) {
        const fn = ops.pop().slice(3); const a = out.pop();
        if (!(fn in MATH_FNS)) throw new Error("unknown fn " + fn);
        out.push(MATH_FNS[fn](a));
      }
    } else {
      const isUnary = (tk.t === "-" || tk.t === "+") &&
        (out.length === 0 || ["+", "-", "*", "/", "/", "^", "("].includes(toks[i - 1] && toks[i - 1].t) || (toks[i - 1] && toks[i - 1].t === "id" && false));
      const prev = toks[i - 1];
      const unary = (tk.t === "-" || tk.t === "+") && (!prev || "+-*/^(".includes(prev.t));
      if (unary) { if (tk.t === "-") ops.push("u-"); continue; }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === "(" || top === "u-") break;
        if (String(top).startsWith("fn:")) break;
        if (prec[top] > prec[tk.t] || (prec[top] === prec[tk.t] && !rightAssoc[tk.t])) applyOp();
        else break;
      }
      ops.push(tk.t);
    }
  }
  while (ops.length) { if (ops[ops.length - 1] === "(") throw new Error("paren"); applyOp(); }
  if (out.length !== 1) throw new Error("malformed");
  return out[0];
}
/* safe wrapper — returns NaN instead of throwing */
function tryEval(src, vars) { try { return evalExpr(src, vars); } catch (e) { return NaN; } }

/* ---------- unit helpers ---------- */
const UNITS = {
  rpm2radps: r => r * 2 * Math.PI / 60,
  radps2rpm: w => w * 60 / (2 * Math.PI),
  deg2rad: d => d * Math.PI / 180,
  rad2deg: r => r * 180 / Math.PI,
  kw2w: k => k * 1000,
  mpa2pa: m => m * 1e6,
  pa2mpa: p => p / 1e6,
  n2kn: n => n / 1000
};

/* ---------- SVG ---------- */
const SVGNS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, kids = []) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "text") n.textContent = v;
    else n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach(c => { if (c) n.appendChild(c); });
  return n;
}
/* standard arrow marker defs, referenced by .dg-force */
function svgDefs() {
  const d = svg("defs");
  [["arw", "#0284c7"], ["arw-red", "#dc2626"], ["arw-green", "#16a34a"], ["arw-amber", "#d97706"], ["arw-slate", "#35597f"]].forEach(([id, col]) => {
    d.appendChild(svg("marker", { id, viewBox: "0 0 10 10", refX: 8.5, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" },
      [svg("path", { d: "M0,0 L10,5 L0,10 z", fill: col })]));
  });
  const hatch = svg("pattern", { id: "hatch", width: 8, height: 8, patternTransform: "rotate(45)", patternUnits: "userSpaceOnUse" },
    [svg("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#5d84b8", "stroke-width": 1.4 })]);
  d.appendChild(hatch);
  return d;
}
/* hatched ground strip used under supports */
function groundStrip(x1, x2, y, h = 12) {
  const g = svg("g");
  g.appendChild(svg("line", { x1, y1: y, x2, y2: y, stroke: "#5d84b8", "stroke-width": 2.2 }));
  for (let x = x1; x < x2; x += 9) g.appendChild(svg("line", { x1: x, y1: y + h, x2: x + 8, y2: y, stroke: "#5d84b8", "stroke-width": 1.1 }));
  return g;
}
function arrow(x1, y1, x2, y2, cls = "dg-force", label = "", lx = null, ly = null) {
  const g = svg("g");
  g.appendChild(svg("line", { x1, y1, x2, y2, class: cls }));
  if (label) {
    const mx = lx === null ? (x1 + x2) / 2 : lx, my = ly === null ? (y1 + y2) / 2 : ly;
    const t = svg("text", { x: mx + 8, y: my - 6, class: "dg-txt", text: label });
    g.appendChild(t);
  }
  return g;
}
function label(x, y, txt, cls = "dg-txt", anchor = "start") {
  return svg("text", { x, y, class: cls, "text-anchor": anchor, text: txt });
}
function dimLine(x1, y1, x2, y2, txt) {
  const g = svg("g");
  g.appendChild(svg("line", { x1, y1, x2, y2, class: "dg-dim" }));
  g.appendChild(svg("text", { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 5, class: "dg-txt sm", "text-anchor": "middle", text: txt }));
  return g;
}

/* ---------- math notation → HTML (very small subset) ----------
   ^2 → superscript, _x → subscript, · , √ , ≤ ≥ ≠ × ±   */
function math(s) {
  let h = esc(s);
  h = h.replace(/\*\*/g, "·").replace(/\*/g, "·");
  h = h.replace(/\^(\{[^}]+\}|[0-9A-Za-z\-]+)/g, (_, g) => `<sup>${g.replace(/[{}]/g, "")}</sup>`);
  h = h.replace(/_(\{[^}]+\}|[0-9A-Za-z]+)/g, (_, g) => `<sub>${g.replace(/[{}]/g, "")}</sub>`);
  return h;
}

/* ---------- date helpers ---------- */
const DAY = 86400000;
const dayKey = d => new Date(d).toISOString().slice(0, 10);
const todayKey = () => dayKey(Date.now());
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);
