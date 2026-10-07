/* ═══════════════════════════════════════════════════════════
   data/questions.js — question engine
   • makeQuestion()      : canonical question object
   • QUESTION_BANK       : curated static questions (all 12 types)
   • GEN_TEMPLATES       : parameterised generators (infinite numeric MCQ)
   • questionFor()       : resolves a question for any concept/level,
                           with an automatic pedagogical fallback
   ═══════════════════════════════════════════════════════════ */
"use strict";

const ALL_LEVELS = [1, 2, 3, 4];

function makeQuestion(o) {
  const q = Object.assign({
    id: "q_" + Math.random().toString(36).slice(2, 9),
    conceptId: "", level: 1, type: "mcq",
    prompt: "", context: "",
    choices: null, answer: null,
    unit: "", tol: 0.02, min: null, max: null,
    pairs: null, correctOrder: null, items: null,
    explanation: "", wrongWhy: "", misconception: "",
    reasoning: [], similar: "", keywords: [], english: false
  }, o);
  if (!q.explanation && q.type === "mcq" && q.choices && typeof q.answer === "number") q.explanation = q.choices[q.answer];
  return q;
}

/* terse authoring: [type, prompt, payload, answer, why, extra] */
function Q(conceptId, level, spec) {
  spec = spec.slice();
  /* tolerate the compact numeric form ["num", {ans,unit,tol}, null, "why"]
     by normalising it to ["num", {payload}, null, answer, "why"] */
  if (spec[0] === "num" && spec[1] && typeof spec[1] === "object" && spec[1].ans !== undefined) {
    spec = ["num", null, spec[1], null, spec[3] || spec[2] || ""];
  }
  /* the "complete the equation" type has two authoring shapes:
     compact  ["fill", [parts], [answers], "why"]
     with text ["fill", "prompt", [parts], [answers], "why"]
     both are normalised to ["fill", prompt, parts, answers, why] */
  if (spec[0] === "fill") {
    if (Array.isArray(spec[1]) && Array.isArray(spec[2])) spec = ["fill", null, spec[1], spec[2], spec[3] || ""];
    else if (typeof spec[1] === "string" && Array.isArray(spec[2]) && Array.isArray(spec[3])) spec = ["fill", spec[1], spec[2], spec[3], spec[4] || ""];
  }
  const [type, prompt, a, b, why, extra] = spec;
  const o = Object.assign({ conceptId, level, type, prompt, explanation: why || "" }, extra || {});
  switch (type) {
    case "mcq": o.choices = a; o.answer = b; break;
    case "tf": o.choices = ["True", "False"]; o.answer = a ? 0 : 1; break;
    case "num": o.unit = a.unit; o.tol = a.tol || 0.02; o.answer = a.ans; o.min = a.min; o.max = a.max; o.answerText = a.text; break;
    case "match": o.pairs = a; o.answer = a.map(() => null); break;
    case "order": o.items = a; o.correctOrder = b; break;
    case "select": o.choices = a; o.answer = b; break;
    case "identify": o.choices = a; o.answer = b; break;
    case "predict": o.choices = a; o.answer = b; break;
    case "fill": o.items = a; o.answer = b; break;
    case "explain": o.keywords = a || []; break;
    case "numeric": o.unit = a.unit; o.answer = a.ans; o.tol = a.tol || 0.02; break;
  }
  return makeQuestion(o);
}

/* ══════════════════════════════════════════════════════════
   CURATED STATIC BANK  (type, prompt, payload, answer, why)
   ══════════════════════════════════════════════════════════ */
