# SynergeticGames — The Living Museum

- Build for the School of Tomorrow as independent contributors to open science. State clearly that QSOL-IMC is not a member; do not imply official publication or endorsement.
- Read ROADMAP.md, docs/MUSEUM.md and docs/EXHIBITS.md before implementing new museum features. Distinguish proposed contracts from shipped code. Preserve Concentric as a playable founding collection; do not break v1 saves.
- Preserve the RayShare, VANILLAJS and Synergetics 95 attribution, licenses, exact source commits and per-file hashes. Update provenance when changing a covered adaptation. Inspect file-specific licences and dependency closures before copying other sources.
- Do not publish private correspondence, unpublished attachments or derived private research material without permission. Do not imply collaboration or endorsement from a source citation.
- Keep the game native HTML/CSS/JavaScript with no build or runtime package dependency. Prefer uv run for Python utilities. Node is a development test runner only. No mandatory cloud services.
- Selectively integrate VANILLAJS modules with a pinned release commit and tests; do not wholesale replace working modules or couple authoritative state to rendering.
- Keep mathematical claims tied to declared coordinates, edge lengths and independent numeric checks. Label exact identities, approximations, assumptions, conjectures and game metaphors distinctly. Do not present schematic interpolation as proven geometry or physics.
- Keep exhibit models independently testable. Separate host, model, presentation and evidence. Explicitly bound inputs, state, resources and iteration counts; keep reset and exit available.
- Gameplay state must not depend on audio, storage, wall-clock timing or rendering. Preserve pause, blur, hidden-page and pointer-cancellation behaviour. Tab must remain available for keyboard focus.
- Validate imported state completely before replacing the current expedition. Never evaluate imported text as code. Imported exhibit packs are data only; executable exhibit modules require reviewed source.
- Run node --test tests/*.test.js and uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py for gameplay changes. Preserve a current failure receipt; distinguish executed evidence from inferred behaviour. Include exact-head source identity and independent reference checks for numerical claims.
- Bump the service-worker cache version when shipped runtime files change. Scope cache cleanup to this game.
- Pull requests validate; only main deploys. Do not merge without owner authorization. Release after green CI, accepted exact-head review and owner acceptance. Do not mark planned features as delivered.
