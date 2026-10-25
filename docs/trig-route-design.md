# From launch to rescue: the trigonometry route

Review of Robin's outline (25 October 2026) and a revised plan. The outline's core is right and
should be kept: manipulate first, discover relationships second, name them last; every number
controls something visible; wrong settings give visible feedback, never damage. The notes below
are about where the outline is uneven and how to make the stations feel different from each
other while sharing one engine.

## What the outline gets right

- Steps 1–3 are a very good opening. The angle is a turn you make, the components are two scales
  you read, and the trade-off is felt by rotating a fixed beam. The triangle appears on the
  instrument, not on a diagram.
- Step 8 (swap cameras, the labels swap) attacks the single most common misconception head-on,
  with the structure held still. Keep it exactly as written.
- Step 9's choice of sensor is the right way to teach which inverse to use: the available
  measurements decide, not the teacher.
- Step 10 is a proper capstone: choose the angle, pick the sides, pick the relationship,
  rearrange, commit.

## Problems

### 1. The two routes do not teach the same things

| | Route A (moon far side) | Route B (salvage station) |
|---|---|---|
| sin forward | A5 | — |
| cos forward | — | B4 |
| tan forward | A6 | — |
| rearranging for the hypotenuse | — | B5 |
| an inverse function | — (table lookup only) | B6 (tan⁻¹) |

Step 7 only patches sin/cos. A Route A player reaches the beacon never having rearranged a
formula or pressed an inverse button; a Route B player has never used tan forwards, and meets
tangent for the first time *through its inverse*, which is the wrong way round. Route B is also
simply harder: two rearrangements and an inverse against Route A's two forward formulas.

**Fix.** Both routes carry the same three skills in different clothing, and the merge section
does the comparing rather than the catching-up:

| Skill | Route A | Route B |
|---|---|---|
| a ratio is constant for a given angle | ramp: double the ramp, double the drop | tractor beam: double the range, double the forward reach |
| name a ratio and use it forwards | sine on the ramp controller | cosine on the capture controller |
| use a ratio backwards (find a length) | cable: opposite = adjacent × tan | salvage arm: hypotenuse = adjacent ÷ cos |
| find an angle from two lengths | ramp table lookup (an inverse, before the word) | tan⁻¹ on the aiming head |

Then 7 (the other of sin/cos), 8 (opposite/adjacent swap), 9 (sin⁻¹ and cos⁻¹), 10 (capstone)
work for either route. Tangent forwards still only appears on Route A; give Route B a tangent
forwards at station 7 instead of the sin/cos swap-in, and move the "whichever you haven't met"
logic to a small table in code rather than prose.

### 2. The route choice has no stakes

Step 3 is a lovely way to make a decision (rotating the beam *is* the choice), but the player
has no reason to prefer one marker. Give the two routes a character each: Mara recommends the
salvage station (procedure, other people, a docking log), Marvin recommends the far side
(nobody there). Coolie reports the beam reach for both. The player picks a side in an argument,
not a menu.

### 3. "The ship labels this relationship sine"

Naming should come from a character, not the ship. Coolie is the obvious instrument voice: she
has spent the whole opening stating readings flatly, so "Drop divided by ramp length is zero
point five. At thirty degrees it is always zero point five. The ratio is called sine." is in
character. Marvin then gets an admiration beat and a dig at the jargon. That keeps the learning
thread inside the same three voices the player already knows, in the pattern we settled for the
banter: open question, technical answer, Marvin hears what he wants to hear.

### 4. "Predict before testing" is a mechanic, not a mood

The outline says later tasks ask Arthur to predict a setting. Make that a concrete control
state. Every station has two modes:

- **Scrub.** The mechanism follows the control live. Used by every station on first visit.
- **Set and commit.** The control is a dial or number; nothing moves until Arthur presses
  Commit. The mechanism then moves at a fixed speed and the result is visible (cable lands in
  mist, pod drifts past the beam, ramp hangs over the drop). Retry is one button.

Stations 1–3 are scrub only. Route stations start in scrub and lock to commit for the last
target. Stations 9 and 10 are commit only.

### 5. It is one instrument wearing ten costumes