const RAW_BANK = {
/* ─────────── STATICS ─────────── */
"force": [
 [2, ["fill", "Complete Newton's second law.", ["F = ", "_", " · ", "_"], ["m", "a"],
   "Force equals mass times acceleration. Mass resists the change of motion; the acceleration measures it."]],
 [1, ["mcq", "Which statement best describes a force in engineering mechanics?",
   ["A scalar quantity describing how heavy a body is", "A vector describing the mechanical interaction between two bodies", "The energy stored in a deformed component", "The resistance of a material to deformation"], 1,
   "A force is fully defined only by magnitude, direction, point of application and line of action — it is a vector interaction, not a scalar property."]],
 [1, ["tf", "Two equal and opposite forces acting on the same body cancel, producing no acceleration.", true,
   "ΣF = 0, so by Newton's second law the acceleration is zero. They may still produce deformation or a couple if their lines of action differ."]],
 [1, ["match", "Match each quantity with its SI unit.",
   [["Force", "newton (N)"], ["Moment", "newton-metre (N·m)"], ["Stress", "pascal (Pa)"], ["Mass", "kilogram (kg)"]], null,
   "Units are part of the answer in engineering: N·m as a moment is a vector quantity, N·m as work is a scalar joule."]],
 [3, ["predict", "A bracket carries a 2 kN load. The load is moved further from the wall while keeping the same magnitude. What happens to the reaction moment at the wall?",
   ["It stays the same — the force is unchanged", "It increases, because the lever arm increases", "It decreases, because the load is further from the support", "It becomes zero"], 1,
   "M = F·d. The force is unchanged but the perpendicular distance grows, so the fixing moment grows proportionally."]],
 [4, ["mcq", "A machine frame is vibrating and a bolt keeps failing. The static calculation shows a safety factor of 4. What is the most likely explanation?",
   ["The safety factor calculation used the wrong area", "The failure is fatigue driven by the dynamic load, not static overload", "The material supplied was weaker than specified", "The bolt was not tightened enough"], 1,
   "A high static safety factor with a low-cycle dynamic load points to fatigue. Static strength says nothing about life under repeated loading."]]
],
"force-vectors": [
 [1, ["mcq", "Two forces of 100 N each act on a point at 120° to each other. What is the magnitude of the resultant?",
   ["200 N", "100 N", "141 N", "0 N"], 1,
   "By the parallelogram law the resultant is 2·100·cos(60°) = 100 N. Vectors do not add arithmetically."]],
 [2, ["mcq", "Forces must be treated as vectors because…",
   ["they always act vertically", "their direction affects the result as much as their magnitude", "they are measured in newtons", "they can be added algebraically"], 1,
   "Direction matters: two equal forces at 180° cancel completely."]],
 [3, ["tf", "A force can be moved anywhere along its line of action without changing its effect on a rigid body.", true,
   "This is the principle of transmissibility — valid for rigid bodies, but not for deformable bodies where the point of application changes the local stress."]]
],
"resultant": [
 [1, ["mcq", "The resultant of a force system is…",
   ["the largest force in the system", "the single force (plus moment) that produces the same external effect", "the sum of the magnitudes of all forces", "the average of all forces"], 1,
   "A general force system reduces to a force and a moment; only in special cases does a single force suffice."]],
 [2, ["num", { ans: 1000, unit: "N", tol: 0.02 }, null, "ΣFx = 800 N, ΣFy = −600 N ⇒ R = √(800² + 600²) = 1000 N — a classic 3-4-5 triangle."]],
 [3, ["mcq", "A force system has a non-zero resultant force and a non-zero resultant moment that are perpendicular. It can be reduced to…",
   ["a single force", "a single couple", "nothing — it is already minimal", "a force plus a parallel moment"], 0,
   "When R ⊥ M the system reduces to a single force whose line of action is offset by d = M/R."]]
],
"components": [
 [1, ["mcq", "A 500 N force acts at 30° above the horizontal. What is its horizontal component?",
   ["250 N", "433 N", "500 N", "866 N"], 1,
   "Fx = F cos θ = 500 × cos 30° = 433 N. The cosine goes with the adjacent side."]],
 [2, ["predict", "On an inclined plane, as the slope angle increases from 0° towards 90°, what happens to the component of weight parallel to the slope?",
   ["It decreases to zero", "It stays constant", "It increases towards the full weight", "It reverses direction"], 2,
   "The parallel component is mg sin θ, which grows from 0 at θ = 0 to mg at θ = 90° — this is what eventually overcomes friction."]],
 [2, ["tf", "Resolving a force into components changes the physical effect of the force on the body.", false,
   "Resolution is only a mathematical decomposition. The components together are exactly equivalent to the original force."]]
],
"moment": [
 [1, ["mcq", "What is a moment?",
   ["The product of mass and acceleration", "The rotational effect of a force about a point or axis", "The internal resistance of a section", "The rate of change of force"], 1,
   "A moment measures the tendency of a force to rotate a body about a point or axis."]],
 [1, ["predict", "A force is applied to a spanner. The force is rotated so that it points along the handle instead of perpendicular to it. What happens to the moment?",
   ["It doubles", "It stays the same", "It becomes zero", "It reverses sign"], 2,
   "M = F·r·sin θ. When the force is aligned with the arm, θ = 0 and the moment vanishes — the lever arm is zero."]],
 [2, ["num", { ans: 50, unit: "N·m" }, null, "M = F·d = 100 N × 0.5 m = 50 N·m."]],
 [3, ["mcq", "Why are door handles placed as far as possible from the hinges?",
   ["To reduce the force on the hinges", "To maximise the lever arm, so a small force produces a large moment", "To reduce the door's weight", "To keep the handle away from the frame"], 1,
   "The required opening moment is fixed; increasing d reduces the force the user must supply."]],
 [3, ["order", "Put the steps for calculating the moment of a force about a point in the correct order.",
   ["Identify the point about which the moment is taken", "Draw the line of action of the force", "Measure the perpendicular distance d from the point to that line", "Compute M = F·d and assign a sign from the rotation sense"], [0, 1, 2, 3],
   "The lever arm is defined by the line of action, not by the distance to the point of application — this is the step most often skipped."]],
 [4, ["mcq", "A 3 t load is lifted by a crane with a 12 m horizontal boom. The counterweight is 6 m behind the pivot. Ignoring self-weight, what minimum counterweight mass prevents tipping?",
   ["3 t", "6 t", "12 t", "1.5 t"], 1,
   "Moment balance about the pivot: 3 × 12 = W × 6 ⇒ W = 6 t. Real cranes add the boom weight and apply a stability factor."]]
],
"torque": [
 [2, ["num", { ans: 31.8, unit: "N·m", tol: 0.02 }, null, "ω = 1500 × 2π/60 = 157.1 rad/s; T = P/ω = 5000/157.1 = 31.8 N·m."]],
 [3, ["predict", "A gearbox reduces speed by a factor of 5 while transmitting the same power (efficiency 100%). What happens to the output torque?",
   ["It is divided by 5", "It stays the same", "It is multiplied by 5", "It becomes zero"], 2,
   "P = Tω. If ω falls by 5 at constant power, T must rise by 5 — the whole purpose of a gearbox."]],
 [3, ["mcq", "Two shafts transmit the same power, one at 3000 rpm and one at 300 rpm. Which needs the larger diameter?",
   ["The 3000 rpm shaft", "The 300 rpm shaft", "Both are the same", "It depends only on the material"], 1,
   "The slow shaft carries ten times the torque, and since τ ∝ T/d³ it needs a substantially larger diameter."]]
],
"couples": [
 [1, ["mcq", "A couple consists of…",
   ["two equal forces acting in the same direction", "two equal, opposite, non-collinear parallel forces", "a single force and a moment", "any two forces that cancel"], 1,
   "The defining feature is a non-zero moment with zero resultant force."]],
 [1, ["tf", "The moment of a couple depends on the point about which it is calculated.", false,
   "A couple is a free vector — its moment is the same about every point, which is what makes it so useful."]],
 [3, ["mcq", "A motor is bolted to a frame and delivers torque to a pump. What does the frame experience?",
   ["Nothing — the torque stays inside the motor", "A reaction torque equal and opposite to the shaft torque", "Only the weight of the motor", "A pure force with no moment"], 1,
   "Newton's third law applies to moments too: the motor housing tries to spin the opposite way, which is why motor mounts must resist torque."]]
],
"fbd": [
 [1, ["mcq", "What is the purpose of a free body diagram?",
   ["To show the deformed shape of the structure", "To isolate a body and show every external force and moment acting on it", "To calculate the material properties", "To draw the internal stress distribution"], 1,
   "The FBD makes the system boundary explicit and lists every interaction — it is the mandatory first step of equilibrium analysis."]],
 [1, ["select", "Which support provides two force reactions and one moment reaction in 2-D?",
   ["Roller", "Pin (hinge)", "Fixed (built-in) support", "Smooth surface"], 2,
   "A fixed support prevents translation in both directions and rotation, so it supplies Fx, Fy and M."]],
 [1, ["identify", "A simply supported beam carries a central point load. Which set of reactions is correct?",
   ["Two vertical reactions only", "Two vertical reactions and one horizontal reaction", "One vertical reaction and one moment", "Two moments"], 0,
   "A pin gives two reactions and a roller one; with no horizontal load, the horizontal reaction is zero, leaving two vertical reactions."]],
 [3, ["order", "Order the correct engineering procedure for a statics problem.",
   ["Define the system and isolate the body", "Draw the free body diagram with all loads and reactions", "Write the equilibrium equations ΣF = 0 and ΣM = 0", "Solve for the unknown reactions", "Check the result for physical sense"], [0, 1, 2, 3, 4],
   "Skipping the FBD or the final sanity check is where most errors survive to the answer."]]
],
"equilibrium": [
 [2, ["fill", "Complete the planar equilibrium conditions.", ["ΣFx = ", "_", ",  ΣFy = ", "_", ",  ΣM = ", "_"], ["0", "0", "0"],
   "A rigid body in static equilibrium has no net force in either direction and no net moment about any point."]],
 [1, ["mcq", "A body is in equilibrium when…",
   ["no forces act on it", "the resultant force and resultant moment are both zero", "it is not moving", "all forces are vertical"], 1,
   "A body can be moving at constant velocity and still be in equilibrium; and a heavily loaded bridge in equilibrium carries large internal forces."]],
 [1, ["tf", "A body at rest must have no forces acting on it.", false,
   "It must have no *unbalanced* force. Forces can be large as long as they cancel."]],
 [2, ["mcq", "How many independent equilibrium equations are available for a planar rigid body?",
   ["2", "3", "4", "6"], 1,
   "ΣFx = 0, ΣFy = 0 and ΣM = 0. In 3-D there are six."]],
 [3, ["mcq", "A beam has four unknown reactions but only three equilibrium equations. The problem is…",
   ["unsolvable", "statically indeterminate — a compatibility condition is needed", "statically determinate", "unstable"], 1,
   "One extra equation must come from deformation compatibility (deflection), which requires material and section properties."]],
 [4, ["mcq", "A tower crane lifts a load beyond its rated radius. Which check governs the risk of overturning?",
   ["The tensile stress in the hoist cable", "The moment balance about the tipping edge", "The shear stress in the slewing ring", "The buckling of the jib"], 1,
   "Overturning is a global equilibrium problem: the restoring moment from the counterweight and self-weight must exceed the load moment, with a stability factor (typically 1.5)."]]
],
"reactions": [
 [2, ["num", { ans: 5, unit: "kN", tol: 0.02 }, null, "ΣM about one support: the symmetric central load splits equally, 10/2 = 5 kN."]],
 [3, ["predict", "A point load on a simply supported beam is moved from mid-span towards the left support. What happens to the left reaction?",
   ["It decreases", "It stays the same", "It increases towards the full load", "It becomes negative"], 2,
   "Taking moments about the right support, R_left = P·(L−x)/L, which approaches P as the load approaches the left support."]],
 [3, ["mcq", "Why does a cantilever connection cost more than a simply supported one for the same load and span?",
   ["It uses more material in the span", "It must resist a moment as well as a shear force", "It has more supports", "It deflects less"], 1,
   "The fixed end carries M = P·L in addition to the shear, requiring a moment-resisting connection and a larger section at the root."]]
],
"distributed-loads": [
 [2, ["num", { ans: 9, unit: "kN", tol: 0.02 }, null, "Triangular load: F_R = ½ × base × height = ½ × 3 m × 6 kN/m = 9 kN."]],
 [2, ["mcq", "Where does the resultant of a triangular distributed load act?",
   ["At mid-length", "At one third from the maximum end", "At the centroid of the load diagram, two thirds from the zero end", "At the point of maximum intensity"], 2,
   "The resultant acts through the centroid of the load diagram; for a triangle that is one third of the base from the wide end."]],
 [3, ["predict", "The water level against a vertical gate is doubled. By what factor does the resultant hydrostatic force increase?",
   ["2", "3", "4", "8"], 2,
   "Pressure grows linearly with depth and so does the loaded length, so F ∝ h². Doubling the depth quadruples the force."]]
],
"centroid": [
 [1, ["mcq", "For a homogeneous beam section, the centroid is the point through which…",
   ["the maximum bending stress acts", "the neutral axis passes", "the shear force is zero", "the support reaction acts"], 1,
   "Bending strain is zero at the centroid, so the neutral axis of a symmetric section passes through it."]],
 [2, ["mcq", "When finding the centroid of a section with a hole, the hole should be treated as…",
   ["ignored", "a negative area", "a positive area added to the total", "replaced by its perimeter"], 1,
   "The composite method subtracts voids as negative areas."]],
 [3, ["tf", "The centroid of a symmetric section always lies on the axis of symmetry.", true,
   "Symmetry guarantees the first moment of area is zero about that axis."]]
],
"friction": [
 [1, ["mcq", "The friction force on a stationary body is…",
   ["always equal to μN", "whatever is needed to prevent sliding, up to a maximum of μN", "always zero", "always equal to the weight"], 1,
   "Friction is a self-adjusting reaction. Only at impending motion does it reach μN."]],
 [2, ["mcq", "A block rests on an incline. It begins to slide when the slope angle reaches 22°. What is the coefficient of static friction?",
   ["0.22", "0.40", "0.36", "0.93"], 1,
   "At the limiting angle, μ_s = tan θ = tan 22° = 0.404. This is the standard experimental method for measuring μ."]],
 [3, ["predict", "The mass of a block on a horizontal surface is doubled. What happens to the maximum friction force before sliding?",
   ["It stays the same", "It halves", "It doubles", "It quadruples"], 2,
   "F_max = μN and N = mg, so doubling the mass doubles the friction ceiling. Note that the slope angle at which sliding begins is unchanged."]],
 [4, ["mcq", "A screw jack holds a load without any holding torque. This is called self-locking and happens when…",
   ["the thread angle is greater than the friction angle", "the thread (lead) angle is less than the friction angle", "the screw is made of hardened steel", "the load is below 1 kN"], 1,
   "Self-locking requires the friction angle to exceed the lead angle; otherwise the load back-drives the screw."]]
],
"trusses": [
 [1, ["mcq", "In an ideal truss, the members carry…",
   ["bending moment only", "axial force only", "shear only", "torsion only"], 1,
   "Pinned joints and joint loading mean members are two-force members, carrying pure tension or compression."]],
 [2, ["mcq", "A planar truss has 8 joints and 3 reaction components. How many members make it statically determinate?",
   ["11", "13", "16", "19"], 1,
   "m + r = 2j ⇒ m = 2(8) − 3 = 13."]],
 [3, ["mcq", "Two non-collinear members meet at an unloaded joint. What can be said about them?",
   ["Both carry the same force", "Both are zero-force members", "One is in tension and one in compression", "Nothing can be concluded"], 1,
   "Equilibrium at the joint cannot be satisfied with two non-collinear forces unless both are zero."]],
 [4, ["mcq", "In a simply supported Pratt roof truss under downward loading, the top chord is primarily in…",
   ["tension", "compression, and must be checked for buckling", "torsion", "pure shear"], 1,
   "Sagging bending puts the top chord in compression — so its capacity is set by buckling, not by crushing strength."]]
],
"frames-machines": [
 [1, ["mcq", "What distinguishes a frame from a truss?",
   ["Frames are always larger", "Frames contain multi-force members that can bend", "Frames have no pins", "Frames carry only axial load"], 1,
   "At least one member is loaded at three or more points, so it experiences bending."]],
 [3, ["order", "Order the steps for analysing a frame or machine.",
   ["Check whether the structure as a whole is statically determinate", "Identify two-force members to reduce unknowns", "Dismember the structure and draw an FBD of each part", "Apply equal and opposite forces at each connection", "Solve member by member, starting from the known loads"], [0, 1, 2, 3, 4],
   "Recognising two-force members first removes unknowns and makes the system solvable."]],
 [3, ["tf", "At a pin connecting two members, the force on one member is equal and opposite to the force on the other.", true,
   "Newton's third law. Getting the direction wrong on one member propagates the error through the whole solution."]]
],

/* ─────────── KINEMATICS ─────────── */
"position-displacement": [
 [1, ["mcq", "A piston moves from top dead centre to bottom dead centre and back. What is its displacement for the full cycle?",
   ["Twice the stroke", "Equal to the stroke", "Zero", "Half the stroke"], 2,
   "Displacement is the change in position, and the piston returns to where it started. It has, however, travelled twice the stroke."]],
 [1, ["tf", "Distance travelled and displacement are always equal.", false,
   "They are equal only for straight-line motion without reversal."]],
 [3, ["mcq", "Why must a reference frame always be declared in a kinematic analysis?",
   ["Because units depend on it", "Because position and velocity are relative to the observer's frame", "Because forces depend on it", "It is only a convention"], 1,
   "All kinematic quantities are measured relative to a frame; and F = ma is only valid in an inertial frame."]]
],
"velocity": [
 [1, ["mcq", "Velocity differs from speed because…",
   ["it is measured in m/s", "it includes direction as well as magnitude", "it is always larger", "it changes with time"], 1,
   "Velocity is a vector. A car going round a track at constant speed has a continuously changing velocity."]],
 [2, ["num", { ans: 12, unit: "m/s", tol: 0.02 }, null, "x = 2t² ⇒ v = dx/dt = 4t ⇒ at t = 3 s, v = 12 m/s."]],
 [3, ["predict", "A car travels at a constant 20 m/s around a circular track. Is it accelerating?",
   ["No — the speed is constant", "Yes — the direction of velocity changes, so there is a centripetal acceleration", "Only if it speeds up", "Only at the start of the lap"], 1,
   "Acceleration is the rate of change of the velocity *vector*: a_n = v²/r is non-zero even at constant speed."]]
],
"acceleration": [
 [1, ["mcq", "Acceleration is…",
   ["the rate of change of position", "the rate of change of velocity", "the same as speed", "the force divided by distance"], 1,
   "a = dv/dt. It accounts for changes in magnitude *and* direction of velocity."]],
 [2, ["num", { ans: 33.3, unit: "m", tol: 0.03 }, null, "Braking distance = v²/(2a) = 20²/(2×6) = 33.3 m."]],
 [3, ["predict", "A car takes a bend at 15 m/s. If the speed is doubled, by what factor does the required lateral (centripetal) acceleration change?",
   ["2", "3", "4", "8"], 2,
   "a_n = v²/r, so doubling v quadruples the demand on tyre grip — the reason cornering speeds are limited."]],
 [4, ["mcq", "A 5 kg part on a robot arm experiences 40 m/s² at the end of a fast move. What inertial force must the joint transmit, ignoring gravity?",
   ["8 N", "50 N", "200 N", "2000 N"], 2,
   "F = ma = 5 × 40 = 200 N. High accelerations dominate robot joint sizing far more than the payload weight."]]
],
"angular-motion": [
 [2, ["mcq", "Convert 1500 rpm to rad/s.",
   ["25 rad/s", "157 rad/s", "942 rad/s", "1500 rad/s"], 1,
   "ω = 2πn/60 = 2π × 1500/60 = 157.1 rad/s. Always convert before using formulas."]],
 [2, ["num", { ans: 157.1, unit: "rad/s", tol: 0.02 }, null, "ω = 2π × 1500/60 = 157.1 rad/s."]],
 [3, ["mcq", "A rigid body rotates about a fixed axis. Which quantity is the same for every point on the body?",
   ["Linear velocity", "Angular velocity", "Linear acceleration", "Distance from the axis"], 1,
   "ω and α are shared by the whole body; v = ωr and a_n = ω²r grow with radius."]],
 [3, ["predict", "A motor's rated speed is unchanged but the load inertia is doubled. What happens to the run-up time?",
   ["It halves", "It stays the same", "It doubles", "It quadruples"], 2,
   "α = T/I. With the same available torque, doubling I halves α and therefore doubles the run-up time."]]
],
"translation-rotation": [
 [1, ["mcq", "A wheel rolls without slipping. What is the velocity of the contact point with the ground?",
   ["Equal to the centre velocity", "Twice the centre velocity", "Zero", "Opposite to the centre velocity"], 2,
   "Rolling without slip means the contact point is instantaneously at rest — that is the definition of the condition v = ωr."]],
 [3, ["mcq", "For the same rolling wheel, what is the velocity of the topmost point?",
   ["Zero", "Equal to the centre velocity", "Twice the centre velocity", "Three times the centre velocity"], 2,
   "Translation v plus rotation ωr = v gives 2v at the top. This is why debris flies off a wheel at twice the vehicle speed."]],
 [3, ["tf", "Any general plane motion of a rigid body can be described as a translation plus a rotation.", true,
   "Chasles' theorem — the foundation of mechanism analysis."]]
],
"relative-motion": [
 [3, ["mcq", "For two points A and B on the same rigid body, the relative velocity v_B/A is always…",
   ["parallel to AB", "perpendicular to AB", "equal to zero", "parallel to v_A"], 1,
   "The distance AB is fixed, so there can be no component of relative velocity along AB — v_B/A = ω × r_B/A is perpendicular to it."]],
 [3, ["order", "Order the steps to find the angular velocity of a connecting rod using relative velocity.",
   ["Find the velocity of the crank pin (magnitude and direction)", "Establish the known direction of the piston velocity", "Write v_B = v_A + ω × r_B/A", "Construct the velocity triangle", "Solve for the unknown magnitude and ω"], [0, 1, 2, 3, 4],
   "Knowing the directions of two velocities is what closes the vector triangle."]]
],
"general-plane-motion": [
 [3, ["mcq", "The instantaneous centre of zero velocity of a body in plane motion is…",
   ["always inside the body", "the point about which the body is purely rotating at that instant", "the centre of mass", "fixed for the whole motion"], 1,
   "The IC may lie outside the body and it moves as the mechanism moves."]],
 [3, ["predict", "For a ladder sliding down a smooth wall, where is the instantaneous centre?",
   ["At the midpoint of the ladder", "At the intersection of the perpendiculars to the two end velocities", "At the foot of the ladder", "At infinity"], 1,
   "The foot moves horizontally and the top vertically, so perpendiculars to those directions meet at a point that moves as the ladder slides."]]
],
"mechanisms": [
 [2, ["mcq", "A planar four-bar linkage has 4 links and 4 revolute joints. What is its mobility?",
   ["0", "1", "2", "3"], 1,
   "M = 3(n−1) − 2j₁ = 3(3) − 8 = 1. One input fully determines the motion."]],
 [3, ["mcq", "A slider-crank mechanism converts…",
   ["rotation into rotation", "rotation into reciprocating translation", "translation into rotation only", "oscillation into rotation"], 1,
   "It is the basis of the internal combustion engine and of most reciprocating compressors and pumps."]],
 [4, ["mcq", "An excavator boom, stick and bucket are connected by pins and driven by hydraulic cylinders. Each cylinder should be modelled as…",
   ["a multi-force member", "a two-force member along its axis", "a fixed support", "a distributed load"], 1,
   "Ignoring friction at the pins, a cylinder transmits force only along its axis — treating it as a two-force member removes two unknowns per cylinder."]]
],

/* ─────────── KINETICS ─────────── */
"newton-laws": [
 [1, ["mcq", "Newton's second law states that…",
   ["force equals mass times velocity", "the resultant force equals the rate of change of momentum", "every action has a reaction", "a body at rest stays at rest"], 1,
   "For constant mass this reduces to ΣF = ma. The momentum form is more general."]],
 [1, ["tf", "Statics is a special case of Newton's second law with acceleration equal to zero.", true,
   "ΣF = ma with a = 0 gives ΣF = 0 — exactly the equilibrium equations."]],
 [2, ["num", { ans: 3750, unit: "N", tol: 0.02 }, null, "F = ma = 1500 × 2.5 = 3750 N at the wheels, before resistances."]],
 [3, ["mcq", "Why must the reference frame be inertial to apply ΣF = ma directly?",
   ["Because mass changes otherwise", "Because in an accelerating frame fictitious forces appear", "Because gravity disappears", "It is not necessary"], 1,
   "In a rotating or accelerating frame you must add centrifugal and Coriolis terms, or work in an inertial frame."]],
 [4, ["predict", "A conveyor accelerates a 20 kg package at 1.5 m/s² while friction opposes motion with 20 N. What drive force is required?",
   ["10 N", "30 N", "50 N", "313 N"], 2,
   "ΣF = ma ⇒ F − 20 = 20 × 1.5 = 30 ⇒ F = 50 N."]]
],
"work": [
 [1, ["mcq", "A worker holds a 20 kg box stationary at chest height for 10 minutes. What mechanical work is done on the box?",
   ["196 J", "1962 J", "Zero", "It depends on the worker's strength"], 2,
   "Work requires displacement. The worker still expends metabolic energy, but no mechanical work is done on the box."]],
 [2, ["num", { ans: 1500, unit: "J", tol: 0.02 }, null, "U = F·s = 300 N × 5 m = 1500 J (force parallel to motion)."]],
 [3, ["mcq", "Friction does negative work. Where does that energy go?",
   ["It disappears", "It is converted into heat and sometimes wear", "It is stored as potential energy", "It becomes kinetic energy"], 1,
   "Energy is conserved but degraded: mechanical energy becomes thermal energy at the interface."]]
],
"energy": [
 [2, ["num", { ans: 400, unit: "J", tol: 0.03 }, null, "Rotational kinetic energy = ½Iω² = ½ × 8 × 10² = 400 J."]],
 [3, ["predict", "A vehicle's speed is doubled. By what factor does its kinetic energy — and therefore its braking energy — change?",
   ["2", "3", "4", "8"], 2,
   "T = ½mv², so the energy quadruples. This is the physics behind the much longer stopping distances at speed."]],
 [3, ["mcq", "A flywheel is fitted to a punch press mainly to…",
   ["increase the peak power available", "store energy between strokes so a smaller motor can supply the average power", "reduce the machine's weight", "increase the stroke rate"], 1,
   "The motor supplies the average power; the flywheel supplies the peak. This is one of the oldest and most useful applications of energy storage."]]
],
"power": [
 [2, ["fill", "Complete the rotary power relation.", ["P = τ · ", "_"], ["ω"],
   "Rotary power is torque times angular velocity; the linear equivalent is P = F·v."]],
 [2, ["num", { ans: 1.96, unit: "kW", tol: 0.03 }, null, "P = Fv = mgv = 500 × 9.81 × 0.4 = 1962 W ≈ 1.96 kW."]],
 [3, ["mcq", "A motor is rated in kW rather than N·m because…",
   ["kW is a larger unit", "power combines the torque and the speed at which it is delivered", "torque cannot be measured", "it is a legal requirement"], 1,
   "A motor can deliver high torque at low speed or low torque at high speed; power captures the capability that matters for the duty."]],
 [4, ["predict", "A pump delivers a fixed flow against a fixed head but the fluid density increases by 20%. What happens to the hydraulic power?",
   ["It is unchanged", "It increases by 20%", "It decreases by 20%", "It doubles"], 1,
   "P = ρgQH, so power scales directly with density — the same pump on a heavier fluid needs a bigger motor."]]
],
"impulse-momentum": [
 [3, ["mcq", "A 0.5 kg hammer at 8 m/s is stopped in 4 ms. What is the average impact force?",
   ["100 N", "250 N", "1000 N", "4000 N"], 2,
   "F = mv/t = 4/0.004 = 1000 N. Extending the stopping time to 40 ms would reduce it tenfold — the principle of cushioning."]],
 [3, ["predict", "To reduce the peak force in an impact without changing the momentum change, you should…",
   ["increase the mass", "increase the impact duration", "reduce the initial speed only", "increase the stiffness of the contact"], 1,
   "F_avg = Δp/Δt. Longer contact time means lower peak force — airbags, crumple zones and soft tool handles all work this way."]],
 [3, ["tf", "In a collision between two bodies with no external forces, the total kinetic energy is always conserved.", false,
   "Momentum is always conserved; kinetic energy is conserved only in a perfectly elastic impact. Most real impacts lose energy to heat, sound and deformation."]]
],
"angular-momentum": [
 [3, ["mcq", "A spinning rotor resists a change in the direction of its axis. This is due to…",
   ["friction in the bearings", "conservation of angular momentum (gyroscopic effect)", "the rotor's weight", "air resistance"], 1,
   "ΣM = dH/dt: changing the direction of H requires a moment, and the rotor responds by precessing."]],
 [4, ["mcq", "A turbocharger rotor spins at 200,000 rpm. During cornering the axis direction changes. What is the engineering consequence?",
   ["Nothing — the effect is negligible", "A gyroscopic moment is transmitted to the bearings, which must be rated for it", "The rotor slows down", "The compressor surges"], 1,
   "Gyroscopic moments scale with Iω and the precession rate; in high-speed rotors they are a genuine bearing load case."]]
],
"moment-of-inertia": [
 [3, ["mcq", "Two discs have the same mass; one has its mass concentrated at the rim. Which has the larger mass moment of inertia?",
   ["The uniform disc", "The rim-weighted disc", "They are equal", "It depends on the material"], 1,
   "I = ∫r²dm weights mass by the square of its radius, so rim mass dominates — the reason flywheels are rim-weighted."]],
 [3, ["predict", "The radius of a uniform disc is doubled while keeping the mass the same. What happens to I about its centre?",
   ["It doubles", "It stays the same", "It quadruples", "It halves"], 2,
   "I = ½mr², so doubling r quadruples I at constant mass."]],
 [3, ["mcq", "The parallel-axis theorem I = I_G + md² is used when…",
   ["the body is not rigid", "the rotation axis does not pass through the centre of mass", "the body is accelerating", "the mass is unknown"], 1,
   "It transfers the inertia from the centroidal axis to any parallel axis."]]
],
"rotational-dynamics": [
 [3, ["mcq", "A gearbox with ratio 10:1 (speed reduction) is fitted between a motor and a load. How does the load inertia appear to the motor?",
   ["Unchanged", "Reduced by a factor of 10", "Reduced by a factor of 100", "Increased by a factor of 10"], 2,
   "Reflected inertia scales with the square of the ratio: I_reflected = I_load/n². This is why gearboxes help servo response."]],
 [3, ["order", "Order the steps to size a motor for a rotating load.",
   ["Determine the speed profile and run-up time", "Calculate the total inertia referred to the motor shaft", "Compute the acceleration torque T = Iα", "Add the friction and load torques", "Select a motor with adequate torque at the required speed and check thermal rating"], [0, 1, 2, 3, 4],
   "Forgetting the thermal check is the classic error: a motor may meet peak torque yet overheat on the duty cycle."]]
],
"vibrations": [
 [3, ["num", { ans: 10.1, unit: "Hz", tol: 0.03 }, null, "f_n = (1/2π)√(k/m) = (1/2π)√(8×10⁵/200) = 10.07 Hz."]],
 [3, ["predict", "A machine is mounted on isolators so that the excitation frequency is three times the natural frequency. What happens to the transmitted force?",
   ["It is amplified", "It is largely isolated (transmissibility below 1)", "It is unchanged", "It becomes zero"], 1,
   "Isolation only works above r = √2. At r = 3 the transmissibility is well below 1 — but passing *through* r = 1 during run-up is the dangerous moment."]],
 [4, ["mcq", "A fan running at 1450 rpm causes a large vibration on its support frame. The first diagnostic step is to…",
   ["replace the fan", "compare the excitation frequency (24.2 Hz) with the natural frequency of the frame", "add mass to the fan", "increase the fan speed"], 1,
   "Resonance is confirmed by matching frequencies. The remedy is then to change stiffness or mass to move f_n away from the excitation."]]
],

/* ─────────── STRENGTH OF MATERIALS ─────────── */
"stress": [
 [1, ["mcq", "Stress is defined as…",
   ["force times area", "force per unit area", "deformation per unit length", "the load divided by the length"], 1,
   "σ = F/A. It is an intensity, not a total force."]],
 [1, ["tf", "Stress is a material property like Young's modulus.", false,
   "Stress depends on the load and the geometry. The material property is the strength it is compared against."]],
 [2, ["num", { ans: 177, unit: "MPa", tol: 0.02 }, null, "A = π(0.012)²/4 = 1.131×10⁻⁴ m²; σ = 20000/1.131e-4 = 177 MPa."]],
 [3, ["predict", "A tensile bar has a small hole drilled through it. What happens to the stress at the hole?",
   ["It decreases because there is less material", "It stays the same", "It rises locally to about three times the nominal value", "It becomes zero at the hole"], 2,
   "The net section raises the nominal stress, and the hole itself concentrates it further (K_t ≈ 3 for a small round hole)."]],
 [4, ["mcq", "A bolted joint fails at the first thread of engagement. Which concept explains this?",
   ["Buckling", "Stress concentration combined with non-uniform load distribution across the threads", "Creep", "Hydrostatic pressure"], 1,
   "The first engaged thread carries a large share of the load and has a high stress concentration — a classic fatigue initiation site."]]
],
"strain": [
 [2, ["fill", "Complete the definition of engineering strain.", ["ε = ", "_", " / L₀"], ["ΔL"],
   "Normal strain is the change in length divided by the original length — a dimensionless measure of deformation."]],
 [1, ["mcq", "A 2 m bar extends by 1 mm. What is the strain?",
   ["0.0005 (500 µε)", "0.002", "0.5", "500"], 0,
   "ε = ΔL/L = 1/2000 = 0.0005 = 500 µε. Strain is dimensionless."]],
 [2, ["predict", "Two bars of the same material and length carry the same load, but one has twice the cross-sectional area. Which has the larger strain?",
   ["The thicker bar", "The thinner bar", "They are equal", "It depends on the length"], 1,
   "σ = F/A is higher in the thinner bar, and ε = σ/E follows directly."]],
 [3, ["mcq", "Why do engineers prefer strain to deformation when comparing a test specimen with a full-size structure?",
   ["Strain is easier to measure", "Strain is dimensionless, so it transfers between scales", "Strain includes the material properties", "Deformation cannot be measured"], 1,
   "Normalising by length removes the size effect, which is why strain gauges are the standard measurement."]]
],
"normal-shear": [
 [2, ["mcq", "A bar in uniaxial tension at stress σ has its maximum shear stress on planes at…",
   ["0° to the axis, equal to σ", "45° to the axis, equal to σ/2", "90° to the axis, equal to σ", "45° to the axis, equal to σ"], 1,
   "τ_max = σ/2 on the 45° planes — which is exactly where ductile metals show slip lines and where torsion failures occur."]],
 [3, ["mcq", "A bolt in double shear carrying load P has an average shear stress of…",
   ["P/A", "P/2A", "2P/A", "P/4A"], 1,
   "Two shear planes share the load, so each carries P/2 over area A."]],
 [3, ["tf", "Pure shear is equivalent to equal tension and compression on planes at 45°.", true,
   "The principal stresses in pure shear are +τ and −τ at 45° — this is why a brittle material in torsion fails on a 45° helix."]]
],
"tension-compression": [
 [2, ["num", { ans: 0.95, unit: "mm", tol: 0.04 }, null, "σ = 40000/(π×0.01²) = 127.3 MPa; δ = σL/E = 127.3e6 × 1.5/200e9 = 0.955 mm."]],
 [3, ["mcq", "A slender column and a short block of the same material and cross-section are loaded in compression. Which fails first and why?",
   ["The block, because it is shorter", "The column, because it buckles below the crushing load", "Both fail at the same load", "Neither fails"], 1,
   "Slenderness introduces an instability that occurs at a load far below the material's compressive strength."]],
 [3, ["predict", "A tie rod's length is doubled while the load and section stay the same. What happens to the stress and the elongation?",
   ["Both double", "Stress is unchanged, elongation doubles", "Both are unchanged", "Stress doubles, elongation is unchanged"], 1,
   "σ = F/A is independent of length; δ = FL/AE is proportional to it."]]
],
"bending": [
 [2, ["mcq", "In a beam under sagging bending, the stress at the neutral axis is…",
   ["maximum tension", "maximum compression", "zero", "maximum shear"], 2,
   "Bending strain varies linearly and crosses zero at the neutral axis, which passes through the centroid."]],
 [2, ["num", { ans: 46.9, unit: "MPa", tol: 0.03 }, null, "I = 0.04×0.08³/12 = 1.707×10⁻⁶ m⁴; σ = Mc/I = 2000×0.04/1.707e-6 = 46.9 MPa."]],
 [3, ["predict", "A rectangular beam is turned from flat (wide) to upright (deep). What happens to its bending stiffness?",
   ["It is unchanged", "It decreases", "It increases substantially, because I ∝ depth³", "It depends on the material"], 2,
   "I = bh³/12, so orientation matters as much as size — the same section can be four times stiffer turned upright."]],
 [4, ["mcq", "An I-beam is used instead of a solid rectangle of the same area mainly because…",
   ["it is easier to manufacture", "material near the neutral axis contributes little to bending resistance, so removing it saves weight at little cost in strength", "it has a higher Young's modulus", "it resists torsion better"], 1,
   "Bending stress is proportional to distance from the neutral axis, so material far away is the most efficient."]]
],
"torsion": [
 [2, ["num", { ans: 56.6, unit: "MPa", tol: 0.03 }, null, "J = πd⁴/32 = 7.95×10⁻⁸ m⁴; τ = Tc/J = 300×0.015/7.95e-8 = 56.6 MPa."]],
 [3, ["mcq", "Why are hollow shafts preferred for transmitting torque?",
   ["They are cheaper", "The material near the axis carries very little shear stress, so removing it saves weight efficiently", "They are stiffer in bending", "They avoid stress concentration"], 1,
   "Shear stress varies linearly from zero at the axis, so the core contributes little to torsional capacity."]],
 [3, ["predict", "The diameter of a solid shaft is reduced by 20%. By roughly what factor does the maximum shear stress under the same torque change?",
   ["1.25", "1.6", "1.95", "3.0"], 2,
   "τ ∝ 1/d³: (1/0.8)³ = 1.95. Small diameter reductions are very expensive in torsion."]],
 [4, ["mcq", "A transmission shaft fails with a fracture surface at 45° to the axis. What loading was responsible?",
   ["Pure tension", "Pure torsion", "Pure bending", "Axial compression"], 1,
   "Torsion produces principal tension at 45°; brittle materials fail on that helical surface, ductile ones on the transverse plane of maximum shear."]]
],
"shear-moment-diagrams": [
 [3, ["mcq", "For a beam, the bending moment is maximum where…",
   ["the load is maximum", "the shear force is zero", "the shear force is maximum", "the deflection is zero"], 1,
   "dM/dx = V, so the moment has a stationary point where the shear crosses zero."]],
 [3, ["order", "Order the procedure for drawing shear and moment diagrams.",
   ["Calculate the support reactions", "Section the beam and write V(x) and M(x) for each segment", "Plot the shear diagram using dV/dx = −w", "Locate the points where V = 0", "Evaluate M at those points to find M_max"], [0, 1, 2, 3, 4],
   "The maximum moment — and therefore the critical section — is found by locating the zero-shear point."]],
 [4, ["predict", "A simply supported beam carries a central point load. Changing it to a cantilever of the same span with the same load at the tip multiplies the maximum moment by…",
   ["1", "2", "4", "8"], 2,
   "Simply supported: M = PL/4. Cantilever: M = PL. The ratio is 4 — a crucial difference in structural efficiency."]]
],
"deflection": [
 [3, ["predict", "The span of a simply supported beam carrying a uniform load is doubled. By what factor does the maximum deflection change?",
   ["2", "4", "8", "16"], 3,
   "δ = 5wL⁴/384EI, so deflection scales with L⁴. Span is the dominant variable in stiffness design."]],
 [3, ["mcq", "A steel floor beam passes the stress check but fails the L/300 deflection limit. The most effective remedy is to…",
   ["use a higher strength steel", "increase the depth of the section (increase I)", "reduce the width of the flange", "use a longer span"], 1,
   "E is essentially the same for all steels, so changing material does not help stiffness. Increasing I — by depth — does."]],
 [4, ["mcq", "A machine tool frame vibrates and produces poor surface finish. The frame passes all stress checks. The governing issue is…",
   ["yield strength", "stiffness (deflection) and natural frequency, not strength", "fatigue", "buckling"], 1,
   "Precision equipment is usually stiffness- and dynamics-limited long before it is strength-limited."]]
],
"stress-concentration": [
 [3, ["mcq", "The theoretical stress concentration factor K_t depends on…",
   ["the material's yield strength", "geometry only", "the applied load magnitude", "the temperature"], 1,
   "K_t is a purely geometric elastic result. Material sensitivity to the notch is a separate factor (q or K_f)."]],
 [3, ["predict", "A shaft shoulder's fillet radius is increased. What happens to K_t and to fatigue life?",
   ["K_t increases, life decreases", "K_t decreases, life increases", "Neither changes", "K_t decreases but life decreases"], 1,
   "A larger radius reduces the geometric stress raiser — the cheapest fatigue improvement available in design."]],
 [4, ["mcq", "Under static loading a ductile material often tolerates a high K_t, but under cyclic loading it does not. Why?",
   ["Ductile materials are immune to stress concentration", "Local yielding redistributes the peak under static load, but fatigue cracks initiate at the peak regardless", "K_t is smaller under cyclic loading", "Cyclic loading reduces the stress"], 1,
   "Static yielding blunts the peak; fatigue acts on the local elastic peak at the surface where cracks start."]]
],
"principal-stresses": [
 [3, ["num", { ans: 108.3, unit: "MPa", tol: 0.02 }, null, "Centre = 50 MPa, radius = √(50² + 40²) = 64.0 ⇒ σ₁ = 114 MPa. (For σx = 100, σy = 0, τ = 40: radius = √(2500+1600) = 64.0.)"]],
 [3, ["mcq", "Principal stresses are important because…",
   ["they are always larger than the applied stresses", "failure criteria are expressed in terms of them", "they are easier to measure", "they cancel out"], 1,
   "The material responds to the stresses on its own planes, not to the arbitrary x–y components chosen by the analyst."]],
 [4, ["tf", "Adding a shear stress to a uniaxial tensile state can produce a compressive principal stress.", true,
   "For σx = σ, τxy = τ, σ₂ = σ/2 − √(σ²/4 + τ²), which is always negative. This is why brittle materials fail in torsion."]]
],
"mohr": [
 [3, ["mcq", "On Mohr's circle, the radius represents…",
   ["the mean normal stress", "the maximum in-plane shear stress", "the yield strength", "the principal angle"], 1,
   "Centre = (σx+σy)/2 and radius = τ_max. Reading both off one drawing is the whole point of the construction."]],
 [3, ["predict", "A stress state is pure hydrostatic pressure (σx = σy = −p, τ = 0). What does Mohr's circle look like?",
   ["A large circle of radius p", "A point at −p on the normal stress axis", "A circle centred at the origin", "Two circles"], 1,
   "No shear anywhere. A ductile material will not yield under hydrostatic pressure alone, however large."]],
 [4, ["mcq", "A rotation of θ on the physical element corresponds to a rotation of … on Mohr's circle.",
   ["θ", "θ/2", "2θ", "90° − θ"], 2,
   "The double angle is the most common source of error when using the circle."]]
],
"safety-factor": [
 [3, ["mcq", "A component has a working stress of 120 MPa and a yield strength of 355 MPa. What is the factor of safety against yield?",
   ["1.7", "2.96", "4.2", "0.34"], 1,
   "n = σ_y/σ = 355/120 = 2.96. But this must be compared against every other failure mode — fatigue often governs."]],
 [3, ["predict", "A design has n = 3 against static yield but n = 1.1 against fatigue. What should be done?",
   ["Nothing — 3 is acceptable", "Redesign for fatigue, because it is the governing limit state", "Increase the static safety factor further", "Change to a stronger material without changing geometry"], 1,
   "The lowest factor of safety governs. Adding static margin does nothing for a fatigue-limited part."]],
 [4, ["mcq", "Why do codes require a larger safety factor for brittle materials than for ductile ones?",
   ["Brittle materials are cheaper", "Brittle failure is sudden and gives no warning, and the strength is more variable", "Brittle materials are heavier", "Ductile materials cannot fail"], 1,
   "Consequence and uncertainty both increase the required margin — the essence of limit state design."]]
],

/* ─────────── ELASTICITY ─────────── */
"elastic-deformation": [
 [1, ["tf", "Elastic deformation is fully recovered when the load is removed.", true,
   "That is the definition. Above the elastic limit, unloading leaves a permanent offset."]],
 [3, ["mcq", "In sheet metal forming, 'springback' is caused by…",
   ["plastic deformation only", "the elastic portion of the strain recovering on unloading", "thermal contraction", "strain hardening"], 1,
   "The elastic strain, though small, changes the final geometry — dies must be designed to over-bend deliberately."]],
 [4, ["mcq", "A bolted joint is tightened so that the bolt stretches elastically. Why is elastic stretch essential?",
   ["It makes the bolt stronger", "The elastic stretch maintains the clamping force as the joint relaxes", "It reduces the bolt's weight", "It prevents corrosion"], 1,
   "The bolt acts as a spring: preload is stored elastic energy, and it is what keeps the joint closed under external load."]]
],
"hooke-law": [
 [1, ["mcq", "Hooke's law states that, within the elastic limit…",
   ["stress equals strain", "stress is proportional to strain", "stress is inversely proportional to strain", "strain is independent of stress"], 1,
   "σ = Eε. The constant E is a measure of bond stiffness, not of strength."]],
 [3, ["mcq", "A designer replaces mild steel with high-strength steel to reduce the deflection of a beam. This will…",
   ["work well, because the material is stronger", "have almost no effect, because E is nearly the same for all steels", "increase the deflection", "reduce the deflection by half"], 1,
   "Deflection depends on E, not on σ_y. All steels have E ≈ 200 GPa — a fundamental and often-missed design fact."]],
 [3, ["predict", "The same stress is applied to steel (E = 200 GPa) and aluminium (E = 70 GPa). What is the ratio of their strains?",
   ["1:1", "About 1:2.9 (aluminium strains more)", "About 2.9:1 (steel strains more)", "It depends on the strength"], 1,
   "ε = σ/E, so the lower modulus material strains proportionally more — stiffness, not strength, controls deformation."]]
],
"elastic-constants": [
 [3, ["num", { ans: 76.9, unit: "GPa", tol: 0.02 }, null, "G = E/2(1+ν) = 200/(2×1.3) = 76.9 GPa."]],
 [3, ["mcq", "How many independent elastic constants does an isotropic material have?",
   ["1", "2", "3", "6"], 1,
   "Any two of E, G, ν, K determine the rest through G = E/2(1+ν)."]],
 [4, ["mcq", "Rubber has ν close to 0.5. What does this imply?",
   ["It is very stiff", "It is nearly incompressible — its volume hardly changes under load", "It has a high Young's modulus", "It cannot be modelled"], 1,
   "ν = 0.5 means constant volume. Rubber changes shape easily but resists volume change strongly, which is why it is used in mounts."]]
],
"elastic-limit": [
 [3, ["mcq", "The 0.2% proof stress is used because…",
   ["it is easier to measure than the true yield point", "many materials have no distinct yield point", "it is always higher than the ultimate strength", "codes require it for all materials"], 1,
   "Aluminium, stainless steels and many alloys yield gradually; the offset construction gives a repeatable design value."]],
 [4, ["predict", "A spring is overloaded once beyond its elastic limit. What is the consequence?",
   ["It returns to its original free length", "It takes a permanent set, changing its free length and rate", "It becomes stiffer", "Nothing measurable"], 1,
   "The permanent set changes both the free length and the operating point — the spring no longer meets its specification."]]
],
"stress-3d": [
 [4, ["mcq", "How many independent stress components describe a general 3-D stress state?",
   ["3", "6", "9", "12"], 1,
   "Six: three normal and three shear. The tensor is symmetric (τxy = τyx) so 9 components reduce to 6."]],
 [4, ["mcq", "In a thick-walled pressure vessel, which stress component does thin-wall theory neglect entirely?",
   ["Hoop stress", "Axial stress", "Radial stress, which equals −p at the inner surface", "Shear stress"], 2,
   "Radial stress varies from −p inside to 0 outside. In thick vessels it is significant and thin-wall theory is invalid (r/t ≤ 10)."]]
],
"generalized-hooke": [
 [4, ["num", { ans: 510, unit: "µε", tol: 0.03 }, null, "ε_hoop = (120 − 0.3×60)/200000 = 5.1×10⁻⁴ = 510 µε."]],
 [4, ["mcq", "A steel bar is heated but fully constrained at both ends. What happens?",
   ["Nothing — it cannot expand", "A compressive thermal stress develops, equal to EαΔT", "A tensile stress develops", "The bar buckles in tension"], 1,
   "Restrained thermal expansion produces compression: σ = EαΔT. For ΔT = 100 K in steel that is about 240 MPa — enough to yield."]]
],
"boundary-conditions": [
 [4, ["mcq", "An FEA model of a bracket shows a very high stress at one sharply constrained corner that grows without limit as the mesh is refined. This is…",
   ["a real stress that must be designed for", "a singularity caused by an idealised constraint", "a mesh error to be ignored", "evidence of plasticity"], 1,
   "Point constraints and sharp re-entrant corners produce theoretical infinities. The fix is to model the real joint or use a stress concentration approach."]],
 [4, ["tf", "Over-constraining an FEA model makes it artificially stiff and can underpredict the real stress.", true,
   "Extra constraints add artificial stiffness. Boundary conditions must represent what the real connection can actually transfer."]]
],

/* ─────────── PLASTICITY ─────────── */
"yielding": [
 [3, ["mcq", "Yielding in a metal is caused by…",
   ["bonds breaking completely", "the motion and multiplication of dislocations", "the material heating up", "atoms evaporating"], 1,
   "Plastic flow is dislocation motion — a much lower-energy process than breaking all bonds at once, which is why real strength is far below theoretical."]],
 [3, ["tf", "Cold working a metal increases its yield strength and reduces its ductility.", true,
   "Strain hardening raises σ_y while consuming the available ductility — a trade-off that cannot be reversed without annealing."]],
 [4, ["predict", "A component yields locally at a fillet but the rest of the section is elastic. Under static ductile loading this is…",
   ["always a failure", "often acceptable, because local yielding redistributes the stress", "a sign of brittle behaviour", "impossible"], 1,
   "Ductile materials redistribute peaks through local yielding. Under fatigue, however, that same peak is where a crack starts."]]
],
"plastic-deformation": [
 [3, ["mcq", "On unloading from the plastic region, the stress–strain path is…",
   ["horizontal", "parallel to the original elastic slope", "a mirror image of the loading curve", "vertical"], 1,
   "Unloading is always elastic, so it follows a line of slope E, leaving the plastic strain as a permanent offset."]],
 [4, ["mcq", "In deep drawing, the final part shape differs from the die shape. This is because of…",
   ["springback from elastic recovery", "thermal contraction", "tool wear", "friction"], 0,
   "The elastic strain recovered on unloading changes the geometry; dies are deliberately over-formed to compensate."]]
],
"elastic-plastic": [
 [4, ["mcq", "Shot peening improves fatigue life by…",
   ["hardening the surface only", "introducing compressive residual stress at the surface, which opposes crack opening", "removing material", "reducing the applied load"], 1,
   "Fatigue cracks need tensile stress to open. Surface compression reduces the effective stress range at the most critical location."]],
 [4, ["predict", "Autofrettage of a thick pressure vessel (deliberate over-pressurising) results in…",
   ["residual tension at the inner surface", "residual compression at the inner surface, increasing the working pressure capacity", "no residual stress", "immediate failure"], 1,
   "The inner fibres yield in tension and, on unloading, are left in compression — the same beneficial principle as shot peening."]]
],
"yield-criteria": [
 [4, ["mcq", "A ductile metal under equal triaxial tension of 400 MPa in all directions will…",
   ["yield immediately", "not yield according to von Mises, because the deviatoric stress is zero", "fracture in shear", "buckle"], 1,
   "Von Mises depends only on stress differences. Pure hydrostatic stress produces no distortion — although in reality triaxiality does promote brittle fracture, which is a separate mechanism."]],
 [4, ["mcq", "Which criterion is most appropriate for grey cast iron?",
   ["Von Mises", "Tresca", "Maximum principal stress", "Mohr's circle radius only"], 2,
   "Brittle materials fail by cleavage in tension, so the maximum principal stress (or Mohr) criterion applies, not a shear-based one."]]
],
"vonmises": [
 [4, ["num", { ans: 173, unit: "MPa", tol: 0.02 }, null, "σ_vm = √(200² − 200×100 + 100²) = √30000 = 173 MPa."]],
 [4, ["mcq", "In pure shear of magnitude τ, yielding according to von Mises occurs when τ equals…",
   ["σ_y", "σ_y/2", "σ_y/√3 ≈ 0.577σ_y", "2σ_y"], 2,
   "For σ₁ = τ, σ₂ = −τ, σ_vm = √3·τ = σ_y ⇒ τ = σ_y/√3. A number every design engineer should know."]]
],
"tresca": [
 [4, ["mcq", "Compared with von Mises, the Tresca criterion is…",
   ["always less conservative", "generally more conservative for ductile metals and simpler to apply by hand", "identical in all cases", "only valid for brittle materials"], 1,
   "The Tresca hexagon lies inside the von Mises ellipse, so it predicts yield earlier — a safe but sometimes wasteful choice."]],
 [4, ["predict", "Tresca ignores the intermediate principal stress σ₂. The practical consequence is…",
   ["it cannot be used at all", "it is easy to apply by hand but can be inaccurate when σ₂ is large", "it is always exact", "it requires FEA"], 1,
   "The simplification is what makes hand calculation possible; FEA-based checks usually use von Mises instead."]]
],
"strain-hardening": [
 [4, ["mcq", "A wire is drawn through a die to reduce its diameter. After drawing, the wire is…",
   ["softer and more ductile", "stronger and less ductile", "unchanged", "stronger and more ductile"], 1,
   "Cold work raises strength through dislocation multiplication but consumes ductility. Intermediate annealing is needed for large reductions."]],
 [4, ["predict", "A material with a high strain-hardening exponent n is preferred for deep drawing because…",
   ["it is cheaper", "strain spreads more uniformly, delaying localisation and necking", "it is stiffer", "it has a higher modulus"], 1,
   "High n delays necking, allowing larger forming strains before failure — a key formability parameter."]]
],
"large-deformation": [
 [4, ["mcq", "True stress differs from engineering stress because it uses…",
   ["the original area", "the instantaneous (current) area", "the maximum load", "the yield area"], 1,
   "After necking the true stress keeps rising while the engineering stress falls — a distinction that matters in forming analysis."]],
 [4, ["tf", "Plastic deformation of metals occurs at essentially constant volume.", true,
   "Plastic flow is shape change without volume change, which is why ε₁ + ε₂ + ε₃ = 0 in plasticity."]]
],

/* ─────────── FAILURE THEORY ─────────── */
"yield-failure": [
 [3, ["mcq", "Yield failure of a ductile component is usually…",
   ["sudden and catastrophic", "gradual and visible, giving warning before collapse", "invisible until fracture", "impossible to detect"], 1,
   "Visible deformation is the reason ductility is specified for lifting and pressure equipment."]],
 [4, ["mcq", "A crane hook is found to have opened out slightly. The correct engineering response is to…",
   ["continue using it with a reduced load", "remove it from service and investigate, because it has exceeded its yield limit", "heat treat it and reuse it", "weld it back into shape"], 1,
   "Permanent deformation means the design limit was exceeded and the material has been work-hardened and possibly damaged. Straightening is not an accepted repair."]]
],
"fracture": [
 [4, ["mcq", "Brittle fracture is particularly dangerous because it…",
   ["only occurs at high temperature", "occurs suddenly at stresses below yield, driven by pre-existing flaws", "is always preceded by visible deformation", "only affects polymers"], 1,
   "Flaw-driven failure below the yield stress is why fracture toughness and inspection are specified for critical structures."]],
 [4, ["predict", "A steel structure operating below its ductile-to-brittle transition temperature is at risk because…",
   ["it becomes weaker in tension", "its fracture toughness drops sharply, so small flaws become critical", "it corrodes faster", "it creeps"], 1,
   "The transition temperature is a genuine design limit — a factor in several historic ship and bridge failures."]]
],
"fatigue": [
 [4, ["mcq", "Most mechanical fatigue failures occur at stresses that are…",
   ["above the ultimate strength", "below the yield strength", "equal to the endurance limit", "independent of stress"], 1,
   "That is what makes fatigue dangerous: a statically safe component can fail after enough cycles."]],
 [4, ["identify", "A fracture surface shows smooth concentric 'beach marks' around a small origin, with a rough final zone. The failure mode is…",
   ["brittle fracture", "fatigue, with a final fast fracture zone", "creep rupture", "overload ductile fracture"], 1,
   "Beach marks are the fingerprint of progressive crack growth; the rough zone is the final overload fracture when the remaining section could no longer carry the load."]],
 [4, ["predict", "A tensile mean stress is added to a fully reversed cyclic load of the same amplitude. What happens to fatigue life?",
   ["It increases", "It is unchanged", "It decreases", "It becomes infinite"], 2,
   "Tensile mean stress opens the crack more each cycle (Goodman/Gerber correction). Compressive mean stress does the opposite — hence shot peening."]],
 [4, ["mcq", "Which design change most improves the fatigue life of a stepped shaft?",
   ["Increasing the shaft length", "Increasing the fillet radius at the shoulder", "Using a higher-strength steel of the same geometry", "Reducing the rotational speed"], 1,
   "Reducing K_t attacks the crack initiation site directly. A stronger steel raises σ_y but its endurance limit rises less, and K_t is unchanged."]]
],
"buckling": [
 [4, ["mcq", "The Euler buckling load of a column depends on…",
   ["the yield strength of the material", "E, I, length and end conditions — not on strength", "the cross-sectional area only", "the applied load"], 1,
   "Buckling is an elastic stability phenomenon. Using a higher-strength steel of the same geometry does not help at all."]],
 [4, ["predict", "Both ends of a pinned column are changed to fixed ends (K from 1.0 to 0.5). The buckling load…",
   ["halves", "stays the same", "doubles", "quadruples"], 3,
   "P_cr ∝ 1/(KL)², so halving K quadruples the capacity — end restraint is the cheapest buckling improvement."]],
 [4, ["mcq", "A hydraulic ram rod fails by bending sideways under a compressive load well below the material's yield stress. The cause is…",
   ["fatigue", "buckling of the slender rod", "creep", "torsion"], 1,
   "Long unsupported rods in compression must always be checked for buckling, not just for compressive stress."]]
],
"creep": [
 [4, ["mcq", "Creep becomes significant for a metal above roughly…",
   ["0.1 × T_melt (K)", "0.4 × T_melt (K)", "0.8 × T_melt (K)", "room temperature for all metals"], 1,
   "Above about 40% of the absolute melting temperature, diffusion-assisted mechanisms become active."]],
 [4, ["predict", "A steam pipe operates at a stress below yield but at 550 °C. Over years of service it will…",
   ["be unaffected", "slowly increase in diameter and eventually rupture", "become stronger", "buckle immediately"], 1,
   "Creep strain accumulates with time; hoop stress causes diameter growth, which increases stress further — a runaway that ends in rupture."]]
],
"wear-corrosion": [
 [4, ["mcq", "According to Archard's law, the most effective way to reduce adhesive wear is to…",
   ["increase the sliding speed", "reduce the contact pressure and maintain a lubricant film", "increase the temperature", "use a softer material"], 1,
   "V = kFs/H: reducing load and lowering k through lubrication are the two powerful levers."]],
 [4, ["predict", "A plain bearing runs with a boundary (thin-film) lubricant instead of full film. The wear rate will…",
   ["be unchanged", "increase by orders of magnitude", "decrease", "become zero"], 1,
   "The wear coefficient k changes by several orders of magnitude between full-film and boundary lubrication."]]
],
"failure-theories": [
 [4, ["mcq", "A grey cast iron shaft in torsion fractures on a 45° helical surface. Which theory explains this?",
   ["Von Mises", "Tresca", "Maximum principal stress", "Buckling"], 2,
   "Torsion produces principal tension at 45°; a brittle material fails on the plane of maximum tensile stress."]],
 [4, ["identify", "Select the correct criterion for a ductile aluminium bracket under combined bending and torsion.",
   ["Maximum principal stress", "Von Mises equivalent stress", "Mohr–Coulomb", "Euler buckling"], 1,
   "Ductile metals under combined loading: von Mises is the standard, matching test data best."]]
],
"fracture-mechanics": [
 [4, ["mcq", "Damage-tolerant design assumes that…",
   ["the component has no flaws", "flaws are present from the start and must not grow to a critical size within the inspection interval", "inspection is unnecessary", "the material is perfectly brittle"], 1,
   "It converts the question from 'will it crack?' to 'how long until this crack becomes critical?' — the basis of inspection planning."]],
 [4, ["predict", "According to Paris law, as a fatigue crack grows the growth rate da/dN…",
   ["stays constant", "decreases", "increases, because ΔK rises with √a", "becomes zero"], 2,
   "Growth accelerates with crack length, so the final part of life is short — inspection must find cracks early."]]
],

/* ─────────── FLUIDS: INCOMPRESSIBLE ─────────── */
"fluid-properties": [
 [1, ["mcq", "Which property mainly determines the friction losses in a pipe flow?",
   ["Density", "Viscosity", "Vapour pressure", "Surface tension"], 1,
   "Viscosity creates shear at the wall; density mainly affects the pressure forces and inertia."]],
 [3, ["mcq", "Kinematic viscosity ν is defined as…",
   ["μ × ρ", "μ / ρ", "ρ / μ", "μ + ρ"], 1,
   "ν = μ/ρ, in m²/s. Lubricant grades (ISO VG) are specified in kinematic viscosity."]],
 [4, ["predict", "A hydraulic system is started cold, when the oil viscosity is 10 times the design value. What is the immediate consequence?",
   ["The system runs faster", "Pressure drops and required pump power increase sharply, with a risk of cavitation", "Nothing changes", "The oil becomes less dense"], 1,
   "Laminar and turbulent friction both scale with viscosity; cold start-up is a classic cause of pump damage."]]
],
"pressure-fluids": [
 [1, ["mcq", "Gauge pressure is measured relative to…",
   ["absolute vacuum", "atmospheric pressure", "the fluid's vapour pressure", "zero depth"], 1,
   "Mixing gauge and absolute pressures is a common and dangerous error — at 1 bar gauge the difference is 50%."]],
 [2, ["num", { ans: 98.1, unit: "kPa", tol: 0.02 }, null, "p = ρgh = 1000 × 9.81 × 10 = 98.1 kPa. Rule of thumb: 10 m of water ≈ 1 bar."]],
 [3, ["mcq", "Pascal's principle allows a hydraulic press to multiply force because…",
   ["energy is created", "pressure is transmitted undiminished, so a larger piston area gives a larger force", "the fluid becomes denser", "the small piston moves faster"], 1,
   "Force is multiplied but displacement is divided in the same proportion — energy is conserved."]]
],
"viscosity": [
 [2, ["mcq", "Newton's law of viscosity relates shear stress to…",
   ["the pressure", "the velocity gradient", "the density", "the temperature only"], 1,
   "τ = μ du/dy. The velocity gradient is the shear rate."]],
 [3, ["predict", "The temperature of a lubricating oil rises during operation. What happens to its viscosity and to the friction loss?",
   ["Both increase", "Viscosity decreases and friction loss decreases", "Viscosity increases and friction decreases", "Neither changes"], 1,
   "Liquids thin as they heat, so friction losses fall — but if the film becomes too thin, metal-to-metal contact and wear follow."]],
 [4, ["mcq", "Which statement about gas and liquid viscosity with temperature is correct?",
   ["Both decrease with temperature", "Liquid viscosity decreases and gas viscosity increases with temperature", "Both increase with temperature", "Neither changes"], 1,
   "In liquids, cohesion dominates and weakens with heat; in gases, molecular momentum transfer dominates and increases with heat."]]
],
"hydrostatics": [
 [2, ["mcq", "Pressure in a static liquid at depth h is…",
   ["ρgh", "ρg/h", "ρh/g", "gh/ρ"], 0,
   "p = ρgh for gauge pressure. Every 10 m of water adds about 1 bar."]],
 [3, ["mcq", "The resultant hydrostatic force on a submerged vertical plane surface acts at…",
   ["the centroid of the surface", "the centre of pressure, below the centroid", "the top edge", "the bottom edge"], 1,
   "Pressure increases with depth, so the resultant acts lower than the centroid — a critical detail for gate and dam design."]],
 [4, ["predict", "A tank is filled with oil (ρ = 850 kg/m³) instead of water. At the same depth the pressure is…",
   ["the same", "about 15% lower", "about 15% higher", "double"], 1,
   "p = ρgh scales directly with density: 850/1000 = 0.85 of the water pressure."]]
],
"flow-rate": [
 [2, ["num", { ans: 7.07, unit: "m/s", tol: 0.03 }, null, "Q = 50 m³/h = 0.0139 m³/s; A = π(0.05)²/4 = 1.963×10⁻³ m²; v = 7.07 m/s — well above the 1–3 m/s water guideline."]],
 [3, ["predict", "For a fixed flow rate, halving the pipe diameter causes the velocity to…",
   ["halve", "stay the same", "double", "quadruple"], 3,
   "v = Q/A and A ∝ D², so halving D quadruples v — and raises friction loss by roughly an order of magnitude."]],
 [3, ["mcq", "Typical design velocity for water in a distribution pipe is about…",
   ["0.05 m/s", "1–3 m/s", "10–15 m/s", "50 m/s"], 1,
   "Below 1 m/s solids settle; above about 3 m/s friction losses, noise and erosion become excessive."]]
],
"continuity": [
 [2, ["mcq", "The continuity equation expresses conservation of…",
   ["energy", "mass", "momentum", "pressure"], 1,
   "ρ₁A₁v₁ = ρ₂A₂v₂. For an incompressible fluid the density cancels."]],
 [3, ["predict", "A hose nozzle reduces the flow area by a factor of 9. The exit velocity is…",
   ["1/9 of the hose velocity", "the same", "3 times higher", "9 times higher"], 3,
   "A₁v₁ = A₂v₂, so v₂ = 9v₁. Bernoulli then tells you the static pressure drops sharply."]],
 [4, ["mcq", "In a supersonic nozzle the gas accelerates while the area increases. This is possible because…",
   ["mass is not conserved", "the density decreases faster than the area increases", "the flow is incompressible", "the temperature is constant"], 1,
   "From continuity, dA/A = (M²−1)dv/v: above M = 1 the density drop dominates and area and velocity change together."]]
],
"bernoulli": [
 [3, ["fill", "Complete Bernoulli's equation along a streamline.", ["p + ½ρv² + ", "_", " = constant"], ["ρgz"],
   "Bernoulli adds the elevation head ρgz to the static and dynamic pressure terms: pressure energy + kinetic energy + potential energy is conserved."]],
 [2, ["mcq", "Bernoulli's equation is a statement of conservation of…",
   ["mass", "momentum", "mechanical energy per unit weight", "heat"], 2,
   "Each term is a head in metres: pressure head, velocity head and elevation head."]],
 [3, ["predict", "Water accelerates from 1 m/s to 4 m/s in a horizontal pipe. The static pressure…",
   ["increases by 7.5 kPa", "decreases by 7.5 kPa", "is unchanged", "decreases by 15 kPa"], 1,
   "Δp = ½ρ(v₂² − v₁²) = ½ × 1000 × 15 = 7.5 kPa converted into velocity head."]],
 [3, ["tf", "Bernoulli's equation can be applied between any two points in a flowing fluid without modification.", false,
   "It requires steady, incompressible, inviscid flow along a streamline. Real systems need head-loss and pump terms added."]],
 [4, ["mcq", "An aerofoil generates lift primarily because…",
   ["the air below is denser", "the flow over the upper surface is faster, giving lower static pressure there", "the wing pushes air down by its weight", "the pressure is equal on both sides"], 1,
   "The pressure difference from the velocity difference produces the net upward force — the momentum deficit in the wake is the same phenomenon viewed globally."]]
],
"momentum-fluid": [
 [3, ["num", { ans: 283, unit: "N", tol: 0.03 }, null, "F = ṁv√2 = 20 × 10 × 1.414 = 283 N for a 90° bend."]],
 [4, ["mcq", "A fire hose nozzle produces a strong backward reaction force because…",
   ["the water is heavy", "the momentum flux of the accelerated jet must be balanced by a force on the nozzle", "of the hose weight", "of atmospheric pressure"], 1,
   "ΣF = ṁ(v_out − v_in): accelerating the water forward requires an equal and opposite force on the nozzle, which the firefighter must resist."]]
],
"reynolds": [
 [3, ["num", { ans: 50000, unit: "", tol: 0.03 }, null, "Re = ρvD/μ = 1000 × 2 × 0.025/0.001 = 50,000 — fully turbulent."]],
 [3, ["predict", "The same flow rate of cold oil is heated, reducing its viscosity by a factor of 5. The Reynolds number…",
   ["decreases by 5", "stays the same", "increases by 5", "increases by 25"], 2,
   "Re ∝ 1/μ. The flow may even change regime from laminar to turbulent, altering the pressure drop law."]],
 [4, ["mcq", "Reynolds number is used in wind tunnel testing to…",
   ["measure the model's weight", "ensure dynamic similarity between the model and the full-scale object", "calculate the air density", "set the tunnel temperature"], 1,
   "Matching Re between model and prototype makes the flow patterns — and therefore the force coefficients — comparable."]]
],
"laminar-turbulent": [
 [3, ["mcq", "In fully developed laminar pipe flow the velocity profile is…",
   ["flat across the pipe", "parabolic, with maximum at the centre", "triangular", "zero everywhere"], 1,
   "The parabolic profile gives v_mean = v_max/2. In turbulent flow the profile is much flatter, about 0.8 v_max."]],
 [3, ["predict", "The flow rate in a turbulent pipe is doubled. The pressure drop increases by approximately a factor of…",
   ["2", "4", "8", "16"], 1,
   "In turbulent flow Δp ∝ v² (approximately), so doubling the flow quadruples the loss — and pump power rises about eightfold."]],
 [4, ["mcq", "Pipe roughness has essentially no effect on the friction factor in laminar flow because…",
   ["the pipe is smooth", "the viscous sublayer covers the roughness elements", "roughness only matters for gases", "it does have an effect"], 1,
   "In laminar flow the whole field is viscously dominated; in turbulent flow roughness protrudes through the sublayer and dominates at high Re."]]
],
"head-losses": [
 [3, ["num", { ans: 1.83, unit: "m", tol: 0.04 }, null, "h_f = f(L/D)v²/2g = 0.02 × 200 × 9/19.62 = 1.83 m."]],
 [3, ["mcq", "In a short circuit with many bends and valves, the dominant loss is usually…",
   ["straight-pipe friction", "minor losses from the fittings", "elevation change", "compressibility"], 1,
   "Each fitting contributes Kv²/2g; with many fittings the sum easily exceeds the straight-pipe friction."]],
 [4, ["predict", "A valve in a pumped circuit is partially closed. What happens to the operating point?",
   ["Flow increases, head decreases", "Flow decreases and the pump operates further left on its curve", "Nothing changes", "The pump stops"], 1,
   "The system curve steepens, moving the operating point to lower flow and higher head — with reduced efficiency and a risk of overheating at low flow."]]
],
"pumps-valves": [
 [3, ["num", { ans: 4.09, unit: "kW", tol: 0.04 }, null, "P_h = ρgQH = 1000 × 9.81 × 0.0139 × 30 = 4.09 kW; at η = 0.65 the shaft power is 6.3 kW."]],
 [3, ["mcq", "The operating point of a pump in a system is found where…",
   ["the efficiency is maximum", "the pump curve intersects the system curve", "the flow is maximum", "the head is zero"], 1,
   "The pump supplies what the system demands at exactly one flow rate — unless the intersection is unstable."]],
 [4, ["mcq", "A centrifugal pump is run with its discharge valve closed for an extended period. The likely consequence is…",
   ["nothing — this is a normal test", "the fluid heats up, possibly causing damage, seal failure or vaporisation", "the motor overloads immediately", "the flow reverses"], 1,
   "All the input power becomes heat in a small trapped volume. Centrifugal pumps must never run dead-headed for long."]],
 [4, ["predict", "A pump's impeller speed is doubled. According to the affinity laws, the flow, head and power change by factors of…",
   ["2, 2, 2", "2, 4, 8", "4, 2, 8", "2, 4, 4"], 1,
   "Q ∝ n, H ∝ n², P ∝ n³. This is why variable-speed drives save so much energy in pumping systems."]]
],
"cavitation": [
 [3, ["mcq", "Cavitation in a pump begins when…",
   ["the discharge pressure is too high", "the local pressure at the impeller eye falls below the fluid's vapour pressure", "the fluid temperature is too low", "the flow rate is too low"], 1,
   "It is a low-pressure phenomenon on the suction side, not a high-pressure one."]],
 [4, ["predict", "The same pump handles water at 20 °C and then at 70 °C with identical suction conditions. At 70 °C…",
   ["NPSH_a increases", "NPSH_a decreases, because the vapour pressure is much higher", "nothing changes", "the flow increases"], 1,
   "NPSH_a = (p_s − p_v)/ρg + z − h_f. At 70 °C, p_v ≈ 31 kPa, so the available margin collapses — hot condensate is the classic cavitation case."]],
 [4, ["identify", "A centrifugal pump is noisy, vibrates, and its impeller shows a pitted, sponge-like surface near the eye. The diagnosis is…",
   ["bearing failure", "cavitation damage", "misalignment", "shaft deflection"], 1,
   "The characteristic pitted appearance at the low-pressure region, with noise like gravel, is the fingerprint of cavitation."]],
 [4, ["mcq", "Which modification most effectively increases NPSH_a?",
   ["Increasing the impeller speed", "Raising the supply level or reducing suction line losses", "Increasing the discharge pressure", "Using a larger discharge pipe"], 1,
   "NPSH_a depends only on the suction side: static head, supply pressure, vapour pressure and suction friction."]]
],

/* ─────────── FLUIDS: COMPRESSIBLE ─────────── */
"density-variation": [
 [3, ["mcq", "The usual rule of thumb for treating air flow as incompressible is…",
   ["M < 0.03", "M < 0.3", "M < 1", "always"], 1,
   "Below M ≈ 0.3 the density change is under about 5%, so incompressible analysis is acceptable."]],
 [4, ["predict", "Air is compressed isothermally to 8 bar absolute. Its density…",
   ["is unchanged", "increases by a factor of 8", "increases by a factor of 4", "decreases"], 1,
   "At constant temperature p = ρRT gives ρ ∝ p. In adiabatic compression the temperature also rises, so the density increase is smaller."]]
],
"mach-number": [
 [3, ["num", { ans: 0.59, unit: "", tol: 0.03 }, null, "a = 340 m/s at sea level; M = 200/340 = 0.59."]],
 [3, ["mcq", "The Mach number is the ratio of…",
   ["flow speed to the speed of light", "flow speed to the local speed of sound", "pressure to density", "velocity to viscosity"], 1,
   "It compares the flow speed with the speed at which pressure information travels upstream."]],
 [4, ["predict", "An aircraft flies at constant true airspeed but climbs to a colder altitude. Its Mach number…",
   ["decreases", "stays the same", "increases, because the speed of sound falls with temperature", "becomes zero"], 2,
   "a = √(γRT) falls with temperature, so the same true speed gives a higher Mach number at altitude."]]
],
"speed-of-sound": [
 [3, ["num", { ans: 340, unit: "m/s", tol: 0.02 }, null, "a = √(γRT) = √(1.4 × 287 × 288) = 340 m/s."]],
 [4, ["mcq", "The speed of sound in an ideal gas depends on…",
   ["pressure only", "temperature and gas properties, not on pressure", "density only", "the flow velocity"], 1,
   "For an ideal gas a = √(γRT); pressure and density change together and cancel."]]
],
"compressible-flow": [
 [4, ["mcq", "Stagnation temperature is…",
   ["the temperature at zero pressure", "the temperature the gas would reach if brought to rest isentropically", "the wall temperature", "always lower than the static temperature"], 1,
   "T₀ = T(1 + (γ−1)M²/2). At high Mach number the difference is large — this is kinetic heating."]],
 [4, ["predict", "Air accelerates to M = 2 in a nozzle. Its static temperature…",
   ["rises above the stagnation temperature", "falls to about 55% of the stagnation temperature", "stays constant", "doubles"], 1,
   "T/T₀ = 1/1.8 = 0.556. Accelerating a gas cools it — the reason moisture condenses in supersonic wind tunnels."]]
],
"subsonic-supersonic": [
 [4, ["mcq", "To accelerate a gas from subsonic to supersonic speed, the duct must be…",
   ["converging only", "diverging only", "converging then diverging", "constant area"], 2,
   "The throat reaches M = 1 and the diverging part continues the acceleration — the de Laval nozzle."]],
 [4, ["tf", "A purely converging nozzle can produce supersonic exit flow if the pressure ratio is high enough.", false,
   "It chokes at M = 1 at the exit plane. Beyond that, expansion happens outside the nozzle."]]
],
"nozzles-diffusers": [
 [4, ["mcq", "A converging nozzle supplied from 10 bar stagnation air is choked when the back pressure falls below…",
   ["10 bar", "5.28 bar", "1 bar", "0.528 bar"], 1,
   "p*/p₀ = (2/(γ+1))^{γ/(γ−1)} = 0.528 for air. Below this the mass flow cannot increase further."]],
 [4, ["predict", "Once a nozzle is choked, lowering the back pressure further causes…",
   ["the mass flow to increase", "the mass flow to stay constant while the exit velocity rises", "the mass flow to decrease", "the nozzle to unchoke"], 1,
   "Choking fixes the mass flow at the throat conditions; additional expansion happens downstream, often through shock cells."]]
],
"compressors-turbines": [
 [4, ["mcq", "The isentropic efficiency of a compressor is defined as…",
   ["actual work over ideal work", "ideal (isentropic) work over actual work", "output power over input power", "mass flow over volume flow"], 1,
   "For a compressor the ideal work is the smaller number, so η = w_ideal/w_actual < 1. For a turbine the ratio is reversed."]],
 [4, ["predict", "The pressure ratio of a gas turbine compressor is increased. The compressor exit temperature…",
   ["falls", "rises, increasing the work required", "is unchanged", "becomes equal to the inlet temperature"], 1,
   "T₀₂ = T₀₁ · r_p^{(γ−1)/γ}. Higher pressure ratio improves cycle efficiency but raises temperature and work — the key trade-off in cycle design."]]
],
"shock-waves": [
 [4, ["mcq", "Across a normal shock wave…",
   ["the flow remains supersonic", "the flow becomes subsonic and total pressure is lost", "total pressure is conserved", "temperature decreases"], 1,
   "Mass, momentum and energy are conserved but entropy rises, so total pressure falls — an irreversible loss."]],
 [4, ["predict", "The upstream Mach number of a normal shock increases. The total pressure recovery across the shock…",
   ["improves", "worsens, because the shock is stronger", "is unchanged", "becomes 100%"], 1,
   "Stronger shocks convert more kinetic energy into heat irreversibly; at M = 3 the total pressure recovery is under 70%."]],
 [4, ["identify", "A supersonic inlet uses a series of weak oblique shocks before a final normal shock. The purpose is to…",
   ["increase the Mach number", "minimise total pressure loss while decelerating to subsonic", "cool the air", "increase the mass flow"], 1,
   "Several weak shocks lose far less total pressure than one strong normal shock — the essence of efficient supersonic inlet design."]]
]
};

