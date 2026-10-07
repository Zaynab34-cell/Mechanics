/* ═══════════════════════════════════════════════════════════
   data/cases.js — industrial case studies
   Each case: scenario → guided questions → model answer →
   engineering checklist → applicable standards.
   ═══════════════════════════════════════════════════════════ */
"use strict";

const CASES = [
{
  id: "broken-shaft", title: "Broken Shaft", domain: "Failure · Fatigue · Torsion", icon: "⚙",
  difficulty: 4,
  scenario:
`A 45 mm diameter steel drive shaft in a gearbox-driven conveyor fractured after about eight months of
continuous operation. The drive delivers 7.5 kW at 960 rpm. The shaft carries a sprocket mounted
outboard of the two supporting bearings, 220 mm from the nearest bearing.

The fracture surface is flat, perpendicular to the axis, with a smooth dark region covering roughly
70% of the area and a coarse bright zone at the remainder. There is a sharp shoulder with a small
fillet radius at the sprocket location, and a keyway nearby.

The maintenance log records occasional belt jams and a recent sprocket replacement.`,
  questions: [
    { q: "What loads act on this shaft, and where does each come from?",
      a: "Torque from the transmitted power (T = P/ω = 7500/100.5 = 74.6 N·m), bending moment from the sprocket's outboard position acting as a cantilever load on the shaft, chain tension (which has a tight side and a slack side, so a substantial net transverse force), the sprocket's own weight, and occasional shock loads from the jams. Axial load is small unless the chain is misaligned.",
      concepts: ["torque", "bending", "shear-moment-diagrams"] },
    { q: "Is this bending, torsion, or combined loading — and which governs?",
      a: "Combined. In a rotating shaft the bending stress is fully reversed (each fibre goes tension → compression every revolution), while the torsional shear stress is essentially steady. Fully reversed bending normally governs fatigue life, so the bending moment at the shoulder is the critical quantity.",
      concepts: ["bending", "torsion", "fatigue"] },
    { q: "What type of stress occurs at the fracture location?",
      a: "Alternating bending stress superimposed on a steady torsional shear stress, amplified locally by the shoulder's stress concentration factor (typically K_t = 1.5–3 depending on the fillet radius) and by the keyway (K_t ≈ 2). The combination must be assessed with a fatigue criterion, not by a static von Mises check alone.",
      concepts: ["stress-concentration", "vonmises", "principal-stresses"] },
    { q: "Could fatigue be involved? What evidence supports it?",
      a: "Yes — the evidence is decisive. A flat fracture perpendicular to the axis, a smooth 'beach mark' region showing progressive crack growth, and a coarse final zone where the remaining section could no longer carry the load, is the classic fatigue appearance. At 960 rpm the shaft accumulated roughly 4×10⁸ cycles in eight months, far into the finite-life region.",
      concepts: ["fatigue", "fracture-mechanics"] },
    { q: "What information should be inspected or measured next?",
      a: "The exact fillet radius and keyway geometry (to obtain K_t); the material certificate and hardness (to estimate the endurance limit); the surface finish and any corrosion or fretting at the shoulder; the chain tension and alignment; the bearing condition and any play that increases the bending moment; the operating history including the jams; and a metallographic examination of the crack origin.",
      concepts: ["stress-concentration", "fatigue", "wear-corrosion"] },
    { q: "What design changes would you recommend?",
      a: "Increase the fillet radius substantially (or use an undercut relief) to reduce K_t; move the sprocket inboard, closer to the bearing, to cut the bending moment; consider a larger diameter, remembering τ ∝ 1/d³ and σ ∝ 1/d³; apply shot peening to introduce compressive residual stress at the surface; specify a better surface finish; and verify with a Goodman or Soderberg fatigue check including the mean torsional stress.",
      concepts: ["stress-concentration", "safety-factor", "elastic-plastic"] }
  ],
  checklist: [
    "Identify every load case, including transient shock loads — not just the rated duty.",
    "Distinguish fully reversed from steady stress components; they affect fatigue differently.",
    "Locate the stress raisers geometrically before computing any stress.",
    "Read the fracture surface: origin, beach marks, final zone.",
    "Check the operating history — jams, overloads and misalignment are often the real cause."
  ],
  standards: ["EN 1993 / ISO 14122 for structural aspects", "AGMA/ISO 6336 gear-related shaft practice", "ASTM E466 for fatigue testing", "ISO 281 for rolling bearing life"]
},
{
  id: "pump-cavitation", title: "Pump Cavitation", domain: "Fluid Mechanics · Pumps", icon: "💧",
  difficulty: 4,
  scenario:
`A centrifugal pump delivering hot condensate at 75 °C from a receiver has developed a noise described
by the operators as "gravel in the casing", together with increased vibration and a falling flow rate.
The discharge pressure gauge fluctuates.

The pump is mounted 1.8 m above the receiver liquid level. The suction line is DN50 with two elbows,
a partially closed isolation valve and a strainer. The pump runs at 2900 rpm and its datasheet gives
NPSH_r = 3.6 m at the rated flow.`,
  questions: [
    { q: "What is cavitation?",
      a: "The formation of vapour bubbles where the local static pressure falls to or below the fluid's vapour pressure, followed by their violent collapse when they are carried into higher-pressure regions. The collapsing bubbles produce micro-jets and pressure spikes that erode metal, generate noise and vibration, and reduce the pump's head and efficiency.",
      concepts: ["cavitation", "pressure-fluids"] },
    { q: "What causes it in this installation?",
      a: "Insufficient NPSH_a. The pump is 1.8 m *above* the liquid level (a suction lift), the suction line has a throttling valve, a strainer and two elbows adding friction, and the condensate at 75 °C has a vapour pressure of about 38.6 kPa. All four factors subtract from the available suction head.",
      concepts: ["cavitation", "head-losses"] },
    { q: "Estimate NPSH_a and decide whether the pump should cavitate.",
      a: "NPSH_a = (p_atm − p_v)/ρg + z_s − h_f = (101.3 − 38.6)/(0.975 × 9.81) − 1.8 − h_f ≈ 6.6 − 1.8 − h_f. With a throttled valve and a strainer, h_f is easily 1.5 m or more, giving NPSH_a ≈ 3.3 m — below the required 3.6 m. The pump is cavitating, exactly as the symptoms indicate.",
      concepts: ["cavitation", "bernoulli"] },
    { q: "What is NPSH, and why are there two values?",
      a: "NPSH is the margin between the absolute pressure at the impeller eye and the vapour pressure, expressed in metres of liquid. NPSH_a (available) is a property of the installation; NPSH_r (required) is a property of the pump, measured by the manufacturer as the head at which the pump loses 3% of its head. Good practice requires NPSH_a ≥ NPSH_r + 0.5 to 1 m of margin.",
      concepts: ["cavitation", "pumps-valves"] },
    { q: "How could the problem be solved?",
      a: "Attack the suction side: open the isolation valve fully or replace it with a full-bore valve; clean or remove the strainer; increase the suction pipe size and shorten it, removing elbows; raise the receiver level or lower the pump to convert the lift into a flooded suction; or sub-cool the condensate to reduce the vapour pressure. Changing to a lower-speed or inducer-equipped pump reduces NPSH_r if the installation cannot be modified.",
      concepts: ["cavitation", "head-losses", "pumps-valves"] },
    { q: "What damage would you expect to find on inspection?",
      a: "Pitted, sponge-like erosion concentrated on the impeller eye and the leading edges of the vanes — the low-pressure region — and possibly on the casing tongue. This differs from corrosion (uniform) and from erosion by solids (downstream of flow direction changes). The shaft seal and bearings may also be damaged by the vibration.",
      concepts: ["cavitation", "wear-corrosion"] }
  ],
  checklist: [
    "Always separate the pump's performance from the installation's suction conditions.",
    "Convert every pressure to head in metres of the actual pumped fluid.",
    "Use the vapour pressure at the real pumping temperature — this is the most common omission.",
    "Check for throttling on the suction side; suction valves should be fully open in service.",
    "Confirm the diagnosis by raising the supply level temporarily: if the noise stops, it was cavitation."
  ],
  standards: ["ISO 5199 / API 610 for centrifugal pumps", "HI 9.6.1 (Hydraulic Institute) NPSH margin guidance", "ISO 13709 for petrochemical pump service"]
},
{
  id: "bent-beam", title: "Excessively Bent Beam", domain: "Strength of Materials · Bending", icon: "⌒",
  difficulty: 3,
  scenario:
`A simply supported steel beam, 6 m span, IPE 200 section (I = 19.4 × 10⁻⁶ m⁴, Z = 195 × 10⁻⁶ m³),
supports a storage platform. The design load was 3 kN/m. After the platform was used to store drums
of resin, a visible sag appeared and a serviceability complaint was raised.

The measured mid-span deflection is 34 mm. The steel is S235 (σ_y = 235 MPa, E = 200 GPa).
The customer asks whether the beam is safe and what should be done.`,
  questions: [
    { q: "What loading is present and what is the bending moment?",
      a: "An approximately uniformly distributed load on a simply supported span. With w = 3 kN/m, M_max = wL²/8 = 3 × 36/8 = 13.5 kN·m at mid-span, and the reactions are wL/2 = 9 kN each.",
      concepts: ["distributed-loads", "shear-moment-diagrams"] },
    { q: "What stress develops, and is the beam within its elastic limit?",
      a: "σ_max = M/Z = 13500/195×10⁻⁶ = 69.2 MPa. Against σ_y = 235 MPa that is a factor of safety of 3.4 — the beam is comfortably elastic at the design load. The visible sag therefore indicates either that the real load exceeded the design load substantially, or that deflection, not stress, is the governing criterion.",
      concepts: ["bending", "stress", "safety-factor"] },
    { q: "What determines the deflection?",
      a: "δ = 5wL⁴/384EI. For w = 3 kN/m: δ = 5 × 3000 × 6⁴/(384 × 200×10⁹ × 19.4×10⁻⁶) = 12.7 mm. The measured 34 mm implies an actual load of about 8 kN/m — nearly three times the design value. Deflection scales with L⁴, so the span dominates everything.",
      concepts: ["deflection", "hooke-law"] },
    { q: "Does the beam fail the serviceability limit?",
      a: "Yes. A typical serviceability limit is L/300 = 6000/300 = 20 mm (some codes use L/250 = 24 mm for floors). At 34 mm the beam exceeds the limit even though the stress is acceptable — a clear illustration that stiffness and strength are separate criteria.",
      concepts: ["deflection", "safety-factor"] },
    { q: "Should the section be modified or the material changed?",
      a: "Modify the section, not the material. All structural steels have E ≈ 200 GPa, so changing from S235 to S355 increases strength but does essentially nothing for deflection. The effective options are a deeper section (δ ∝ 1/I, and I ∝ depth³), a shorter span (add an intermediate support — δ ∝ L⁴, so halving the span reduces deflection sixteenfold), or reducing the load.",
      concepts: ["deflection", "centroid", "bending"] },
    { q: "What else would you check before approving continued use?",
      a: "Whether permanent (plastic) deformation occurred — unload and measure the residual sag; the actual load history and whether overloading continues; lateral torsional buckling if the compression flange is unrestrained; the condition of the supports and bearings; and whether connections were designed for the increased reactions.",
      concepts: ["elastic-plastic", "buckling", "yield-failure"] }
  ],
  checklist: [
    "Check stress AND deflection — they are independent criteria and either can govern.",
    "Back-calculate the real load from the measured deflection; it reveals the true duty.",
    "Remember that changing steel grade does not improve stiffness.",
    "Distinguish elastic deflection from permanent set by unloading.",
    "Verify the supports and connections, not just the beam."
  ],
  standards: ["EN 1993-1-1 (Eurocode 3) for steel members", "EN 1990 deflection serviceability limits", "ISO 14122 for platforms and walkways"]
},
{
  id: "pressure-vessel", title: "Hydrogen Pressure Vessel", domain: "Elasticity · Failure · Codes", icon: "◍",
  difficulty: 4,
  scenario:
`A cylindrical steel vessel, 500 mm internal diameter and 12 mm wall thickness, is used to store
hydrogen at 20 MPa and ambient temperature. The design life is 20 years with daily pressurisation
cycles. The vessel has a longitudinal welded seam and several nozzle penetrations.

A routine inspection has raised three concerns: the wall thickness relative to the pressure, the
weld quality, and the choice of material for hydrogen service.`,
  questions: [
    { q: "What stresses develop in the wall?",
      a: "Hoop (circumferential) stress σ_h = pr/t = 20 × 250/12 = 416.7 MPa, axial stress σ_a = pr/2t = 208.3 MPa, and a radial stress varying from −20 MPa at the inner surface to zero outside. With r/t = 20.8 the thin-wall assumption is marginally acceptable, but the radial stress is not negligible near the inner wall.",
      concepts: ["pressure-fluids", "stress-3d", "generalized-hooke"] },
    { q: "Is the current thickness adequate?",
      a: "No. A hoop stress of 417 MPa exceeds the yield strength of most pressure-vessel steels (P355 has σ_y = 355 MPa) and gives a factor of safety below 1 against yield. For σ_y = 355 MPa with a design factor of 1.5, the allowable is 237 MPa, requiring t = pr/σ_allow = 20 × 250/237 ≈ 21 mm. The vessel as described is unsuitable for 20 MPa.",
      concepts: ["safety-factor", "yielding", "vonmises"] },
    { q: "Why is wall thickness so important, and why is the longitudinal seam critical?",
      a: "Hoop stress is twice the axial stress, so the circumferential direction governs. A longitudinal seam is loaded by the hoop stress — the highest stress in the vessel — so it must have the highest weld efficiency and the most rigorous inspection. A circumferential seam carries only the axial stress.",
      concepts: ["pressure-fluids", "fatigue", "fracture-mechanics"] },
    { q: "Which failure mechanisms should be considered?",
      a: "Yielding and plastic collapse under proof pressure; low-cycle fatigue from the daily pressure cycles (about 7,300 cycles over 20 years, with a large stress range); fracture from a weld defect, assessed by fracture mechanics; hydrogen embrittlement, which reduces ductility and fracture toughness and raises the ductile-to-brittle transition temperature; and creep is not a concern at ambient temperature.",
      concepts: ["fatigue", "fracture-mechanics", "yield-failure", "failure-theories"] },
    { q: "What is special about hydrogen service?",
      a: "Hydrogen atoms are small enough to diffuse into the steel, where they reduce toughness and promote cracking (hydrogen embrittlement and hydrogen-induced cracking). Mitigations include using lower-strength steels with high toughness, austenitic stainless steels, avoiding hard weld zones and high local hardness, controlling the pressurisation rate, and applying more generous flaw acceptance criteria and shorter inspection intervals.",
      concepts: ["fracture", "wear-corrosion", "failure-theories"] },
    { q: "Which engineering standards could apply?",
      a: "EN 13445 (unfired pressure vessels) or ASME BPVC Section VIII Div. 1/2 in the US; for hydrogen specifically ISO 19880 (gaseous hydrogen fuelling) and ISO 11114 for material compatibility; EN 10204 3.1 material certification; and NDT to EN ISO 17635 with weld quality per EN ISO 5817. A notified-body design appraisal is required in the EU under the Pressure Equipment Directive.",
      concepts: ["safety-factor", "fracture-mechanics"] }
  ],
  checklist: [
    "Hoop stress is twice the axial stress — it always governs thin cylinders.",
    "Check r/t before applying thin-wall theory; below 10 use thick-wall (Lamé) equations.",
    "Pressure cycling means fatigue, even at only a few thousand cycles, because the stress range is large.",
    "Hydrogen service changes the material selection rules, not just the stress calculation.",
    "Codes are not optional: they define the allowable stress, the weld joint efficiency and the inspection regime."
  ],
  standards: ["EN 13445 unfired pressure vessels", "ASME BPVC Section VIII", "ISO 19880 hydrogen fuelling", "ISO 11114 gas/material compatibility", "PED 2014/68/EU"]
},
{
  id: "vibrating-frame", title: "Vibrating Machine Frame", domain: "Dynamics · Vibrations", icon: "∿",
  difficulty: 3,
  scenario:
`A 320 kg compressor running at 1450 rpm is bolted to a welded steel support frame. After a
modification that added a stiffening plate to the frame, the vibration amplitude increased sharply
and a fatigue crack appeared at a weld toe.

Before the modification the vibration was barely noticeable.`,
  questions: [
    { q: "What is the excitation frequency?",
      a: "1450 rpm = 1450/60 = 24.2 Hz. If the compressor is single-acting, the dominant excitation is once per revolution at 24.2 Hz; a two-cylinder machine could also excite at 48.3 Hz.",
      concepts: ["angular-motion", "vibrations"] },
    { q: "Why did adding stiffness make the vibration worse?",
      a: "Adding a stiffening plate raised the frame's natural frequency. Before the modification the natural frequency was probably well above 24.2 Hz; after it, the frame's f_n moved close to 24.2 Hz and the system went through resonance. Adding stiffness raises f_n = (1/2π)√(k/m), which can move a structure *towards* the excitation rather than away from it.",
      concepts: ["vibrations", "spring-mass"] },
    { q: "How would you confirm resonance?",
      a: "Measure the natural frequency by a bump or run-down test and compare it with 24.2 Hz; or vary the machine speed slightly and observe whether the vibration amplitude peaks at a specific speed. A large phase shift of about 90° between the force and the response at the peak confirms resonance.",
      concepts: ["vibrations", "fatigue"] },
    { q: "What are the possible remedies?",
      a: "Move the natural frequency well away from 24.2 Hz — either much lower (below 24.2/√2 ≈ 17 Hz, using flexible isolators with added mass) or much higher (a much stiffer frame, though this is often impractical). Add damping, use anti-vibration mounts, balance the rotating assembly to reduce the excitation force, and dress the weld toe to reduce the stress concentration where the crack started.",
      concepts: ["vibrations", "stress-concentration", "fatigue"] },
    { q: "Why did the crack start at the weld toe?",
      a: "A weld toe is a severe geometric stress raiser (K_t of 2 or more) and often contains small undercut or porosity. Under resonant cyclic loading it is the natural site for fatigue crack initiation. Weld fatigue classes in the codes (EN 1993-1-9) reflect exactly this.",
      concepts: ["stress-concentration", "fatigue", "fracture-mechanics"] }
  ],
  checklist: [
    "Always compare the excitation frequency with the structure's natural frequency before changing stiffness.",
    "Adding stiffness is not always beneficial — it can move a structure into resonance.",
    "Isolation only works for excitation above √2 times the natural frequency.",
    "Weld toes are the default fatigue initiation site; detail and inspect them accordingly.",
    "A run-down or run-up test is the cheapest and most informative diagnostic."
  ],
  standards: ["ISO 10816 / ISO 20816 vibration evaluation", "EN 1993-1-9 fatigue of welded joints", "ISO 2631 for human exposure to vibration"]
},
{
  id: "hydraulic-circuit", title: "Slow Hydraulic Cylinder", domain: "Fluid Power · Losses", icon: "⚙",
  difficulty: 3,
  scenario:
`A hydraulic press cylinder has become progressively slower over several months. The system pressure
at the pump relief valve is unchanged at 180 bar, the oil temperature reads 68 °C (normal is 45 °C),
and the reservoir level is correct.

The pump is a fixed-displacement vane pump, 20 years old. The circuit contains a directional valve,
a flow control valve and a relief valve.`,
  questions: [
    { q: "What does a high oil temperature with normal pressure suggest?",
      a: "Energy is being dissipated as heat somewhere in the circuit — almost always internal leakage across a worn component, with the pump continually delivering flow over the relief valve. The high temperature also thins the oil, which increases leakage further: a self-reinforcing loop.",
      concepts: ["viscosity", "power"] },
    { q: "Where is the flow going?",
      a: "Not to the cylinder. Either internal leakage in the pump (wear reduces volumetric efficiency), leakage past the cylinder piston seal, or flow escaping over the relief valve because the flow control setting or a spool is restricting the useful path. A flow meter in the pump delivery line would separate these.",
      concepts: ["flow-rate", "pumps-valves"] },
    { q: "How would you quantify the loss?",
      a: "Measure the actual pump delivery against its theoretical displacement × speed to obtain the volumetric efficiency. A healthy vane pump is 85–92%; below about 80% the pump is worn. Then measure the cylinder's extension speed and back-calculate the flow it actually receives.",
      concepts: ["flow-rate", "power"] },
    { q: "Why does the temperature matter for the seals?",
      a: "Elastomer seals have a maximum continuous temperature, typically 80–100 °C for nitrile. Running at 68 °C with excursions above that accelerates hardening and cracking, so seal leakage grows and the problem worsens. Temperature is both a symptom and a cause.",
      concepts: ["wear-corrosion", "creep"] },
    { q: "What is the correct sequence of remedial action?",
      a: "First measure — flow, pressure and temperature at several points to locate the loss. Then correct the root cause: replace or overhaul the pump if volumetric efficiency is low, replace the cylinder seals, and clean or replace the flow control valve. Finally address the heat: check the cooler, reduce unnecessary relief-valve flow with an unloading circuit or a variable-displacement pump, and fit a temperature alarm.",
      concepts: ["pumps-valves", "power", "viscosity"] }
  ],
  checklist: [
    "Heat in a hydraulic system is wasted power — always find where the energy is going.",
    "Measure before replacing parts; a flow meter is the most valuable diagnostic tool.",
    "High temperature and internal leakage reinforce each other.",
    "Check the whole circuit, not just the component that appears to be at fault.",
    "Consider energy efficiency when repairing: an unloading or variable-displacement circuit removes the standing loss."
  ],
  standards: ["ISO 4406 fluid cleanliness coding", "ISO 4413 hydraulic systems general rules", "ISO 3448 viscosity classification"]
}
];

const CASE_BY_ID = Object.fromEntries(CASES.map(c => [c.id, c]));
