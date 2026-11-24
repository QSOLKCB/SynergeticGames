# Sources, mathematics and design

Built for the School of Tomorrow by QSOL-IMC as independent contributors to open science. We are not members of the School of Tomorrow. No official publication or endorsement is claimed.

## Inspected sources

| Source | Pinned revision / page | Use |
|---|---|---|
| RyanJBuchanan/RayShare | `e0f7fe59331b5a09ac1e20164a12280202ab44d0`, `app.js` | Adapted raycaster and two-observer facing relationship |
| QSOLKCB/VANILLAJS | `68a3e94aa0bd8d44b6c0139742605d9dd9425147` | Direct imports of unchanged clock, math, PCM and playback modules |
| QSOLKCB/VANILLAJS display API | `2d5caddc93154874e9bdb582de6a830356b360aa`, `api/display/index.js` | Unchanged fit/page/fullscreen controller, with input clearing and graceful denial fallback |
| QSOLKCB/synergetics2 | `96aae2de4a02cd4df86ff2db68af07b1ce7ea1a3`, `js/math.js`, `js/content.js` | Vendored geometry; educator reference for independently written puzzles |
| Kirby Urner | [The Proposal (Martian Math Portfolio)](https://www.youtube.com/watch?v=wxMmUJygIRg) | Curriculum direction: tetrahedral accounting, relationships and exploratory artifacts |
| Polydactica | [Earthbound Music](https://www.youtube.com/playlist?list=PLbcn_8NsfcIrKQPqpC8VTEeTPBVlRe0E4) | Broad mood reference for an original retro score |

The two channels were inspected in the requested cloud browser. Kirby's video transcript was read; its media player remained at the start, so full audiovisual viewing is not claimed. The playlist contained two Pollyanna arrangements and an Onett Sega Genesis remix. Playlist titles were inspected; listening to those recordings is not claimed.

## Mathematical conventions

The educational model follows [Synergetics 95](https://qsolkcb.github.io/synergetics2/#/home). Its selected topic links are also attached to each game experiment.

- The unit tetrahedron has all six edges equal to 1. Its Euclidean volume is √2/12. Multiplying Euclidean volume by 6√2 gives tetravolume.
- With the same edge length, the regular octahedron has tetravolume 4, and the cuboctahedron/vector equilibrium has tetravolume 20. Tests triangulate the actual outward-oriented meshes into origin-based tetrahedra and independently check the totals. These volume ratios are not a claim of tiling one solid with whole regular copies of another.
- The twelve nearest-neighbour vectors are the permutations of `(0, ±1, ±1)/√2`. Each has length 1, each has a unique opposite, and all twelve sum to zero.
- Quadray basis vectors are `(±1, ±1, ±1)√2/4`, using the four tetrahedral sign combinations in the source. Their sum is zero. Subtracting a shared minimum preserves the represented point. The game takes `[5,3,4,3]` to `[2,0,1,0]`.
- Geometry uses binary64 and numeric tolerances. The integer coordinates and combinatorial counts are exact; the rendered projection is floating point. No formal proof or cross-engine bitwise movement guarantee is claimed.

The game does not reconstruct a hinged Jitterbug motion, represent Fuller's whole philosophy as established physics, or conflate Fuller's Synergetics with Haken's separate theory. The broader concentric hierarchy motivates the expedition; the first milestone teaches the specific equal-edge comparisons listed above, not a complete hierarchy reconstruction.

## Architecture and extensions

`game.js` owns the fixed-tick state and validated puzzle transitions. `world.js` declares the map, exhibit coordinates and educational facts. `render.js` draws the raycast world and 3D holograms without WebGL. `music.js` constructs the original four-lane integer PCM score. `app.js` owns keyboard/touch, pause, native dialogs and I/O.

RayShare's two views become two player-controlled probes; this is a single-player perspective-switching game, not network multiplayer. The engine finale requires both within three map units of the core, a clear line of sight, both facing within π/7 radians of each other, and 120 consecutive held-link ticks at 60 Hz.

The score is a 16-second, four-phrase loop with a triangle bass, plucked triangle lead, quiet saw chord tones and seeded percussion. Audio device timing is presentation only. Puzzle progress and movement do not depend on whether sound plays. Original score WAV SHA-256: `b2108a62f79dca00bb515c190d3c021b3d6adf837ea86398a6cf2fea579beee3`.

The v0.2 presentation adds seven original bounded PCM cues, unchanged-source VANILLAJS display modes, face-normal lighting using VANILLAJS vector operations, seeded decorative particles, and coloured floor trails. All are presentation aids, not new geometric or physical claims. The compass points towards the next unfinished exhibit; it is a bearing, not a route planner. Quadray basis vertices and the marked point use the same rotation and scale. Existing version-1 expedition saves remain compatible. Reduced motion freezes exhibit rotation, bobbing and decorative particles.

For later milestones: authored station packs, additional geometry experiments, cooperative challenge design and a classroom route. None is claimed as already implemented. The first game deliberately has a small, inspectable state model and no runtime dependencies outside the source tree.

## Volume Exchange (MUSEUM-001C)

Public curriculum reference: Kirby Urner, [Qvolume.ipynb, XYZ : IVM Conversion (S3)](https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/Qvolume.ipynb), inspected at commit `8d30d18fa1dde164317f2e21ae7e6c29ab2060df`. Its radius/diameter convention and S3 factor inform this independently authored exhibit. No notebook code, external images, private correspondence or unpublished material is redistributed. See [VOLUME_EXCHANGE.md](VOLUME_EXCHANGE.md) for derivation and precision.

## VOLUME-001 public references

Kirby Urner, [TetraBook.ipynb](https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/TetraBook.ipynb) (thanks in the notebook to Alan Michelson and David Koski), [Qvolume.ipynb](https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/Qvolume.ipynb), and [VolumeTalk.ipynb](https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/VolumeTalk.ipynb), inspected at the pinned revision. Euclid, Elements VI.31, [Clay Mathematics Institute](https://www.claymath.org/euclid_index/similar-figures-and-proportions/?chapter=31), supports similar figures on right triangle sides. These are mathematical references; the source, diagrams and visitor actions are original, with no notebook code or media redistributed. No private correspondence or unpublished research is shipped.

## QUADRAY-001 public references

At School_of_Tomorrow revision `8d30d18fa1dde164317f2e21ae7e6c29ab2060df`, inspected Mapping_Quadrays.ipynb, QuadraysResearch.ipynb, Rendering_IVM.ipynb, Qvolume.ipynb, qrays.py and QuadCraft2.html. See [pinned tree](https://github.com/4dsolutions/School_of_Tomorrow/tree/8d30d18fa1dde164317f2e21ae7e6c29ab2060df). Independently authored models and graphics use the mathematical conventions; no notebook code, QuadCraft scripts or media are copied. The Qvolume notebook acknowledges Tom Ace for the Quadray determinant enhancement. No endorsement implied.

## EPISTEMIC-001 public reference

Sergei Artemov and Benjamin Prud'homme, Strategic disclosure and epistemic manipulation in extensive games, [arXiv:2611.17084v1](https://arxiv.org/abs/2611.17084v1) (November 2026). The public abstract motivates truthful commitments and maximin decisions; the museum's finite two-stage example is original and does not reproduce the paper's general theorem. RayShare inspires the two observer roles. No private correspondence or unpublished material used.

## INFERENCE-001 public reference

Christian Knoll, [Understanding the Behavior of Belief Propagation](https://arxiv.org/abs/2209.05464), arXiv:2209.05464. General background on BP behaviour; the museum uses independently authored bounded pairwise XOR examples, not a reproduction of thesis experiments or a QEC decoder. No private research used.
