# SynergeticGames — Concentric

**The Department of Unnecessary Cubes has a paperwork problem.**

A small 2.5D adventure about a whole different way to see. Explore a geometric field station, restore four interactive exhibits, and bring two survey probes into a shared perspective. Hilarious where possible. Correct where it counts.

**Built for the School of Tomorrow. Created by QSOL-IMC as independent contributors to open science. We are not members of the School of Tomorrow.** This is an independent contribution, not an official School of Tomorrow publication or endorsement.

[Play on GitHub Pages](https://qsolkcb.github.io/SynergeticGames/) · [Teaching reference](https://qsolkcb.github.io/synergetics2/#/home) · [Sources and scope](docs/SOURCES.md)

**v0.2 — The Field Station Edition.** Follow coloured floor trails through lit exhibit rooms, with shaded holograms, quiet particles, and a compass towards your next connection. The large gold **E / INSPECT** button lights up when an experiment is within reach; a prompt in the view makes the keyboard and touch action explicit. Seven original VANILLAJS cues distinguish selections, connections, mistakes, discoveries, probe switches and the finale. **Fit window** and **Fullscreen** give the station more room.

## The expedition

You control **Pip** and **Mica**, two geometric survey probes with a remarkable ability to make a simple task require two perspectives.

| Exhibit | What you do | What you discover |
|---|---|---|
| The Minimum Department | Join four vertices with six struts | A tetrahedron closes four triangular faces |
| The Volume Bureau | Calibrate two targets in tetrahedral units | Equal-edge tetrahedron : octahedron : cuboctahedron volumes are 1 : 4 : 20 |
| Neighbourhood Watch | Match twelve directions into six opposite pairs | The nearest-neighbour geometry of the FCC / isotropic vector matrix |
| The Coordinate Office | Remove shared offsets from a Quadray address | Different four-number addresses can represent the same point |
| The Concentric Engine | Park both probes near the core, face each other, and link | Two viewpoints can contribute to one working system |

There is no countdown, combat, account, or score penalty for trying something. The relay is a fictional game mechanic, not a proposed physical law. The volume experiment compares quantities; it does not assert that four regular tetrahedra tile a regular octahedron.

## Play

Follow a coloured floor trail toward an exhibit. When the gold **E / INSPECT** button lights up, press **E** or tap it to open the experiment. The compass indicates the next unfinished exhibit; use the map for the route through the rooms. Experiments can be completed in any order. Once all four are restored, bring both probes near the central engine, turn each toward its partner, and hold the link control for two seconds.

| Control | Action |
|---|---|
| W / S or ↑ / ↓ | Move forward / backward |
| A / D | Strafe left / right |
| ← / → or drag the view | Turn |
| E | Inspect a nearby exhibit |
| Q | Switch the controlled probe |
| F | Face the other probe |
| Space | Hold to synchronise |
| P / Escape | Pause / resume |
| Tab | Move keyboard focus normally |

Touch controls, reduced motion, pause on focus loss, local saves, JSON download/restore and an original WAV soundtrack export are included. Enable **Sound** explicitly. The game works without audio or browser storage; downloadable saves remain available. Offline play is available after the first complete HTTP(S) load and service-worker installation. External reference links need a connection.

## Run locally

No build, npm install, CDN, Docker, or server application is required. Serve the files with Python:

```sh
uv run --no-project python -m http.server 8765
```

Open `http://localhost:8765`. A static HTTP server is needed because the game uses native JavaScript modules; opening `index.html` through `file://` is not supported.

## The actual ingredients

- **[Ryan Jamie’s RayShare](https://github.com/RyanJBuchanan/RayShare)**: adapted DDA raycasting and mutual-facing connection mechanics, with grid-exact sight checks and disk collision added here. MIT notice retained.
- **[QSOL-IMC VANILLAJS](https://github.com/QSOLKCB/VANILLAJS)**: unchanged math, fixed clock, integer PCM synthesis, soundtrack, audio playback and display-controller modules. Facet lighting uses the math module; the runtime uses these modules directly.
- **[Synergetics 95](https://qsolkcb.github.io/synergetics2/#/home)**: unchanged tested geometry helpers, plus the educator edition as the reference for the original game explanations. MPL-2.0 source and notices retained.
- **[Kirby Urner’s channel](https://www.youtube.com/@kirbyurner)**: curriculum inspiration, especially [The Proposal (Martian Math Portfolio)](https://www.youtube.com/watch?v=wxMmUJygIRg).
- **[Polydactica’s Earthbound Music playlist](https://www.youtube.com/playlist?list=PLbcn_8NsfcIrKQPqpC8VTEeTPBVlRe0E4)**: musical mood reference. The game contains a new composition, *A Small Department on a Very Large Planet*, with no EarthBound melodies, samples, or recordings.

Exact source commits and file hashes are recorded in [vendor/PROVENANCE.json](vendor/PROVENANCE.json). The raycast world is 2.5D; its floating geometric exhibits use projected 3D vertices. All visuals are procedural Canvas 2D, so WebGL is not required.

## Validate

The browser needs no Node runtime. Development checks use Node's built-in test runner, and browser checks use Python with a pinned Playwright version:

```sh
node --test tests/*.test.js
uv run --no-project --python 3.12 --with playwright==1.62.0 python -m playwright install chromium
uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py
```

Browser checks traverse the station and complete the actual UI, then exercise the relay, saves, malformed input, offline reload, sound controls, missing audio/storage and 390/320 px layouts. Each run writes a current PASS or FAIL receipt and screenshots under `test-results/`. See [verification notes](docs/VERIFICATION.md) for the executed evidence and limits.

Pull requests validate without deploying. Every change merged to `main` runs the checks and then the GitHub Pages deployment. Pages must use **GitHub Actions** as its source. No merge or repository-settings change is performed by this contribution.

## Open science, open source

Original game code, score, graphics and writing: **Apache-2.0**. Retained RayShare files/adaptation: **MIT**. Retained Synergetics 95 geometry: **MPL-2.0**. See [NOTICE.md](NOTICE.md).

For the School of Tomorrow, from independent contributors to open science. Geometry is a team sport. :-)
