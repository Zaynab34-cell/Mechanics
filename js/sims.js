/* ═══════════════════════════════════════════════════════════
   sims.js — Interactive Lab
   18 parameterised engineering simulations. Each renders an
   SVG diagram plus live readouts; sliders and dragging update
   everything in real time.
   ═══════════════════════════════════════════════════════════ */
"use strict";

/* ── shared scaffolding ──────────────────────────────────── */
function defineSim(id, meta) {
  const p = {};
  meta.params.forEach(d => { p[d.key] = d.def; });
  const sim = {
    id, title: meta.title, sub: meta.sub, conceptId: meta.conceptId,
    params: meta.params, values: p, animate: !!meta.animate,
    onParam: meta.onParam || null, drag: meta.drag || null,
    mount(root, ui) {
      const svgEl = svg("svg", { viewBox: meta.vb, preserveAspectRatio: "xMidYMid meet" });
      root.innerHTML = ""; root.appendChild(svgEl);
      ui.innerHTML = "";
      const controls = el("div");
      const readout = el("div", { class: "readout mt" });
      const note = el("div", { class: "sim-note" });
      ui.appendChild(controls); ui.appendChild(readout); ui.appendChild(note);

      sim._svg = svgEl; sim._readout = readout; sim._note = note;
      const redraw = () => {
        const r = meta.render(sim.values, sim._t || 0, svgEl);
        svgEl.innerHTML = "";
        svgEl.appendChild(svgDefs());
        (Array.isArray(r.body) ? r.body : [r.body]).forEach(n => n && svgEl.appendChild(n));
        readout.innerHTML = "";
        (r.readouts || []).forEach(o => {
          readout.appendChild(el("div", { class: "r " + (o.cls || "") }, [
            el("span", { text: o.k }), el("b", { text: o.v })
          ]));
        });
        note.textContent = r.note || meta.note || "";
        if (meta.drag) meta.drag(svgEl, sim, redraw);
      };
      sim.params.forEach(d => {
        if (d.type === "select") {
          const sel = el("select", {
            onchange: e => { sim.values[d.key] = isNaN(+e.target.value) ? e.target.value : +e.target.value; redraw(); }
          }, d.options.map(o => el("option", { value: o[0], selected: String(o[0]) === String(sim.values[d.key]) }, o[1])));
          controls.appendChild(el("div", { class: "slider" }, [el("div", { class: "lbl" }, [el("span", { text: d.label })]), sel]));
        } else if (d.type === "toggle") {
          const btn = el("button", { class: "btn btn-sm", onclick: e => { sim.values[d.key] = !sim.values[d.key]; e.target.classList.toggle("on", sim.values[d.key]); redraw(); } }, d.label);
          if (sim.values[d.key]) btn.classList.add("on");
          controls.appendChild(el("div", { class: "slider" }, [btn]));
        } else {
          const val = el("b", { text: fmtV(sim.values[d.key], d) });
          const inp = el("input", {
            type: "range", min: d.min, max: d.max, step: d.step, value: sim.values[d.key],
            oninput: e => {
              sim.values[d.key] = +e.target.value;
              val.textContent = fmtV(sim.values[d.key], d);
              if (sim.onParam) sim.onParam(d.key, sim.values[d.key]);
              redraw();
            }
          });
          controls.appendChild(el("div", { class: "slider" }, [
            el("div", { class: "lbl" }, [el("span", { text: d.label }), val]), inp
          ]));
        }
      });
      redraw();
      sim._redraw = redraw;
      return sim;
    }
  };
  return sim;
}
function fmtV(v, d) { return (d.fmt ? d.fmt(v) : sig(v, 3)) + (d.unit ? " " + d.unit : ""); }

/* ══════════════════════════════════════════════════════════
   1 · MOMENT / LEVER
   ══════════════════════════════════════════════════════════ */
const SIM_moment = defineSim("moment", {
  title: "Moment & lever arm", sub: "Drag the force arrow or move the sliders — watch the turning effect change.",
  conceptId: "moment", vb: "0 0 660 300",
  params: [
    { key: "F", label: "Force F", min: 20, max: 500, step: 5, def: 200, unit: "N" },
    { key: "d", label: "Distance d", min: 0.1, max: 1.6, step: 0.05, def: 0.8, unit: "m" },
    { key: "ang", label: "Force angle θ", min: 5, max: 90, step: 1, def: 90, unit: "°" }
  ],
  note: "M = F·d·sin θ. Notice that aligning the force with the arm (small θ) destroys the moment even though the force is unchanged.",
  render(v) {
    const px = 150, py = 210, scale = 250;
    const ex = px + v.d * scale, ey = py;
    const dperp = v.d * Math.sin(v.ang * Math.PI / 180);
    const M = v.F * dperp;
    const L = clamp(v.F / 4, 30, 110);
    const ax = ex - L * Math.cos(v.ang * Math.PI / 180), ay = ey - L * Math.sin(v.ang * Math.PI / 180);
    const g = svg("g");
    g.appendChild(groundStrip(px - 70, px + 70, py + 46));
    /* beam */
    g.appendChild(svg("line", { x1: px, y1: py, x2: ex + 20, y2: py, stroke: "#35597f", "stroke-width": 9, "stroke-linecap": "round" }));
    /* pivot */
    g.appendChild(svg("path", { d: `M${px},${py} l-18,42 l36,0 z`, fill: "#dbe6f2", stroke: "#35597f", "stroke-width": 1.6 }));
    g.appendChild(svg("circle", { cx: px, cy: py, r: 6, fill: "#eef4fb", stroke: "#0284c7", "stroke-width": 2.4 }));
    g.appendChild(label(px - 8, py + 62, "pivot O", "dg-txt sm"));
    /* lever arm + perpendicular arm */
    g.appendChild(dimLine(px, py + 20, ex, py + 20, `d = ${sig(v.d, 3)} m`));
    if (v.ang < 89) {
      const fx = px + dperp * scale;
      g.appendChild(svg("line", { x1: ex, y1: ey, x2: fx, y2: ey, class: "dg-dim", stroke: "#d97706" }));
      g.appendChild(svg("line", { x1: fx, y1: ey, x2: ex, y2: ay, class: "dg-dim", stroke: "#d97706" }));
      g.appendChild(label((fx + ex) / 2 - 10, ey - 8, `d⊥ = ${sig(dperp, 3)} m`, "dg-txt sm"));
    }
    /* force arrow */
    g.appendChild(arrow(ex, ey, ax, ay, "dg-force", `F = ${sig(v.F, 3)} N`, ax - 96, ay - 14));
    /* rotation arc */
    const rot = clamp(M / 400, 0, 1.1);
    const arc = svg("path", { d: `M ${px + 42} ${py - 30} A 52 52 0 0 1 ${px + 30} ${py + 38}`, fill: "none", stroke: "#16a34a", "stroke-width": 2, "stroke-dasharray": `${rot * 130} 300`, "marker-end": "url(#arw-green)" });
    g.appendChild(arc);
    g.appendChild(label(px + 58, py - 34, `M = ${sig(M, 4)} N·m`, "dg-txt"));
    return {
      body: g,
      readouts: [
        { k: "Moment M", v: `${sig(M, 4)} N·m` },
        { k: "Lever arm d⊥", v: `${sig(dperp, 3)} m` },
        { k: "F·d (max possible)", v: `${sig(v.F * v.d, 4)} N·m` },
        { k: "Effectiveness", v: `${sig(100 * Math.sin(v.ang * Math.PI / 180), 3)} %`, cls: v.ang < 30 ? "warn" : "ok" }
      ]
    };
  },
  drag(svgEl, sim, redraw) {
    const tip = svgEl.querySelector("line[marker-end]");
    if (!tip) return;
  }
});

/* ══════════════════════════════════════════════════════════
   2 · BEAM STATICS (reactions, V/M, stress, deflection)
   ══════════════════════════════════════════════════════════ */
