/* ═══════════════════════════════════════════════════════════
   state.js — persistence, mastery scoring, spaced repetition
   ═══════════════════════════════════════════════════════════ */
"use strict";

const STORAGE_KEY = "mechanics-mastery.v1";
const SR_INTERVALS = [1, 2, 4, 7, 14, 30, 60];   // days: learn → review schedule
const LEVEL_WEIGHT = { 1: 1, 2: 1.5, 3: 2, 4: 2.5 };

const DEFAULT_STATE = () => ({
  version: 1,
  concepts: {},        // conceptId → {seen, steps, attempts, correct, byLevel, mastery, sr}
  mistakes: [],        // recent wrong answers (max 300)
  history: [],         // recent answers (max 400)
  quizzes: [],         // last 30 quiz results
  xp: 0,
  lastActive: null,
  streak: 0,
  bestDays: 0,
  cases: {},           // caseId → {answered: idx[]}
  created: Date.now()
});

let STATE = DEFAULT_STATE();

/* ── persistence (safe in sandboxed contexts) ────────────── */
const Store = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return false;
      STATE = Object.assign(DEFAULT_STATE(), parsed);
      STATE.concepts = STATE.concepts || {};
      return true;
    } catch (e) { return false; }
  },
  save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); return true; }
    catch (e) { return false; }
  },
  reset() { STATE = DEFAULT_STATE(); Store.save(); }
};