/* flatten into a lookup: bank[conceptId][level] = [questions] */
const QUESTION_BANK = {};
for (const [cid, arr] of Object.entries(RAW_BANK)) {
  QUESTION_BANK[cid] = QUESTION_BANK[cid] || { 1: [], 2: [], 3: [], 4: [] };
  arr.forEach(([lvl, spec]) => {
    if (!QUESTION_BANK[cid][lvl]) QUESTION_BANK[cid][lvl] = [];
    QUESTION_BANK[cid][lvl].push(Q(cid, lvl, spec));
  });
}

/* ══════════════════════════════════════════════════════════
   GENERATIVE TEMPLATES — randomised numeric questions
   ══════════════════════════════════════════════════════════ */
const GEN_TEMPLATES = {
  moment: () => {
    const F = rndi(4, 40) * 25, d = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1.0][rndi(0, 7)];
    const ang = pick([90, 90, 60, 45, 30]);
    const M = F * d * Math.sin(ang * Math.PI / 180);
    return makeQuestion({
      conceptId: "moment", level: 2, type: "num",
      prompt: ang === 90
        ? `A force of ${F} N acts perpendicular to a lever at a distance of ${d} m from the pivot. Calculate the moment about the pivot.`
        : `A force of ${F} N acts at ${ang}° to a lever, at a distance of ${d} m from the pivot. Calculate the moment about the pivot.`,
      unit: "N·m", answer: M, tol: 0.02,
      explanation: `M = F·d·sin θ = ${F} × ${d} × ${ang === 90 ? "1" : "sin " + ang + "°"} = ${sig(M, 4)} N·m.`,
      wrongWhy: "The lever arm is the *perpendicular* distance from the pivot to the line of action — not the distance to the point of application.",
      misconception: "Confusing the position distance r with the lever arm d = r·sin θ.",
      reasoning: ["Identify the pivot (moment centre).", "Draw the line of action of the force.",
        `Take the perpendicular distance: d = ${d} m × sin ${ang}° = ${sig(d * Math.sin(ang * Math.PI / 180), 3)} m.`,
        "Apply M = F·d.", `Interpret: ${sig(M, 3)} N·m of turning effect about the pivot.`],
      similar: "A 250 N force on a 0.4 m spanner gives 100 N·m; at 30° it gives only 50 N·m."
    });
  },
  torque: () => {
    const P = pick([2.2, 3, 4, 5.5, 7.5, 11, 15]), n = pick([750, 960, 1450, 1500, 2900, 3000]);
    const w = n * 2 * Math.PI / 60, T = P * 1000 / w;
    return makeQuestion({
      conceptId: "torque", level: 2, type: "num",
      prompt: `A shaft transmits ${P} kW at ${n} rpm. Calculate the torque in the shaft.`,
      unit: "N·m", answer: T, tol: 0.02,
      explanation: `ω = 2πn/60 = ${sig(w, 4)} rad/s; T = P/ω = ${P * 1000}/${sig(w, 4)} = ${sig(T, 4)} N·m.`,
      wrongWhy: "rpm must be converted to rad/s before using T = P/ω. Using rpm directly gives a value 9.55 times too large.",
      misconception: "Forgetting the rpm → rad/s conversion.",
      reasoning: ["Convert speed: ω = 2πn/60.", "Express power in watts.", "Apply T = P/ω.",
        `Interpret: at lower speed the same power needs more torque — ${n} rpm is a ${n < 1000 ? "low" : "high"} speed, so the torque is ${T > 100 ? "large" : "moderate"}.`],
      similar: "5 kW at 1500 rpm → 31.8 N·m; the same 5 kW at 150 rpm → 318 N·m."
    });
  },
  stress: () => {
    const F = rndi(5, 60) * 1000, d = pick([10, 12, 16, 20, 25, 30]);
    const A = Math.PI * (d / 1000) ** 2 / 4, s = F / A / 1e6;
    return makeQuestion({
      conceptId: "stress", level: 2, type: "num",
      prompt: `A circular tie bar of ${d} mm diameter carries an axial tensile load of ${(F / 1000).toFixed(1)} kN. Calculate the normal stress.`,
      unit: "MPa", answer: s, tol: 0.02,
      explanation: `A = πd²/4 = ${sig(A * 1e6, 4)} mm²; σ = F/A = ${F}/${sig(A, 4)} = ${sig(s, 4)} MPa.`,
      wrongWhy: "The area must be in m² (or the load in N with the area in mm²) — a unit slip of 10⁶ is the usual cause of a wrong answer.",
      misconception: "Using the diameter instead of the area, or mixing mm² with N.",
      reasoning: ["Section the bar and take the internal axial force F.", "Compute A = πd²/4.",
        "Apply σ = F/A.", `Interpret: ${sig(s, 3)} MPa — compare with the material yield strength to get the safety factor.`],
      similar: "A 12 mm bar at 20 kN gives 177 MPa."
    });
  },
  strain: () => {
    const L = pick([0.5, 1, 1.5, 2, 2.5]), dL = pick([0.4, 0.6, 0.8, 1.2, 1.6, 2.0]);
    const e = (dL / 1000) / L, ue = e * 1e6;
    return makeQuestion({
      conceptId: "strain", level: 2, type: "num",
      prompt: `A bar of ${L} m gauge length extends by ${dL} mm under load. Calculate the normal strain in microstrain (µε).`,
      unit: "µε", answer: ue, tol: 0.02,
      explanation: `ε = ΔL/L = ${dL / 1000}/${L} = ${sig(e, 3)} = ${sig(ue, 4)} µε.`,
      wrongWhy: "Both lengths must be in the same unit before dividing, and microstrain is 10⁻⁶.",
      misconception: "Confusing strain (dimensionless) with elongation (metres).",
      reasoning: ["Convert ΔL to metres.", "Divide by the gauge length.", "Multiply by 10⁶ for microstrain.",
        `Interpret: ${sig(ue, 3)} µε in steel corresponds to σ = Eε = ${sig(200e3 * e, 3)} MPa.`],
      similar: "1 mm extension over 2 m = 500 µε."
    });
  },
  elongation: () => {
    const F = rndi(10, 60) * 1000, d = pick([15, 20, 25, 30]), L = pick([1, 1.5, 2, 2.5]);
    const A = Math.PI * (d / 1000) ** 2 / 4, delta = F * L / (A * 200e9) * 1000;
    return makeQuestion({
      conceptId: "tension-compression", level: 2, type: "num",
      prompt: `A steel bar (E = 200 GPa) of ${d} mm diameter and ${L} m length carries ${(F / 1000).toFixed(0)} kN in tension. Calculate the elongation.`,
      unit: "mm", answer: delta, tol: 0.03,
      explanation: `σ = F/A = ${sig(F / A / 1e6, 4)} MPa; δ = FL/AE = ${sig(delta, 3)} mm.`,
      wrongWhy: "δ = FL/AE requires consistent SI units; the area is often the source of the error.",
      misconception: "Forgetting that elongation depends on length while stress does not.",
      reasoning: ["Compute A = πd²/4.", "Find σ = F/A.", "Apply δ = σL/E.",
        `Interpret: ${sig(delta, 3)} mm is ${delta < 2 ? "small — the bar is stiff" : "significant — check the tolerance stack-up"}.`],
      similar: "A 20 mm bar, 1.5 m long, at 40 kN extends 0.95 mm."
    });
  },
  bending: () => {
    const b = pick([30, 40, 50, 60]), h = pick([60, 80, 100, 120]), M = rndi(1, 6) * 1000;
    const I = (b / 1000) * (h / 1000) ** 3 / 12, s = M * (h / 2000) / I / 1e6;
    return makeQuestion({
      conceptId: "bending", level: 2, type: "num",
      prompt: `A rectangular beam section ${b} mm wide × ${h} mm deep carries a bending moment of ${(M / 1000).toFixed(1)} kN·m. Calculate the maximum bending stress.`,
      unit: "MPa", answer: s, tol: 0.03,
      explanation: `I = bh³/12 = ${sig(I * 1e12, 4)} mm⁴; σ = Mc/I = ${sig(s, 4)} MPa.`,
      wrongWhy: "The second moment of area uses the depth cubed — the most common slip is using b³h/12.",
      misconception: "Confusing I (m⁴) with the section modulus Z = I/c.",
      reasoning: ["Locate the neutral axis at mid-depth.", "Compute I = bh³/12.", "Take c = h/2.",
        "Apply σ = Mc/I.", `Interpret: ${sig(s, 3)} MPa — compare with the allowable bending stress.`],
      similar: "40×80 mm under 2 kN·m gives 46.9 MPa."
    });
  },
  torsion: () => {
    const d = pick([20, 25, 30, 40, 50]), T = rndi(1, 9) * 100;
    const J = Math.PI * (d / 1000) ** 4 / 32, tau = T * (d / 2000) / J / 1e6;
    return makeQuestion({
      conceptId: "torsion", level: 2, type: "num",
      prompt: `A solid circular shaft of ${d} mm diameter transmits a torque of ${T} N·m. Calculate the maximum shear stress.`,
      unit: "MPa", answer: tau, tol: 0.03,
      explanation: `J = πd⁴/32 = ${sig(J * 1e12, 4)} mm⁴; τ = Tc/J = ${sig(tau, 4)} MPa.`,
      wrongWhy: "τ ∝ 1/d³ — using the radius instead of the diameter, or b³ instead of d⁴ in J, are the usual errors.",
      misconception: "Confusing the polar second moment J with the bending second moment I.",
      reasoning: ["Compute J = πd⁴/32 for the solid circular section.", "Take c = d/2.",
        "Apply τ = Tc/J.", `Interpret: ${sig(tau, 3)} MPa of shear — check against the allowable shear stress (≈ 0.577σ_y for von Mises).`],
      similar: "A 30 mm shaft at 300 N·m gives 56.6 MPa."
    });
  },
  reynolds: () => {
    const v = pick([0.5, 1, 1.5, 2, 3, 4]), D = pick([15, 20, 25, 32, 50]), fluid = pick([["water", 1000, 0.001], ["oil", 870, 0.05], ["oil (cold)", 900, 0.2], ["air", 1.2, 1.8e-5]]);
    const [fn, rho, mu] = fluid, Re = rho * v * (D / 1000) / mu;
    return makeQuestion({
      conceptId: "reynolds", level: 2, type: "num",
      prompt: `${fn[0].toUpperCase() + fn.slice(1)} (${fn === "water" ? "ρ = 1000 kg/m³, μ = 1 mPa·s" : `ρ = ${rho} kg/m³, μ = ${mu} Pa·s`}) flows at ${v} m/s in a ${D} mm pipe. Calculate the Reynolds number.`,
      unit: "", answer: Re, tol: 0.03,
      explanation: `Re = ρvD/μ = ${rho} × ${v} × ${D / 1000} / ${mu} = ${sig(Re, 4)}. ${Re < 2300 ? "Laminar." : Re < 4000 ? "Transitional." : "Turbulent."}`,
      wrongWhy: "The diameter must be in metres and the viscosity in Pa·s (not mPa·s or cSt).",
      misconception: "Mixing kinematic and dynamic viscosity, or mm with m.",
      reasoning: ["Identify ρ, v, D and μ.", "Convert D to metres.", "Apply Re = ρvD/μ.",
        `Interpret: Re = ${sig(Re, 3)} ⇒ the flow is ${Re < 2300 ? "laminar (Δp ∝ v)" : Re < 4000 ? "transitional" : "turbulent (Δp ∝ v²)"}.`],
      similar: "Water at 2 m/s in a 25 mm pipe gives Re = 50,000."
    });
  },
  headloss: () => {
    const f = pick([0.018, 0.02, 0.022, 0.025]), L = rndi(20, 200) * 5, D = pick([25, 50, 80, 100]), v = pick([1, 1.5, 2, 2.5, 3]);
    const h = f * (L / (D / 1000)) * v * v / (2 * 9.81);
    return makeQuestion({
      conceptId: "head-losses", level: 2, type: "num",
      prompt: `Water flows at ${v} m/s through ${L} m of ${D} mm pipe with a Darcy friction factor f = ${f}. Calculate the friction head loss.`,
      unit: "m", answer: h, tol: 0.03,
      explanation: `h_f = f(L/D)v²/2g = ${f} × ${sig(L / (D / 1000), 4)} × ${v * v}/19.62 = ${sig(h, 4)} m.`,
      wrongWhy: "L/D must be dimensionless, so both in the same unit. The velocity is squared.",
      misconception: "Forgetting that head loss scales with v² in turbulent flow.",
      reasoning: ["Compute L/D.", "Apply the Darcy–Weisbach equation.",
        `Interpret: ${sig(h, 3)} m of head ≈ ${sig(h * 9.81, 3)} kPa of pressure loss, which the pump must supply.`],
      similar: "f = 0.02, L/D = 200, v = 3 m/s gives 1.83 m."
    });
  },
  pump: () => {
    const Q = pick([20, 30, 40, 50, 60, 80]), H = pick([15, 20, 25, 30, 40]), eta = pick([0.6, 0.65, 0.7, 0.75]);
    const Qs = Q / 3600, Ph = 1000 * 9.81 * Qs * H / 1000, Psh = Ph / eta;
    return makeQuestion({
      conceptId: "pumps-valves", level: 2, type: "num",
      prompt: `A pump delivers ${Q} m³/h of water against a total head of ${H} m with an efficiency of ${(eta * 100).toFixed(0)}%. Calculate the required shaft power.`,
      unit: "kW", answer: Psh, tol: 0.03,
      explanation: `Q = ${sig(Qs, 3)} m³/s; P_h = ρgQH = ${sig(Ph, 4)} kW; P_shaft = ${sig(Ph, 4)}/${eta} = ${sig(Psh, 4)} kW.`,
      wrongWhy: "Flow must be in m³/s, not m³/h — a factor of 3600 is the classic error.",
      misconception: "Confusing hydraulic power with shaft power (forgetting efficiency).",
      reasoning: ["Convert Q to m³/s.", "Apply P_h = ρgQH.", "Divide by the efficiency.",
        `Interpret: select a motor of at least ${sig(Psh * 1.15, 3)} kW allowing a service margin.`],
      similar: "50 m³/h at 30 m and η = 0.65 needs 6.3 kW."
    });
  },
  hydrostatic: () => {
    const hgt = rndi(2, 15), rho = pick([1000, 1000, 850, 870, 1030]);
    const p = rho * 9.81 * hgt / 1000;
    return makeQuestion({
      conceptId: "hydrostatics", level: 2, type: "num",
      prompt: `A tank contains liquid of density ${rho} kg/m³ to a depth of ${hgt} m. Calculate the gauge pressure at the base.`,
      unit: "kPa", answer: p, tol: 0.02,
      explanation: `p = ρgh = ${rho} × 9.81 × ${hgt} = ${sig(p * 1000, 4)} Pa = ${sig(p, 4)} kPa.`,
      wrongWhy: "Use gauge pressure consistently and keep g = 9.81 m/s².",
      misconception: "Forgetting that pressure depends on depth, not on the tank's shape or volume.",
      reasoning: ["Identify the depth below the free surface.", "Apply p = ρgh.",
        `Interpret: ${sig(p, 3)} kPa ≈ ${sig(p / 100, 3)} bar — the wall thickness and base design follow from this.`],
      similar: "10 m of water gives 98.1 kPa ≈ 1 bar."
    });
  },
  bernoulli: () => {
    const v1 = pick([1, 1.5, 2]), v2 = pick([4, 5, 6, 8]);
    const dp = 0.5 * 1000 * (v2 * v2 - v1 * v1) / 1000;
    return makeQuestion({
      conceptId: "bernoulli", level: 2, type: "num",
      prompt: `Water flows in a horizontal pipe and accelerates from ${v1} m/s to ${v2} m/s. Calculate the change in static pressure (state the drop as a positive number).`,
      unit: "kPa", answer: dp, tol: 0.03,
      explanation: `Δp = ½ρ(v₂² − v₁²) = ½ × 1000 × (${v2}² − ${v1}²) = ${sig(dp * 1000, 4)} Pa = ${sig(dp, 4)} kPa drop.`,
      wrongWhy: "The velocity is squared and the factor ½ must be kept; the sign indicates a pressure *drop*.",
      misconception: "Assuming pressure rises where velocity rises — Bernoulli says the opposite.",
      reasoning: ["Write Bernoulli between the two sections (z constant).", "Rearrange for Δp.",
        `Interpret: ${sig(dp, 3)} kPa of static pressure was converted into velocity head — this is what a venturi meter measures.`],
      similar: "1 → 4 m/s gives a 7.5 kPa drop."
    });
  },
  npsh: () => {
    const T = pick([20, 40, 60, 70]), pv = { 20: 2.34, 40: 7.38, 60: 19.9, 70: 31.2 }[T];
    const zs = -pick([2, 2.5, 3, 3.5]), hf = pick([0.3, 0.5, 0.8, 1.0]);
    const a = (101.3 - pv) / (9.81 * (T > 55 ? 0.983 : 1)) + zs - hf;
    return makeQuestion({
      conceptId: "cavitation", level: 4, type: "num",
      prompt: `A pump draws water at ${T} °C (vapour pressure ${pv} kPa) from a sump ${Math.abs(zs)} m below the pump centreline. Suction line losses are ${hf} m and atmospheric pressure is 101.3 kPa. Calculate NPSH_a.`,
      unit: "m", answer: a, tol: 0.05,
      explanation: `NPSH_a = (p_atm − p_v)/ρg + z_s − h_f = (101.3 − ${pv})/9.81 + (${zs}) − ${hf} = ${sig(a, 3)} m.`,
      wrongWhy: "The suction lift is negative (the liquid is below the pump) and the vapour pressure must be subtracted before dividing by ρg.",
      misconception: "Treating NPSH as a pump property. NPSH_a belongs to the installation; NPSH_r belongs to the pump.",
      reasoning: ["Convert pressures to head.", "Apply the sign convention for a suction lift.",
        "Subtract the suction friction.", `Interpret: NPSH_a = ${sig(a, 3)} m — a pump requiring more than this will cavitate. ${a < 4 ? "The margin is thin; hot water makes this critical." : "The margin is reasonable."}`],
      similar: "At 60 °C with a 3 m lift, NPSH_a ≈ 4.8 m."
    });
  },
  euler: () => {
    const L = pick([1.5, 2, 2.5, 3]), I = pick([2, 3, 4, 6, 8]) * 1e-6, K = pick([1, 0.7, 0.5]);
    const P = Math.PI ** 2 * 200e9 * I / (K * L) ** 2 / 1000;
    return makeQuestion({
      conceptId: "buckling", level: 4, type: "num",
      prompt: `A steel column (E = 200 GPa, I = ${I * 1e6} × 10⁶ mm⁴) is ${L} m long with an effective length factor K = ${K}. Calculate the Euler critical buckling load.`,
      unit: "kN", answer: P, tol: 0.03,
      explanation: `P_cr = π²EI/(KL)² = π² × 200×10⁹ × ${I} / (${K * L})² = ${sig(P, 4)} kN.`,
      wrongWhy: "The effective length KL, not the physical length, goes into the formula — and it is squared.",
      misconception: "Believing that a stronger steel increases the buckling load. Euler depends on E only.",
      reasoning: ["Determine the effective length KL from the end conditions.", "Use the *minimum* second moment of area.",
        "Apply the Euler formula.", `Interpret: ${sig(P, 3)} kN — check the slenderness to confirm Euler is valid, and apply a safety factor of 2–3.`],
      similar: "A pinned 2 m column with I = 4×10⁻⁶ m⁴ buckles at 197 kN."
    });
  },
  vessel: () => {
    const p = pick([1, 2, 5, 10, 15]), r = pick([150, 200, 250, 300]), t = pick([5, 6, 8, 10, 12]);
    const sh = p * 1e6 * (r / 1000) / (t / 1000) / 1e6;
    return makeQuestion({
      conceptId: "pressure-fluids", level: 3, type: "num",
      prompt: `A thin-walled cylindrical pressure vessel has an internal radius of ${r} mm, a wall thickness of ${t} mm and an internal pressure of ${p} MPa. Calculate the hoop stress.`,
      unit: "MPa", answer: sh, tol: 0.02,
      explanation: `σ_hoop = pr/t = ${p} × ${r}/${t} = ${sig(sh, 4)} MPa. The axial stress is half this value.`,
      wrongWhy: "Keep r and t in the same unit; the ratio r/t is what matters.",
      misconception: "Confusing hoop stress with axial stress — hoop is twice as large and governs the design.",
      reasoning: ["Confirm the thin-wall assumption r/t > 10.", "Apply σ_hoop = pr/t.",
        "Halve it for the axial stress.", `Interpret: σ_hoop = ${sig(sh, 3)} MPa — with σ_y = 355 MPa the factor of safety is ${sig(355 / sh, 3)}.`],
      similar: "p = 10 MPa, r = 250 mm, t = 8 mm gives 312.5 MPa."
    });
  },
  vm: () => {
    const s1 = rndi(6, 24) * 10, s2 = rndi(0, 10) * 10;
    const vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
    return makeQuestion({
      conceptId: "vonmises", level: 4, type: "num",
      prompt: `At a point in a loaded component the principal stresses are σ₁ = ${s1} MPa and σ₂ = ${s2} MPa (plane stress). Calculate the von Mises equivalent stress.`,
      unit: "MPa", answer: vm, tol: 0.02,
      explanation: `σ_vm = √(σ₁² − σ₁σ₂ + σ₂²) = √(${s1}² − ${s1}×${s2} + ${s2}²) = ${sig(vm, 4)} MPa.`,
      wrongWhy: "The cross term −σ₁σ₂ is easy to omit; it is what makes hydrostatic stress produce zero von Mises stress.",
      misconception: "Using σ₁ alone, or adding the principal stresses algebraically.",
      reasoning: ["Identify the principal stresses.", "Apply the plane-stress von Mises formula.",
        `Interpret: compare ${sig(vm, 3)} MPa with σ_y to obtain the safety factor n = σ_y/σ_vm.`],
      similar: "σ₁ = 200, σ₂ = 100 MPa gives σ_vm = 173 MPa."
    });
  },
  impact: () => {
    const m = pick([0.5, 1, 2, 5]), v = pick([4, 6, 8, 10]), tms = pick([2, 4, 5, 10, 20]);
    const F = m * v / (tms / 1000);
    return makeQuestion({
      conceptId: "impulse-momentum", level: 3, type: "num",
      prompt: `A ${m} kg mass travelling at ${v} m/s is brought to rest in ${tms} ms. Calculate the average impact force.`,
      unit: "N", answer: F, tol: 0.02,
      explanation: `F = Δ(mv)/Δt = ${m} × ${v}/${tms / 1000} = ${sig(F, 4)} N.`,
      wrongWhy: "Time must be in seconds. A millisecond-scale impact produces a very large force.",
      misconception: "Using energy instead of momentum for a short-duration force.",
      reasoning: ["Identify the momentum change.", "Divide by the impact duration.",
        `Interpret: ${sig(F, 3)} N. Extending the time tenfold would reduce this tenfold — the principle of cushioning.`],
      similar: "A 0.5 kg hammer at 8 m/s stopping in 4 ms gives 1000 N."
    });
  },
  naturalfreq: () => {
    const m = pick([50, 100, 200, 500]), k = pick([2, 4, 8, 16]) * 1e5;
    const f = Math.sqrt(k / m) / (2 * Math.PI);
    return makeQuestion({
      conceptId: "vibrations", level: 3, type: "num",
      prompt: `A machine of mass ${m} kg is mounted on isolators with a combined stiffness of ${k / 1e5} × 10⁵ N/m. Calculate the natural frequency.`,
      unit: "Hz", answer: f, tol: 0.03,
      explanation: `f_n = (1/2π)√(k/m) = (1/2π)√(${k}/${m}) = ${sig(f, 3)} Hz.`,
      wrongWhy: "ω_n is in rad/s; dividing by 2π converts it to Hz. The two are often confused.",
      misconception: "Assuming isolation works at any frequency — it only works above r = √2.",
      reasoning: ["Apply ω_n = √(k/m).", "Convert to Hz.",
        `Interpret: the machine must not be excited near ${sig(f, 3)} Hz. For isolation, keep the excitation above ${sig(f * 1.414, 3)} Hz.`],
      similar: "200 kg on 8×10⁵ N/m gives 10.1 Hz."
    });
  },
  ke: () => {
    const m = pick([200, 500, 1000, 1500]), v = pick([5, 10, 15, 20]);
    const T = 0.5 * m * v * v / 1000;
    return makeQuestion({
      conceptId: "energy", level: 2, type: "num",
      prompt: `A ${m} kg mass moves at ${v} m/s. Calculate its kinetic energy.`,
      unit: "kJ", answer: T, tol: 0.02,
      explanation: `T = ½mv² = ½ × ${m} × ${v}² = ${sig(T * 1000, 4)} J = ${sig(T, 4)} kJ.`,
      wrongWhy: "The velocity is squared — doubling the speed quadruples the energy.",
      misconception: "Treating kinetic energy as proportional to speed rather than to its square.",
      reasoning: ["Apply T = ½mv².", "Convert to kJ if required.",
        `Interpret: a brake or absorber must dissipate ${sig(T, 3)} kJ — the reason stopping distance grows with the square of speed.`],
      similar: "1500 kg at 20 m/s stores 300 kJ."
    });
  }
};