Scanner, rangefinder, tractor beam, aiming head, ramp, salvage arm, maintenance arm, docking arm
are all the same object: a hinged segment with an angle and a length, whose tip projects onto
two perpendicular scales. That is good news for building (one `Segment` in `world.js`, skinned
per station) and bad news for the player if every station feels like turning the same dial.
The answer is to vary what the player *holds*, not what the maths is. See the station table.

### 6. Scope

Ten stations is roughly four times the opening we have. Build in this order and stop at any
point with a playable game:

1. The `Segment` instrument and stations 1–3 (one shared scene, the cockpit).
2. Route A (three stations, one moon scene) and a temporary straight-to-finale.
3. Stations 7–10 (beacon scene).
4. Route B.

## Stations and interactions

The principle: each station changes at least two of **what you control**, **what is hidden**,
**the input gesture**, and **the feedback**. Columns: C = concept; Control = the thing Arthur
moves; Hidden = the quantity he cannot read directly; Gesture = how he moves it; Feedback = how
the world answers.

### Shared cockpit (life shuttle 07)

| # | Station | C | Control | Hidden | Gesture | Feedback |
|---|---|---|---|---|---|---|
| 1 | Scanner | angle is a turn from "ahead" | angle | nothing | drag the scanner housing round, or ← → | beam passes through the gap in the debris; Mara: "that's it, hold there" |
| 2 | Rangefinder | one diagonal = forward + sideways | length | nothing | hold ↑ to extend, ↓ to retract, angle locked | tip drops a dashed line to each scale; both readouts tick up together |
| 3 | Route beam | same diagonal, trade forward for sideways | angle, length locked | nothing | drag the beam tip in an arc | forward readout falls as sideways rises; two markers light when swept |

Station 1 lets the scanner go all the way round, so 0° to 360° is seen once, before the game
settles into 0° to 90° for the rest.

### Route A: the moon's far side

| # | Station | C | Control | Hidden | Gesture | Feedback |
|---|---|---|---|---|---|---|
| A4 | Landing ramp | same angle → same ratio | ramp angle | nothing | pull a lever down (like the airlock handle) | ramp foot touches the ledge, or hangs, or digs in; second ledge with a longer ramp |
| A5 | Ramp controller | sine, named | angle, from a lookup strip | drop (you only see the ledge) | choose a row on the strip, then Commit | ramp deploys at that angle; lands or misses by the shortfall shown on the scale |
| A6 | Cable launcher | tangent used backwards | cable payout (a length) | crossing distance (mist) | turn a winch dial to set payout, then Fire | cable lands on the anchor, or falls short into the mist, or overshoots and snags |

A5 is the only place a table is used, deliberately: Arthur finds an angle from a ratio by
reading a strip *before* he meets the ⁻¹ button in 9. Coolie built the strip from his A4
measurements.

### Route B: the asteroid salvage station

| # | Station | C | Control | Hidden | Gesture | Feedback |
|---|---|---|---|---|---|---|
| B4 | Tractor beam | cosine, named | angle, range locked | nothing | rotate a joystick (mouse drag anywhere in a circle) | forward reach must stay inside a painted capture zone; pod drifts in or past |
| B5 | Salvage arm | cos used backwards | extension | the diagonal (bulkhead blocks the view) | type a length, or hold a key to extend, then Commit | arm reaches the cell, or stops short of it, or punches the bulkhead and resets |
| B6 | Aiming head | tan⁻¹ | angle | the pod (dust) | enter two readings, press the ⁻¹ key, then Light | beam light reveals the pod dead centre, or off to one side by the error |

B4 is the "constraint" station: not "hit the target" but "keep a reading inside a zone", which
is a different kind of hand feel.

### The beacon (both routes)

| # | Station | C | Control | Hidden | Gesture | Feedback |
|---|---|---|---|---|---|---|
| 7 | Maintenance arm | the ratio this route skipped | angle and length | nothing | two sliders, one per quantity | vertical and forward reach shown on the beacon mast; Coolie names the missing one |
| 8 | Cable cameras | opposite/adjacent swap | which camera | nothing | press Tab to swap ends | structure still; the highlighted angle jumps; the two labels swap |
| 9 | Elevation | sin⁻¹ and cos⁻¹ | which sensor, then angle | the angle itself | pick a sensor card, then a ⁻¹ key, Commit | rescue ship enters the beam cone, or passes above/below it |
| 10 | Docking arm | everything | angle, then extension | nothing, but the outcrop is in the way | dial, number, Commit; revise freely before Commit | platform lands on the deck, or the arm clips the rock and retracts |

