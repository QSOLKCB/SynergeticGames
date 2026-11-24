# v0.3.0 — The Living Museum release acceptance

Candidate, not a release receipt. MUSEUM-001A–D culminate in this candidate. Review and tag belong to the owner.

## Automated gates

- Run the existing Node suite: `node --test tests/*.test.js`.
- Run the pinned browser suite: `uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py`.
- Require green exact-head PR review and CI. After merge require green main validation and Pages deployment. Inspect browser-receipt.json and screenshots from the actual tested checkout; match the receipt's commit to the workflow checkout. Do not substitute a historical PASS.
- Provenance digests, runtime import/cache closure and the PR #4 Pages workflow ordering regression must pass. Verify the published site serves the new version and the museum cache updates on a clean browser load. External source links are optional online references, not runtime dependencies.

## Owner playthrough (pending)

- Open the museum on desktop and a mobile/touch device. Verify the entrance, catalogue labels, keyboard focus, previous/next and return to station. Inspect readability at 320/390 px and reduced motion.
- Complete the four founding standalone labs and the Volume Exchange. Predict incorrectly, revise, measure, scale and switch all three unit conventions. Verify status, reset, save and restore; download a guided route, reload it, restore the founding route.
- Complete the original Concentric expedition using its four seals and two-probe finale. Check standalone completions did not affect expedition seals. Load a prior v1 expedition save; confirm original soundtrack export and optional audio.
- Reload offline after service worker installation; verify both catalogue and expedition. Check denied fullscreen and blocked storage fallbacks. Inspect deployment smoke test at the published Pages origin.
- Record actual observations, exact release SHA, CI link and any open defects. Record any skipped check explicitly. Tag v0.3.0 only after approval.

## Scope and limits

No new physical theory, complete external exhibit SDK, mandatory cloud service, WebGL upgrade, gamepad integration or performance certification is claimed. The existing deterministic simulation and Canvas 2D fallback remain. Controller support is deferred to a separately tested engine integration; keyboard/touch are the supported inputs. No new runtime dependencies. All private research remains out of the shipped assets. A successful browser test is not proof of complete accessibility or cross-browser/device support.