/* ── tiny event bus so views can refresh ─────────────────── */
const Bus = {
  _h: {},
  on(evt, fn) { (this._h[evt] = this._h[evt] || []).push(fn); },
  emit(evt, data) { (this._h[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }
};

/* ── per-concept record ──────────────────────────────────── */
function conceptState(id) {
  if (!STATE.concepts[id]) {
    STATE.concepts[id] = {
      seen: false, steps: {}, attempts: 0, correct: 0,
      byLevel: { 1: { a: 0, c: 0 }, 2: { a: 0, c: 0 }, 3: { a: 0, c: 0 }, 4: { a: 0, c: 0 } },
      sr: { box: 0, last: null, due: null, status: null }
    };
  }
  return STATE.concepts[id];
}

function markSeen(id) {
  const c = conceptState(id);
  if (!c.seen) { c.seen = true; Store.save(); Bus.emit("progress", { id }); }
}
function markStep(id, stepKey) {
  const c = conceptState(id);
  if (!c.steps[stepKey]) { c.steps[stepKey] = Date.now(); Store.save(); Bus.emit("progress", { id }); }
}

/* ── mastery ─────────────────────────────────────────────── */
function masteryOf(id) {
  const c = STATE.concepts[id];
  if (!c || !c.attempts) return 0;
  let got = 0, max = 0;
  ALL_LEVELS.forEach(l => {
    const w = LEVEL_WEIGHT[l];
    const bl = c.byLevel[l] || { a: 0, c: 0 };
    const ratio = bl.a ? bl.c / bl.a : 0;
    const attempted = bl.a > 0;
    max += w * 1.2;
    if (attempted) got += w * (0.2 + 0.8 * ratio);
  });
  return Math.round(clamp(got / max, 0, 1) * 100);
}

function srStatusOf(id) {
  const c = STATE.concepts[id];
  if (!c || !c.attempts) return null;
  const m = masteryOf(id);
  if (m >= 75) return "g";
  if (m >= 45) return "y";
  return "r";
}
const SR_LABEL = { g: "Mastered", y: "Needs revision", r: "Weak", null: "Not started" };

/* ── answer recording ────────────────────────────────────── */
function recordAnswer(res) {
  const { conceptId, level, correct, question, yourAnswer, topicTitle } = res;
  if (!TOPICS[conceptId]) return;
  const c = conceptState(conceptId);
  const lv = clamp(level, 1, 4);
  c.attempts++;
  if (correct) c.correct++;
  if (!c.byLevel[lv]) c.byLevel[lv] = { a: 0, c: 0 };
  c.byLevel[lv].a++;
  if (correct) c.byLevel[lv].c++;

  /* XP + streak */
  if (correct) STATE.xp += 10 * lv;
  touchStreak();

  /* spaced repetition update */
  const now = Date.now(), today = todayKey();
  if (correct) {
    c.sr.box = Math.min(c.sr.box + 1, SR_INTERVALS.length - 1);
  } else {
    c.sr.box = 0;
  }
  c.sr.last = now;
  c.sr.due = todayKey(now + SR_INTERVALS[c.sr.box] * DAY);
  c.sr.status = srStatusOf(conceptId);

  /* history */
  STATE.history.unshift({ conceptId, level: lv, correct, t: now, title: topicTitle || TOPICS[conceptId].title });
  if (STATE.history.length > 400) STATE.history.length = 400;

  /* mistakes */
  if (!correct) {
    STATE.mistakes.unshift({
      conceptId, level: lv, t: now,
      title: topicTitle || TOPICS[conceptId].title,
      prompt: question.prompt, type: question.type,
      your: yourAnswer, right: answerText(question),
      explanation: question.explanation, wrongWhy: question.wrongWhy,
      misconception: question.misconception, reasoning: question.reasoning || [],
      similar: question.similar || "", resolved: false
    });
    if (STATE.mistakes.length > 300) STATE.mistakes.length = 300;
  }
  Store.save();
  Bus.emit("progress", { conceptId, correct });
}

function touchStreak() {
  const today = todayKey();
  if (STATE.lastActive === today) return;
  if (STATE.lastActive === todayKey(Date.now() - DAY)) STATE.streak++;
  else STATE.streak = 1;
  STATE.lastActive = today;
  STATE.bestDays = Math.max(STATE.bestDays, STATE.streak);
}

/* ── aggregates for the dashboard ────────────────────────── */
function sectionStats(sectionId) {
  const sec = SECTION_BY_ID[sectionId];
  if (!sec) return { mastery: 0, started: 0, total: 0, byStatus: { g: 0, y: 0, r: 0, n: 0 } };
  const list = sec.concepts;
  let sum = 0, started = 0;
  const byStatus = { g: 0, y: 0, r: 0, n: 0 };
  list.forEach(id => {
    const m = masteryOf(id);
    sum += m;
    const st = srStatusOf(id);
    if (st) { started++; byStatus[st]++; } else byStatus.n++;
  });
  return { mastery: Math.round(sum / list.length), started, total: list.length, byStatus };
}
function moduleStats(moduleId) {
  const mod = MODULES.find(m => m.id === moduleId);
  const ss = mod.sections.map(s => sectionStats(s.id));
  const all = mod.sections.flatMap(s => s.concepts);
  const sum = all.reduce((a, id) => a + masteryOf(id), 0);
  return { mastery: Math.round(sum / all.length), sections: ss, total: all.length, started: all.filter(id => srStatusOf(id)).length };
}
function overallMastery() {
  const all = TOPIC_LIST.map(t => t.id);
  return Math.round(all.reduce((a, id) => a + masteryOf(id), 0) / all.length);
}
function dueConcepts() {
  const today = todayKey();
  return TOPIC_LIST.filter(t => {
    const c = STATE.concepts[t.id];
    return c && c.sr && c.sr.due && c.sr.due <= today && c.attempts > 0;
  });
}
function weakConcepts() {
  return TOPIC_LIST.filter(t => {
    const c = STATE.concepts[t.id];
    return c && c.attempts > 0 && masteryOf(t.id) < 60;
  }).sort((a, b) => masteryOf(a.id) - masteryOf(b.id));
}
function recentHistory(n = 40) { return STATE.history.slice(0, n); }
function accuracyLast(n = 20) {
  const h = STATE.history.slice(0, n);
  if (!h.length) return null;
  return Math.round(100 * h.filter(x => x.correct).length / h.length);
}
function nextConceptToStudy() {
  /* priority: due for review → weak → unseen (map order) → lowest mastery */
  const due = dueConcepts();
  if (due.length) return due[0].id;
  const weak = weakConcepts();
  if (weak.length) return weak[0].id;
  const unseen = TOPIC_LIST.find(t => !conceptState(t.id).seen);
  if (unseen) return unseen.id;
  return TOPIC_LIST.slice().sort((a, b) => masteryOf(a.id) - masteryOf(b.id))[0].id;
}

/* ── answer text helpers (used by mistake log) ───────────── */
function answerText(q) {
  switch (q.type) {
    case "mcq": case "tf": case "select": case "identify": case "predict":
      return q.choices ? q.choices[q.answer] : String(q.answer);
    case "num": case "numeric": return `${sig(q.answer, 4)} ${q.unit || ""}`.trim();
    case "match": return q.pairs.map(p => `${p[0]} → ${p[1]}`).join("  ·  ");
    case "order": return q.items.join(" → ");
    case "fill": return q.answer.join(", ");
    case "explain": return "Free-text answer — see the model reasoning";
    default: return "";
  }
}

/* ── quiz results ────────────────────────────────────────── */
function saveQuizResult(r) {
  STATE.quizzes.unshift(Object.assign({ t: Date.now() }, r));
  if (STATE.quizzes.length > 30) STATE.quizzes.length = 30;
  touchStreak();
  STATE.xp += Math.round(r.score * 4);
  Store.save();
  Bus.emit("quiz-saved", r);
}
function resolveMistake(index) {
  if (STATE.mistakes[index]) { STATE.mistakes[index].resolved = true; Store.save(); Bus.emit("mistakes-changed"); }
}
function clearResolvedMistakes() {
  STATE.mistakes = STATE.mistakes.filter(m => !m.resolved);
  Store.save(); Bus.emit("mistakes-changed");
}