const SIM_beam = defineSim("beam", {
  title: "Beam under load", sub: "Reactions, shear and moment diagrams, bending stress and deflection — live.",
  conceptId: "bending", vb: "0 0 660 380",
  params: [
    { key: "L", label: "Span L", min: 1, max: 8, step: 0.5, def: 4, unit: "m" },
    { key: "w", label: "Distributed load w", min: 0, max: 40, step: 0.5, def: 8, unit: "kN/m" },
    { key: "P", label: "Point load P", min: 0, max: 80, step: 1, def: 20, unit: "kN" },
    { key: "xp", label: "Point load position", min: 5, max: 95, step: 1, def: 50, unit: "%" },
    { key: "h", label: "Section depth h", min: 60, max: 400, step: 10, def: 200, unit: "mm" },
    { key: "b", label: "Section width b", min: 20, max: 200, step: 5, def: 100, unit: "mm" }
  ],
  note: "Rectangular section assumed. σ_max = M·c/I and δ_max from superposition of the two standard cases. Watch which criterion — stress or deflection — governs.",
  render(v) {
    const L = v.L, w = v.w * 1000, P = v.P * 1000, xp = L * v.xp / 100;
    const Ra = (w * L / 2) + (P * (L - xp) / L);
    const Rb = (w * L / 2) + (P * xp / L);
    /* M(x) */
    const N = 60; let Mmax = 0, xm = 0;
    const Ms = [];
    for (let i = 0; i <= N; i++) {
      const x = L * i / N;
      let M = Ra * x - w * x * x / 2 - (x > xp ? P * (x - xp) : 0);
      Ms.push(M);
      if (Math.abs(M) > Math.abs(Mmax)) { Mmax = M; xm = x; }
    }
    const I = (v.b / 1000) * (v.h / 1000) ** 3 / 12;
    const Z = I / (v.h / 2000);
    const sigMax = Math.abs(Mmax) / Z / 1e6;
    const defUdl = 5 * w * L ** 4 / (384 * 200e9 * I) * 1000;
    /* point-load deflection: PL^3/48EI at mid-span, reduced as the load moves off centre */
    const defPt = P > 0 ? (P * L ** 3 / (48 * 200e9 * I) * 1000) * (1 - 0.6 * Math.abs(xp - L / 2) / (L / 2)) : 0;
    const defTotal = defUdl + defPt;
    /* geometry */
    const x0 = 70, x1 = 590, by = 120, sc = (x1 - x0) / L;
    const g = svg("g");
    g.appendChild(groundStrip(x0 - 40, x0 + 40, by + 40));
    g.appendChild(groundStrip(x1 - 40, x1 + 40, by + 40));
    g.appendChild(svg("path", { d: `M${x0},${by} l-14,36 l28,0 z`, fill: "#dbe6f2", stroke: "#35597f" }));
    g.appendChild(svg("path", { d: `M${x1},${by} l-14,36 l28,0 z`, fill: "#dbe6f2", stroke: "#35597f" }));
    g.appendChild(svg("circle", { cx: x1, cy: by + 36, r: 5, fill: "#35597f" }));
    g.appendChild(svg("line", { x1: x0 - 20, y1: by, x2: x1 + 20, y2: by, stroke: "#0ea5e9", "stroke-width": 8, "stroke-linecap": "round" }));
    g.appendChild(dimLine(x0, by - 46, x1, by - 46, `L = ${sig(L, 3)} m`));
    if (w > 0) {
      for (let x = x0; x <= x1; x += 22) g.appendChild(arrow(x, by - 34, x, by - 8, "dg-force red", ""));
      g.appendChild(label((x0 + x1) / 2, by - 40, `w = ${sig(v.w, 3)} kN/m`, "dg-txt sm", "middle"));
    }
    if (P > 0) {
      const px = x0 + xp * sc;
      g.appendChild(arrow(px, by - 74, px, by - 12, "dg-force", `P = ${sig(v.P, 3)} kN`, px + 8, by - 66));
    }
    g.appendChild(arrow(x0, by + 78, x0, by + 20, "dg-force green", `R_A = ${sig(Ra / 1000, 4)} kN`, x0 - 100, by + 66));
    g.appendChild(arrow(x1, by + 78, x1, by + 20, "dg-force green", `R_B = ${sig(Rb / 1000, 4)} kN`, x1 + 10, by + 66));
    /* M diagram */
    const dy = 250, dm = 80 / Math.max(1, Math.abs(Mmax) / 1000);
    const dpath = Ms.map((M, i) => `${i ? "L" : "M"}${x0 + L * i / N * sc},${dy + M / 1000 * dm}`).join(" ");
    g.appendChild(svg("line", { x1: x0, y1: dy, x2: x1, y2: dy, class: "dg-dim" }));
    g.appendChild(svg("path", { d: dpath, fill: "rgba(2,132,199,.10)", stroke: "#0284c7", "stroke-width": 2 }));
    g.appendChild(label(x0, dy - 8, "Bending moment diagram", "dg-txt sm"));
    const mx = x0 + xm * sc;
    g.appendChild(svg("circle", { cx: mx, cy: dy + Mmax / 1000 * dm, r: 4, fill: "#dc2626" }));
    g.appendChild(label(mx + 6, dy + Mmax / 1000 * dm + 14, `M_max = ${sig(Math.abs(Mmax) / 1000, 4)} kN·m @ ${sig(xm, 3)} m`, "dg-txt sm"));
    const lim = 235, defLim = L * 1000 / 300;
    return {
      body: g,
      readouts: [
        { k: "R_A / R_B", v: `${sig(Ra / 1000, 3)} / ${sig(Rb / 1000, 3)} kN` },
        { k: "M_max", v: `${sig(Math.abs(Mmax) / 1000, 4)} kN·m` },
        { k: "σ_max", v: `${sig(sigMax, 4)} MPa`, cls: sigMax > lim ? "bad" : sigMax > lim * 0.7 ? "warn" : "ok" },
        { k: "δ_max", v: `${sig(defTotal, 3)} mm`, cls: defTotal > defLim ? "bad" : "ok" },
        { k: "Deflection limit L/300", v: `${sig(defLim, 3)} mm`, cls: defTotal > defLim ? "bad" : "" },
        { k: "Section modulus Z", v: `${sig(Z * 1e6, 4)} cm³` },
        { k: "FoS vs yield (S235)", v: `${sig(lim / Math.max(sigMax, 0.01), 3)}`, cls: sigMax > lim ? "bad" : "" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   3 · INCLINED PLANE & FRICTION
   ══════════════════════════════════════════════════════════ */
const SIM_incline = defineSim("incline", {
  title: "Inclined plane & friction", sub: "Raise the slope until the block slips — the slip angle is tan⁻¹μ.",
  conceptId: "friction", vb: "0 0 660 320",
  params: [
    { key: "m", label: "Mass m", min: 1, max: 100, step: 1, def: 20, unit: "kg" },
    { key: "ang", label: "Slope angle θ", min: 0, max: 70, step: 1, def: 20, unit: "°" },
    { key: "mu", label: "Friction coefficient μ", min: 0.05, max: 0.9, step: 0.01, def: 0.4 }
  ],
  note: "F_f,max = μN = μmg cos θ, driving force = mg sin θ. Slipping starts at θ = tan⁻¹μ, independent of the mass.",
  render(v) {
    const th = v.ang * Math.PI / 180, W = v.m * 9.81;
    const N = W * Math.cos(th), drv = W * Math.sin(th), fmax = v.mu * N;
    const slips = drv > fmax + 1e-6;
    const ax = 90, ay = 260, Lb = 430;
    const tx = ax + Lb * Math.cos(th), ty = ay - Lb * Math.sin(th);
    const g = svg("g");
    g.appendChild(svg("path", { d: `M${ax},${ay} L${tx},${ty} L${ax},${ty} Z`, fill: "#f1f5f9", stroke: "#5d84b8", "stroke-width": 1.4 }));
    for (let i = 0; i < 18; i++) {
      const s = i / 17;
      const bx = ax + (tx - ax) * s, byy = ay - (ay - ty) * s;
      g.appendChild(svg("line", { x1: bx, y1: byy, x2: bx - 9 * Math.sin(th) - 6, y2: byy + 9 * Math.cos(th) + 4, stroke: "#5d84b8", "stroke-width": 1 }));
    }
    /* block */
    const s = 0.35 + v.m / 220, bw = 70 * s, bh = 46 * s;
    const pos = slips ? 0.72 : 0.45;
    const cx = ax + Lb * pos * Math.cos(th), cy = ay - Lb * pos * Math.sin(th);
    const blk = svg("g", { transform: `translate(${cx},${cy}) rotate(${-v.ang})` });
    blk.appendChild(svg("rect", { x: -bw / 2, y: -bh, width: bw, height: bh, rx: 4, fill: slips ? "#b91c1c" : "#c9d8ea", stroke: slips ? "#dc2626" : "#0ea5e9", "stroke-width": 2 }));
    blk.appendChild(svg("text", { x: 0, y: -bh / 2 + 5, class: "dg-txt sm", "text-anchor": "middle", text: `${v.m} kg` }));
    g.appendChild(blk);
    /* force arrows at block centre */
    const ox = cx, oy = cy - bh / 2;
    g.appendChild(arrow(ox, oy, ox, oy + 52, "dg-force red", `W = ${sig(W, 4)} N`, ox + 8, oy + 50));
    const nx = ox - 46 * Math.sin(th), ny = oy - 46 * Math.cos(th);
    g.appendChild(arrow(ox, oy, nx, ny, "dg-force green", `N = ${sig(N, 4)} N`, nx - 92, ny - 4));
    const fx = ox - Math.min(60, fmax / 6) * Math.cos(th), fy = oy + Math.min(60, fmax / 6) * Math.sin(th);
    g.appendChild(arrow(ox, oy, fx, fy, "dg-force amber", `F_f = ${sig(Math.min(fmax, drv), 3)} N`, fx - 96, fy + 14));
    g.appendChild(dimLine(ax, ay + 26, ax + 120, ay + 26, `θ = ${v.ang}°`));
    const slipAng = Math.atan(v.mu) * 180 / Math.PI;
    return {
      body: g,
      readouts: [
        { k: "Weight W", v: `${sig(W, 4)} N` },
        { k: "Normal force N", v: `${sig(N, 4)} N` },
        { k: "Driving force", v: `${sig(drv, 4)} N` },
        { k: "Friction available", v: `${sig(fmax, 4)} N` },
        { k: "State", v: slips ? "SLIDING" : "Gripping", cls: slips ? "bad" : "ok" },
        { k: "Slip angle tan⁻¹μ", v: `${sig(slipAng, 3)}°`, cls: v.ang > slipAng ? "bad" : "" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   4 · TRUSS (method of joints, live solve)
   ══════════════════════════════════════════════════════════ */
const SIM_truss = defineSim("truss", {
  title: "Truss — member forces", sub: "A Warren truss solved live by the method of joints. Move the load along the bottom chord.",
  conceptId: "trusses", vb: "0 0 660 330",
  params: [
    { key: "P", label: "Load P", min: 5, max: 100, step: 1, def: 30, unit: "kN" },
    { key: "pos", label: "Loaded joint", min: 1, max: 3, step: 1, def: 2, fmt: v => "J" + (v + 1) },
    { key: "hgt", label: "Truss depth h", min: 0.8, max: 2.4, step: 0.1, def: 1.4, unit: "m" }
  ],
  note: "Members in red are in tension, blue in compression, with the force in kN. Increasing the depth reduces the chord forces because the internal lever arm grows.",
  render(v) {
    const L = 6, h = v.hgt;
    const joints = [[0, 0], [2, 0], [4, 0], [6, 0], [1, h], [3, h], [5, h]];
    const members = [[0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3], [3, 0 + 3], [4, 5], [5, 6], [1, 2], [2, 3], [0, 1]];
    /* reactions */
    const xp = joints[v.pos][0];
    const Ra = v.P * (L - xp) / L, Rb = v.P * xp / L;
    /* method of joints */
    const F = {};
    const unknown = members.map((m, i) => i);
    const key = (a, b) => Math.min(a, b) + "-" + Math.max(a, b);
    const atJoint = j => members.map((m, i) => [i, m]).filter(([, m]) => m[0] === j || m[1] === j);
    const solved = {};
    const loadVec = j => (j === v.pos ? [0, -v.P] : [0, 0]);
    const react = j => (j === 0 ? [0, Ra] : j === 3 ? [0, Rb] : [0, 0]);
    let guard = 0;
    while (Object.keys(solved).length < members.length && guard++ < 60) {
      for (let j = 0; j < joints.length; j++) {
        const ms = atJoint(j).filter(([i]) => solved[i] === undefined);
        if (ms.length !== 2 && !(ms.length === 1)) continue;
        if (ms.length > 2) continue;
        let fx = -(loadVec(j)[0] + react(j)[0]), fy = -(loadVec(j)[1] + react(j)[1]);
        ms.forEach(([i]) => { const m = members[i]; const o = m[0] === j ? m[1] : m[0]; const dx = joints[o][0] - joints[j][0], dy = joints[o][1] - joints[j][1]; const len = Math.hypot(dx, dy); const f = solved[i] || 0; fx += f * dx / len; fy += f * dy / len; });
        if (ms.length === 1) {
          const [i, m] = ms[0]; const o = m[0] === j ? m[1] : m[0];
          const dx = joints[o][0] - joints[j][0], dy = joints[o][1] - joints[j][1], len = Math.hypot(dx, dy);
          const ux = dx / len, uy = dy / len;
          if (Math.abs(ux) > 1e-6) solved[i] = -fx / ux; else if (Math.abs(uy) > 1e-6) solved[i] = -fy / uy; else solved[i] = 0;
        } else {
          const [[i1, m1], [i2, m2]] = ms;
          const u1 = unit(joints, m1, j), u2 = unit(joints, m2, j);
          const det = u1[0] * u2[1] - u1[1] * u2[0];
          if (Math.abs(det) < 1e-9) continue;
          const f1 = (-fx * u2[1] + fy * u2[0]) / det;
          const f2 = (-fx * u1[1] + fy * u1[0]) / -det;
          solved[i1] = f1; solved[i2] = f2;
        }
      }
    }
    /* draw */
    const x0 = 60, y0 = 250, sc = 88;
    const g = svg("g");
    g.appendChild(groundStrip(x0 - 34, x0 + 34, y0 + 24));
    g.appendChild(groundStrip(x0 + L * sc - 34, x0 + L * sc + 34, y0 + 24));
    const P2 = j => [x0 + joints[j][0] * sc, y0 - joints[j][1] * sc];
    members.forEach((m, i) => {
      const a = P2(m[0]), b = P2(m[1]);
      const f = solved[i] || 0;
      const col = Math.abs(f) < 0.05 ? "#5d84b8" : f > 0 ? "#dc2626" : "#0284c7";
      g.appendChild(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, "stroke-width": Math.abs(f) < 0.05 ? 1.4 : clamp(1.6 + Math.abs(f) / 14, 1.6, 6), "stroke-linecap": "round" }));
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      g.appendChild(svg("text", { x: mx, y: my - 6, class: "dg-txt sm", "text-anchor": "middle", fill: col, text: Math.abs(f) < 0.05 ? "0" : sig(Math.abs(f), 3) }));
    });
    joints.forEach((j, i) => {
      const p = P2(i);
      g.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 6, fill: "#eef4fb", stroke: i === v.pos ? "#d97706" : "#35597f", "stroke-width": 2 }));
    });
    const pl = P2(v.pos);
    g.appendChild(arrow(pl[0], pl[1] + 66, pl[0], pl[1] + 12, "dg-force amber", `P = ${v.P} kN`, pl[0] + 10, pl[1] + 58));
    const a0 = P2(0), a3 = P2(3);
    g.appendChild(arrow(a0[0], a0[1] + 46, a0[0], a0[1] + 10, "dg-force green", `R_A = ${sig(Ra, 3)} kN`, a0[0] - 100, a0[1] + 40));
    g.appendChild(arrow(a3[0], a3[1] + 46, a3[0], a3[1] + 10, "dg-force green", `R_B = ${sig(Rb, 3)} kN`, a3[0] + 10, a3[1] + 40));
    const vals = Object.values(solved);
    const maxF = vals.length ? Math.max(...vals.map(Math.abs)) : 0;
    return {
      body: g,
      readouts: [
        { k: "Reactions R_A / R_B", v: `${sig(Ra, 3)} / ${sig(Rb, 3)} kN` },
        { k: "Max member force", v: `${sig(maxF, 3)} kN`, cls: maxF > 60 ? "warn" : "" },
        { k: "Members solved", v: `${Object.keys(solved).length} / ${members.length}` },
        { k: "Zero-force members", v: `${vals.filter(f => Math.abs(f) < 0.05).length}` }
      ]
    };
  }
});
function unit(joints, m, j) {
  const o = m[0] === j ? m[1] : m[0];
  const dx = joints[o][0] - joints[j][0], dy = joints[o][1] - joints[j][1], len = Math.hypot(dx, dy);
  return [dx / len, dy / len];
}

/* ══════════════════════════════════════════════════════════
   5 · PROJECTILE
   ══════════════════════════════════════════════════════════ */
const SIM_projectile = defineSim("projectile", {
  title: "Projectile motion", sub: "Independent horizontal and vertical motion. Find the 45° optimum — then see how air drag would spoil it.",
  conceptId: "acceleration", vb: "0 0 660 320", animate: true,
  params: [
    { key: "v0", label: "Launch speed v₀", min: 2, max: 40, step: 0.5, def: 20, unit: "m/s" },
    { key: "ang", label: "Launch angle θ", min: 5, max: 85, step: 1, def: 45, unit: "°" },
    { key: "g", label: "Gravity g", min: 1.6, max: 9.81, step: 0.01, def: 9.81, unit: "m/s²" }
  ],
  note: "R = v₀²sin2θ/g. Maximum range at 45° in vacuum; the horizontal and vertical motions are completely independent.",
  render(v, t) {
    const th = v.ang * Math.PI / 180;
    const T = 2 * v.v0 * Math.sin(th) / v.g;
    const R = v.v0 * v.v0 * Math.sin(2 * th) / v.g;
    const H = (v.v0 * Math.sin(th)) ** 2 / (2 * v.g);
    const x0 = 60, y0 = 260, sc = Math.min(520 / Math.max(R, 1), 220 / Math.max(H, 0.5));
    const g = svg("g");
    g.appendChild(groundStrip(x0 - 20, 640, y0 + 4));
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const tt = T * i / 60;
      pts.push([x0 + v.v0 * Math.cos(th) * tt * sc, y0 - (v.v0 * Math.sin(th) * tt - 0.5 * v.g * tt * tt) * sc]);
    }
    g.appendChild(svg("path", { d: pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" "), fill: "none", stroke: "#0284c7", "stroke-width": 2, "stroke-dasharray": "6 4" }));
    const tc = t % (T + 0.6);
    const bx = x0 + v.v0 * Math.cos(th) * Math.min(tc, T) * sc;
    const by = y0 - (v.v0 * Math.sin(th) * Math.min(tc, T) - 0.5 * v.g * Math.min(tc, T) ** 2) * sc;
    g.appendChild(svg("circle", { cx: bx, cy: by, r: 7, fill: "#d97706", stroke: "#ffedd5", "stroke-width": 1.5 }));
    g.appendChild(arrow(x0, y0, x0 + 70 * Math.cos(th), y0 - 70 * Math.sin(th), "dg-force", `v₀ = ${v.v0} m/s`));
    g.appendChild(dimLine(x0, y0 + 26, x0 + R * sc, y0 + 26, `R = ${sig(R, 4)} m`));
    g.appendChild(svg("line", { x1: x0 + R * sc / 2, y1: y0, x2: x0 + R * sc / 2, y2: y0 - H * sc, class: "dg-dim" }));
    g.appendChild(label(x0 + R * sc / 2 + 6, y0 - H * sc / 2, `H = ${sig(H, 3)} m`, "dg-txt sm"));
    return {
      body: g,
      readouts: [
        { k: "Range R", v: `${sig(R, 4)} m` },
        { k: "Max height H", v: `${sig(H, 3)} m` },
        { k: "Time of flight", v: `${sig(T, 3)} s` },
        { k: "v_x / v_y at launch", v: `${sig(v.v0 * Math.cos(th), 3)} / ${sig(v.v0 * Math.sin(th), 3)}` },
        { k: "Range at 45°", v: `${sig(v.v0 * v.v0 / v.g, 4)} m`, cls: Math.abs(v.ang - 45) < 2 ? "ok" : "" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   6 · PENDULUM
   ══════════════════════════════════════════════════════════ */
const SIM_pendulum = defineSim("pendulum", {
  title: "Simple pendulum", sub: "T = 2π√(L/g): the period does not depend on the mass — only on length and gravity.",
  conceptId: "vibrations", vb: "0 0 660 320", animate: true,
  params: [
    { key: "L", label: "Length L", min: 0.2, max: 3, step: 0.05, def: 1, unit: "m" },
    { key: "g", label: "Gravity g", min: 1.6, max: 9.81, step: 0.01, def: 9.81, unit: "m/s²" },
    { key: "amp", label: "Amplitude", min: 5, max: 60, step: 1, def: 25, unit: "°" }
  ],
  note: "For small angles the period is independent of amplitude and mass. Above about 15° the small-angle approximation starts to under-predict the period.",
  render(v, t) {
    const w = Math.sqrt(v.g / v.L), T = 2 * Math.PI / w;
    const th = v.amp * Math.PI / 180 * Math.cos(w * t);
    const ox = 330, oy = 50, px = 190 / 1.6;
    const bx = ox + px * Math.sin(th) * v.L, by = oy + px * Math.cos(th) * v.L;
    const g = svg("g");
    g.appendChild(svg("line", { x1: ox - 70, y1: oy, x2: ox + 70, y2: oy, stroke: "#5d84b8", "stroke-width": 6 }));
    for (let i = -6; i <= 6; i++) g.appendChild(svg("line", { x1: ox + i * 12, y1: oy, x2: ox + i * 12 - 8, y2: oy - 10, stroke: "#5d84b8", "stroke-width": 1 }));
    g.appendChild(svg("line", { x1: ox, y1: oy, x2: ox, y2: oy + px * v.L + 20, class: "dg-dim" }));
    g.appendChild(svg("line", { x1: ox, y1: oy, x2: bx, y2: by, stroke: "#35597f", "stroke-width": 2 }));
    g.appendChild(svg("circle", { cx: bx, cy: by, r: 15, fill: "#c9d8ea", stroke: "#0ea5e9", "stroke-width": 2 }));
    const arcR = 60;
    g.appendChild(svg("path", { d: `M ${ox} ${oy + arcR} A ${arcR} ${arcR} 0 0 0 ${ox + arcR * Math.sin(v.amp * Math.PI / 180)} ${oy + arcR * Math.cos(v.amp * Math.PI / 180)}`, fill: "none", stroke: "#d97706", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
    g.appendChild(label(ox + 14, oy + arcR + 4, `θ = ${sig(v.amp, 3)}°`, "dg-txt sm"));
    g.appendChild(arrow(bx, by, bx, by + 46, "dg-force red", "mg"));
    g.appendChild(label(ox + 96, oy + 40, `θ now = ${sig(th * 180 / Math.PI, 3)}°`, "dg-txt"));
    const err = v.amp > 15 ? (1 + (v.amp * Math.PI / 180) ** 2 / 16) : 1;
    return {
      body: g,
      readouts: [
        { k: "ω_n", v: `${sig(w, 4)} rad/s` },
        { k: "Period T (small angle)", v: `${sig(T, 4)} s` },
        { k: "Frequency", v: `${sig(1 / T, 3)} Hz` },
        { k: "Corrected period", v: `${sig(T * err, 4)} s`, cls: v.amp > 15 ? "warn" : "ok" },
        { k: "Angle now", v: `${sig(th * 180 / Math.PI, 3)}°` },
        { k: "Speed now", v: `${sig(w * v.L * v.amp * Math.PI / 180 * Math.abs(Math.sin(w * t)), 3)} m/s` }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   7 · ROTATING DISK
   ══════════════════════════════════════════════════════════ */
const SIM_disk = defineSim("disk", {
  title: "Rotating disk", sub: "Torque, angular acceleration and inertia. Every point shares ω — but v = ωr grows with radius.",
  conceptId: "rotational-dynamics", vb: "0 0 660 320", animate: true,
  params: [
    { key: "T", label: "Applied torque T", min: 0, max: 60, step: 1, def: 20, unit: "N·m" },
    { key: "m", label: "Disk mass m", min: 1, max: 60, step: 1, def: 12, unit: "kg" },
    { key: "r", label: "Disk radius r", min: 0.05, max: 0.5, step: 0.01, def: 0.2, unit: "m" },
    { key: "b", label: "Friction torque", min: 0, max: 10, step: 0.1, def: 1, unit: "N·m" }
  ],
  note: "I = ½mr², α = ΣT/I. Doubling the radius quadruples the inertia for the same mass — the reason flywheels put their mass at the rim.",
  render(v, t) {
    const I = 0.5 * v.m * v.r * v.r;
    const cx = 250, cy = 160, R = 105;
    const w = (t * 60) % 360 * Math.PI / 180 * (1 + v.T / 20);
    const g = svg("g");
    g.appendChild(svg("circle", { cx, cy, r: R, fill: "#f1f5f9", stroke: "#35597f", "stroke-width": 2 }));
    g.appendChild(svg("circle", { cx, cy, r: R * 0.62, fill: "none", stroke: "#dbe6f2", "stroke-width": 10 }));
    for (let i = 0; i < 8; i++) {
      const a = w + i * Math.PI / 4;
      g.appendChild(svg("line", { x1: cx + 16 * Math.cos(a), y1: cy + 16 * Math.sin(a), x2: cx + R * 0.9 * Math.cos(a), y2: cy + R * 0.9 * Math.sin(a), stroke: "#5d84b8", "stroke-width": 3 }));
    }
    g.appendChild(svg("circle", { cx, cy, r: 12, fill: "#dbe6f2", stroke: "#0284c7", "stroke-width": 2.4 }));
    g.appendChild(arrow(cx + R * 0.2, cy - R * 1.15, cx + R * 0.95, cy - R * 1.15, "dg-force", `T = ${v.T} N·m`, cx - 30, cy - R * 1.15 - 10));
    const rpmNow = (v.T - v.b) > 0 ? 0 : 0;
    const alpha = Math.max(0, v.T - v.b) / I;
    const wNow = alpha * Math.min(t, 6);
    const P = Math.abs(wNow) > 0 ? v.T * wNow : 0;
    const pt = svg("circle", { cx: cx + R * Math.cos(w), cy: cy + R * Math.sin(w), r: 6, fill: "#d97706" });
    g.appendChild(pt);
    g.appendChild(label(cx + R + 40, cy - 40, `ω = ${sig(wNow, 3)} rad/s`, "dg-txt"));
    g.appendChild(label(cx + R + 40, cy - 18, `= ${sig(UNITS.radps2rpm(wNow), 4)} rpm`, "dg-txt sm"));
    return {
      body: g,
      readouts: [
        { k: "Inertia I = ½mr²", v: `${sig(I, 3)} kg·m²` },
        { k: "α = ΣT/I", v: `${sig(alpha, 3)} rad/s²` },
        { k: "ω after 5 s", v: `${sig(alpha * 5, 3)} rad/s` },
        { k: "Speed after 5 s", v: `${sig(UNITS.radps2rpm(alpha * 5), 4)} rpm` },
        { k: "Rim speed v = ωr", v: `${sig(alpha * 5 * v.r, 3)} m/s` },
        { k: "Kinetic energy", v: `${sig(0.5 * I * (alpha * 5) ** 2, 3)} J` }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   8 · SLIDER-CRANK MECHANISM
   ══════════════════════════════════════════════════════════ */
const SIM_slidercrank = defineSim("slidercrank", {
  title: "Slider-crank mechanism", sub: "Rotation into reciprocation — the engine's core. Watch the piston speed vary through the cycle.",
  conceptId: "mechanisms", vb: "0 0 660 300", animate: true,
  params: [
    { key: "n", label: "Crank speed n", min: 60, max: 3000, step: 30, def: 600, unit: "rpm" },
    { key: "r", label: "Crank radius r", min: 20, max: 80, step: 1, def: 50, unit: "mm" },
    { key: "l", label: "Rod length l", min: 90, max: 260, step: 5, def: 160, unit: "mm" }
  ],
  note: "x = r·cos θ + √(l² − r²sin²θ). A shorter rod (larger r/l) increases the piston's acceleration and the side thrust on the cylinder wall.",
  render(v, t) {
    const w = UNITS.rpm2radps(v.n);
    const th = (w * t) % (2 * Math.PI);
    const r = v.r, l = v.l;
    const sinb = r * Math.sin(th) / l;
    const cosb = Math.sqrt(Math.max(0, 1 - sinb * sinb));
    const x = r * Math.cos(th) + l * cosb;
    const dxdt = -r * w * Math.sin(th) - (r * r * w * Math.sin(2 * th)) / (2 * l * cosb || 1);
    const stroke = 2 * r;
    const ox = 190, oy = 165, sc = 1.5;
    const cx = ox + r * Math.cos(th) * sc, cy = oy - r * Math.sin(th) * sc;
    const px = ox + x * sc;
    const g = svg("g");
    g.appendChild(svg("circle", { cx: ox, cy: oy, r: r * sc, fill: "none", stroke: "#dbe6f2", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
    g.appendChild(svg("rect", { x: px - 22, y: oy - 30, width: 60, height: 60, rx: 5, fill: "#c9d8ea", stroke: "#0ea5e9", "stroke-width": 2 }));
    g.appendChild(svg("line", { x1: px + 38, y1: oy - 34, x2: 620, y2: oy - 34, stroke: "#5d84b8", "stroke-width": 3 }));
    g.appendChild(svg("line", { x1: px + 38, y1: oy + 34, x2: 620, y2: oy + 34, stroke: "#5d84b8", "stroke-width": 3 }));
    g.appendChild(svg("line", { x1: ox, y1: oy, x2: cx, y2: cy, stroke: "#dc2626", "stroke-width": 7, "stroke-linecap": "round" }));
    g.appendChild(svg("line", { x1: cx, y1: cy, x2: px, y2: oy, stroke: "#35597f", "stroke-width": 6, "stroke-linecap": "round" }));
    [  [ox, oy], [cx, cy], [px, oy] ].forEach(p => g.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 7, fill: "#eef4fb", stroke: "#0284c7", "stroke-width": 2.4 })));
    g.appendChild(arrow(ox + r * sc * 1.25, oy - 52, ox + r * sc * 1.25 - 26, oy - 52, "dg-force green", `ω = ${sig(v.n, 4)} rpm`, ox + r * sc * 1.25 - 6, oy - 62));
    g.appendChild(dimLine(ox, oy + 78, ox + stroke * sc, oy + 78, `stroke = ${stroke} mm`));
    g.appendChild(svg("line", { x1: px, y1: oy + 40, x2: px, y2: oy + 70, stroke: "#d97706", "stroke-width": 2 }));
    const vmax = r * w * (1 + r / (2 * l));
    return {
      body: g,
      readouts: [
        { k: "Crank angle θ", v: `${sig(th * 180 / Math.PI, 3)}°` },
        { k: "Piston position x", v: `${sig(x, 4)} mm` },
        { k: "Piston velocity", v: `${sig(dxdt / 1000, 4)} m/s` },
        { k: "Max piston speed", v: `${sig(vmax / 1000, 4)} m/s` },
        { k: "Rod angle β", v: `${sig(Math.asin(sinb) * 180 / Math.PI, 3)}°` },
        { k: "r/l ratio", v: `${sig(r / l, 3)}`, cls: r / l > 0.33 ? "warn" : "ok" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   9 · MASS-SPRING SYSTEM
   ══════════════════════════════════════════════════════════ */
const SIM_springmass = defineSim("springmass", {
  title: "Mass–spring vibration", sub: "Free and forced vibration. Push the excitation frequency towards the natural frequency and watch resonance.",
  conceptId: "vibrations", vb: "0 0 660 300", animate: true,
  params: [
    { key: "m", label: "Mass m", min: 5, max: 200, step: 5, def: 40, unit: "kg" },
    { key: "k", label: "Stiffness k", min: 1000, max: 200000, step: 1000, def: 40000, unit: "N/m" },
    { key: "z", label: "Damping ratio ζ", min: 0.01, max: 0.8, step: 0.01, def: 0.08 },
    { key: "f", label: "Excitation frequency f", min: 0, max: 40, step: 0.5, def: 0, unit: "Hz" }
  ],
  note: "Set f = 0 for free vibration. Then raise f towards f_n: the amplitude grows until damping limits it. Isolation only works above f = √2·f_n.",
  render(v, t) {
    const wn = Math.sqrt(v.k / v.m), fn = wn / (2 * Math.PI);
    const wd = wn * Math.sqrt(1 - v.z * v.z);
    let x, mode;
    if (v.f <= 0) {
      x = 0.05 * Math.exp(-v.z * wn * t) * Math.cos(wd * t);
      mode = "free vibration";
    } else {
      const r = (2 * Math.PI * v.f) / wn;
      const X = 0.02 / Math.sqrt((1 - r * r) ** 2 + (2 * v.z * r) ** 2);
      x = X * Math.sin(2 * Math.PI * v.f * t - Math.atan2(2 * v.z * r, 1 - r * r));
      mode = "forced vibration";
    }
    const r = v.f > 0 ? (2 * Math.PI * v.f) / wn : 0;
    const TR = v.f > 0 ? Math.sqrt(1 + (2 * v.z * r) ** 2) / Math.sqrt((1 - r * r) ** 2 + (2 * v.z * r) ** 2) : 0;
    const ox = 120, oy = 150, dx = x * 1400;
    const g = svg("g");
    g.appendChild(svg("rect", { x: 30, y: oy - 70, width: 14, height: 140, fill: "#dbe6f2", stroke: "#5d84b8" }));
    /* spring */
    let d = `M44,${oy}`;
    for (let i = 0; i <= 12; i++) d += ` L${44 + (140 + dx) * i / 12},${oy + (i % 2 ? -22 : 22)}`;
    d += ` L${184 + dx},${oy}`;
    g.appendChild(svg("path", { d, fill: "none", stroke: "#0ea5e9", "stroke-width": 2.4 }));
    g.appendChild(svg("rect", { x: 184 + dx, y: oy - 34, width: 68, height: 68, rx: 6, fill: "#c9d8ea", stroke: "#0284c7", "stroke-width": 2 }));
    g.appendChild(svg("text", { x: 218 + dx, y: oy + 6, class: "dg-txt", "text-anchor": "middle", text: `${v.m} kg` }));
    g.appendChild(groundStrip(30, 320, oy + 42));
    g.appendChild(svg("line", { x1: 184, y1: oy - 60, x2: 184 + dx, y2: oy - 60, stroke: "#d97706", "stroke-width": 2, "marker-end": "url(#arw-amber)" }));
    g.appendChild(label(184 + dx / 2, oy - 68, `x = ${sig(x * 1000, 3)} mm`, "dg-txt sm", "middle"));
    /* response plot */
    const bx = 360, bw = 270, bh = 170;
    g.appendChild(svg("rect", { x: bx, y: 60, width: bw, height: bh, fill: "#eef4fb", stroke: "#dbe6f2" }));
    let pd = "";
    for (let i = 0; i <= 120; i++) {
      const tt = t - (120 - i) * 0.02;
      let xx;
      if (v.f <= 0) xx = 0.05 * Math.exp(-v.z * wn * Math.max(tt, 0)) * Math.cos(wd * Math.max(tt, 0));
      else { const X = 0.02 / Math.sqrt((1 - r * r) ** 2 + (2 * v.z * r) ** 2); xx = X * Math.sin(2 * Math.PI * v.f * tt); }
      pd += `${i ? "L" : "M"}${bx + bw * i / 120},${60 + bh / 2 - clamp(xx * 1200, -bh / 2 + 4, bh / 2 - 4)}`;
    }
    g.appendChild(svg("path", { d: pd, fill: "none", stroke: "#0284c7", "stroke-width": 1.8 }));
    g.appendChild(label(bx + 4, 54, "displacement vs time", "dg-txt sm"));
    return {
      body: g,
      readouts: [
        { k: "f_n = √(k/m)/2π", v: `${sig(fn, 4)} Hz`, cls: v.f > 0 && Math.abs(v.f - fn) / fn < 0.1 ? "bad" : "" },
        { k: "ω_n", v: `${sig(wn, 4)} rad/s` },
        { k: "Frequency ratio r", v: v.f > 0 ? sig(r, 3) : "— (free)" },
        { k: "Transmissibility", v: v.f > 0 ? sig(TR, 3) : "—", cls: v.f > 0 && TR > 1.4 ? "bad" : v.f > 0 && TR < 0.7 ? "ok" : "" },
        { k: "Isolating?", v: v.f <= 0 ? "—" : r > Math.SQRT2 ? "YES" : "NO — amplifying", cls: v.f > 0 ? (r > Math.SQRT2 ? "ok" : "bad") : "" },
        { k: "Mode", v: mode }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   10 · TENSILE TEST
   ══════════════════════════════════════════════════════════ */
const MATERIALS = {
  "S235 steel": { E: 200e9, sy: 235e6, su: 360e6, ef: 0.26, d: 12 },
  "S355 steel": { E: 200e9, sy: 355e6, su: 510e6, ef: 0.22, d: 12 },
  "Al 6061-T6": { E: 69e9, sy: 276e6, su: 310e6, ef: 0.15, d: 12 },
  "Copper (annealed)": { E: 117e9, sy: 70e6, su: 220e6, ef: 0.45, d: 12 },
  "Cast iron (grey)": { E: 110e9, sy: 0, su: 200e6, ef: 0.007, d: 12 }
};
function stressStrainCurve(mat, n = 120) {
  const pts = [];
  const ey = mat.sy ? mat.sy / mat.E : 0.0015;
  for (let i = 0; i <= n; i++) {
    const e = mat.ef * i / n;
    let s;
    if (e <= ey) s = mat.E * e;
    else {
      const p = (e - ey) / (mat.ef - ey);
      if (!mat.sy) s = mat.su * Math.pow(p, 0.05);
      else s = mat.sy + (mat.su - mat.sy) * Math.sin(Math.min(p, 1) * Math.PI / 2);
    }
    if (e > mat.ef * 0.82 && mat.ef > 0.05) s *= 1 - 0.55 * ((e - mat.ef * 0.82) / (mat.ef * 0.18)) ** 1.6;
    pts.push([e, Math.max(s, 0)]);
  }
  return pts;
}
const SIM_tensile = defineSim("tensile", {
  title: "Tensile test", sub: "The whole story of a material on one curve: elasticity, yield, hardening, necking, fracture.",
  conceptId: "stress", vb: "0 0 660 340",
  params: [
    { key: "mat", label: "Material", type: "select", def: "S235 steel", options: Object.keys(MATERIALS).map(k => [k, k]) },
    { key: "eps", label: "Current strain ε", min: 0, max: 0.45, step: 0.001, def: 0.004, fmt: v => sig(v * 1000, 3) + " ‰" }
  ],
  note: "Unloading from any point follows a line parallel to the elastic slope — the horizontal distance left behind is the permanent plastic strain.",
  render(v) {
    const mat = MATERIALS[v.mat] || MATERIALS["S235 steel"];
    const curve = stressStrainCurve(mat);
    const x0 = 80, y0 = 280, W = 470, H = 220;
    const emax = mat.ef * 1.08, smax = Math.max(...curve.map(p => p[1])) * 1.08;
    const px = e => x0 + e / emax * W, py = s => y0 - s / smax * H;
    const g = svg("g");
    g.appendChild(svg("line", { x1: x0, y1: y0, x2: x0 + W, y2: y0, stroke: "#5d84b8", "stroke-width": 1.6 }));
    g.appendChild(svg("line", { x1: x0, y1: y0, x2: x0, y2: y0 - H - 10, stroke: "#5d84b8", "stroke-width": 1.6 }));
    g.appendChild(label(x0 + W - 6, y0 + 20, "strain ε →", "dg-txt sm", "end"));
    g.appendChild(label(x0 - 60, y0 - H - 14, "stress σ (MPa) ↑", "dg-txt sm"));
    [0.25, 0.5, 0.75, 1].forEach(f => {
      g.appendChild(svg("line", { x1: x0, y1: y0 - H * f, x2: x0 + W, y2: y0 - H * f, stroke: "#e2e9f2" }));
      g.appendChild(label(x0 - 8, y0 - H * f + 4, sig(smax * f / 1e6, 3), "dg-txt sm", "end"));
    });
    g.appendChild(svg("path", { d: curve.map((p, i) => `${i ? "L" : "M"}${px(p[0])},${py(p[1])}`).join(" "), fill: "none", stroke: "#0284c7", "stroke-width": 2.4 }));
    /* elastic slope line */
    g.appendChild(svg("line", { x1: x0, y1: y0, x2: px(mat.ef), y2: py(mat.E * mat.ef), stroke: "#5d84b8", "stroke-width": 1, "stroke-dasharray": "5 4" }));
    if (mat.sy) {
      g.appendChild(svg("line", { x1: x0, y1: py(mat.sy), x2: x0 + W, y2: py(mat.sy), stroke: "#d97706", "stroke-width": 1, "stroke-dasharray": "6 4" }));
      g.appendChild(label(x0 + W - 4, py(mat.sy) - 6, `σ_y = ${sig(mat.sy / 1e6, 3)} MPa`, "dg-txt sm", "end"));
    }
    g.appendChild(svg("line", { x1: x0, y1: py(mat.su), x2: x0 + W, y2: py(mat.su), stroke: "#dc2626", "stroke-width": 1, "stroke-dasharray": "6 4" }));
    g.appendChild(label(x0 + W - 4, py(mat.su) - 6, `σ_u = ${sig(mat.su / 1e6, 3)} MPa`, "dg-txt sm", "end"));
    /* current point */
    const e = Math.min(v.eps, mat.ef);
    const ey = mat.sy ? mat.sy / mat.E : 0.0015;
    let s;
    if (e <= ey) s = mat.E * e;
    else { const f = curve.find(p => p[0] >= e); s = f ? f[1] : mat.su; }
    g.appendChild(svg("circle", { cx: px(e), cy: py(s), r: 6, fill: "#d97706", stroke: "#fff", "stroke-width": 1.5 }));
    g.appendChild(svg("line", { x1: px(e), y1: py(s), x2: px(e), y2: y0, stroke: "#d97706", "stroke-width": 1, "stroke-dasharray": "3 3" }));
    if (e > ey) {
      const recov = s / mat.E;
      g.appendChild(svg("line", { x1: px(e), y1: py(s), x2: px(e - recov), y2: y0, stroke: "#16a34a", "stroke-width": 2, "stroke-dasharray": "5 3" }));
      g.appendChild(label(px(e - recov) + 4, y0 - 8, `plastic ${sig((e - recov) * 100, 3)} %`, "dg-txt sm"));
    }
    /* specimen drawing */
    const neck = clamp((e - ey) / Math.max(mat.ef - ey, 1e-6), 0, 1);
    const sx = 570, sw = 34 * (1 - 0.45 * neck), sh = 150;
    g.appendChild(svg("path", { d: `M${sx - 17},70 L${sx + 17},70 L${sx + sw / 2},${70 + sh * 0.3} Q${sx + sw / 2 - 6},${70 + sh / 2} ${sx + sw / 2},${70 + sh * 0.7} L${sx + 17},${70 + sh} L${sx - 17},${70 + sh} L${sx - sw / 2},${70 + sh * 0.7} Q${sx - sw / 2 + 6},${70 + sh / 2} ${sx - sw / 2},${70 + sh * 0.3} Z`, fill: neck > 0.85 ? "#b91c1c" : "#c9d8ea", stroke: neck > 0.85 ? "#dc2626" : "#0ea5e9", "stroke-width": 2 }));
    g.appendChild(label(sx, 62, neck > 0.85 ? "necking" : "specimen", "dg-txt sm", "middle"));
    const A = Math.PI * (mat.d / 2000) ** 2, F = s * A;
    return {
      body: g,
      readouts: [
        { k: "Stress σ", v: `${sig(s / 1e6, 4)} MPa` },
        { k: "Elastic strain", v: `${sig(s / mat.E * 1000, 3)} ‰` },
        { k: "Plastic strain", v: e > ey ? `${sig((e - s / mat.E) * 100, 3)} %` : "0 (fully elastic)", cls: e > ey ? "warn" : "ok" },
        { k: "Load on Ø12 bar", v: `${sig(F / 1000, 4)} kN` },
        { k: "State", v: e > mat.ef * 0.82 ? "necking / fracture" : e > ey ? "plastic — hardening" : "elastic", cls: e > ey ? "warn" : "ok" },
        { k: "σ_y / σ_u", v: `${mat.sy ? sig(mat.sy / 1e6, 3) : "—"} / ${sig(mat.su / 1e6, 3)} MPa` }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   11 · BENDING (section properties)
   ══════════════════════════════════════════════════════════ */
const SIM_bending = defineSim("bending", {
  title: "Bending & section properties", sub: "Why an I-beam beats a rectangle: material far from the neutral axis does the work.",
  conceptId: "bending", vb: "0 0 660 320",
  params: [
    { key: "type", label: "Section", type: "select", def: "Rectangle", options: [["Rectangle", "Rectangle b×h"], ["I-section", "I-section"], ["Circle", "Solid circle"]] },
    { key: "h", label: "Depth h", min: 40, max: 400, step: 10, def: 200, unit: "mm" },
    { key: "b", label: "Width b", min: 20, max: 300, step: 10, def: 100, unit: "mm" },
    { key: "M", label: "Bending moment M", min: 0.5, max: 60, step: 0.5, def: 10, unit: "kN·m" }
  ],
  note: "Compare a rectangle and an I-section of similar area: the I-section has a far larger I and Z, so it carries the same moment at much lower stress.",
  render(v) {
    const h = v.h / 1000, b = v.b / 1000, M = v.M * 1000;
    let I, A, shape = [];
    if (v.type === "Rectangle") { I = b * h ** 3 / 12; A = b * h; }
    else if (v.type === "Circle") { const r = b / 2; I = Math.PI * r ** 4 / 4; A = Math.PI * r * r; }
    else { const tw = Math.max(0.006, b * 0.08), tf = Math.max(0.008, h * 0.09); I = (b * h ** 3 - (b - tw) * (h - 2 * tf) ** 3) / 12; A = b * h - (b - tw) * (h - 2 * tf); }
    const Z = I / (h / 2), sigMax = M / Z / 1e6;
    const cx = 200, cy = 160, sc = Math.min(360 / h, 300 / Math.max(b, 0.04));
    const g = svg("g");
    const wpx = b * sc, hpx = h * sc;
    if (v.type === "Circle") {
      g.appendChild(svg("circle", { cx, cy, r: b / 2 * sc, fill: "#c9d8ea", stroke: "#0ea5e9", "stroke-width": 2 }));
    } else if (v.type === "Rectangle") {
      g.appendChild(svg("rect", { x: cx - wpx / 2, y: cy - hpx / 2, width: wpx, height: hpx, fill: "#c9d8ea", stroke: "#0ea5e9", "stroke-width": 2 }));
    } else {
      const tw = Math.max(0.006, b * 0.08) * sc, tf = Math.max(0.008, h * 0.09) * sc;
      g.appendChild(svg("path", { d: `M${cx - wpx / 2},${cy - hpx / 2} h${wpx} v${tf} h${-(wpx - tw) / 2} v${hpx - 2 * tf} h${(wpx - tw) / 2} v${tf} h${-wpx} v${-tf} h${(wpx - tw) / 2} v${-(hpx - 2 * tf)} h${-(wpx - tw) / 2} z`, fill: "#c9d8ea", stroke: "#0ea5e9", "stroke-width": 2 }));
    }
    g.appendChild(svg("line", { x1: cx - wpx, y1: cy, x2: cx + wpx, y2: cy, stroke: "#d97706", "stroke-width": 1.6, "stroke-dasharray": "7 4" }));
    g.appendChild(label(cx + wpx + 6, cy + 4, "neutral axis", "dg-txt sm"));
    /* stress distribution */
    const sw = 110, sx = 430;
    for (let i = 0; i <= 40; i++) {
      const yy = cy - hpx / 2 + hpx * i / 40;
      const s = (cy - yy) / (hpx / 2);
      const len = s * sw;
      g.appendChild(svg("line", { x1: sx, y1: yy, x2: sx + len, y2: yy, stroke: s > 0 ? "#dc2626" : "#0284c7", "stroke-width": 2.2, opacity: 0.85 }));
    }
    g.appendChild(svg("line", { x1: sx, y1: cy - hpx / 2, x2: sx, y2: cy + hpx / 2, stroke: "#35597f", "stroke-width": 1.4 }));
    g.appendChild(label(sx + sw + 6, cy - hpx / 2 + 10, `+${sig(sigMax, 3)} MPa`, "dg-txt sm"));
    g.appendChild(label(sx + sw + 6, cy + hpx / 2, `−${sig(sigMax, 3)} MPa`, "dg-txt sm"));
    g.appendChild(label(sx, cy - hpx / 2 - 12, "bending stress distribution", "dg-txt sm"));
    g.appendChild(arrow(cx, cy - hpx / 2 - 34, cx + 40, cy - hpx / 2 - 34, "dg-force green", `M = ${v.M} kN·m`));
    const rectI = b * h ** 3 / 12;
    return {
      body: g,
      readouts: [
        { k: "Area A", v: `${sig(A * 1e4, 4)} cm²` },
        { k: "Second moment I", v: `${sig(I * 1e8, 4)} cm⁴` },
        { k: "Section modulus Z", v: `${sig(Z * 1e6, 4)} cm³` },
        { k: "σ_max", v: `${sig(sigMax, 4)} MPa`, cls: sigMax > 235 ? "bad" : sigMax > 165 ? "warn" : "ok" },
        { k: "I / (bh³/12)", v: `${sig(I / rectI, 3)}`, cls: I / rectI > 1.2 ? "ok" : "" },
        { k: "FoS vs S235", v: `${sig(235 / Math.max(sigMax, 0.01), 3)}` }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   12 · TORSION OF A SHAFT
   ══════════════════════════════════════════════════════════ */
const SIM_torsion = defineSim("torsion", {
  title: "Shaft in torsion", sub: "Shear stress grows linearly from the axis — which is exactly why hollow shafts are efficient.",
  conceptId: "torsion", vb: "0 0 660 300",
  params: [
    { key: "T", label: "Torque T", min: 10, max: 2000, step: 10, def: 300, unit: "N·m" },
    { key: "d", label: "Outer diameter d", min: 15, max: 120, step: 1, def: 30, unit: "mm" },
    { key: "ratio", label: "Inner/outer diameter", min: 0, max: 0.9, step: 0.05, def: 0, fmt: v => v === 0 ? "solid" : sig(v, 2) },
    { key: "n", label: "Speed n", min: 100, max: 3600, step: 50, def: 1500, unit: "rpm" }
  ],
  note: "τ = Tr/J. Making the shaft hollow removes material from the region that contributes least — a large mass saving for a small strength loss.",
  render(v) {
    const R = v.d / 2000, ri = R * v.ratio;
    const J = Math.PI * (R ** 4 - ri ** 4) / 2;
    const tau = v.T * R / J / 1e6;
    const w = UNITS.rpm2radps(v.n), P = v.T * w / 1000;
    const th = v.T * 1 / (76.9e9 * J) * 180 / Math.PI;
    const cx = 190, cy = 150, rr = 95, rin = rr * v.ratio;
    const g = svg("g");
    g.appendChild(svg("circle", { cx, cy, r: rr, fill: "#f1f5f9", stroke: "#35597f", "stroke-width": 2 }));
    if (v.ratio > 0) g.appendChild(svg("circle", { cx, cy, r: rin, fill: "#f4f7fb", stroke: "#35597f", "stroke-width": 2 }));
    for (let i = 0; i <= 6; i++) {
      const f = i / 6, rad = rin + (rr - rin) * f;
      const twist = tau * f * 0.9;
      g.appendChild(svg("line", { x1: cx + rad * Math.cos(-Math.PI / 4), y1: cy + rad * Math.sin(-Math.PI / 4), x2: cx + rad * Math.cos(-Math.PI / 4 + twist / 60), y2: cy + rad * Math.sin(-Math.PI / 4 + twist / 60), stroke: `rgba(2,132,199,${0.18 + f * 0.5})`, "stroke-width": 2.6 }));
    }
    g.appendChild(svg("circle", { cx, cy, r: 5, fill: "#d97706" }));
    g.appendChild(arrow(cx - rr - 30, cy - 30, cx - rr - 30 + 44, cy - 30, "dg-force", `T = ${v.T} N·m`, cx - rr - 30, cy - 44));
    /* stress distribution */
    const sx = 420;
    for (let i = 0; i <= 30; i++) {
      const f = i / 30, rad = rin + (rr - rin) * f;
      const frac = rad / rr;
      g.appendChild(svg("line", { x1: sx + frac * 0, y1: cy - rr + (2 * rr) * i / 30, x2: sx + frac * 130, y2: cy - rr + (2 * rr) * i / 30, stroke: "#dc2626", "stroke-width": 2, opacity: 0.35 + frac * 0.6 }));
    }
    g.appendChild(svg("line", { x1: sx, y1: cy - rr, x2: sx, y2: cy + rr, stroke: "#35597f", "stroke-width": 1.4 }));
    g.appendChild(label(sx + 136, cy - 6, `τ_max = ${sig(tau, 3)} MPa`, "dg-txt sm"));
    g.appendChild(label(sx, cy - rr - 12, "shear stress vs radius", "dg-txt sm"));
    const massRatio = 1 - v.ratio ** 2;
    const solidTau = v.T * R / (Math.PI * R ** 4 / 2) / 1e6;
    return {
      body: g,
      readouts: [
        { k: "Polar moment J", v: `${sig(J * 1e12, 4)} mm⁴` },
        { k: "τ_max", v: `${sig(tau, 4)} MPa`, cls: tau > 200 ? "bad" : tau > 130 ? "warn" : "ok" },
        { k: "Twist over 1 m", v: `${sig(th, 3)} °/m`, cls: th > 1 ? "warn" : "ok" },
        { k: "Power at n", v: `${sig(P, 4)} kW` },
        { k: "Mass vs solid", v: `${sig(massRatio * 100, 3)} %`, cls: massRatio < 0.8 ? "ok" : "" },
        { k: "τ if solid", v: `${sig(solidTau, 4)} MPa` }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   13 · MOHR'S CIRCLE + YIELD CRITERIA
   ══════════════════════════════════════════════════════════ */
const SIM_mohr = defineSim("mohr", {
  title: "Mohr's circle & yield criteria", sub: "Principal stresses, maximum shear, and how close the state is to yielding by Tresca and von Mises.",
  conceptId: "mohr", vb: "0 0 660 320",
  params: [
    { key: "sx", label: "σ_x", min: -200, max: 300, step: 5, def: 120, unit: "MPa" },
    { key: "sy", label: "σ_y", min: -200, max: 300, step: 5, def: 0, unit: "MPa" },
    { key: "txy", label: "τ_xy", min: -150, max: 150, step: 5, def: 40, unit: "MPa" },
    { key: "syield", label: "Yield strength σ_y", min: 150, max: 900, step: 5, def: 355, unit: "MPa" }
  ],
  note: "The circle's radius is the maximum in-plane shear stress. The dotted hexagon is the Tresca yield surface and the ellipse is von Mises — the point must stay inside both.",
  render(v) {
    const C = (v.sx + v.sy) / 2, R = Math.hypot((v.sx - v.sy) / 2, v.txy);
    const s1 = C + R, s2 = C - R;
    const vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
    const tresca = s1 - s2;
    const cx = 210, cy = 160, sc = 0.62;
    const g = svg("g");
    g.appendChild(svg("line", { x1: 40, y1: cy, x2: 400, y2: cy, stroke: "#5d84b8", "stroke-width": 1.4 }));
    g.appendChild(svg("line", { x1: cx, y1: 30, x2: cx, y2: 290, stroke: "#5d84b8", "stroke-width": 1.4 }));
    [-200, -100, 100, 200, 300].forEach(s => {
      g.appendChild(svg("line", { x1: cx + s * sc, y1: cy - 4, x2: cx + s * sc, y2: cy + 4, stroke: "#5d84b8" }));
      g.appendChild(label(cx + s * sc, cy + 18, s, "dg-txt sm", "middle"));
    });
    g.appendChild(label(396, cy - 8, "σ", "dg-txt sm", "end"));
    g.appendChild(label(cx + 8, 40, "τ", "dg-txt sm"));
    /* yield surfaces */
    const Y = v.syield;
    let hex = "";
    [[Y, 0], [Y / 2, Y * Math.sqrt(3) / 2], [-Y / 2, Y * Math.sqrt(3) / 2], [-Y, 0], [-Y / 2, -Y * Math.sqrt(3) / 2], [Y / 2, -Y * Math.sqrt(3) / 2]].forEach((p, i) => { hex += `${i ? "L" : "M"}${cx + p[0] * sc},${cy - p[1] * sc}`; });
    g.appendChild(svg("path", { d: hex + "Z", fill: "none", stroke: "#d97706", "stroke-width": 1.4, "stroke-dasharray": "6 4", opacity: 0.75 }));
    let ell = "";
    for (let i = 0; i <= 60; i++) {
      const a = i / 60 * 2 * Math.PI;
      const px = Y * Math.cos(a), py = Y * Math.sin(a);
      const vx = (px - py / 2), vy = (py * Math.sqrt(3) / 2);
      ell += `${i ? "L" : "M"}${cx + (px) * sc},${cy - (py) * sc}`;
    }
    g.appendChild(svg("ellipse", { cx, cy, rx: Y * sc * 1.0, ry: Y * sc * 0.62, fill: "none", stroke: "#7c3aed", "stroke-width": 1.4, "stroke-dasharray": "3 4", opacity: 0.7, transform: `rotate(0 ${cx} ${cy})` }));
    /* circle */
    g.appendChild(svg("circle", { cx: cx + C * sc, cy, r: R * sc, fill: "rgba(2,132,199,.06)", stroke: "#0284c7", "stroke-width": 2.2 }));
    g.appendChild(svg("circle", { cx: cx + C * sc, cy, r: 3.5, fill: "#0284c7" }));
    const A = [cx + v.sx * sc, cy - v.txy * sc], B = [cx + v.sy * sc, cy + v.txy * sc];
    g.appendChild(svg("line", { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: "#35597f", "stroke-width": 1.2, "stroke-dasharray": "4 3" }));
    [[A, "X"], [B, "Y"]].forEach(([p, n]) => {
      g.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 5, fill: "#d97706" }));
      g.appendChild(label(p[0] + 8, p[1] - 6, n, "dg-txt sm"));
    });
    g.appendChild(svg("circle", { cx: cx + s1 * sc, cy, r: 5, fill: "#16a34a" }));
    g.appendChild(svg("circle", { cx: cx + s2 * sc, cy, r: 5, fill: "#16a34a" }));
    g.appendChild(label(cx + s1 * sc, cy - 12, `σ₁ = ${sig(s1, 3)}`, "dg-txt sm", "middle"));
    g.appendChild(label(cx + s2 * sc, cy + 24, `σ₂ = ${sig(s2, 3)}`, "dg-txt sm", "middle"));
    g.appendChild(svg("line", { x1: cx + C * sc, y1: cy, x2: cx + C * sc, y2: cy - R * sc, stroke: "#dc2626", "stroke-width": 2, "marker-end": "url(#arw-red)" }));
    g.appendChild(label(cx + C * sc + 6, cy - R * sc + 4, `τ_max = ${sig(R, 3)}`, "dg-txt sm"));
    /* element sketch */
    const ex = 470, ey = 70, s = 60;
    g.appendChild(svg("rect", { x: ex, y: ey, width: s, height: s, fill: "#f1f5f9", stroke: "#35597f", "stroke-width": 1.6 }));
    g.appendChild(arrow(ex + s / 2, ey + s, ex + s / 2 + v.sx / 6, ey + s, "dg-force", ""));
    g.appendChild(arrow(ex + s / 2, ey, ex + s / 2 - v.sy / 6, ey, "dg-force", ""));
    g.appendChild(arrow(ex + s, ey + s / 2, ex + s, ey + s / 2 - v.txy / 6, "dg-force amber", ""));
    g.appendChild(label(ex, ey - 10, "stress element", "dg-txt sm"));
    const okVM = vm < v.syield, okTr = tresca < v.syield;
    return {
      body: g,
      readouts: [
        { k: "Centre C", v: `${sig(C, 4)} MPa` },
        { k: "τ_max = radius", v: `${sig(R, 4)} MPa` },
        { k: "σ₁ / σ₂", v: `${sig(s1, 3)} / ${sig(s2, 3)} MPa` },
        { k: "Von Mises σ_vm", v: `${sig(vm, 4)} MPa`, cls: okVM ? "ok" : "bad" },
        { k: "Tresca (σ₁−σ₂)", v: `${sig(tresca, 4)} MPa`, cls: okTr ? "ok" : "bad" },
        { k: "FoS (von Mises)", v: `${sig(v.syield / Math.max(vm, 0.01), 3)}`, cls: okVM ? "" : "bad" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   14 · COLUMN BUCKLING
   ══════════════════════════════════════════════════════════ */
const SIM_column = defineSim("column", {
  title: "Column buckling", sub: "A stability failure, not a strength failure: notice that changing the steel grade does not help.",
  conceptId: "buckling", vb: "0 0 660 320",
  params: [
    { key: "L", label: "Length L", min: 0.5, max: 6, step: 0.1, def: 2.5, unit: "m" },
    { key: "d", label: "Section (square) side", min: 20, max: 150, step: 5, def: 60, unit: "mm" },
    { key: "P", label: "Applied load P", min: 5, max: 900, step: 5, def: 120, unit: "kN" },
    { key: "K", label: "End condition K", type: "select", def: 1, options: [[2, "Fixed–free (K=2)"], [1, "Pinned–pinned (K=1)"], [0.7, "Fixed–pinned (K=0.7)"], [0.5, "Fixed–fixed (K=0.5)"]] }
  ],
  note: "P_cr = π²EI/(KL)². It depends on E and geometry only — a higher-strength steel gives no buckling benefit at all.",
  render(v) {
    const b = v.d / 1000, A = b * b, I = b ** 4 / 12;
    const r = Math.sqrt(I / A);
    const Pcr = Math.PI ** 2 * 200e9 * I / (v.K * v.L) ** 2;
    const lam = v.K * v.L / r;
    const crush = 355e6 * A;
    const P = v.P * 1000;
    const governing = Math.min(Pcr, crush);
    const buckled = P > Pcr;
    const cx = 230, top = 50, bot = 270, hh = bot - top, wpx = b * 900;
    const g = svg("g");
    const amp = buckled ? clamp((P / Pcr - 1) * 90, 4, 70) : 0;
    let d1 = `M${cx},${bot}`;
    for (let i = 0; i <= 20; i++) { const f = i / 20; d1 += ` L${cx + amp * Math.sin(Math.PI * f)},${bot - hh * f}`; }
    g.appendChild(svg("path", { d: d1, stroke: buckled ? "#dc2626" : "#0ea5e9", "stroke-width": Math.max(wpx, 6), fill: "none", "stroke-linecap": "round" }));
    g.appendChild(svg("line", { x1: cx, y1: bot, x2: cx, y2: top, class: "dg-dim" }));
    g.appendChild(groundStrip(cx - 60, cx + 60, bot));
    if (v.K <= 0.7) g.appendChild(svg("rect", { x: cx - 55, y: top - 16, width: 110, height: 12, fill: "#dbe6f2", stroke: "#5d84b8" }));
    g.appendChild(arrow(cx, top - 40, cx, top - 8, "dg-force red", `P = ${v.P} kN`, cx + 10, top - 30));
    g.appendChild(dimLine(cx + 110, top, cx + 110, bot, `L = ${sig(v.L, 3)} m`));
    /* load bar chart */
    const bx = 420, bw = 190, maxV = Math.max(Pcr, crush, P) * 1.1;
    [["Applied P", P, "#dc2626"], ["Euler P_cr", Pcr, "#0284c7"], ["Crush σ_y·A", crush, "#16a34a"]].forEach((row, i) => {
      const y = 80 + i * 52;
      g.appendChild(label(bx, y - 6, row[0], "dg-txt sm"));
      g.appendChild(svg("rect", { x: bx, y, width: bw * row[1] / maxV, height: 20, fill: row[2], opacity: 0.85 }));
      g.appendChild(label(bx + bw * row[1] / maxV + 6, y + 15, sig(row[1] / 1000, 3) + " kN", "dg-txt sm"));
    });
    return {
      body: g,
      readouts: [
        { k: "Slenderness KL/r", v: `${sig(lam, 4)}`, cls: lam < 60 ? "warn" : "ok" },
        { k: "Euler P_cr", v: `${sig(Pcr / 1000, 4)} kN` },
        { k: "Crushing load", v: `${sig(crush / 1000, 4)} kN` },
        { k: "Governing", v: Pcr < crush ? "buckling" : "material strength", cls: Pcr < crush ? "warn" : "" },
        { k: "State", v: buckled ? "BUCKLED" : "stable", cls: buckled ? "bad" : "ok" },
        { k: "FoS on governing", v: `${sig(governing / Math.max(P, 1), 3)}`, cls: governing / P < 2 ? "bad" : "ok" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   15 · FATIGUE (S-N)
   ══════════════════════════════════════════════════════════ */
const SIM_fatigue = defineSim("fatigue", {
  title: "Fatigue life (S–N)", sub: "Stress amplitude, mean stress, stress concentration and the number of cycles the component survives.",
  conceptId: "fatigue", vb: "0 0 660 320",
  params: [
    { key: "su", label: "Ultimate strength σ_u", min: 350, max: 1200, step: 10, def: 600, unit: "MPa" },
    { key: "sa", label: "Nominal stress amplitude σ_a", min: 20, max: 400, step: 5, def: 120, unit: "MPa" },
    { key: "sm", label: "Mean stress σ_m", min: -150, max: 250, step: 5, def: 0, unit: "MPa" },
    { key: "kt", label: "Stress concentration K_f", min: 1, max: 3.5, step: 0.05, def: 1.6 },
    { key: "n", label: "Operating speed", min: 60, max: 3600, step: 30, def: 1500, unit: "rpm" }
  ],
  note: "The endurance limit is taken as 0.5σ_u (steels). Mean stress is corrected by Goodman, and the stress concentration factor is applied to the amplitude — this is where most real fatigue failures start.",
  render(v) {
    const Se = 0.5 * v.su;
    const Sa = v.sa * v.kt;
    const Sm = v.sm;
    const Goodman = Sm > 0 ? Sa / (1 - Math.min(Sm / v.su, 0.95)) : Sa * (Sm < 0 ? 0.9 : 1);
    const x0 = 80, y0 = 260, W = 480, H = 200;
    const N = S => Math.pow(10, (Math.log10(1000) - 3) / (Math.log10(0.5 * v.su) - Math.log10(0.9 * v.su)) * (Math.log10(S) - Math.log10(0.9 * v.su)) + 3);
    const px = n => x0 + (Math.log10(n) - 3) / (9 - 3) * W;
    const py = s => y0 - (Math.log10(s) - Math.log10(30)) / (Math.log10(1400) - Math.log10(30)) * H;
    const g = svg("g");
    g.appendChild(svg("rect", { x: x0, y: y0 - H, width: W, height: H, fill: "#eef4fb", stroke: "#dbe6f2" }));
    [3, 4, 5, 6, 7, 8, 9].forEach(e => {
      g.appendChild(svg("line", { x1: px(10 ** e), y1: y0 - H, x2: px(10 ** e), y2: y0, stroke: "#e2e9f2" }));
      g.appendChild(label(px(10 ** e), y0 + 16, "1e" + e, "dg-txt sm", "middle"));
    });
    [50, 100, 200, 400, 800].forEach(s => {
      if (s > 30 && s < 1400) { g.appendChild(svg("line", { x1: x0, y1: py(s), x2: x0 + W, y2: py(s), stroke: "#e2e9f2" })); g.appendChild(label(x0 - 6, py(s) + 4, s, "dg-txt sm", "end")); }
    });
    let d = "";
    for (let e = 3; e <= 9; e += 0.05) {
      const S = 0.9 * v.su * Math.pow(10, (e - 3) * (Math.log10(0.5 * v.su) - Math.log10(0.9 * v.su)) / 6);
      if (S < Se) break;
      d += `${d ? "L" : "M"}${px(10 ** e)},${py(S)}`;
    }
    d += ` L${px(1e9)},${py(Se)}`;
    g.appendChild(svg("path", { d, fill: "none", stroke: "#0284c7", "stroke-width": 2.4 }));
    g.appendChild(svg("line", { x1: x0, y1: py(Se), x2: x0 + W, y2: py(Se), stroke: "#16a34a", "stroke-width": 1.2, "stroke-dasharray": "6 4" }));
    g.appendChild(label(x0 + W - 4, py(Se) - 6, `endurance limit Se = ${sig(Se, 3)} MPa`, "dg-txt sm", "end"));
    const Nf = N(Math.max(Goodman, 1));
    const life = Nf / (v.n * 60);
    const cx = clamp(px(Math.min(Nf, 1e9)), x0, x0 + W), cyy = clamp(py(Math.max(Goodman, 30)), y0 - H, y0);
    g.appendChild(svg("circle", { cx, cy: cyy, r: 6, fill: "#d97706", stroke: "#fff", "stroke-width": 1.5 }));
    g.appendChild(label(cx + 8, cyy - 8, `σ_a' = ${sig(Goodman, 3)} MPa`, "dg-txt sm"));
    return {
      body: g,
      readouts: [
        { k: "Se = 0.5σ_u", v: `${sig(Se, 4)} MPa` },
        { k: "Effective σ_a (with K_f)", v: `${sig(Sa, 4)} MPa`, cls: Sa > Se ? "warn" : "ok" },
        { k: "Goodman-corrected", v: `${sig(Goodman, 4)} MPa`, cls: Goodman > Se ? "bad" : "ok" },
        { k: "Estimated life", v: Goodman < Se ? "infinite (> 10⁹)" : `${sig(Nf, 3)} cycles`, cls: Goodman < Se ? "ok" : "bad" },
        { k: "Service life", v: Goodman < Se ? "—" : `${sig(life, 3)} hours`, cls: life < 8000 ? "bad" : "" },
        { k: "FoS on Se", v: `${sig(Se / Math.max(Goodman, 0.01), 3)}`, cls: Se / Goodman < 1 ? "bad" : "ok" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   16 · PIPE FLOW
   ══════════════════════════════════════════════════════════ */
const SIM_pipe = defineSim("pipe", {
  title: "Pipe flow & losses", sub: "Reynolds number, flow regime, friction factor, head loss and the pumping power to overcome it.",
  conceptId: "head-losses", vb: "0 0 660 300",
  params: [
    { key: "Q", label: "Flow rate Q", min: 1, max: 200, step: 1, def: 40, unit: "m³/h" },
    { key: "D", label: "Pipe diameter D", min: 15, max: 200, step: 1, def: 50, unit: "mm" },
    { key: "L", label: "Pipe length L", min: 5, max: 500, step: 5, def: 80, unit: "m" },
    { key: "mu", label: "Viscosity μ", min: 0.0003, max: 0.3, step: 0.0001, def: 0.001, unit: "Pa·s" },
    { key: "eps", label: "Roughness ε", min: 0, max: 1, step: 0.01, def: 0.045, unit: "mm" }
  ],
  note: "Below Re = 2300 the flow is laminar with f = 64/Re. Above 4000 it is turbulent and the friction factor comes from the Colebrook equation. Notice how the pressure drop law changes from Δp ∝ v to Δp ∝ v².",
  render(v) {
    const Q = v.Q / 3600, D = v.D / 1000, A = Math.PI * D * D / 4, vel = Q / A;
    const Re = 1000 * vel * D / v.mu;
    const rel = (v.eps / 1000) / D;
    let f, regime;
    if (Re < 2300) { f = 64 / Math.max(Re, 1); regime = "laminar"; }
    else if (Re < 4000) { f = 0.035; regime = "transitional"; }
    else {
      f = 0.02;
      for (let i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2);
      regime = "turbulent";
    }
    const hf = f * (v.L / D) * vel * vel / (2 * 9.81);
    const dp = 1000 * 9.81 * hf / 1000;
    const Pp = 1000 * 9.81 * Q * hf / 1000;
    const x0 = 40, y0 = 150, wpx = 470, hh = 26 + v.D / 4;
    const g = svg("g");
    g.appendChild(svg("rect", { x: x0, y: y0 - hh, width: wpx, height: hh * 2, fill: "#eef4fb", stroke: "#5d84b8", "stroke-width": 2 }));
    const prof = regime === "laminar" ? 1 : 0.25;
    for (let i = 0; i <= 12; i++) {
      const yy = -1 + 2 * i / 12;
      const u = Math.pow(1 - Math.abs(yy), regime === "laminar" ? 2 : 1 / 7);
      const len = u * clamp(vel * 22, 12, 130);
      g.appendChild(svg("line", { x1: x0 + 90, y1: y0 + yy * hh * 0.86, x2: x0 + 90 + len, y2: y0 + yy * hh * 0.86, stroke: "#0284c7", "stroke-width": 2, opacity: 0.8, "marker-end": "url(#arw)" }));
    }
    g.appendChild(label(x0 + 90, y0 - hh - 12, regime === "laminar" ? "parabolic profile" : "flat (turbulent) profile", "dg-txt sm"));
    /* energy gradient line */
    g.appendChild(svg("line", { x1: x0, y1: y0 - hh - 40, x2: x0 + wpx, y2: y0 - hh - 40 + clamp(hf * 8, 0, 60), stroke: "#d97706", "stroke-width": 2 }));
    g.appendChild(label(x0, y0 - hh - 50, "hydraulic grade line", "dg-txt sm"));
    g.appendChild(label(x0 + wpx + 6, y0, `v = ${sig(vel, 3)} m/s`, "dg-txt"));
    const vGuide = vel > 3 ? "above the 1–3 m/s guideline" : vel < 0.6 ? "below guideline — settling risk" : "within guideline";
    return {
      body: g,
      readouts: [
        { k: "Velocity v", v: `${sig(vel, 3)} m/s`, cls: vel > 3 ? "warn" : "ok" },
        { k: "Reynolds number", v: `${sig(Re, 4)}` },
        { k: "Regime", v: regime, cls: regime === "laminar" ? "" : regime === "turbulent" ? "ok" : "warn" },
        { k: "Friction factor f", v: `${sig(f, 3)}` },
        { k: "Head loss h_f", v: `${sig(hf, 3)} m` },
        { k: "Pumping power", v: `${sig(Pp, 3)} kW`, cls: Pp > 5 ? "warn" : "" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   17 · VENTURI & CAVITATION
   ══════════════════════════════════════════════════════════ */
const SIM_venturi = defineSim("venturi", {
  title: "Venturi & cavitation", sub: "Continuity accelerates the flow, Bernoulli drops the pressure — and the throat is where cavitation starts.",
  conceptId: "cavitation", vb: "0 0 660 300",
  params: [
    { key: "D1", label: "Inlet diameter D₁", min: 40, max: 200, step: 5, def: 100, unit: "mm" },
    { key: "D2", label: "Throat diameter D₂", min: 15, max: 150, step: 1, def: 50, unit: "mm" },
    { key: "Q", label: "Flow rate Q", min: 5, max: 250, step: 5, def: 60, unit: "m³/h" },
    { key: "p1", label: "Inlet pressure p₁ (gauge)", min: 0, max: 600, step: 10, def: 200, unit: "kPa" },
    { key: "T", label: "Fluid temperature", min: 10, max: 90, step: 5, def: 20, unit: "°C" }
  ],
  note: "NPSH-style check: if the throat pressure falls to the vapour pressure the fluid flashes to vapour. Hot water cavitates far more easily than cold.",
  render(v) {
    const pv = Math.exp(16.65 - 4030 / (v.T + 235)) * 100 / 1000; /* kPa, Antoine approx */
    const Q = v.Q / 3600, A1 = Math.PI * (v.D1 / 1000) ** 2 / 4, A2 = Math.PI * (v.D2 / 1000) ** 2 / 4;
    const v1 = Q / A1, v2 = Q / A2;
    const dp = 0.5 * 1000 * (v2 * v2 - v1 * v1) / 1000;
    const p2 = v.p1 - dp;
    const pAbs2 = p2 + 101.3;
    const cavit = pAbs2 <= pv;
    const x0 = 60, y0 = 150, L = 500;
    const h1 = v.D1 / 5, h2 = v.D2 / 5;
    const g = svg("g");
    g.appendChild(svg("path", {
      d: `M${x0},${y0 - h1} L${x0 + 170},${y0 - h1} L${x0 + 250},${y0 - h2} L${x0 + 340},${y0 - h2} L${x0 + 420},${y0 - h1} L${x0 + L},${y0 - h1}
          L${x0 + L},${y0 + h1} L${x0 + 420},${y0 + h1} L${x0 + 340},${y0 + h2} L${x0 + 250},${y0 + h2} L${x0 + 170},${y0 + h1} L${x0},${y0 + h1} Z`,
      fill: "#f8fafc", stroke: "#35597f", "stroke-width": 2
    }));
    /* streamlines */
    [-0.6, 0, 0.6].forEach(f => {
      let d = `M${x0},${y0 + f * h1 * 0.8}`;
      d += ` L${x0 + 170},${y0 + f * h1 * 0.8} L${x0 + 250},${y0 + f * h2 * 0.8} L${x0 + 340},${y0 + f * h2 * 0.8} L${x0 + 420},${y0 + f * h1 * 0.8} L${x0 + L},${y0 + f * h1 * 0.8}`;
      g.appendChild(svg("path", { d, fill: "none", stroke: cavit ? "#dc2626" : "#0284c7", "stroke-width": 1.4, opacity: 0.6 }));
    });
    if (cavit) {
      for (let i = 0; i < 14; i++) {
        g.appendChild(svg("circle", { cx: x0 + 260 + Math.random() * 70, cy: y0 + (Math.random() - 0.5) * h2 * 1.2, r: 2 + Math.random() * 4, fill: "rgba(220,38,38,.35)", stroke: "#dc2626", "stroke-width": 0.8 }));
      }
    }
    g.appendChild(arrow(x0 + 295, y0 - h2 - 40, x0 + 295, y0 - h2 - 12, "dg-force amber", `p₂ = ${sig(p2, 3)} kPa`));
    g.appendChild(label(x0 + 60, y0 - h1 - 12, `v₁ = ${sig(v1, 3)} m/s`, "dg-txt sm"));
    g.appendChild(label(x0 + 295, y0 + h2 + 22, `v₂ = ${sig(v2, 3)} m/s`, "dg-txt sm", "middle"));
    g.appendChild(label(x0 + 10, y0 + 4, `p₁ = ${v.p1} kPa`, "dg-txt sm"));
    return {
      body: g,
      readouts: [
        { k: "v₁ / v₂", v: `${sig(v1, 3)} / ${sig(v2, 3)} m/s` },
        { k: "Area ratio A₂/A₁", v: `${sig(A2 / A1, 3)}` },
        { k: "Δp (Bernoulli)", v: `${sig(dp, 4)} kPa` },
        { k: "Throat absolute p", v: `${sig(pAbs2, 4)} kPa`, cls: cavit ? "bad" : "ok" },
        { k: "Vapour pressure", v: `${sig(pv, 3)} kPa @ ${v.T}°C` },
        { k: "Cavitation", v: cavit ? "YES — flashing" : "no", cls: cavit ? "bad" : "ok" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   18 · PRESSURE VESSEL
   ══════════════════════════════════════════════════════════ */
const SIM_vessel = defineSim("vessel", {
  title: "Pressure vessel", sub: "Hoop stress is twice the axial stress — the reason vessels split lengthways along the longitudinal weld.",
  conceptId: "pressure-fluids", vb: "0 0 660 300",
  params: [
    { key: "p", label: "Internal pressure p", min: 0.5, max: 30, step: 0.5, def: 8, unit: "MPa" },
    { key: "r", label: "Internal radius r", min: 80, max: 500, step: 10, def: 250, unit: "mm" },
    { key: "t", label: "Wall thickness t", min: 3, max: 60, step: 1, def: 12, unit: "mm" },
    { key: "sy", label: "Yield strength σ_y", min: 200, max: 900, step: 5, def: 355, unit: "MPa" }
  ],
  note: "Thin-wall theory needs r/t > 10. Below that, the radial stress varies through the wall and the Lamé equations are required.",
  render(v) {
    const sh = v.p * v.r / v.t, sa = v.p * v.r / (2 * v.t);
    const vm = Math.sqrt(sh * sh - sh * sa + sa * sa);
    const ratio = v.r / v.t;
    const cx = 250, cy = 150, rx = 130, ry = 78, tw = clamp(v.t * 1.6, 4, 34);
    const g = svg("g");
    g.appendChild(svg("ellipse", { cx, cy, rx, ry, fill: "#f1f5f9", stroke: "#0284c7", "stroke-width": tw }));
    g.appendChild(svg("ellipse", { cx: cx + 210, cy, rx: 26, ry, fill: "#f1f5f9", stroke: "#0284c7", "stroke-width": tw }));
    g.appendChild(svg("rect", { x: cx, y: cy - ry - tw / 2, width: 210, height: tw, fill: "#c9d8ea", stroke: "#0284c7", "stroke-width": 1 }));
    g.appendChild(svg("rect", { x: cx, y: cy + ry - tw / 2, width: 210, height: tw, fill: "#c9d8ea", stroke: "#0284c7", "stroke-width": 1 }));
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const px = cx + rx * 0.7 * Math.cos(a), py = cy + ry * 0.7 * Math.sin(a);
      g.appendChild(arrow(px, py, px + 24 * Math.cos(a), py + 24 * Math.sin(a), "dg-force amber", ""));
    }
    g.appendChild(label(cx, cy + 6, `p = ${v.p} MPa`, "dg-txt", "middle"));
    g.appendChild(svg("line", { x1: cx - rx - tw, y1: cy - ry - 46, x2: cx - rx - tw + 60, y2: cy - ry - 46, stroke: "#dc2626", "stroke-width": 3, "marker-end": "url(#arw-red)" }));
    g.appendChild(label(cx - rx - tw, cy - ry - 54, `σ_hoop = ${sig(sh, 3)} MPa`, "dg-txt sm"));
    g.appendChild(arrow(cx + 105, cy + ry + tw + 40, cx + 165, cy + ry + tw + 40, "dg-force green", `σ_axial = ${sig(sa, 3)} MPa`));
    const bx = 500;
    [["σ_hoop", sh, "#dc2626"], ["σ_axial", sa, "#16a34a"], ["σ_vm", vm, "#7c3aed"], ["σ_y", v.sy, "#35597f"]].forEach((r0, i) => {
      const y = 60 + i * 44;
      g.appendChild(label(bx, y - 6, r0[0], "dg-txt sm"));
      g.appendChild(svg("rect", { x: bx, y, width: clamp(r0[1] / v.sy * 120, 2, 130), height: 16, fill: r0[2], opacity: 0.85 }));
      g.appendChild(label(bx + clamp(r0[1] / v.sy * 120, 2, 130) + 5, y + 13, sig(r0[1], 3), "dg-txt sm"));
    });
    const fos = v.sy / vm;
    return {
      body: g,
      readouts: [
        { k: "σ_hoop = pr/t", v: `${sig(sh, 4)} MPa`, cls: sh > v.sy ? "bad" : "" },
        { k: "σ_axial = pr/2t", v: `${sig(sa, 4)} MPa` },
        { k: "σ_vm", v: `${sig(vm, 4)} MPa`, cls: vm > v.sy ? "bad" : vm > v.sy * 0.7 ? "warn" : "ok" },
        { k: "r/t ratio", v: `${sig(ratio, 3)}`, cls: ratio < 10 ? "bad" : "ok" },
        { k: "Thin wall valid?", v: ratio > 10 ? "yes" : "NO — use Lamé", cls: ratio > 10 ? "ok" : "bad" },
        { k: "Factor of safety", v: `${sig(fos, 3)}`, cls: fos < 1.5 ? "bad" : fos < 2.5 ? "warn" : "ok" }
      ]
    };
  }
});

/* ══════════════════════════════════════════════════════════
   19 · COMPRESSIBLE NOZZLE
   ══════════════════════════════════════════════════════════ */
const SIM_nozzle = defineSim("nozzle", {
  title: "Compressible nozzle", sub: "Mach number, choking and the converging–diverging shape needed to go supersonic.",
  conceptId: "compressible-flow", vb: "0 0 660 300",
  params: [
    { key: "M", label: "Exit Mach number M", min: 0.05, max: 3, step: 0.05, def: 0.6 },
    { key: "p0", label: "Stagnation pressure p₀", min: 1.5, max: 20, step: 0.5, def: 5, unit: "bar abs" },
    { key: "T0", label: "Stagnation temperature T₀", min: 250, max: 900, step: 10, def: 300, unit: "K" },
    { key: "At", label: "Throat area A*", min: 1, max: 40, step: 0.5, def: 5, unit: "cm²" }
  ],
  note: "γ = 1.4 for air. Choking occurs when the exit Mach number reaches 1: below the critical pressure ratio (0.528 p₀) no further increase in mass flow is possible.",
  render(v) {
    const gm = 1.4, R = 287, M = v.M;
    const T = v.T0 / (1 + (gm - 1) / 2 * M * M);
    const p = v.p0 * Math.pow(T / v.T0, gm / (gm - 1));
    const rho = p * 1e5 / (R * T);
    const a = Math.sqrt(gm * R * T);
    const vel = M * a;
    const Ar = Math.pow(1 / M * Math.sqrt((2 / (gm + 1)) * (1 + (gm - 1) / 2 * M * M)), (gm + 1) / (gm - 1));
    const A = Ar * v.At;
    const mdot = rho * vel * A / 10000;
    const crit = v.p0 * 0.528;
    const choked = M >= 1;
    const x0 = 80, y0 = 150, L = 430, xEnd = x0 + L;
    const hAt = 22, hIn = 60;
    /* duct geometry: converging only (M<1) or converging–diverging (M≥1) */
    const throatX = M >= 1 ? x0 + L * 0.42 : xEnd;
    const hEnd = M >= 1 ? hAt + (M - 1) * 34 : hIn - (hIn - hAt) * M;
    const g = svg("g");
    const ptsTop = [[x0, y0 - hIn]];
    const ptsBot = [[x0, y0 + hIn]];
    if (M >= 1) { ptsTop.push([throatX, y0 - hAt]); ptsBot.push([throatX, y0 + hAt]); }
    ptsTop.push([xEnd, y0 - hEnd]); ptsBot.push([xEnd, y0 + hEnd]);
    const dPath = ptsTop.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ")
      + " " + ptsBot.slice().reverse().map(p => `L${p[0]},${p[1]}`).join(" ") + " Z";
    g.appendChild(svg("path", { d: dPath, fill: "#f8fafc", stroke: "#35597f", "stroke-width": 2 }));
    /* streamlines converge towards the throat, then diverge again */
    for (let i = 1; i < 9; i++) {
      const f = -1 + 2 * i / 9;
      const p = `M${x0 + 6},${y0 + f * hIn * 0.86}`
        + (M >= 1 ? ` L${throatX},${y0 + f * hAt * 0.86} L${xEnd - 6},${y0 + f * hEnd * 0.86}`
          : ` L${xEnd - 6},${y0 + f * hEnd * 0.86}`);
      g.appendChild(svg("path", { d: p, fill: "none", stroke: "#0284c7", "stroke-width": 1.5, opacity: 0.55, "marker-end": "url(#arw)" }));
    }
    g.appendChild(label(x0 + 6, y0 - hIn - 12, `p₀ = ${v.p0} bar, T₀ = ${v.T0} K`, "dg-txt sm"));
    g.appendChild(label(xEnd + 8, y0 + 4, `M = ${sig(M, 3)}`, "dg-txt"));
    if (M >= 1) g.appendChild(label(throatX, y0 - hAt - 10, "throat M = 1", "dg-txt sm", "middle"));
    const regime = M < 0.3 ? "incompressible" : M < 0.8 ? "subsonic" : M < 1.2 ? "transonic" : M < 5 ? "supersonic" : "hypersonic";
    return {
      body: g,
      readouts: [
        { k: "Regime", v: regime, cls: M >= 1 ? "warn" : "ok" },
        { k: "Speed of sound a", v: `${sig(a, 4)} m/s` },
        { k: "Flow velocity", v: `${sig(vel, 4)} m/s` },
        { k: "Static T / p", v: `${sig(T, 4)} K / ${sig(p, 3)} bar` },
        { k: "Area ratio A/A*", v: `${sig(Ar, 3)}` },
        { k: "Mass flow", v: `${sig(mdot, 3)} kg/s`, cls: choked ? "warn" : "" },
        { k: "Choked?", v: choked ? "YES (M = 1 at throat)" : `no — needs p_back < ${sig(crit, 3)} bar`, cls: choked ? "warn" : "" }
      ]
    };
  }
});

/* ── registry ────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════
   20 · REYNOLDS NUMBER & FLOW REGIME
   ══════════════════════════════════════════════════════════ */
const FLUIDS = {
  water20: { name: "Water 20 °C", rho: 998, mu: 1.002e-3 },
  water80: { name: "Water 80 °C", rho: 972, mu: 0.355e-3 },
  oil:     { name: "Hydraulic oil", rho: 870, mu: 0.06 },
  glycerol:{ name: "Glycerol 99 %", rho: 1261, mu: 1.41 },
  air:     { name: "Air 20 °C", rho: 1.204, mu: 1.82e-5 }
};

const SIM_reynolds = defineSim("reynolds", {
  title: "Reynolds number & flow regime",
  sub: "Re = ρ·v·D/μ compares inertia to viscous forces. Push it past 2300 and the dye filament you injected stops being a straight line.",
  conceptId: "reynolds", vb: "0 0 660 320", animate: true,
  params: [
    { key: "fluid", label: "Fluid", type: "select", def: "water20",
      options: Object.entries(FLUIDS).map(([k, f]) => [k, f.name]) },
    { key: "v", label: "Mean velocity v", min: 0.01, max: 8, step: 0.01, def: 0.4, unit: "m/s" },
    { key: "D", label: "Pipe diameter D", min: 5, max: 150, step: 1, def: 25, unit: "mm" },
    { key: "rough", label: "Wall roughness ε", min: 0, max: 1, step: 0.01, def: 0.045, unit: "mm" }
  ],
  note: "Re < 2300 laminar (f = 64/Re, Δp ∝ v). 2300–4000 transitional — never design in this band. Re > 4000 turbulent (Colebrook, Δp ∝ v²). Note how little it takes to go turbulent with air and how hard it is with glycerol.",
  render(v, t) {
    const f = FLUIDS[v.fluid] || FLUIDS.water20;
    const D = v.D / 1000;
    const Re = f.rho * v.v * D / f.mu;
    const regime = Re < 2300 ? "laminar" : Re < 4000 ? "transitional" : "turbulent";
    const rel = v.rough / v.D;
    let fd;
    if (Re < 2300) fd = 64 / Math.max(Re, 1e-6);
    else if (Re < 4000) fd = 0.035;
    else { fd = 0.02; for (let i = 0; i < 40; i++) fd = Math.pow(-2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(fd))), -2); }
    const tau = fd / 8 * f.rho * v.v * v.v;
    const dpL = fd / D * f.rho * v.v * v.v / 2;            /* Pa per metre */
    const bl = regime === "laminar" ? 5.0 * D / Math.sqrt(Math.max(Re, 1)) : 0;

    const x0 = 40, wpx = 470, cy = 150, hh = clamp(v.D * 0.55, 14, 62);
    const g = svg("g");
    g.appendChild(svg("rect", { x: x0, y: cy - hh, width: wpx, height: hh * 2, fill: "#eef4fb", stroke: "#5d84b8", "stroke-width": 2 }));
    /* inlet + dye injector */
    g.appendChild(svg("path", { d: `M${x0 - 26},${cy - hh} L${x0},${cy - hh} L${x0},${cy + hh} L${x0 - 26},${cy + hh}`, fill: "none", stroke: "#5d84b8", "stroke-width": 2 }));
    g.appendChild(svg("circle", { cx: x0 + 6, cy, r: 3, fill: "#d97706" }));
    g.appendChild(label(x0 + 6, cy - hh - 10, "dye filament", "dg-txt sm"));

    /* the dye filament: straight when laminar, wavy then broken up as Re rises */
    const amp = regime === "laminar" ? 0 : regime === "transitional" ? hh * 0.18 : hh * 0.42;
    const breakUp = regime === "turbulent" ? 0.55 : regime === "transitional" ? 0.82 : 1;
    const steps = 60, pts = [];
    for (let i = 0; i <= steps; i++) {
      const xx = x0 + 14 + (wpx - 30) * i / steps;
      const grow = Math.pow(i / steps, 1.6);
      const wob = amp * grow * Math.sin(i * (regime === "laminar" ? 0.05 : 0.55) - t * (1.5 + v.v)) *
        (i / steps < breakUp ? 1 : Math.exp(-(i / steps - breakUp) * 6));
      pts.push(`${i ? "L" : "M"}${xx.toFixed(1)},${(cy + wob).toFixed(1)}`);
    }
    g.appendChild(svg("path", { d: pts.join(" "), fill: "none", stroke: "#d97706", "stroke-width": 2.5, "stroke-linecap": "round", opacity: 0.95 }));

    /* surrounding streamlines */
    const n = regime === "laminar" ? 7 : 11;
    for (let i = 1; i < n; i++) {
      const yy = cy - hh + 2 * hh * i / n;
      const wob = regime === "laminar" ? 0 : amp * 0.5 * Math.sin(i * 1.7 - t * 2.2 + v.v);
      g.appendChild(svg("line", { x1: x0 + 10, y1: yy + wob, x2: x0 + wpx - 10, y2: yy + wob, stroke: "#0284c7", "stroke-width": 1, opacity: regime === "laminar" ? 0.5 : 0.22 }));
    }
    /* turbulent eddies */
    if (regime === "turbulent") {
      for (let i = 0; i < 7; i++) {
        const ex = x0 + 60 + ((i * 97 + t * 40) % (wpx - 90));
        const ey = cy + Math.sin(i * 2.1 + t) * hh * 0.6;
        g.appendChild(svg("path", { d: `M${ex},${ey} a9,9 0 1,1 8,5`, fill: "none", stroke: "#7c3aed", "stroke-width": 1.6, opacity: 0.75 }));
      }
    }
    /* laminar entrance length */
    if (regime === "laminar") {
      const len = clamp(bl / D * (wpx - 60), 8, wpx - 60);
      g.appendChild(svg("line", { x1: x0, y1: cy + hh + 16, x2: x0 + len, y2: cy + hh + 16, stroke: "#16a34a", "stroke-width": 2 }));
      g.appendChild(label(x0 + len + 6, cy + hh + 20, "entrance length ≈ 0.05·Re·D", "dg-txt sm"));
    }
    /* velocity profile at the outlet */
    g.appendChild(label(x0 + wpx + 8, cy - hh + 6, regime === "laminar" ? "parabolic" : regime === "turbulent" ? "flat + thin wall layer" : "unstable", "dg-txt sm"));
    /* regime bar */
    const bx = 40, by = 278, bw = 470;
    g.appendChild(svg("rect", { x: bx, y: by, width: bw, height: 8, fill: "#dbe6f2" }));
    g.appendChild(svg("rect", { x: bx, y: by, width: bw * 0.23, height: 8, fill: "#16a34a", opacity: 0.55 }));
    g.appendChild(svg("rect", { x: bx + bw * 0.23, y: by, width: bw * 0.17, height: 8, fill: "#d97706", opacity: 0.55 }));
    g.appendChild(svg("rect", { x: bx + bw * 0.4, y: by, width: bw * 0.6, height: 8, fill: "#dc2626", opacity: 0.45 }));
    const px = bx + bw * clamp(Math.log10(Math.max(Re, 1)) / 8, 0, 1);
    g.appendChild(svg("path", { d: `M${px},${by - 3} l-5,-9 l10,0 z`, fill: "#0f172a" }));
    g.appendChild(label(bx, by + 22, "Re = 1", "dg-txt sm"));
    g.appendChild(label(bx + bw * 0.23, by - 12, "2300", "dg-txt sm"));
    g.appendChild(label(bx + bw * 0.4, by - 12, "4000", "dg-txt sm"));
    g.appendChild(label(bx + bw, by + 22, "10⁸", "dg-txt sm", "end"));

    return {
      body: g,
      readouts: [
        { k: "Reynolds number", v: `${sig(Re, 4)}`, cls: regime === "laminar" ? "ok" : regime === "turbulent" ? "bad" : "warn" },
        { k: "Regime", v: regime, cls: regime === "laminar" ? "ok" : regime === "turbulent" ? "bad" : "warn" },
        { k: "Kinematic viscosity ν", v: `${sig(f.mu / f.rho * 1e6, 3)} mm²/s` },
        { k: "Inertia / viscous", v: `${sig(Re, 3)} : 1` },
        { k: "Friction factor f", v: `${sig(fd, 4)}` },
        { k: "Wall shear stress τ_w", v: `${sig(tau, 4)} Pa` },
        { k: "Pressure gradient", v: `${sig(dpL, 4)} Pa/m`, cls: dpL > 500 ? "warn" : "" },
        { k: "Entrance length", v: regime === "laminar" ? `${sig(bl, 3)} m` : "— (turbulent from the start)" }
      ]
    };
  }
});

const SIMS = [
  SIM_moment, SIM_beam, SIM_incline, SIM_truss, SIM_projectile, SIM_pendulum, SIM_disk,
  SIM_slidercrank, SIM_springmass, SIM_tensile, SIM_bending, SIM_torsion, SIM_mohr,
  SIM_column, SIM_fatigue, SIM_pipe, SIM_venturi, SIM_vessel, SIM_nozzle, SIM_reynolds
];
const SIM_BY_ID = Object.fromEntries(SIMS.map(s => [s.id, s]));
const SIM_GROUPS = [
  { name: "Statics", ids: ["moment", "beam", "incline", "truss"] },
  { name: "Dynamics", ids: ["projectile", "pendulum", "disk", "slidercrank", "springmass"] },
  { name: "Strength of Materials", ids: ["tensile", "bending", "torsion", "mohr", "column", "fatigue"] },
  { name: "Fluid Mechanics", ids: ["reynolds", "pipe", "venturi", "vessel", "nozzle"] }
];
