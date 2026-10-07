/* ═══════════════════════════════════════════════════════════
   views/lab.js — Interactive Lab gallery + simulation stage
   ═══════════════════════════════════════════════════════════ */
"use strict";

function ViewLab(root, params) {
  const wantId = params[0] && SIM_BY_ID[params[0]] ? params[0] : null;
  if (!wantId) { labGallery(root); return; }
  labStage(root, SIM_BY_ID[wantId]);
}

function labGallery(root) {
  root.appendChild(el("h1", { class: "page-title", text: "Interactive Lab" }));
  root.appendChild(el("p", { class: "page-sub", text: SIMS.length + " parameterised simulations. Drag the sliders, watch the diagram and the engineering numbers update together, and try to predict each result before it appears. That prediction habit is the whole point of the lab." }));

  SIM_GROUPS.forEach(grp => {
    root.appendChild(el("div", { class: "section-title", text: grp.name }));
    const g = el("div", { class: "grid g3" });
    grp.ids.forEach(id => {
      const s = SIM_BY_ID[id];
      if (!s) return;
      const t = TOPICS[s.conceptId];
      g.appendChild(el("a", { class: "sim-card", href: "#lab/" + id, style: { textDecoration: "none", color: "inherit" } }, [
        el("div", { class: "row" }, [el("h5", { text: s.title }), s.animate ? el("span", { class: "chip n", text: "animated" }) : null]),
        el("p", { text: s.sub }),
        t ? el("div", { class: "row mt-s" }, [el("span", { class: "chip", text: "◎ " + t.title }), el("span", { class: "chip", text: masteryOf(t.id) + "%" })]) : null
      ]));
    });
    root.appendChild(g);
  });
}

function labStage(root, sim) {
  const t = TOPICS[sim.conceptId];
  root.appendChild(el("div", { class: "row spread" }, [
    el("div", {}, [
      el("div", { class: "row" }, [
        el("a", { class: "chip", href: "#lab", text: "← all simulations" }),
        t ? el("a", { class: "chip", href: "#learn/" + t.id, text: "◎ " + t.title }) : null
      ]),
      el("h1", { class: "page-title", style: { marginTop: "8px" }, text: sim.title })
    ]),
    el("div", { class: "row" }, [
      t ? el("a", { class: "btn", href: "#practice/" + t.id, text: "▶ Practise this concept" }) : null
    ])
  ]));
  root.appendChild(el("p", { class: "page-sub", text: sim.sub }));

  const grid = el("div", { class: "lab-grid" });
  const stage = el("div", { class: "sim-stage" });
  const ui = el("div", { class: "card" });
  ui.appendChild(el("div", { class: "section-title", style: { margin: "0 0 6px" }, text: "Parameters" }));
  grid.appendChild(stage); grid.appendChild(ui);
  root.appendChild(grid);

  const inst = sim.mount(stage, ui);
  App.registerAnim(inst);

  /* pedagogical footer */
  const foot = el("div", { class: "grid g2 mt" });
  if (t) {
    const c1 = el("div", { class: "card" });
    c1.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "What the simulation is showing" }));
    c1.appendChild(el("p", { class: "small", text: t.meaning }));
    if (t.formula) c1.appendChild(el("div", { class: "formula-box mt-s" }, [el("div", { class: "f", html: math(t.formula) })]));
    c1.appendChild(el("div", { class: "sim-note", text: t.assumptions }));
    foot.appendChild(c1);
  }
  const c2 = el("div", { class: "card" });
  c2.appendChild(el("div", { class: "section-title", style: { margin: 0 }, text: "Experiments to run" }));
  const ideas = labExperiments(sim.id);
  const ul = el("div", { class: "steps-reason mt-s" });
  ideas.forEach(i => ul.appendChild(el("div", { text: i })));
  c2.appendChild(ul);
  foot.appendChild(c2);
  root.appendChild(foot);
}

