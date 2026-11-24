# Museum SDK v1 — independent contribution without central runtime services

## Quick start

Clone or fork, run a static HTTP server (uv run --no-project python -m http.server 8765 --bind 127.0.0.1), open http://localhost:8765/workshop.html. No Node/npm required for authoring. file:// is unsupported. Create a pack, enter author, choose a reviewed template, edit initial JSON and question, validate/preview, download and load from Museum catalogue. Example assets/example-pack.json.

## Data pack v1

Exact fields: kind museum.pack.v1, schema 1, id pack.<lowercase slug up to 32 chars>, title <=100, gallery <=64, question <=512, author <=100, license one of CC0-1.0, CC-BY-4.0, Apache-2.0, MIT, template an allowlisted reviewed ID, templateVersion 1, initial validated template state. Text is rendered as text, not HTML. The source link is the reviewed template source. Imported content cannot supply URLs, JavaScript, expressions, new model definitions or remote assets. Author/license identify the pack's original content, not a relicensing of the template.

Local install is page-session-only; duplicate IDs rejected, max catalogue 32 including expedition, no replacement or eviction. Save exhibit embeds the normalized pack identity and model state; install the identical pack before restoring. Packs do not modify built-in labs. Reload clears local packs. A route referencing a pack requires that pack installed first; route editor lists reviewed built-in/native exhibits only. Existing route/save schemas preserved. Curators can share the pack file or integrate reviewed native source separately.

## Native source SDK

Copy js/museum/examples/counter.js to a local module, use a unique namespaced ID, provide the manifest and initial/validate/transition/describe plus optional draw as described in MUSEUM_HOST.md. A reviewed native source addition changes only js/museum/contributions.js to import and list the module, the service worker inventory, attribution and tests. No host edits required. The counter is tested as an independently registered example, not installed by default. Authors own their source and choose compatible licences. Do not assign contributors work or imply endorsement.

## Fork identity

Edit the reviewed plain-text js/museum/museum-config.js (title, brand, description, edition), preserve required attribution and legal notices. This is a source configuration, not imported executable configuration. Keep existing Concentric save semantics or explicitly migrate; never reinterpret legacy data. Pages publishes only distributable files. Add any new runtime imports to sw.js and bump cache revision.

## Routes and evidence

Workshop route editor supports adding, removing, reordering reviewed exhibits and loading/exporting validated v1 routes. Evidence inspector recomputes RESEARCH-001 records before displaying their full contents. No state restoration, digital signature or scientific certification. Use node scripts/validate-museum.mjs RECORD.json for local CLI validation (Node is development-only). No external code, private research or service dependencies. See docs/EXPERIMENTAL_ANNEX.md for exact reproducibility scope.

## Release acceptance

PR A authoring and PR B quality/compatibility are separate. Test model, pack validation/identity, route and evidence workflows, original expedition and offline closure. Actual Safari on older Intel Mac remains a manual device check; Playwright WebKit is not the shipping Safari browser.
