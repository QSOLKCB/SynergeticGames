# SynergeticGames

- Build for the School of Tomorrow as independent contributors to open science. State clearly that QSOL-IMC is not a member; do not imply official publication or endorsement.
- Preserve the RayShare, VANILLAJS and Synergetics 95 attribution, licenses, exact source commits and per-file hashes. Update provenance when changing a covered adaptation.
- Keep the game native HTML/CSS/JavaScript with no build or runtime package dependency. Prefer `uv run` for Python utilities. Node is a development test runner only.
- Keep mathematical claims tied to declared coordinates, edge lengths and independent numeric checks. Label game metaphors as such. Do not present schematic interpolation as proven geometry or physics.
- Gameplay state must not depend on audio, storage, wall-clock timing or rendering. Preserve pause, blur, hidden-page and pointer-cancellation behaviour. Tab must remain available for keyboard focus.
- Validate imported state completely before replacing the current expedition. Never evaluate imported text as code.
- Run `node --test tests/*.test.js` and `uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py` for gameplay changes. Preserve a current failure receipt; distinguish executed evidence from inferred behaviour.
- Bump the service-worker cache version when shipped runtime files change. Scope cache cleanup to this game.
- Pull requests validate; only `main` deploys. Do not merge without owner authorization.