function labExperiments(id) {
  const E = {
    moment: ["Set θ = 90° and double the distance — the moment doubles.", "Now keep d and halve θ: the effective lever arm collapses.", "Find the force needed to produce 100 N·m at d = 0.4 m, then check it."],
    beam: ["Move the point load to mid-span and watch the moment diagram reshape.", "Double the section depth and compare the stress reduction with the deflection reduction.", "Find the load at which deflection, not stress, becomes the governing limit."],
    incline: ["Increase the slope until the block slips, then compare that angle with tan⁻¹μ.", "Double the mass: does the slip angle change? Why not?", "Set μ = 0.15 and find the maximum safe slope for a conveyor."],
    truss: ["Move the load to a support and watch several members go to zero.", "Increase the truss depth and observe the chord forces fall.", "Identify which member is critical and whether it is in tension or compression."],
    projectile: ["Sweep the angle from 10° to 80° and confirm the maximum at 45°.", "Set g to the Moon's 1.62 m/s² and compare the range.", "Find the angle that reaches a given range at two different elevations."],
    pendulum: ["Double the length: the period increases by √2, not by 2.", "Change the amplitude above 20° and watch the small-angle approximation break down.", "Estimate g on another planet from the period."],
    disk: ["Double the radius at constant mass and watch the inertia quadruple.", "Set the torque to just above the friction torque and observe the very slow spin-up.", "Compute the kinetic energy stored at 3000 rpm and compare with a flywheel."],
    slidercrank: ["Increase r/l and watch the piston acceleration and rod angle grow.", "Find the crank angles where the piston velocity is zero and maximum.", "Relate the rod angle to the side thrust on the cylinder wall."],
    springmass: ["Set the excitation to zero and watch the free decay rate set by ζ.", "Sweep the excitation frequency through f_n and find the resonance peak.", "Increase the frequency beyond √2·f_n and confirm the transmissibility falls below 1."],
    tensile: ["Load into the plastic region, then read the permanent strain on unloading.", "Compare steel and aluminium at the same stress — stiffness versus strength.", "Switch to cast iron and observe the absence of a yield plateau and the low fracture strain."],
    bending: ["Compare a rectangle with an I-section of similar area at the same moment.", "Double the depth and confirm the stress falls by about four times.", "Find the moment at which an S235 section reaches its limit."],
    torsion: ["Introduce a hollow bore and compare the strength loss with the mass saving.", "Reduce the diameter by 20% and confirm the stress rises by about 95%.", "Check the twist per metre against a typical 1°/m limit."],
    mohr: ["Set σx = σy and τ = 0: the circle collapses to a point — no shear, no yielding.", "Increase τ until the von Mises circle is reached and read the safety factor.", "Compare Tresca and von Mises: which is more conservative here?"],
    column: ["Double the length and confirm the capacity falls by a factor of four.", "Change the end condition from pinned to fixed and confirm the fourfold gain.", "Increase the section until crushing, not buckling, becomes the governing mode."],
    fatigue: ["Raise K_f from 1.0 to 2.5 and watch the life collapse.", "Add a tensile mean stress and observe the Goodman correction.", "Find the stress amplitude that gives an infinite life at the operating speed."],
    reynolds: ["Raise the velocity slowly and note the exact speed at which the dye filament breaks up — that is Re ≈ 2300.", "Switch the fluid from water to glycerol and find how much faster you must run to reach the same Re.", "Double the pipe diameter at constant velocity and confirm that Re doubles, then check how the pressure gradient responds."],
    pipe: ["Reduce the diameter and watch the velocity and head loss both climb.", "Raise the viscosity until the flow becomes laminar and the profile parabolic.", "Estimate the annual energy cost of the pumping power."],
    venturi: ["Increase the flow until the throat pressure reaches the vapour pressure.", "Raise the temperature from 20 °C to 80 °C and see how much earlier cavitation starts.", "Increase the inlet pressure and confirm the margin improves."],
    vessel: ["Reduce the thickness until r/t falls below 10 and thin-wall theory becomes invalid.", "Raise the pressure until the factor of safety drops below 1.5.", "Compare hoop and axial stress and identify which weld is critical."],
    nozzle: ["Raise the exit Mach number through 1 and watch the duct become converging–diverging.", "Compare the static and stagnation temperature at M = 2.", "Confirm that the mass flow stops increasing once the nozzle is choked."]
  };
  return E[id] || ["Change one parameter at a time.", "Predict the result before the diagram updates.", "Relate the readout back to the governing equation."];
}