/* which generators serve which concept (for randomised practice) */
const CONCEPT_GENERATORS = {
  "moment": ["moment"], "torque": ["torque"], "couples": ["moment"],
  "stress": ["stress"], "strain": ["strain"], "normal-shear": ["stress"],
  "tension-compression": ["elongation", "stress"], "bending": ["bending"],
  "torsion": ["torsion"], "safety-factor": ["stress", "vm"],
  "principal-stresses": ["vm"], "mohr": ["vm"], "vonmises": ["vm"],
  "tresca": ["vm"], "yield-criteria": ["vm"],
  "reynolds": ["reynolds"], "head-losses": ["headloss"], "pumps-valves": ["pump"],
  "hydrostatics": ["hydrostatic"], "bernoulli": ["bernoulli"],
  "flow-rate": ["headloss"], "cavitation": ["npsh"],
  "pressure-fluids": ["hydrostatic", "vessel"], "compressible-flow": ["bernoulli"],
  "buckling": ["euler"], "impulse-momentum": ["impact"],
  "vibrations": ["naturalfreq"], "energy": ["ke"], "work": ["ke"],
  "power": ["pump", "torque"], "deflection": ["bending"],
  "fluid-properties": ["reynolds"], "viscosity": ["reynolds"],
  "hooke-law": ["strain", "elongation"], "elastic-constants": ["strain"],
  "stress-concentration": ["stress"], "fatigue": ["vm", "stress"],
  "friction": ["moment"], "equilibrium": ["moment"], "reactions": ["bending"],
  "shear-moment-diagrams": ["bending"], "centroid": ["bending"]
};