Station 8 has no maths to get wrong and no commit; it is a two-minute look.

## Dialogue roles on the route

- **Mara** sets the task over comms and never explains. "Lifeboat Seven, there's a gap at your
  two o'clock." She is wrong about nothing and warm about nothing; Marvin's digs stay petty.
- **Marvin** proposes the test ("before we trust her coordinates"), undercuts the task, and gets
  the admiration beat after each of Coolie's namings. He carries Coolie off the shuttle in A5
  ("Finally, a member of this expedition worth protecting.") and insists on her at 7.
- **Coolie** reads the instruments. Every number in the game that is spoken is hers. She names
  sine, cosine and tangent, in that flat register, and never explains why anyone should care.
- **Arthur** still never speaks.

The ending stands: Coolie boards first, and the rescue ship's Wi-Fi is found wanting.

## As built (25 October 2026)

`src/voyage.js` implements the plan above with these concrete numbers. Angles recur deliberately:
30°, 45° and 60° carry almost everything, so 0.5 at 30° becomes familiar.

| # | Station | Fixed | Target | Gesture |
|---|---|---|---|---|
| 1 | Scanner | range 10 m | gap at 40° | drag / ← → |
| 2 | Rangefinder | angle 40° | range 10 m (fwd 7.7, side 6.4) | drag along beam / ↑ ↓ |
| 3 | Course | range 10 m | moon 30° or station 60° | drag, then Commit |
| A4 | Ramp | ramp 4 m then 8 m | drop 2 m then 4 m (30°) | lever |
| A5 | Ramp controller | ramp 6 m | drop 4.24 m (45°) | lookup strip, Deploy |
| A6 | Cable | rim 6 m | sight 30°, payout 3.46 m | drag sight, winch dial, Fire |
| B4 | Tractor | range 8 m | fwd in [3.5, 4.5], pod at 60° | joystick drag |
| B5 | Salvage arm | fwd 4 m, angle 45° then 60° | 5.66 m then 8 m | typed number, Extend |
| B6 | Aiming head | fwd 6, side 3.46 | 30° | ratio box + tan⁻¹, dial, Light |
| 7 | Maintenance arm | panel at (5.2, 3) | 30°, 6 m | two sliders |
| 8 | Cable cameras | mast 6, run 8, cable 10 | see both ends | Tab, Continue |
| 9 | Elevation | ship at slant 8, height 4, forward 6.9 | 30° | sensor card (3), sin⁻¹/cos⁻¹/tan⁻¹, dial, Commit |
| 10 | Docking arm | deck 4 m up, 3–6 m along; rock 0.8 m at 1–2 m | any θ from 39° to 53° with reach 4/sin θ | dial + number, Commit |

Coverage check: Route A meets sin (A5), tan (A6) and cos (7) forwards, and all three inverses at
9. Route B meets cos (B4, B5) and tan⁻¹ (B6), then sin and tan forwards at 7 (Coolie reads both),
and all three inverses at 9. Station 9 offers three sensors so the player chooses the inverse from
the pair of readings he has.

## Engine notes

- One `Segment` object in `world.js`: pivot, angle, length, two scales, dashed drop-lines to
  each scale, optional hidden flags per quantity. Stations skin it.
- Stations become a registry, replacing the `activeStation()` chain in `game.js`: each has
  `enter`, `update(dt)`, `commit`, `exit`, and the scrub/commit mode flag. The airlock handle and
  launch button already follow this shape (focus view, `projectUI` hit area, `setView`).
- Readings go through Coolie's `say` with the spoken-form trick we used for dates, so "zero
  point five" is synthesised while the caption shows 0.5.
- Scenes: cockpit (existing shuttle, new window view), moon ledge, salvage station, beacon.
  Each is a small set like the lounge, reached by a cut, not by walking.
