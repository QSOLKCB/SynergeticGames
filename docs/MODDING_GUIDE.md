# Modding and native authoring guide

## Choose the contribution boundary

A data pack changes title, question, attribution and validated initial conditions of a reviewed model. A native exhibit adds new mathematics and must be reviewed as source or maintained in your own fork. No imported JavaScript, remote modules, eval or arbitrary HTML.

## Clone on macOS, Linux or Windows

Install Git and Python 3; uv is optional for serving. Clone, then from the repository directory run one of:

```sh
uv run --no-project python -m http.server 8765 --bind 127.0.0.1
# Or with Python already installed:
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://localhost:8765 in your browser. Windows may use py -3 instead. No npm, Docker, web framework or cloud account. Do not open file:// directly.

## Your first native exhibit

Copy js/museum/examples/counter.js to js/museum/my-exhibit.js. Change the manifest ID to your unique namespace, title, question and public source. Change the bounded model and supply independently calculated expected results. In js/museum/contributions.js import the definition and append it to the frozen contributions array. Add the new runtime file and its local import closure to sw.js and bump the scoped cache version. Add tests and attribution; no host edits required.

The example illustrates an initial state, validation of imported state, pure transition, textual describe and action descriptors. Optional draw(canvas,state) must not mutate state, use network calls or install timers. Keep actions finite and deterministic. Do not use shared mutable global state. Preserve plain JSON records and declared bounds. See [SDK](SDK.md) for the exact contract.

## Fork your museum

Edit js/museum/museum-config.js to set the title, brand, description and edition. Keep required attribution and licensing. Add your own SVG banner or replace the README image. Preserve the original Concentric save interpretation. For a different default route, adjust the reviewed route definition and tests, not imported code. GitHub Pages is optional; any static HTTP(S) host works. Publish your own fork or offer a focused pull request with source and verification evidence.

## Verify before sharing

```sh
node --test tests/*.test.js
node scripts/validate-museum.mjs assets/example-pack.json
```

Node is development tooling only. See [browser compatibility](BROWSER_COMPATIBILITY.md) for full browser commands. Test valid and invalid actions, malformed saves, repeatability, boundaries, keyboard/touch, offline and a separately derived mathematical oracle. Review licence and permission before adding material. Never imply that a source author endorses your exhibit.
