/* ═══════════════════════════════════════════════════════════
   data/formulas.js — Engineering Formula Library
   Every entry: expression, physical meaning, variables, units,
   assumptions, application, worked example, related formulas.
   ═══════════════════════════════════════════════════════════ */
"use strict";

/* Parse compact "SYM → meaning [unit]" blocks into rows */
function parseVars(block) {
  return String(block).trim().split("\n").map(l => {
    const m = l.trim().match(/^([^\u2192]+)\u2192(.+)$/);
    if (!m) return { s: l.trim(), d: "", u: "" };
    const rest = m[2].trim();
    const um = rest.match(/\[([^\]]+)\]\s*$/);
    return { s: m[1].trim(), d: um ? rest.slice(0, um.index).trim() : rest, u: um ? um[1] : "" };
  });
}

const FORMULAS = [
/* ══════════════ STATICS ══════════════ */
{
  id: "moment", name: "Moment of a force", field: "statics", expr: "M = F · d",
  exprFull: "M_O = F · d = F · r · sin(θ)",
  meaning: "The turning effect a force produces about a point. Only the component perpendicular to the lever arm rotates the body; the rest is wasted.",
  vars: "M → moment about the point [N·m]\nF → force magnitude [N]\nd → perpendicular distance from the point to the line of action [m]\nr → position vector from the point to the force application [m]\nθ → angle between r and F [deg]",
  assumptions: "Rigid body; force is a sliding vector along its line of action; 2-D planar moment (use the cross product M = r × F in 3-D).",
  application: "Wrenches, levers, bracket design, crane booms, pedal mechanisms, bolt tightening torque.",
  example: "A 100 N force is applied 0.5 m from a pivot, perpendicular to the arm: M = 100 × 0.5 = 50 N·m. The same 100 N at 30° to the arm gives M = 100 × 0.5 × sin 30° = 25 N·m — half the turning effect.",
  related: ["couple", "torque-power", "equilibrium"],
  intuition: "Increase the lever arm and the same muscle produces more rotation — this is why spanners are long and why door handles sit far from the hinges."
},
{
  id: "torque-power", name: "Torque from transmitted power", field: "statics", expr: "P = T · ω",
  exprFull: "T = P / ω = 9550 · P[kW] / n[rpm]  (N·m)",
  meaning: "Rotating machinery converts torque and angular speed into power. At constant speed the shaft torque is set by the power and nothing else.",
  vars: "P → mechanical power [W]\nT → torque [N·m]\nω → angular speed [rad/s]\nn → rotational speed [rpm]",
  assumptions: "Steady state (no angular acceleration), rigid shaft, efficiency ≈ 1 unless stated.",
  application: "Motor and gearbox selection, shaft sizing, dynamometer testing, pump and fan drives.",
  example: "A shaft transmits 5 kW at 1500 rpm: ω = 1500 × 2π/60 = 157.1 rad/s, T = 5000/157.1 = 31.8 N·m.",
  related: ["moment", "torsion", "power"],
  intuition: "Same power, lower speed ⇒ much larger torque. This is exactly why gearboxes exist: they trade speed for torque."
},
{
  id: "couple", name: "Couple", field: "statics", expr: "M = F · d",
  meaning: "Two equal, opposite, parallel forces separated by a distance produce a pure moment with zero resultant force. A free vector: it can be moved anywhere on the body.",
  vars: "F → magnitude of each force [N]\nd → perpendicular distance between the two lines of action [m]",
  assumptions: "Forces equal, opposite and non-collinear; rigid body.",
  application: "Steering wheels, valve handwheels, screwdriver action, motor torque reaction on its mounts.",
  example: "Two 250 N forces 0.4 m apart on a handwheel: M = 100 N·m, resultant force = 0, so the bearings see no extra radial load from the couple alone.",
  related: ["moment", "equilibrium"],
  intuition: "A couple spins without pushing. That is the cleanest way to apply a moment to a shaft."
},
{
  id: "equilibrium", name: "Equilibrium equations", field: "statics", expr: "ΣF = 0 , ΣM = 0",
  exprFull: "ΣFx = 0 ; ΣFy = 0 ; ΣM_O = 0",
  meaning: "A rigid body at rest (or in uniform motion) has no net force and no net moment. These three scalar equations are the entire toolbox of 2-D statics.",
  vars: "ΣFx → sum of horizontal force components [N]\nΣFy → sum of vertical force components [N]\nΣM_O → sum of moments about any point O [N·m]",
  assumptions: "Rigid body, planar loading, at most 3 independent unknown reactions (else statically indeterminate).",
  application: "Support reactions, bracket design, crane stability, vehicle load transfer, fixture design.",
  example: "A simply supported beam, 4 m span, with 10 kN at mid-span: ΣM_A = 0 ⇒ R_B × 4 = 10 × 2 ⇒ R_B = 5 kN, then ΣFy = 0 ⇒ R_A = 5 kN.",
  related: ["resultant-dist", "moment", "centroid"],
  intuition: "Choose the moment centre to kill unknowns: sum moments about a support and its reaction drops out of the equation."
},
{
  id: "resultant-dist", name: "Resultant of a distributed load", field: "statics", expr: "F_R = ∫ w(x) dx",
  meaning: "A distributed load is replaced by one force equal to the area under the load diagram, acting through the centroid of that area.",
  vars: "w → load intensity [N/m]\nF_R → resultant force [N]\nx̄ → location of the centroid of the load diagram [m]",
  assumptions: "Load acts perpendicular to the member; the diagram is known (uniform, triangular, trapezoidal).",
  application: "Floor slabs, wind pressure on walls, hydrostatic pressure on gates, snow load on roofs.",
  example: "Triangular load, 0 at A to 6 kN/m over 3 m: F_R = ½ × 3 × 6 = 9 kN acting at 2 m from A (two-thirds from the zero end).",
  related: ["centroid", "hydrostatic-pressure", "shear-moment"],
  intuition: "The area of the load diagram is the force; the centroid of that area is where it pushes."
},
{
  id: "friction", name: "Dry (Coulomb) friction", field: "statics", expr: "F_f ≤ μ_s · N",
  exprFull: "F_f,max = μ_s N   (impending motion) ;  F_f = μ_k N  (sliding)",
  meaning: "Friction is a reaction, not a fixed force. It grows to match the applied tangential load up to a ceiling set by the normal force; beyond that ceiling the bodies slide.",
  vars: "F_f → friction force [N]\nμ_s → static friction coefficient [–]\nμ_k → kinetic friction coefficient [–]\nN → normal force [N]",
  assumptions: "Dry contact, rigid bodies, coefficient independent of contact area and speed (approximation).",
  application: "Brakes, clutches, bolted joints, belt drives, wedge clamps, vehicle tyres, thread self-locking.",
  example: "A 20 kg block on a 25° incline: N = mg cos 25° = 177.8 N; driving force mg sin 25° = 82.8 N. It stays put if μ_s ≥ 82.8/177.8 = 0.466, i.e. if the incline angle is below tan⁻¹μ_s.",
  related: ["safety-factor", "equilibrium", "wear"],
  intuition: "The friction angle φ = tan⁻¹μ is the steepest slope the block can hold. Self-locking happens whenever the load angle is smaller than φ."
},
{
  id: "centroid", name: "Centroid / centre of gravity", field: "statics", expr: "x̄ = ΣA_i x_i / ΣA_i",
  meaning: "The geometric average position of an area (or the mass-weighted average for a centre of gravity). Resultants and stiffness calculations always reference it.",
  vars: "x̄ → centroid coordinate [m]\nA_i → area of sub-region i [m²]\nx_i → centroid of sub-region i [m]",
  assumptions: "Uniform density for CG = centroid; composite regions must not overlap (subtract voids as negative areas).",
  application: "Beam section properties, balancing rotating parts, stability of floating bodies, robot centre of mass.",
  example: "T-section: flange 100×10 at y = 95, web 10×80 at y = 40 ⇒ ȳ = (1000×95 + 800×40)/1800 = 70.6 mm above the bottom.",
  related: ["second-moment", "resultant-dist"],
  intuition: "Bending stress is zero at the centroid — that is why the neutral axis of a symmetric beam passes through it."
},
{
  id: "truss-method-joints", name: "Truss — method of joints", field: "statics", expr: "m + r = 2j",
  meaning: "A planar truss with m members, r reactions and j joints is statically determinate when m + r = 2j. Each joint is a concurrent force system, so two equations per joint solve every member.",
  vars: "m → number of members [–]\nr → number of reaction components [–]\nj → number of joints [–]",
  assumptions: "Pin joints, loads applied only at joints, members carry axial force only (tension or compression), weight neglected.",
  application: "Roof trusses, bridge trusses, tower structures, space frames, crane jibs.",
  example: "A Pratt truss with j = 8, r = 3 needs m = 2(8) − 3 = 13 members to be statically determinate.",
  related: ["equilibrium", "buckling", "normal-stress"],
  intuition: "Zero-force members are found instantly: two non-collinear members at an unloaded joint both carry zero."
},

/* ══════════════ KINEMATICS ══════════════ */
{
  id: "velocity", name: "Velocity", field: "kinematics", expr: "v = ds/dt",
  meaning: "The rate of change of position — a vector with both magnitude (speed) and direction. Uniform motion means this derivative is constant.",
  vars: "v → velocity [m/s]\ns → position along the path [m]\nt → time [s]",
  assumptions: "Continuous, differentiable position function.",
  application: "Conveyor speeds, vehicle dynamics, machine cycle times, flow velocity measurement.",
  example: "x(t) = 2t² ⇒ v(t) = 4t, so at t = 3 s the velocity is 12 m/s and the acceleration is 4 m/s².",
  related: ["uniform-accel", "angular-kinematics", "continuity"],
  intuition: "Velocity is the slope of the position-time curve; acceleration is the slope of the velocity-time curve."
},
{
  id: "uniform-accel", name: "Uniformly accelerated motion", field: "kinematics", expr: "v = v₀ + a·t",
  exprFull: "s = s₀ + v₀t + ½at² ; v² = v₀² + 2a(s − s₀)",
  meaning: "The three kinematic equations for constant acceleration. They link displacement, velocity, acceleration and time without needing the force.",
  vars: "v → final velocity [m/s]\nv₀ → initial velocity [m/s]\na → constant acceleration [m/s²]\nt → time [s]\ns → displacement [m]",
  assumptions: "Acceleration constant in magnitude and direction; straight-line (or component-wise) motion.",
  application: "Free fall, braking distance, lift and elevator profiles, press ram motion, ballistic trajectories.",
  example: "Braking from 20 m/s with a = −6 m/s²: stopping distance = v²/(2a) = 400/12 = 33.3 m, stopping time 3.33 s.",
  related: ["velocity", "newton2", "projectile"],
  intuition: "Braking distance scales with the square of speed: double the speed, four times the distance."
},
{
  id: "angular-kinematics", name: "Angular motion", field: "kinematics", expr: "ω = dθ/dt , α = dω/dt",
  meaning: "Rotation has its own kinematics, formally identical to translation with θ, ω, α replacing s, v, a.",
  vars: "θ → angular position [rad]\nω → angular velocity [rad/s]\nα → angular acceleration [rad/s²]\nn → speed [rpm]",
  assumptions: "Rigid body rotating about a fixed axis.",
  application: "Motor start-up, flywheel design, gear trains, engine balancing, turntable positioning.",
  example: "A motor goes from 0 to 1500 rpm in 2 s: ω = 157.1 rad/s, α = 78.5 rad/s², angle turned = ½αt² = 157 rad ≈ 25 revolutions.",
  related: ["moment-inertia", "moment-inertia", "velocity"],
  intuition: "Every point on the body shares ω and α, but linear speed grows with radius: v = ωr."
},
{
  id: "relative-motion", name: "Relative velocity (two points on a rigid body)", field: "kinematics", expr: "v_B = v_A + ω × r_B/A",
  meaning: "Any general plane motion is a translation of one point plus a rotation about it. The relative term is always perpendicular to the line joining the two points.",
  vars: "v_A , v_B → absolute velocities [m/s]\nω → angular velocity of the body [rad/s]\nr_B/A → position of B relative to A [m]",
  assumptions: "Rigid body, planar motion, distance A–B constant.",
  application: "Slider-crank engines, four-bar linkages, rolling wheels, robot arm kinematics, gear meshing.",
  example: "Rolling wheel, r = 0.3 m, centre speed 6 m/s: ω = v/r = 20 rad/s, contact point velocity 0, top point velocity 12 m/s.",
  related: ["instantaneous-centre", "angular-kinematics", "instantaneous-centre"],
  intuition: "The instantaneous centre is the point with zero velocity at that instant — the body is purely rotating about it."
},
{
  id: "instantaneous-centre", name: "Instantaneous centre of zero velocity", field: "kinematics", expr: "v_P = ω · r_P/IC",
  meaning: "At any instant a body in plane motion rotates about a single point whose velocity is zero. Distances from that point scale the velocities of all other points.",
  vars: "v_P → velocity of point P [m/s]\nω → angular velocity [rad/s]\nr_P/IC → distance from P to the IC [m]",
  assumptions: "Planar motion, rigid body, IC may lie outside the body and moves with time.",
  application: "Linkage velocity analysis, cam followers, rolling contact, steering geometry.",
  example: "Connecting rod of an engine: the IC lies at the intersection of the perpendiculars to the piston velocity (along the cylinder) and the crank-pin velocity.",
  related: ["relative-motion", "angular-kinematics"],
  intuition: "Find the IC and the whole velocity diagram becomes a single rotation."
},

/* ══════════════ KINETICS ══════════════ */
{
  id: "newton2", name: "Newton's second law", field: "kinetics", expr: "F = m · a",
  exprFull: "ΣF = m·a  ;  ΣM_G = I_G·α",
  meaning: "Force is the rate of change of momentum. Unbalanced force produces acceleration; the mass measures how strongly the body resists that change.",
  vars: "F → resultant force [N]\nm → mass [kg]\na → acceleration [m/s²]\nI_G → mass moment of inertia [kg·m²]\nα → angular acceleration [rad/s²]",
  assumptions: "Inertial reference frame, constant mass, rigid body for the rotational form.",
  application: "Machine dynamics, vehicle acceleration, impact loads, servo sizing, vibration isolation.",
  example: "A 1500 kg car accelerating at 2.5 m/s² needs ΣF = 3750 N at the wheels, before rolling and aerodynamic resistance.",
  related: ["momentum", "work-energy", "impulse"],
  intuition: "F = ma answers 'why does it move'; kinematics only answers 'how'."
},
{
  id: "work-energy", name: "Work–energy principle", field: "kinetics", expr: "T₁ + ΣU₁₋₂ = T₂",
  meaning: "Work done by all forces equals the change in kinetic energy. Path-based scalar bookkeeping that avoids solving differential equations.",
  vars: "T → kinetic energy ½mv² [J]\nU → work ∫F·ds [J]\ns → displacement along the force [m]",
  assumptions: "All energy transfers (including friction losses) are counted; rigid body or accounted deformation.",
  application: "Flywheel sizing, brake energy, impact analysis, machine cycle power, hoist design.",
  example: "Stopping a 200 kg flywheel at 10 rad/s with I = 8 kg·m²: energy to absorb = ½ × 8 × 100 = 400 J.",
  related: ["newton2", "power", "power"],
  intuition: "Energy methods ignore the path details — perfect when you only care about start and end states."
},
{
  id: "power", name: "Power", field: "kinetics", expr: "P = F · v = T · ω",
  meaning: "The rate at which work is done. Translation and rotation have parallel expressions.",
  vars: "P → power [W]\nF → force [N]\nv → velocity [m/s]\nT → torque [N·m]\nω → angular velocity [rad/s]",
  assumptions: "Instantaneous values; average over a cycle if quantities vary.",
  application: "Motor selection, pump and compressor rating, conveyor drives, vehicle performance.",
  example: "Lifting 500 kg at 0.4 m/s: P = mgv = 500 × 9.81 × 0.4 = 1.96 kW (before efficiency).",
  related: ["torque-power", "work-energy", "pump-head"],
  intuition: "Power is the currency that motors, pumps and gearboxes trade in."
},
{
  id: "impulse", name: "Impulse–momentum", field: "kinetics", expr: "m v₁ + Σ∫F dt = m v₂",
  meaning: "Impulse is force integrated over time and equals the change in momentum. It is the right tool whenever the force acts for a very short time.",
  vars: "m → mass [kg]\nv → velocity [m/s]\n∫F dt → linear impulse [N·s]\nt → duration [s]",
  assumptions: "Constant mass; internal forces cancel in a system.",
  application: "Crash and impact analysis, hammer forging, pile driving, recoil, clutch engagement.",
  example: "A 0.5 kg hammer at 8 m/s stopping in 4 ms: average force = mv/t = 4/0.004 = 1000 N. Same energy over 40 ms gives only 100 N — cushioning cuts the peak force tenfold.",
  related: ["momentum", "newton2"],
  intuition: "Longer impact time, lower peak force. That is the whole idea behind airbags, cushions and soft tool handles."
},
{
  id: "momentum", name: "Conservation of linear momentum", field: "kinetics", expr: "m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'",
  meaning: "With no external impulse, the total momentum of a system is unchanged by collisions.",
  vars: "m → mass [kg]\nv → velocity before [m/s]\nv' → velocity after [m/s]\ne → coefficient of restitution [–]",
  assumptions: "Isolated system in the direction considered; coefficient of restitution known for the impact type.",
  application: "Collisions, forging, ballistic pendulum, coupling railway wagons, robotic grippers.",
  example: "Perfectly plastic impact of 2 kg at 6 m/s onto 4 kg at rest: v' = 12/6 = 2 m/s; kinetic energy drops from 36 J to 12 J — two-thirds is lost as heat and deformation.",
  related: ["impulse", "angular-momentum"],
  intuition: "Momentum is always conserved in an impact; kinetic energy usually is not."
},
{
  id: "angular-momentum", name: "Angular momentum", field: "kinetics", expr: "H = I · ω",
  meaning: "The rotational analogue of momentum. With no external moment it is conserved — the basis of gyroscopic stability.",
  vars: "H → angular momentum [kg·m²/s]\nI → mass moment of inertia [kg·m²]\nω → angular velocity [rad/s]",
  assumptions: "Rigid body about a principal axis, or accounted products of inertia.",
  application: "Flywheels, gyroscopes, turbine rotors, reaction wheels, engine balancing.",
  example: "A rotor with I = 2 kg·m² at 300 rad/s holds H = 600 kg·m²/s; halving I doubles ω if H is conserved.",
  related: ["moment-inertia", "momentum", "moment-inertia"],
  intuition: "A spinning rotor resists changes to the direction of its axis — that resistance appears as a gyroscopic moment."
},
{
  id: "moment-inertia", name: "Mass moment of inertia", field: "kinetics", expr: "I = ∫ r² dm",
  exprFull: "I = I_G + m d²   (parallel axis)",
  meaning: "The rotational equivalent of mass: how strongly a body resists angular acceleration. Mass far from the axis counts much more.",
  vars: "I → mass moment of inertia [kg·m²]\nr → distance from the axis [m]\nm → mass [kg]\nd → distance between parallel axes [m]",
  assumptions: "Rigid body; axis known; use the parallel-axis theorem for off-centre axes.",
  application: "Flywheel design, motor acceleration time, robot arm dynamics, crankshaft balancing.",
  example: "Solid disc m = 10 kg, r = 0.2 m about its centre: I = ½mr² = 0.2 kg·m². About a tangent: I = 0.2 + 10(0.2)² = 0.6 kg·m².",
  related: ["angular-momentum", "second-moment", "angular-kinematics"],
  intuition: "Double the radius and the inertia quadruples for the same mass — this is why flywheels put their mass at the rim."
},
{
  id: "pendulum", name: "Simple pendulum period", field: "kinetics", expr: "T = 2π √(L/g)",
  meaning: "For small oscillations the period depends only on length and gravity — not on mass or amplitude.",
  vars: "T → period [s]\nL → length [m]\ng → gravitational acceleration [m/s²]",
  assumptions: "Small angle (< 10°), massless rod, point mass, no damping.",
  application: "Clocks, vibration absorbers, seismic sensors, crane load swing control.",
  example: "L = 1 m ⇒ T = 2π√(1/9.81) = 2.01 s. A 4 m crane cable swings with T = 4.01 s, which sets the operator's anti-swing timing.",
  related: ["spring-mass", "vibration-natural", "angular-kinematics"],
  intuition: "Longer pendulum, slower swing — mass cancels out completely."
},
{
  id: "spring-mass", name: "Mass–spring natural frequency", field: "kinetics", expr: "ω_n = √(k/m)",
  exprFull: "f_n = (1/2π)√(k/m)",
  meaning: "Every elastic system has a frequency at which it prefers to oscillate, set by its stiffness and its inertia.",
  vars: "ω_n → natural angular frequency [rad/s]\nf_n → natural frequency [Hz]\nk → stiffness [N/m]\nm → mass [kg]",
  assumptions: "Linear spring, single degree of freedom, undamped (or lightly damped).",
  application: "Vibration isolation, suspension design, machine mounting, seismic design, tuning absorbers.",
  example: "A 200 kg machine on mounts of total stiffness 8×10⁵ N/m: f_n = (1/2π)√(4000) = 10.1 Hz. Any excitation near 10 Hz must be avoided.",
  related: ["vibration-natural", "hooke", "pendulum"],
  intuition: "Stiffer or lighter raises the natural frequency; resonance appears when the excitation frequency approaches it."
},
{
  id: "vibration-natural", name: "Resonance / transmissibility", field: "kinetics", expr: "r = ω/ω_n",
  meaning: "When the excitation frequency approaches the natural frequency the amplitude is limited only by damping. Isolation only works above r = √2.",
  vars: "r → frequency ratio [–]\nω → excitation frequency [rad/s]\nω_n → natural frequency [rad/s]\nζ → damping ratio [–]",
  assumptions: "Harmonic excitation, linear SDOF system.",
  application: "Rotating machinery, engine mounts, building design, washing machines, turbine blade design.",
  example: "A machine at 30 Hz with f_n = 10 Hz gives r = 3 ⇒ transmissibility < 0.4, so the mount isolates. At r = 1 the amplitude can be tens of times the static deflection.",
  related: ["spring-mass", "fatigue", "moment-inertia"],
  intuition: "You cannot isolate at low frequency ratios — you must go well above √2 or add damping."
},
{
  id: "projectile", name: "Projectile motion", field: "kinematics", expr: "R = v₀² sin(2θ) / g",
  meaning: "Horizontal and vertical motions are independent; gravity only affects the vertical component.",
  vars: "v₀ → launch speed [m/s]\nθ → launch angle [deg]\nR → horizontal range [m]\ng → 9.81 [m/s²]",
  assumptions: "No air resistance, flat ground, constant g.",
  application: "Material throwing, spray nozzles, ballistic testing, conveyor transfer points, sports engineering.",
  example: "20 m/s at 45°: R = 400/9.81 = 40.8 m; time of flight 2.9 s; peak height 10.2 m.",
  related: ["uniform-accel", "velocity"],
  intuition: "Maximum range at 45° in vacuum; real throws are shortened by drag, which favours flatter angles."
},

/* ══════════════ STRENGTH OF MATERIALS ══════════════ */
{
  id: "normal-stress", name: "Normal stress (axial)", field: "som", expr: "σ = F / A",
  meaning: "Internal force intensity perpendicular to the section. It is not a property of the material — it is a property of the load and the geometry.",
  vars: "σ → normal stress [Pa]\nF → internal axial force [N]\nA → cross-sectional area [m²]",
  assumptions: "Uniform distribution (Saint-Venant: valid away from load application and geometric changes), centric loading, prismatic bar.",
  application: "Tie rods, bolts, columns, pressure vessel walls, cable design.",
  example: "A 12 mm bar carrying 20 kN: A = 1.131×10⁻⁴ m², σ = 20000/1.131e-4 = 177 MPa.",
  related: ["strain", "shear-stress", "safety-factor"],
  intuition: "Stress concentrates where the section shrinks — holes, fillets and threads are where real parts fail."
},
{
  id: "shear-stress", name: "Average shear stress", field: "som", expr: "τ = V / A",
  meaning: "Internal force intensity parallel to the section — layers of material sliding over each other.",
  vars: "τ → shear stress [Pa]\nV → shear force [N]\nA → area resisting shear [m²]",
  assumptions: "Uniform distribution (single shear plane); bolts in double shear use 2A.",
  application: "Bolts, pins, rivets, welded joints, keys, punch and blanking operations.",
  example: "A 10 mm pin in single shear carrying 15 kN: A = 7.85×10⁻⁵ m², τ = 191 MPa — close to typical allowable values, so double shear would be specified.",
  related: ["normal-stress", "torsion", "vonmises"],
  intuition: "Shear governs fasteners and punch tools; tension governs the members they connect."
},
{
  id: "strain", name: "Normal strain", field: "som", expr: "ε = ΔL / L₀",
  meaning: "Deformation normalised by the original length — dimensionless, which is why it transfers between scales and materials.",
  vars: "ε → normal strain [–] (often µε = 10⁻⁶)\nΔL → change in length [m]\nL₀ → original length [m]",
  assumptions: "Small strain; uniform deformation along the gauge length.",
  application: "Strain gauges, extensometry, tolerance and fit analysis, thermal expansion checks.",
  example: "A 2 m tie rod stretches 1.6 mm: ε = 1.6/2000 = 800 µε. Steel at E = 200 GPa ⇒ σ = Eε = 160 MPa.",
  related: ["hooke", "normal-stress", "poisson"],
  intuition: "Strain is what a strain gauge actually measures; stress is inferred through the elastic law."
},
{
  id: "hooke", name: "Hooke's law (uniaxial)", field: "elasticity", expr: "σ = E · ε",
  exprFull: "δ = FL/(AE)",
  meaning: "Inside the elastic limit stress and strain are proportional. E is the slope — a measure of atomic bond stiffness, not of strength.",
  vars: "σ → normal stress [Pa]\nε → normal strain [–]\nE → Young's modulus [Pa]\nδ → elongation [m]",
  assumptions: "Linear elastic, isotropic, homogeneous, uniaxial stress, below the proportional limit.",
  application: "Deflection prediction, spring design, bolt preload, strain-gauge conversion, stiffness-limited design.",
  example: "Aluminium (E = 70 GPa) and steel (E = 200 GPa) under the same stress: aluminium strains almost three times more. Strength and stiffness are unrelated.",
  related: ["strain", "poisson", "generalized-hooke"],
  intuition: "Stiffness (E) decides how much it bends; strength (σ_y) decides when it stops coming back."
},
{
  id: "poisson", name: "Poisson's ratio", field: "elasticity", expr: "ν = −ε_lateral / ε_axial",
  meaning: "Stretching a bar makes it thinner. The ratio links transverse to axial strain.",
  vars: "ν → Poisson's ratio [–] (metals 0.25–0.35)\nε_lateral → transverse strain [–]\nε_axial → axial strain [–]",
  assumptions: "Linear elastic, isotropic; ν < 0.5 for stable materials (0.5 = incompressible, e.g. rubber).",
  application: "Pressure vessel strain analysis, interference fits, biaxial strain gauge rosettes, FEA validation.",
  example: "Steel bar, ε_axial = 1000 µε, ν = 0.3 ⇒ ε_lateral = −300 µε; a 20 mm diameter loses 6 µm.",
  related: ["hooke", "generalized-hooke", "shear-modulus"],
  intuition: "Poisson's effect is why a pressurised vessel grows in diameter as well as in length."
},
{
  id: "shear-modulus", name: "Shear modulus & elastic constants", field: "elasticity", expr: "G = E / (2(1 + ν))",
  meaning: "For isotropic materials only two of E, G, ν, K are independent — measure two and you know all of them.",
  vars: "G → shear modulus [Pa]\nE → Young's modulus [Pa]\nν → Poisson's ratio [–]\nK → bulk modulus [Pa]",
  assumptions: "Isotropic, linear elastic, homogeneous.",
  application: "Torsion stiffness, rubber mounts, material characterisation, FEA material cards.",
  example: "Steel E = 200 GPa, ν = 0.3 ⇒ G = 200/(2×1.3) = 76.9 GPa.",
  related: ["hooke", "poisson", "torsion"],
  intuition: "Shear stiffness is always lower than axial stiffness for the same material — shafts twist more easily than they stretch."
},
{
  id: "generalized-hooke", name: "Generalized Hooke's law (3-D)", field: "elasticity", expr: "ε_x = [σ_x − ν(σ_y + σ_z)] / E",
  meaning: "Each normal strain depends on all three normal stresses through Poisson coupling. The bridge from 3-D stress to 3-D strain.",
  vars: "σ_x,σ_y,σ_z → normal stresses [Pa]\nε_x,ε_y,ε_z → normal strains [–]\nE → Young's modulus [Pa]\nν → Poisson's ratio [–]",
  assumptions: "Isotropic linear elasticity; shear components uncoupled (τ_xy = Gγ_xy).",
  application: "Pressure vessels, thick cylinders, FEA post-processing, strain rosette inversion.",
  example: "Thin vessel σ_hoop = 120 MPa, σ_axial = 60 MPa, σ_radial ≈ 0: ε_hoop = (120 − 0.3×60)/200000 = 510 µε.",
  related: ["hooke", "poisson", "principal-stress"],
  intuition: "You can never strain in one direction only — the other directions always respond."
},
{
  id: "torsion", name: "Torsion of a circular shaft", field: "som", expr: "τ = T · r / J",
  exprFull: "τ_max = T·c/J = 16T/(πd³) ; θ = TL/(GJ)",
  meaning: "Shear stress in a circular shaft grows linearly from zero at the axis to a maximum at the surface, which is why hollow shafts are material-efficient.",
  vars: "τ → shear stress [Pa]\nT → torque [N·m]\nr → radial position [m]\nc → outer radius [m]\nJ → polar second moment of area [m⁴]\nθ → angle of twist [rad]\nG → shear modulus [Pa]",
  assumptions: "Circular (or annular) section, linear elastic, plane sections remain plane, no warping restraint.",
  example: "Solid 30 mm shaft, T = 300 N·m: J = πd⁴/32 = 7.95×10⁻⁸ m⁴, τ_max = 300×0.015/7.95e-8 = 56.6 MPa.",
  application: "Transmission shafts, drive axles, torsion bars, drill strings, coupling design.",
  related: ["torque-power", "shear-stress", "vonmises"],
  intuition: "Material at the centre of a shaft does almost nothing in torsion — that is the argument for hollow shafts."
},
{
  id: "bending-stress", name: "Bending (flexure) stress", field: "som", expr: "σ = M · y / I",
  exprFull: "σ_max = M·c/I = M/Z ,  Z = I/c",
  meaning: "Bending puts one face in tension and the other in compression, with a linear distribution crossing zero at the neutral axis.",
  vars: "σ → bending stress [Pa]\nM → bending moment [N·m]\ny → distance from the neutral axis [m]\nI → second moment of area [m⁴]\nZ → section modulus [m³]",
  assumptions: "Pure bending or slender beam (L/h > 10), linear elastic, plane sections remain plane, symmetric section.",
  application: "Beams, axles, shafts with transverse loads, crane booms, chassis frames, springs.",
  example: "Rectangular section 40×80 mm, M = 2 kN·m: I = bh³/12 = 1.707×10⁻⁶ m⁴, σ_max = 2000×0.04/1.707e-6 = 46.9 MPa.",
  related: ["shear-moment", "second-moment", "deflection-beam"],
  intuition: "I grows with the cube of the depth: doubling the depth multiplies the section modulus by four."
},
{
  id: "shear-moment", name: "Shear force and bending moment diagrams", field: "som", expr: "dV/dx = −w , dM/dx = V",
  meaning: "Load, shear and moment are successive integrals of one another. The maximum moment occurs where the shear crosses zero.",
  vars: "w → distributed load [N/m]\nV → shear force [N]\nM → bending moment [N·m]\nx → position along the beam [m]",
  assumptions: "Straight prismatic beam, loads perpendicular to the axis.",
  application: "Beam design, locating the critical section, reinforcing bar layout, fatigue-critical zone identification.",
  example: "Simply supported 4 m beam with 5 kN/m: V goes +10 kN → −10 kN, M_max = wL²/8 = 10 kN·m at mid-span where V = 0.",
  related: ["bending-stress", "resultant-dist", "deflection-beam"],
  intuition: "Read the diagrams as slopes: the load diagram is the slope of the shear diagram, the shear diagram is the slope of the moment diagram."
},
{
  id: "deflection-beam", name: "Beam deflection", field: "som", expr: "δ_max = 5wL⁴ / (384EI)",
  exprFull: "point load at mid-span: δ = PL³/(48EI) ; cantilever tip: δ = PL³/(3EI)",
  meaning: "Deflection scales with the fourth power of span — span is by far the most powerful design variable.",
  vars: "δ → deflection [m]\nw → load per unit length [N/m]\nP → point load [N]\nL → span [m]\nE → Young's modulus [Pa]\nI → second moment of area [m⁴]",
  assumptions: "Small deflection, linear elastic, constant EI, standard support conditions.",
  application: "Floor and bridge serviceability, machine tool stiffness, shaft alignment, precision frames.",
  example: "Steel beam L = 5 m, w = 4 kN/m, I = 8×10⁻⁶ m⁴: δ = 5×4000×625/(384×200e9×8e-6) = 20.3 mm — likely above a L/300 = 16.7 mm serviceability limit.",
  related: ["bending-stress", "second-moment", "hooke"],
  intuition: "Stiffness problems are usually solved by shortening the span or deepening the section, not by changing the material — E varies little between steels."
},
{
  id: "second-moment", name: "Second moment of area", field: "som", expr: "I = ∫ y² dA",
  meaning: "A purely geometric property describing how the area is distributed about an axis. It controls bending stiffness and buckling resistance.",
  vars: "I → second moment of area [m⁴]\ny → distance from the axis [m]\nA → area [m²]",
  assumptions: "Axis defined; use the parallel-axis theorem I = I_c + Ad² for off-centre axes.",
  application: "Section selection, buckling checks, deflection analysis, composite beams.",
  example: "Rectangle 40×80 mm about its centroidal axis parallel to the 40 mm side: I = 40×80³/12 = 1.707×10⁶ mm⁴. Flipped: 4.27×10⁵ mm⁴ — four times less stiff.",
  related: ["bending-stress", "buckling", "deflection-beam"],
  intuition: "Orientation matters as much as size: the same beam can be four times stiffer just by turning it."
},
{
  id: "stress-concentration", name: "Stress concentration factor", field: "failure", expr: "σ_max = K_t · σ_nom",
  meaning: "Geometry multiplies the nominal stress locally. K_t depends only on shape ratios, not on material.",
  vars: "K_t → theoretical stress concentration factor [–]\nσ_nom → nominal stress on the net section [Pa]\nσ_max → local peak stress [Pa]",
  assumptions: "Linear elastic material; K_t from charts or FEA for the specific geometry.",
  application: "Fillet design, keyways, holes, threads, notched fatigue specimens.",
  example: "A shaft shoulder with K_t = 2.5 and nominal 80 MPa sees 200 MPa locally — enough to yield even though the nominal value looked safe.",
  related: ["fatigue", "normal-stress", "safety-factor"],
  intuition: "Fatigue cracks always start at the highest K_t. Generous fillet radii are the cheapest fatigue improvement available."
},
{
  id: "principal-stress", name: "Principal stresses (2-D)", field: "elasticity", expr: "σ₁,₂ = (σ_x+σ_y)/2 ± √[((σ_x−σ_y)/2)² + τ_xy²]",
  meaning: "There is always an orientation where the shear stress vanishes; the two normal stresses there are the extremes the material actually experiences.",
  vars: "σ_x,σ_y → normal stresses [Pa]\nτ_xy → shear stress [Pa]\nσ₁,σ₂ → principal stresses [Pa]\nθ_p → principal angle [deg]",
  assumptions: "Plane stress; the third principal stress is zero (thin components).",
  application: "Pressure vessels, welded joints, brittle material design, strain rosette analysis.",
  example: "σ_x = 100 MPa, σ_y = 0, τ_xy = 40 MPa ⇒ centre 50, radius 58.3 ⇒ σ₁ = 108.3 MPa, σ₂ = −8.3 MPa. Pure tension plus shear produces a small compressive principal stress.",
  related: ["mohr", "vonmises", "tresca"],
  intuition: "Shear stress always rotates the principal directions away from the loading axes — by 45° in pure shear."
},
{
  id: "mohr", name: "Mohr's circle", field: "elasticity", expr: "R = √[((σ_x−σ_y)/2)² + τ_xy²]",
  meaning: "A graphical map of the stress state: the centre is the average normal stress, the radius is the maximum shear stress.",
  vars: "C → circle centre = (σ_x+σ_y)/2 [Pa]\nR → radius = τ_max [Pa]\nσ₁ = C + R, σ₂ = C − R [Pa]\n2θ → rotation on the circle = θ on the element [deg]",
  assumptions: "Plane stress; angles on the circle are twice the physical rotation.",
  application: "Failure assessment, ductile vs brittle criteria selection, photoelasticity, rosette analysis.",
  example: "σ_x = 100, σ_y = 20, τ_xy = 30 MPa ⇒ C = 60, R = 50 ⇒ σ₁ = 110, σ₂ = 10, τ_max = 50 MPa.",
  related: ["principal-stress", "vonmises", "tresca"],
  intuition: "The radius of Mohr's circle is the maximum shear — and shear is what makes ductile metals yield."
},
{
  id: "vonmises", name: "Von Mises equivalent stress", field: "plasticity", expr: "σ_vm = √(σ₁² − σ₁σ₂ + σ₂²)",
  exprFull: "3-D: σ_vm = √(½[(σ₁−σ₂)² + (σ₂−σ₃)² + (σ₃−σ₁)²])",
  meaning: "A single scalar that represents the distortional (shape-changing) energy in a multiaxial state. Yielding starts when σ_vm reaches the uniaxial yield strength.",
  vars: "σ_vm → von Mises stress [Pa]\nσ₁,σ₂,σ₃ → principal stresses [Pa]\nσ_y → yield strength [Pa]",
  assumptions: "Isotropic, ductile material; hydrostatic pressure does not cause yielding.",
  application: "FEA acceptance checks, ductile component design, pressure equipment, shaft combined loading.",
  example: "σ₁ = 200, σ₂ = 100 MPa ⇒ σ_vm = √(40000 − 20000 + 10000) = 173 MPa. Pure hydrostatic 200 MPa in all directions gives σ_vm = 0 — no yielding at all.",
  related: ["tresca", "principal-stress", "safety-factor"],
  intuition: "Pressure alone cannot make a ductile metal yield; only the deviatoric part can. That is what von Mises measures."
},
{
  id: "tresca", name: "Tresca (max shear) criterion", field: "plasticity", expr: "τ_max = (σ₁ − σ₃)/2 ≤ σ_y/2",
  meaning: "Yielding starts when the maximum shear stress reaches the shear stress at yield in a simple tension test. Simpler and more conservative than von Mises.",
  vars: "τ_max → maximum shear stress [Pa]\nσ₁,σ₃ → largest and smallest principal stresses [Pa]\nσ_y → yield strength [Pa]",
  assumptions: "Isotropic ductile material; independent of the intermediate principal stress.",
  application: "Conservative hand checks, pressure vessel codes, thin-walled design, metal forming limits.",
  example: "σ₁ = 200, σ₂ = 100, σ₃ = 0 ⇒ Tresca τ_max = 100 MPa ⇒ yield when σ_y = 200 MPa; von Mises gives σ_vm = 173 MPa, so Tresca predicts yield about 15% earlier.",
  related: ["vonmises", "mohr", "yielding"],
  intuition: "Tresca ignores σ₂, so it is easy to apply by hand and errs on the safe side."
},
{
  id: "yielding", name: "Yield strength and 0.2% proof stress", field: "plasticity", expr: "σ_0.2 : ε_plastic = 0.002",
  meaning: "The stress at which permanent deformation becomes measurable. For materials without a clear yield point it is defined by a 0.2% offset line parallel to the elastic slope.",
  vars: "σ_y , σ_0.2 → yield / proof stress [Pa]\nE → Young's modulus [Pa]\nε → strain [–]",
  assumptions: "Quasi-static monotonic loading at room temperature; rate and temperature sensitive in reality.",
  application: "Material selection, allowable stress definition, forming process design, code compliance.",
  example: "S355 steel: σ_y = 355 MPa. At E = 200 GPa the elastic strain at yield is only 1775 µε — most of the visible deformation in a bent beam is plastic.",
  related: ["strain-hardening", "safety-factor", "vonmises"],
  intuition: "Yield is the end of 'remove the load and it recovers'. Everything past it is permanent."
},
{
  id: "strain-hardening", name: "Strain hardening", field: "plasticity", expr: "σ = K · ε_p^n",
  meaning: "Plastic deformation increases the strength of the metal (dislocation multiplication). The material becomes stronger but less ductile.",
  vars: "σ → true stress [Pa]\nε_p → true plastic strain [–]\nK → strength coefficient [Pa]\nn → strain-hardening exponent [–]",
  assumptions: "Power-law (Hollomon) hardening, cold working, true stress and true strain.",
  application: "Cold rolling, deep drawing, shot peening, spring manufacturing, work-hardening stainless.",
  example: "Copper with n ≈ 0.4 hardens strongly; mild steel with n ≈ 0.2 hardens less. Low n means early necking and limited deep drawability.",
  related: ["yielding", "plastic-flow", "fatigue"],
  intuition: "Cold working buys strength and costs ductility — a trade you must never make twice on the same part."
},
{
  id: "plastic-flow", name: "Plastic collapse / limit load", field: "plasticity", expr: "M_p = σ_y · Z_p",
  meaning: "A ductile beam keeps carrying load after first yield until a plastic hinge forms. The ratio Z_p/Z (shape factor) is the hidden reserve.",
  vars: "M_p → plastic moment [N·m]\nσ_y → yield strength [Pa]\nZ_p → plastic section modulus [m³]\nZ → elastic section modulus [m³]",
  assumptions: "Ductile material, perfect plasticity (no hardening), sufficient rotation capacity.",
  application: "Plastic design of steel frames, limit analysis, crash energy absorbers, overload assessment.",
  example: "A rectangle has shape factor Z_p/Z = 1.5, an I-section only about 1.14 — the rectangle has far more post-yield reserve.",
  related: ["yielding", "bending-stress", "safety-factor"],
  intuition: "Ductile structures warn you before they collapse; brittle ones do not. That reserve is why ductility is a design requirement, not a bonus."
},
{
  id: "safety-factor", name: "Factor of safety", field: "failure", expr: "n = σ_allowable / σ_working",
  meaning: "The margin between what the material can take and what the component actually sees. It must cover uncertainty in loads, material, geometry and modelling.",
  vars: "n → factor of safety [–]\nσ_allowable → allowable / limit stress [Pa]\nσ_working → calculated working stress [Pa]",
  assumptions: "Correct stress model; the FoS cannot compensate for a wrong load case or a missed failure mode.",
  application: "Every structural and machine design; codes specify values (typically 1.5–3 for static ductile, 3–5 for brittle, higher for fatigue).",
  example: "Working stress 120 MPa with σ_y = 355 MPa ⇒ n = 2.96 against yield. Against fatigue the same part might have n = 1.1 — the governing case.",
  related: ["vonmises", "fatigue", "stress-concentration"],
  intuition: "A factor of safety is an ignorance budget: the less you know about the loads, the bigger it must be."
},
{
  id: "buckling", name: "Euler buckling load", field: "failure", expr: "P_cr = π²EI / (K·L)²",
  meaning: "A slender column fails by instability, not by strength — it suddenly bends sideways at a load far below the crushing load.",
  vars: "P_cr → critical buckling load [N]\nE → Young's modulus [Pa]\nI → minimum second moment of area [m⁴]\nL → column length [m]\nK → effective length factor [–] (pinned 1.0, fixed-free 2.0, fixed-fixed 0.5)",
  assumptions: "Slender column, perfectly straight, centric load, elastic material. Check slenderness λ = KL/r > ~100 for validity.",
  application: "Columns, struts, hydraulic rams, truss compression members, thin shells, stiffened panels.",
  example: "Pinned 2 m steel column, I = 4×10⁻⁶ m⁴: P_cr = π²×200e9×4e-6/4 = 197 kN. Fixing both ends (K = 0.5) quadruples it to 790 kN.",
  related: ["second-moment", "normal-stress", "safety-factor"],
  intuition: "Buckling depends on E and geometry, not on strength — a high-strength steel column buckles at exactly the same load as a mild steel one of the same shape."
},
{
  id: "fatigue", name: "Fatigue and the S–N curve", field: "failure", expr: "σ_a = (σ_max − σ_min)/2",
  exprFull: "R = σ_min/σ_max ; Goodman: σ_a/σ_e + σ_m/σ_u = 1",
  meaning: "Repeated loading causes crack initiation and growth at stresses far below the static strength. The stress amplitude and the mean stress control the life.",
  vars: "σ_a → stress amplitude [Pa]\nσ_m → mean stress [Pa]\nR → stress ratio [–]\nσ_e → endurance limit [Pa]\nσ_u → ultimate strength [Pa]\nN → cycles to failure [–]",
  assumptions: "Constant amplitude loading; σ_e ≈ 0.5σ_u for steels below ~1400 MPa; modified by surface finish, size, temperature and K_f.",
  application: "Shafts, gears, springs, welded structures, aircraft, crankshafts — roughly 80% of mechanical failures.",
  example: "A rotating shaft: bending stress reverses fully each revolution, R = −1. At σ_a = 180 MPa with σ_e = 200 MPa the life is short; a K_t = 2 shoulder cuts the effective endurance limit nearly in half.",
  related: ["stress-concentration", "safety-factor", "fracture"],
  intuition: "Fatigue is not about the peak stress — it is about the range. A statically safe shaft can fail in months under a small reversing load."
},
{
  id: "fracture", name: "Fracture mechanics (crack)", field: "failure", expr: "K_I = Y · σ · √(π·a)",
  meaning: "A crack amplifies the stress at its tip. Failure occurs when the stress intensity reaches the material's fracture toughness.",
  vars: "K_I → stress intensity factor [MPa·√m]\nY → geometry factor [–]\nσ → applied stress [Pa]\na → crack half-length [m]\nK_Ic → fracture toughness [MPa·√m]",
  assumptions: "Linear elastic fracture mechanics (LEFM), small-scale yielding at the tip, known crack size and shape.",
  application: "Damage-tolerant design, pressure vessels, aircraft inspection intervals, weld assessment, fitness-for-service.",
  example: "Steel with K_Ic = 60 MPa√m, Y = 1.12, σ = 200 MPa ⇒ critical crack a = (60/(1.12×200))²/π = 22.8 mm. Inspection must find cracks well before this size.",
  related: ["fatigue", "stress-concentration", "creep"],
  intuition: "High-strength steels are often less tough. Raising σ_y without checking K_Ic can make a component far more dangerous."
},
{
  id: "creep", name: "Creep", field: "failure", expr: "ε̇ = A · σ^n · exp(−Q/RT)",
  meaning: "Under sustained load at high temperature a material deforms continuously with time, even below the yield stress.",
  vars: "ε̇ → creep strain rate [1/s]\nσ → applied stress [Pa]\nT → absolute temperature [K]\nQ → activation energy [J/mol]\nn → stress exponent [–]",
  assumptions: "Constant load and temperature; significant above ≈ 0.4 T_melt (in Kelvin).",
  application: "Turbine blades, boilers, steam pipes, exhaust manifolds, polymer components under sustained load.",
  example: "Austenitic stainless steel at 650 °C (≈ 0.54 T_melt) creeps appreciably; the same steel at 200 °C does not. Design life is set by the rupture time, not by yield.",
  related: ["fatigue", "yielding", "hooke"],
  intuition: "Temperature is a load. Above roughly 40% of the melting point (in Kelvin) time becomes a design variable."
},
{
  id: "wear", name: "Archard wear", field: "failure", expr: "V = k · (F·s) / H",
  meaning: "Wear volume grows with the load and the sliding distance and falls with hardness. It is a surface process, not a bulk one.",
  vars: "V → wear volume [m³]\nk → dimensionless wear coefficient [–]\nF → normal load [N]\ns → sliding distance [m]\nH → hardness [Pa]",
  assumptions: "Adhesive wear regime, dry or boundary lubrication, constant coefficient.",
  application: "Bearings, gears, seals, pistons, cutting tools, tribological material selection.",
  example: "Doubling the load doubles the wear volume; halving the clearance pressure halves it. Lubrication changes k by orders of magnitude.",
  related: ["friction", "fatigue", "fatigue"],
  intuition: "Wear is usually controlled by contact pressure and lubrication, not by the bulk strength of the material."
},

/* ══════════════ FLUID MECHANICS ══════════════ */
{
  id: "density", name: "Density and specific weight", field: "fluids", expr: "ρ = m / V , γ = ρ g",
  meaning: "Mass per unit volume, and its weight equivalent. The starting point of every fluid calculation.",
  vars: "ρ → density [kg/m³]\nm → mass [kg]\nV → volume [m³]\nγ → specific weight [N/m³]",
  assumptions: "Homogeneous fluid; for gases ρ varies with p and T (ideal gas ρ = p/RT).",
  application: "Buoyancy, hydraulic fluid selection, pump sizing, gas metering, CFD setup.",
  example: "Water ρ = 1000 kg/m³; hydraulic oil ≈ 870 kg/m³; air at 20 °C ≈ 1.2 kg/m³. Air is about 800 times lighter — that is why gas dynamics needs compressibility.",
  related: ["hydrostatic-pressure", "reynolds", "ideal-gas"],
  intuition: "The huge density gap between liquids and gases is the reason the two branches of fluid mechanics behave so differently."
},
{
  id: "hydrostatic-pressure", name: "Hydrostatic pressure", field: "fluids", expr: "p = ρ · g · h",
  meaning: "Pressure in a static fluid grows linearly with depth because it supports the weight of the fluid above.",
  vars: "p → gauge pressure [Pa]\nρ → density [kg/m³]\ng → 9.81 [m/s²]\nh → depth below the free surface [m]",
  assumptions: "Incompressible fluid at rest; add atmospheric pressure for absolute values.",
  application: "Tanks, dams, hydraulic presses, manometers, submarine hulls, level measurement.",
  example: "10 m of water: p = 1000 × 9.81 × 10 = 98.1 kPa ≈ 0.97 bar. Every 10 m of water adds about 1 bar — a rule worth memorising.",
  related: ["density", "bernoulli", "pressure-vessel"],
  intuition: "Pressure at a point acts equally in all directions (Pascal) — that is the principle of the hydraulic press."
},
{
  id: "pascal", name: "Pascal's law / hydraulic advantage", field: "fluids", expr: "F₂ = F₁ · (A₂/A₁)",
  meaning: "Pressure applied to a confined fluid transmits undiminished in all directions, so a small force on a small piston creates a large force on a large one.",
  vars: "F → force [N]\nA → piston area [m²]\np → pressure [Pa]",
  assumptions: "Incompressible fluid, no friction or leakage, static or quasi-static.",
  application: "Hydraulic presses, jacks, brakes, clamps, excavator cylinders.",
  example: "A 10:1 area ratio multiplies force tenfold but divides displacement tenfold — energy is conserved, only force is transformed.",
  related: ["hydrostatic-pressure", "flow-rate", "power"],
  intuition: "Hydraulics is a force transformer, never an energy multiplier."
},
{
  id: "viscosity", name: "Newton's law of viscosity", field: "fluids", expr: "τ = μ · (du/dy)",
  meaning: "Shear stress in a Newtonian fluid is proportional to the velocity gradient. Viscosity is internal friction between fluid layers.",
  vars: "τ → shear stress [Pa]\nμ → dynamic viscosity [Pa·s]\ndu/dy → velocity gradient [1/s]\nν = μ/ρ → kinematic viscosity [m²/s]",
  assumptions: "Newtonian fluid (constant μ), laminar shear.",
  application: "Lubrication, bearing design, pumping power, paint and polymer processing, oil grade selection.",
  example: "SAE 30 oil at 20 °C has μ ≈ 0.29 Pa·s — 290 times water. Shear between a shaft and its bearing at 10⁴ s⁻¹ gives τ ≈ 2900 Pa.",
  related: ["reynolds", "head-loss", "friction"],
  intuition: "Viscosity falls sharply with temperature for liquids and rises slightly for gases — a cold start is a lubrication problem."
},
{
  id: "flow-rate", name: "Volumetric flow rate", field: "fluids", expr: "Q = A · v",
  meaning: "The volume passing a section per unit time. With constant Q, velocity is inversely proportional to area.",
  vars: "Q → volumetric flow rate [m³/s]\nA → cross-sectional area [m²]\nv → mean velocity [m/s]\nṁ = ρQ → mass flow rate [kg/s]",
  assumptions: "One-dimensional mean velocity across the section; incompressible flow.",
  application: "Pipe sizing, metering, pump and fan selection, cooling circuit design.",
  example: "50 m³/h in a DN50 pipe (A = 1.963×10⁻³ m²): Q = 0.0139 m³/s, v = 7.1 m/s — above the usual 1–3 m/s water guideline, so the pipe is undersized.",
  related: ["continuity", "bernoulli", "head-loss"],
  intuition: "Squeeze the area and the fluid speeds up — that is continuity, and it is where Bernoulli starts."
},
{
  id: "continuity", name: "Continuity equation", field: "fluids", expr: "ρ₁A₁v₁ = ρ₂A₂v₂",
  exprFull: "incompressible: A₁v₁ = A₂v₂",
  meaning: "Mass is neither created nor destroyed: what enters a control volume must leave it.",
  vars: "ρ → density [kg/m³]\nA → area [m²]\nv → velocity [m/s]",
  assumptions: "Steady flow, one inlet and one outlet, uniform properties across each section.",
  application: "Nozzles, diffusers, duct sizing, venturi meters, CFD boundary conditions.",
  example: "A hose nozzle reducing area 9:1 raises the velocity ninefold — and by Bernoulli drops the static pressure substantially.",
  related: ["flow-rate", "bernoulli", "mach"],
  intuition: "In a nozzle the gas also loses density, so velocity rises even faster than the area ratio alone suggests."
},
{
  id: "bernoulli", name: "Bernoulli equation", field: "fluids", expr: "p/ρg + v²/2g + z = const",
  exprFull: "with losses and a pump: p₁/ρg + v₁²/2g + z₁ + h_pump = p₂/ρg + v₂²/2g + z₂ + h_loss",
  meaning: "Energy conservation along a streamline, expressed as head: pressure head, velocity head and elevation head trade with each other.",
  vars: "p → static pressure [Pa]\nρ → density [kg/m³]\nv → velocity [m/s]\nz → elevation [m]\nh → head [m]\ng → 9.81 [m/s²]",
  assumptions: "Steady, incompressible, inviscid flow along a streamline, no shaft work or heat transfer (add h_pump and h_loss when present).",
  application: "Venturi and orifice meters, pitot tubes, carburettors, pump inlet analysis, siphons, aerofoils.",
  example: "Water accelerating from 1 to 4 m/s: Δp = ½ρ(v₂²−v₁²) = ½×1000×15 = 7.5 kPa of static pressure converted into velocity head.",
  related: ["continuity", "head-loss", "venturi", "npsh"],
  intuition: "Fast fluid is low-pressure fluid. That single sentence explains lift, venturi meters, cavitation and carburettors."
},
{
  id: "reynolds", name: "Reynolds number", field: "fluids", expr: "Re = ρ v D / μ",
  meaning: "The ratio of inertial to viscous forces. It decides whether the flow is laminar or turbulent and which friction correlation applies.",
  vars: "Re → Reynolds number [–]\nρ → density [kg/m³]\nv → mean velocity [m/s]\nD → characteristic (hydraulic) diameter [m]\nμ → dynamic viscosity [Pa·s]",
  assumptions: "Newtonian fluid; pipe thresholds Re < 2300 laminar, 2300–4000 transitional, > 4000 turbulent.",
  application: "Pipe design, heat exchangers, model testing and similarity, mixing, drag prediction.",
  example: "Water at 2 m/s in a 25 mm pipe: Re = 1000×2×0.025/0.001 = 50,000 ⇒ fully turbulent. The same oil (μ = 0.1 Pa·s) gives Re = 500 ⇒ laminar, and a completely different pressure drop.",
  related: ["viscosity", "head-loss", "laminar-flow"],
  intuition: "Re is the only thing that matters for dynamically similar flows — that is why wind tunnels use scaled models."
},
{
  id: "laminar-flow", name: "Laminar pipe flow (Hagen–Poiseuille)", field: "fluids", expr: "Δp = 32 μ L v / D²",
  meaning: "In laminar flow the pressure drop is proportional to velocity and viscosity, with a parabolic velocity profile and f = 64/Re.",
  vars: "Δp → pressure drop [Pa]\nμ → viscosity [Pa·s]\nL → length [m]\nv → mean velocity [m/s]\nD → diameter [m]",
  assumptions: "Re < 2300, Newtonian, fully developed, straight circular pipe.",
  application: "Lubrication circuits, microfluidics, hydraulic servo lines, viscosity measurement.",
  example: "Halving the diameter multiplies the pressure drop by four at the same velocity — small bore lines are expensive in laminar flow.",
  related: ["reynolds", "head-loss", "viscosity"],
  intuition: "Laminar: Δp ∝ v. Turbulent: Δp ∝ v². That change of exponent is why pumping power rises so fast with flow rate."
},
{
  id: "head-loss", name: "Darcy–Weisbach head loss", field: "fluids", expr: "h_f = f · (L/D) · v²/(2g)",
  exprFull: "minor losses: h_m = K · v²/(2g)",
  meaning: "Friction converts mechanical energy into heat. The loss scales with the square of velocity in turbulent flow.",
  vars: "h_f → head loss [m]\nf → Darcy friction factor [–]\nL → pipe length [m]\nD → diameter [m]\nv → velocity [m/s]\nK → minor loss coefficient [–]",
  assumptions: "Fully developed turbulent or laminar flow; f from the Moody chart or Colebrook equation.",
  application: "Pipe network design, pump sizing, HVAC ducting, fire mains, hydraulic circuits.",
  example: "f = 0.02, L/D = 200, v = 3 m/s: h_f = 0.02×200×9/(2×9.81) = 1.83 m. Doubling the velocity quadruples this to 7.3 m.",
  related: ["reynolds", "bernoulli", "pump-head"],
  intuition: "Every fitting, bend and valve has a K. In short, fitting-dense circuits the minor losses often exceed the straight-pipe friction."
},
{
  id: "pump-head", name: "Pump head and hydraulic power", field: "fluids", expr: "P_h = ρ g Q H",
  exprFull: "P_shaft = ρ g Q H / η",
  meaning: "A pump adds head (energy per unit weight). Hydraulic power depends on flow, head and density; shaft power adds the efficiency.",
  vars: "P_h → hydraulic power [W]\nρ → density [kg/m³]\nQ → flow rate [m³/s]\nH → total head [m]\nη → pump efficiency [–]",
  assumptions: "Incompressible fluid; η typically 0.5–0.85 for centrifugal pumps at the best efficiency point.",
  application: "Pump selection, water supply, cooling circuits, hydraulic power packs, irrigation.",
  example: "50 m³/h (0.0139 m³/s) against 30 m head: P_h = 1000×9.81×0.0139×30 = 4.09 kW; at η = 0.65 the motor needs 6.3 kW.",
  related: ["bernoulli", "head-loss", "npsh"],
  intuition: "Head is not pressure: head is energy per unit weight and is independent of the fluid, while pressure depends on density."
},
{
  id: "npsh", name: "NPSH and cavitation", field: "fluids", expr: "NPSH_a > NPSH_r",
  exprFull: "NPSH_a = (p_s − p_v)/(ρg) + z_s − h_fs",
  meaning: "Cavitation starts when the local pressure falls to the vapour pressure. Available NPSH (a property of the installation) must exceed the NPSH required by the pump.",
  vars: "NPSH_a → available net positive suction head [m]\nNPSH_r → required NPSH [m]\np_s → absolute pressure at the source [Pa]\np_v → vapour pressure [Pa]\nz_s → static suction head [m]\nh_fs → suction line losses [m]",
  assumptions: "Steady flow, known vapour pressure at the pumping temperature.",
  application: "Pump installation design, boiler feed pumps, condensate extraction, suction lift limits.",
  example: "Suction lift of 3 m with 0.5 m of friction at 60 °C (p_v = 19.9 kPa): NPSH_a = (101.3−19.9)/(9.81) − 3 − 0.5 = 4.8 m. A pump needing 5 m will cavitate — hot water is the classic trap.",
  related: ["bernoulli", "pump-head", "venturi"],
  intuition: "Cavitation is a pressure problem, not a temperature problem — and heating the liquid makes it dramatically worse."
},
{
  id: "momentum-fluid", name: "Linear momentum equation (fluids)", field: "fluids", expr: "ΣF = ṁ (v_out − v_in)",
  meaning: "The force a flowing fluid exerts on a bend, nozzle or blade equals the rate of change of its momentum.",
  vars: "ΣF → resultant force [N]\nṁ → mass flow rate [kg/s]\nv → velocity vector [m/s]",
  assumptions: "Steady flow, uniform velocity at inlet and outlet, include pressure forces on the control surface.",
  application: "Pipe bends and thrust blocks, jet impingement, turbine and propeller blades, rocket thrust.",
  example: "Water at 20 kg/s turned through 90° at 10 m/s: F = ṁv√2 = 283 N on the bend — enough to move an unanchored pipe.",
  related: ["continuity", "bernoulli", "newton2"],
  intuition: "Every pipe bend wants to straighten itself out. That is thrust, and it must be restrained."
},
{
  id: "venturi", name: "Venturi meter", field: "fluids", expr: "Q = C_d A₂ √(2Δp/ρ) / √(1 − (A₂/A₁)²)",
  meaning: "A contraction raises velocity and drops pressure. Measuring that pressure difference gives the flow rate.",
  vars: "Q → flow rate [m³/s]\nC_d → discharge coefficient [–] (≈ 0.98 for a venturi)\nΔp → differential pressure [Pa]\nA₁, A₂ → upstream and throat areas [m²]",
  assumptions: "Incompressible, steady flow, negligible losses between the two taps.",
  application: "Flow measurement, carburettors, aspirators, ejectors, atomisers.",
  example: "With A₂/A₁ = 0.5 and Δp = 20 kPa for water: v₂ = √(2×20000/1000)/√(1−0.25) = 7.3 m/s.",
  related: ["bernoulli", "continuity", "npsh"],
  intuition: "The throat is the lowest-pressure point in the meter — and the first place cavitation appears."
},
{
  id: "pressure-vessel", name: "Thin-walled pressure vessel", field: "som", expr: "σ_hoop = p·r / t",
  exprFull: "σ_axial = p·r/(2t) ; validity r/t > 10",
  meaning: "A pressurised cylinder carries twice as much stress around its circumference as along its axis — which is why vessels split lengthways.",
  vars: "σ_hoop → hoop (circumferential) stress [Pa]\nσ_axial → longitudinal stress [Pa]\np → internal gauge pressure [Pa]\nr → internal radius [m]\nt → wall thickness [m]",
  assumptions: "Thin wall (r/t > 10), uniform stress through the thickness, away from ends and nozzles.",
  application: "Boilers, gas cylinders, hydraulic accumulators, pipelines, aerospace tanks.",
  example: "p = 10 MPa, r = 0.25 m, t = 8 mm: σ_hoop = 312.5 MPa, σ_axial = 156 MPa. With σ_y = 355 MPa the margin on hoop stress is small — thickness or material must change.",
  related: ["normal-stress", "vonmises", "safety-factor"],
  intuition: "Hoop stress governs. That is why a longitudinal weld is the critical joint in any pressure vessel."
},
{
  id: "ideal-gas", name: "Ideal gas law", field: "fluids", expr: "p = ρ R T",
  meaning: "Links pressure, density and temperature for a gas. It is what makes compressible flow different from liquid flow.",
  vars: "p → absolute pressure [Pa]\nρ → density [kg/m³]\nR → specific gas constant [J/(kg·K)] (air 287)\nT → absolute temperature [K]",
  assumptions: "Ideal gas (good for air below ~10 bar and well away from the critical point).",
  application: "Compressors, pneumatic systems, combustion, gas metering, atmosphere modelling.",
  example: "Compressing air isothermally to 8 bar absolute multiplies the density by 8; adiabatic compression also raises the temperature, so density rises a little less.",
  related: ["density", "mach", "isentropic"],
  intuition: "In liquids, density is fixed. In gases, density responds to everything — that is the whole subject of compressible flow."
},
{
  id: "mach", name: "Mach number and speed of sound", field: "fluids", expr: "M = v / a",
  exprFull: "a = √(γ R T)",
  meaning: "The ratio of flow speed to the speed at which pressure information travels. Above M = 1 the upstream flow cannot be warned of the body's approach.",
  vars: "M → Mach number [–]\nv → flow velocity [m/s]\na → speed of sound [m/s]\nγ → specific heat ratio [–] (air 1.4)\nR → gas constant [J/(kg·K)]\nT → static temperature [K]",
  assumptions: "Ideal gas; a = 340 m/s in air at 15 °C.",
  application: "Nozzles, diffusers, compressors, turbines, aircraft, gas pipelines, safety relief valves.",
  example: "Air at 288 K: a = √(1.4×287×288) = 340 m/s. M = 0.3 (102 m/s) is the usual threshold below which air may be treated as incompressible.",
  related: ["ideal-gas", "isentropic", "shock"],
  intuition: "M = 0.3 is not 'fast' in everyday terms — it is where density changes stop being negligible."
},
{
  id: "isentropic", name: "Isentropic (stagnation) relations", field: "fluids", expr: "T₀/T = 1 + ((γ−1)/2) M²",
  exprFull: "p₀/p = (T₀/T)^{γ/(γ−1)} ; ρ₀/ρ = (T₀/T)^{1/(γ−1)}",
  meaning: "Stagnation properties are what the fluid would reach if brought to rest isentropically. They are the reference state for all compressible calculations.",
  vars: "T₀, p₀, ρ₀ → stagnation temperature, pressure, density [K, Pa, kg/m³]\nT, p, ρ → static values\nγ → 1.4 for air [–]\nM → Mach number [–]",
  assumptions: "Adiabatic, reversible (isentropic), ideal gas, calorically perfect.",
  application: "Nozzle and diffuser design, compressors, turbines, pitot-static measurement, wind tunnels.",
  example: "At M = 2, T₀/T = 1.8 ⇒ the static temperature is only 55% of the stagnation value. A high-speed flow is much colder than the gas in the reservoir feeding it.",
  related: ["mach", "nozzle-choked", "shock"],
  intuition: "Speed comes from pressure and temperature. In a nozzle, accelerating the gas necessarily cools it."
},
{
  id: "nozzle-choked", name: "Choked flow", field: "fluids", expr: "p*/p₀ = (2/(γ+1))^{γ/(γ−1)}",
  meaning: "At M = 1 in the throat the mass flow rate reaches its maximum. Lowering the downstream pressure further cannot increase it.",
  vars: "p* → critical (throat) pressure [Pa]\np₀ → stagnation pressure [Pa]\nγ → specific heat ratio [–] (0.528 for air)",
  assumptions: "Isentropic nozzle, ideal gas, converging or converging–diverging geometry.",
  application: "Relief valves, rocket nozzles, gas metering, ejectors, supersonic wind tunnels, turbine nozzles.",
  example: "Air from 10 bar absolute: choking when the back pressure drops below 5.28 bar. Further reduction increases exit velocity but not mass flow.",
  related: ["isentropic", "mach", "shock"],
  intuition: "Choking is a hard ceiling on mass flow. It is why a sonic nozzle is used as a flow standard."
},
{
  id: "shock", name: "Normal shock relations", field: "fluids", expr: "M₂² = [1 + ((γ−1)/2)M₁²] / [γM₁² − (γ−1)/2]",
  meaning: "A shock converts supersonic flow to subsonic almost instantly, raising pressure and temperature and irreversibly losing total pressure.",
  vars: "M₁, M₂ → Mach numbers before and after [–]\np₂/p₁ → static pressure ratio [–]\nT₂/T₁ → temperature ratio [–]\np₀₂/p₀₁ → total pressure recovery [–]",
  assumptions: "Adiabatic but irreversible, infinitesimally thin, ideal gas, one-dimensional.",
  application: "Supersonic inlets, jet engine intakes, supersonic wind tunnels, relief device design, detonation analysis.",
  example: "M₁ = 2 normal shock: M₂ = 0.577, p₂/p₁ = 4.5, T₂/T₁ = 1.69, total pressure recovery only 0.72 — a 28% permanent loss of usable pressure.",
  related: ["mach", "isentropic", "nozzle-choked"],
  intuition: "A shock is where kinetic energy is destroyed into heat. Designers try to replace one strong shock with several weak oblique ones."
},
{
  id: "bulk-modulus", name: "Bulk modulus / compressibility", field: "fluids", expr: "K = −V (dp/dV)",
  meaning: "How much pressure is needed to change a fluid's volume. It is the fluid equivalent of Young's modulus and it governs water hammer.",
  vars: "K → bulk modulus [Pa]\ndp → pressure change [Pa]\ndV/V → relative volume change [–]",
  assumptions: "Small changes; temperature constant unless stated.",
  application: "Hydraulic stiffness, water hammer, accumulator sizing, precision hydraulics, cavitation onset.",
  example: "Water K ≈ 2.2 GPa: a 1% volume reduction needs 22 MPa. Entrained air drops K by orders of magnitude, which is why spongy hydraulics always means air.",
  related: ["hydrostatic-pressure", "hooke", "density"],
  intuition: "Hydraulic systems feel rigid because the fluid is stiff — until air gets in."
}
];

/* index helpers */
const FORMULA_BY_ID = Object.fromEntries(FORMULAS.map(f => [f.id, f]));
const FIELD_LABELS = {
  statics: "Statics", kinematics: "Kinematics", kinetics: "Kinetics",
  som: "Strength of Materials", elasticity: "Elasticity", plasticity: "Plasticity",
  failure: "Failure Theory", fluids: "Fluid Mechanics"
};
