/* ═══════════════════════════════════════════════════════════
   views/map.js — the mechanics knowledge map
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewMap(root, params) {
  const focus = params[0] || null;   // module id or section id

  root.appendChild(el("h1", { class: "page-title", text: "Mechanics Knowledge Map" }));
  root.appendChild(el("p", { class: "page-sub", text: "The complete curriculum: three modules, eight domains, " + TOPIC_LIST.length + " concepts. Every tile shows your status — 🟢 mastered, 🟡 needs revision, 🔴 weak, grey not started." }));

  /* legend + filter */
  const tools = el("div", { class: "row spread mb" });
  const legend = el("div", { class: "row" }, [
    el("span", { class: "chip", text: "● Not started" }), el("span", { class: "chip b", text: "● Mastered ≥75%" }),
    el("span", { class: "chip i", text: "● Needs revision 45–74%" }), el("span", { class: "chip a", text: "● Weak <45%" })
  ]);
  const search = el("input", { type: "text", placeholder: "Filter concepts…", style: { maxWidth: "260px" }, oninput: e => {
    const q = e.target.value.trim().toLowerCase();
    $$(".concept-tile").forEach(n => { n.style.display = !q || n.dataset.search.includes(q) ? "" : "none"; });
  } });
  tools.appendChild(legend); tools.appendChild(search);
  root.appendChild(tools);

  MODULES.forEach(m => {
    const open = true;   // the whole map is always visible
    const ms = moduleStats(m.id);
    const box = el("div", { class: "map-module mod-" + m.id });
    const head = el("header", {}, [
      el("span", { class: "code", text: m.code }),
      el("h3", { text: m.name }),
      el("span", { class: "small muted", text: m.core }),
      el("div", { class: "grow" }, [
        el("div", { class: "bar" + (ms.mastery >= 75 ? " g" : ms.mastery >= 45 ? " a" : " r"), style: { width: "120px" } }, [el("i", { style: { width: ms.mastery + "%" } })]),
        el("b", { class: "mono small", text: ms.mastery + "%" })
      ])
    ]);
    const bodyEl = el("div", { class: "map-body" });
    head.onclick = () => { bodyEl.classList.toggle("hidden"); };
    box.appendChild(head); box.appendChild(bodyEl);

    m.sections.forEach(s => {
      const st = sectionStats(s.id);
      const sec = el("div", { class: "map-sec", id: "sec-" + s.id });
      sec.appendChild(el("div", { class: "map-sec-head" }, [
        el("h4", { text: s.name }),
        el("span", { class: "chip n", text: st.started + "/" + st.total }),
        el("span", { class: "small muted", text: s.core }),
        el("a", { class: "btn btn-sm btn-ghost", href: "#quiz/topic/" + s.id, text: "Quiz this domain" })
      ]));
      if (s.examples) sec.appendChild(el("div", { class: "small muted mb", text: "Typical fluids: " + s.examples }));
      const grid = el("div", { class: "concept-grid" });
      s.concepts.forEach(id => {
        const t = TOPICS[id];
        const m0 = masteryOf(id), stt = srStatusOf(id);
        const tile = el("a", {
          class: "concept-tile", href: "#learn/" + id,
          dataset: { search: (t.title + " " + t.simple + " " + s.name).toLowerCase() }
        }, [
          el("div", { class: "t" }, [el("span", { class: "status-dot " + (stt || ""), title: stt ? SR_LABEL[stt] : "Not started" }), el("span", { text: t.title })]),
          el("div", { class: "m" }, [
            el("div", { class: "bar thin " + (m0 >= 75 ? "g" : m0 >= 45 ? "a" : m0 > 0 ? "r" : "") }, [el("i", { style: { width: m0 + "%" } })]),
            el("span", { class: "v", text: m0 + "%" })
          ]),
          el("div", { class: "small muted", style: { marginTop: "4px" }, text: LEVELS[t.level].icon + " core level " + t.level })
        ]);
        grid.appendChild(tile);
      });
      sec.appendChild(grid);
      bodyEl.appendChild(sec);
    });
    if (!open) bodyEl.classList.add("hidden");
    root.appendChild(box);
  });

  /* engineering connections */
  root.appendChild(el("div", { class: "section-title", text: "Engineering connection chains" }));
  const cc = el("div", { class: "grid g2" });
  [["Force → Moment → Stress → Deformation → Failure → Design", ["force", "moment", "stress", "strain", "yielding", "safety-factor"]],
   ["Pressure → Fluid velocity → Bernoulli → Pressure losses → Pump selection", ["pressure-fluids", "flow-rate", "bernoulli", "head-losses", "pumps-valves"]],
   ["Torque → Shear stress → Angle of twist → Shaft diameter → Coupling design", ["torque", "torsion", "power"]],
   ["Cyclic load → Stress amplitude → K_t → Fatigue life → Inspection interval", ["fatigue", "stress-concentration", "fracture-mechanics"]]
  ].forEach(([txt, ids]) => {
    const card = el("div", { class: "card" });
    const cw = el("div", { class: "chain" });
    txt.split(" → ").forEach((part, i) => {
      const target = ids[i] && TOPICS[ids[i]] ? ids[i] : null;
      cw.appendChild(target ? el("a", { class: "chain-node", href: "#learn/" + target, text: part }) : el("span", { class: "chain-node", text: part }));
      if (i < txt.split(" → ").length - 1) cw.appendChild(el("span", { class: "chain-arrow", text: "↓" }));
    });
    card.appendChild(cw);
    cc.appendChild(card);
  });
  root.appendChild(cc);
}