/* ══════════════════════════════════════════════════════════
   QUESTION RESOLUTION
   ══════════════════════════════════════════════════════════ */
function bankFor(conceptId, level) {
  const b = QUESTION_BANK[conceptId];
  if (!b) return [];
  return (b[level] || []).slice();
}

/* generic pedagogical fallbacks so every concept × level has a question */
function fallbackQuestion(conceptId, level) {
  const t = TOPICS[conceptId];
  if (!t) return null;
  const gens = CONCEPT_GENERATORS[conceptId] || [];
  if (level === 2 && gens.length) {
    const q = GEN_TEMPLATES[pick(gens)]();
    q.conceptId = conceptId;
    return q;
  }
  if (level === 1) {
    const w = pick(t.vocab);
    const others = shuffle(TOPIC_LIST.filter(x => x.id !== conceptId)).slice(0, 3).map(x => x.title);
    const opts = shuffle([t.simple, ...others.map(o => o)]);
    return makeQuestion({
      conceptId, level: 1, type: "mcq",
      prompt: `Which statement best describes “${t.title}”?`,
      choices: opts, answer: opts.indexOf(t.simple),
      explanation: `${t.title}: ${t.simple} In engineering terms — ${t.engineering}`,
      wrongWhy: "That statement describes a different concept. Return to the definition and identify what makes this one specific.",
      misconception: "Mixing up closely related mechanics concepts.",
      reasoning: ["Recall the physical picture of the concept.", "Identify the key quantity involved.",
        "Eliminate the options that describe other concepts.", "Confirm with the engineering definition."],
      similar: `${w[0]}: ${w[1]}.`
    });
  }
  if (level === 3) {
    const rel = shuffle((t.connections || []).filter(c => TOPICS[c]));
    const opts = shuffle([TOPICS[rel[0] || conceptId].title, ...shuffle(TOPIC_LIST.filter(x => x.section !== t.section)).slice(0, 3).map(x => x.title)]);
    const right = TOPICS[rel[0] || conceptId].title;
    return makeQuestion({
      conceptId, level: 3, type: "mcq",
      prompt: `You have just analysed “${t.title}”. Which concept comes next in the engineering reasoning chain for this component?`,
      choices: opts, answer: opts.indexOf(right),
      explanation: `${t.title} → ${right}. ${t.chain ? "The full chain: " + t.chain.join(" → ") + "." : ""}`,
      wrongWhy: "That concept is not the immediate next step from this one. Trace the load path: what does this analysis feed into?",
      misconception: "Treating concepts as isolated topics instead of links in a reasoning chain.",
      reasoning: ["Identify what the current analysis produces.", "Ask which decision that output supports.",
        "Choose the concept that consumes it.", "Check the chain makes physical sense end to end."],
      similar: `Force → Moment → Stress → Deformation → Failure → Design.`
    });
  }
  /* level 4 — industrial: short explanation with keyword marking */
  const keys = (t.vocab || []).slice(0, 3).map(v => v[0].toLowerCase());
  return makeQuestion({
    conceptId, level: 4, type: "explain",
    prompt: `Industrial scenario: a component involving ${t.title.toLowerCase()} has been reported as problematic in service. In 2–4 sentences, explain (in English) what you would check first, which physical principle governs it, and what measurement would confirm your diagnosis.`,
    context: `Reference concept: ${t.title}. Core question of this domain: ${SECTION_BY_ID[t.section] ? SECTION_BY_ID[t.section].core : ""}`,
    keywords: keys.concat((t.title.toLowerCase().split(/\s+/)[0])),
    explanation: `A strong answer names the governing principle (${t.title}), states the physical mechanism, and proposes a measurable check. Key vocabulary: ${keys.join(", ")}.`,
    wrongWhy: "The answer does not connect the symptom to a physical mechanism, or it does not propose a verification step.",
    misconception: "Describing symptoms without identifying the governing physics.",
    reasoning: ["What is the system and its boundary?", "Which mechanics domain applies?",
      "What loads and assumptions?", "Which law and equation govern it?",
      "What measurement confirms the diagnosis?"],
    similar: t.chain ? t.chain.join(" → ") : ""
  });
}

