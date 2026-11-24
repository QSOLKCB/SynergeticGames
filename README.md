# SynergeticGames — The Living Museum

**A modular science museum that can be cloned, audited, played and extended.**

Discover mathematics by doing mathematics. Walk through interactive exhibits, change a representation, make a prediction, test a relationship and inspect the evidence. A museum is not a textbook with a movement controller: the interaction itself should reveal the idea.

Built for the School of Tomorrow by QSOL-IMC as independent contributors to open science. **We are not members of the School of Tomorrow.** This is an independent contribution, not an official publication, affiliation or endorsement.

[Play the current museum expedition](https://qsolkcb.github.io/SynergeticGames/) · [Roadmap](ROADMAP.md) · [Design charter](docs/MUSEUM.md) · [Exhibit authoring](docs/EXHIBITS.md) · [Sources](docs/SOURCES.md) · [Verification](docs/VERIFICATION.md)

## Visit the museum (v0.4.0 candidate)

Open **Museum catalogue** for eight standalone experiments, an optional guided route and access to the Concentric finale. Explore freely or follow a route with Previous/Next; export or load route JSON, revisit experiments, reset an individual lab and download its state. Completion counts describe standalone experiments only; they never award expedition seals. No account or persistent museum-wide profile is required. See [release acceptance](docs/RELEASE_ACCEPTANCE.md).

## The Measurement Gallery

Three new independent experiments extend the Volume Exchange: **The Conversion Desk** (bidirectional XYZ/IVM conversion), **The Pythagorean Transfer** (similar figures and area accounting), and **The TetraBook** (hinged equilateral triangles and volume). See [Measurement Gallery](docs/MEASUREMENT_GALLERY.md) for mathematical conventions, source attribution and tests.

## Founding collection: Concentric — The Field Station Edition

The released v0.2.0 game is the founding exhibit collection. Pip and Mica explore a 2.5D geometric field station, restore four experiments and link their perspectives. The Department of Unnecessary Cubes still has a paperwork problem.

| Exhibit | Interactive discovery |
| --- | --- |
| The Minimum Department | Construct a tetrahedron from four vertices and six struts. |
| The Volume Bureau | Discover equal-edge tetravolume ratios 1 : 4 : 20. |
| Neighbourhood Watch | Pair the twelve FCC/IVM nearest-neighbour directions. |
| The Coordinate Office | Remove a shared Quadray offset without moving the point. |
| The Concentric Engine | Bring both probes into mutual visibility and alignment. |

There is no combat, countdown, account or penalty for experimenting. The final relay is fiction, not a physical law. Volume comparisons do not assert that whole regular tetrahedra tile a regular octahedron.

### Visitor controls

| Control | Action |
| --- | --- |
| W / S or up / down | Move forward / backward |
| A / D | Strafe |
| Left / right or drag | Turn |
| E / Inspect | Open a nearby exhibit |
| Q | Switch probe |
| F | Face the other probe |
| Space | Hold to synchronise |
| P / Escape | Pause / resume |
| Tab | Normal keyboard focus |

Follow the coloured trails; the compass points towards the next unfinished exhibit. Finish all four, bring both probes near the central engine, face each other and hold the link for two seconds. Touch, reduced motion, fit window, fullscreen, local saves, JSON download/restore and original WAV export are supported. Sound is opt-in. See [the original Field Station README](README_HISTORY.md).

## The museum we are building

**The initial museum host:** a shared catalogue with independently testable founding exhibits. The additional galleries and research workbench below are planned. A visitor can explore freely or follow an educational route. A research workbench is planned. The same exhibit should support an accessible first encounter and an inspectable mathematical explanation; advanced tools are optional.

| Gallery | Planned exhibits |
| --- | --- |
| Geometry | Quadray construction, IVM/FCC, concentric polyhedra and coordinate perspective |
| Measurement | Further volume-from-edges experiments; Volume Exchange, Conversion Desk, Pythagorean Transfer and TetraBook are in the catalogue |
| Information | Observer-specific visibility, selective revelation, exact inference and belief propagation |
| Topology | Simplicial complexes, boundary operators, cycles and holes |
| Research annex | Numerical model reproduction, parameter sweeps, evidence exports; candidate elastic-loop work subject to source review and permission |
| Workshop | Author, validate, test and share local exhibit packs |

Our teaching inspiration includes [Kirby Urner's School of Tomorrow](https://github.com/4dsolutions/School_of_Tomorrow), [Ryan's RayShare](https://github.com/RyanJBuchanan/RayShare) and [Synergetics 95](https://qsolkcb.github.io/synergetics2/#/home). Public source materials are references, not a blanket licence to copy everything or a claim of contributor endorsement.

## Clone and play

No npm install, CDN, Docker, account or application server required. Native HTML/CSS/JavaScript; Python serves static files.

```sh
git clone https://github.com/QSOLKCB/SynergeticGames.git
cd SynergeticGames
uv run --no-project python -m http.server 8765 --bind 127.0.0.1
```

Open http://localhost:8765. A static HTTP origin is required for native modules; file:// is not supported. After a complete HTTP(S) load and service-worker installation the current game supports offline reload. External reference links require connectivity.

## Audit

```sh
node --test tests/*.test.js
uv run --no-project --python 3.12 --with playwright==1.62.0 python -m playwright install chromium
uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py
```

Node is a development test runner only. Browser checks exercise actual gameplay, save validation, offline reload, sound, layout and focus. Current receipts and screenshots are written under test-results/. See [verification scope](docs/VERIFICATION.md); historical PASS results do not certify a new commit.

[Source provenance](vendor/PROVENANCE.json) records pinned upstream revisions and file hashes. The existing runtime modules are byte-identical to [VANILLAJS v3.5.0](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v3.5.0); the engine bridge adds its exact-rational and exact-graph modules for independently testable museum model foundations. The modular catalogue now exposes the four founding experiments as independent, resettable labs and a route back to the original expedition finale. Open **Museum catalogue** before or during play. The new **Volume Exchange** compares an R-edged cube with a D-edged tetrahedron (D = 2R): predict, measure, rescale and switch units. It is the first new independently registered lab. See [Volume Exchange](docs/VOLUME_EXCHANGE.md). Further galleries remain planned.

## Extend

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the proposed [exhibit contract](docs/EXHIBITS.md). An exhibit should have a question, an interaction, a mathematical or experimental model, source attribution and a way to check its result. Educators can propose an exhibit without writing code.

Pull requests validate; only main deploys through GitHub Actions. No merge without owner authorization.

Original code, score, graphics and writing are Apache-2.0. Retained RayShare code is MIT and retained Synergetics 95 geometry is MPL-2.0; see [NOTICE.md](NOTICE.md). Preserve licences and provenance at the file level.

**Geometry is a team sport. Science is something you can do. :-)**