/* main entry: get a question for a concept at a level */
function questionFor(conceptId, level, opts = {}) {
  const t = TOPICS[conceptId];
  if (!t) return null;
  const gens = CONCEPT_GENERATORS[conceptId] || [];
  /* prefer a generated numeric question at level 2/3 if available and variety is wanted */
  if (!opts.staticOnly && (level === 2 || level === 3) && gens.length && Math.random() < 0.6) {
    const q = GEN_TEMPLATES[pick(gens)]();
    q.conceptId = conceptId;
    q.level = level;
    return q;
  }
  let pool = bankFor(conceptId, level);
  if (opts.excludeIds) pool = pool.filter(q => !opts.excludeIds.includes(q.id));
  if (pool.length) {
    const q = pick(pool);
    return makeQuestion(Object.assign({}, q, { id: q.id }));
  }
  /* try adjacent level, else fall back to the generated question */
  const near = [level - 1, level + 1].filter(l => l >= 1 && l <= 4);
  for (const l of near) {
    const p = bankFor(conceptId, l);
    if (p.length) return makeQuestion(Object.assign({}, pick(p), { level }));
  }
  return fallbackQuestion(conceptId, level);
}

/* random question across a set of concepts */
function randomQuestion(conceptIds, level, opts = {}) {
  const ids = conceptIds && conceptIds.length ? conceptIds : TOPIC_LIST.map(t => t.id);
  const cid = pick(ids);
  return questionFor(cid, level || pick(ALL_LEVELS), opts);
}

/* total counts (for UI display) */
function bankStats() {
  let n = 0, byType = {};
  TOPIC_LIST.forEach(t => ALL_LEVELS.forEach(l => {
    bankFor(t.id, l).forEach(q => { n++; byType[q.type] = (byType[q.type] || 0) + 1; });
  }));
  return { curated: n, generators: Object.keys(GEN_TEMPLATES).length, byType };
}
