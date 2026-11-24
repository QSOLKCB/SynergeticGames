# Verification evidence

The original repository base was `df5b183c9cc3b67aac1bd2ab4d4360b1767dace6` (README and Apache-2.0 license only).

Executed locally: Node's built-in tests cover the actual geometry meshes, collision, sight and mutual facing, complete simulated expedition, wrong puzzle inputs, owned/validated save data, fixed-clock partitions, and deterministic PCM/WAV output. The original soundtrack WAV SHA-256 is recorded in SOURCES.md and checked by the browser export test.

Local browser attempts are preserved here as failed environment checks: the installed Playwright package first requested a missing bundled browser; both system Chromium and an existing cached Chromium subsequently failed to start with `socket() failed: Operation not permitted`. The cloud browser also reported `ERR_CONNECTION_REFUSED` for the local HTTP preview. Those attempts do not establish browser gameplay or layout correctness.

The pull-request workflow runs the packaged game in Chromium and writes `browser-receipt.json` for the tested checkout, including FAIL status if any assertion raises. Screenshots and the receipt are uploaded even when the browser test fails. The test server and browser run in the same runner; no external preview hosting is needed.

Browser coverage: actual movement and strafing; pause/held-input clearing; all four experiments through their controls; two-observer finale and post-victory exploration; JSON save/download/restore and rejection; original WAV byte identity; explicit sound toggle; offline reload with progress; 390/320 px touch layouts and motion preference; absent audio and blocked storage.

The v0.2 browser suite additionally checks the prominent E/Inspect state, keyboard and touch experiment entry, the 60-pixel minimum action target, the compass, fit/page/fullscreen transitions with held-input clearing, and denied fullscreen fallback. It plays the expedition with sound enabled so the interaction cues run alongside the score. The Node suite also checks that all seven cue scores are distinct, repeatable, bounded and unclipped. The current CI receipt, rather than this coverage description, establishes whether a revision passed.

Executed CI: [run 43731856764](https://github.com/QSOLKCB/SynergeticGames/actions/runs/43731856764) passed all 11 Node tests and all ten browser scenarios for source head `b0ce2d0d856ba035c8b6469a1746e04babba4856`. GitHub tested its merge checkout `4ec36316a71916108c154d79f60da45eef2aed44`; that exact SHA appears in the PASS receipt. No page errors were recorded. Desktop and mobile screenshots were visually inspected. The audio retry regression first failed with a partially constructed device, then passed after failed players and contexts were discarded.

Earlier CI attempts preserve an organisation action-policy rejection, a fractional Playwright clock argument error and a failed mobile-control check. The fixes use a pinned uv installation without a third-party setup action, integer test-clock milliseconds, and touch controls immediately below the game view. Both 390 px and 320 px checks now verify that the view remains visible while steering. Deployment also requires `refs/heads/main`, including manual workflow runs.

Not established by automated checks: subjective musical quality, physical touch-device behaviour, screen-reader usability, other browser engines, or bit-identical floating-point movement across engines. Geometric and narrative scope is specified in SOURCES.md. Consult the latest PR check and its exact checkout receipt for browser execution status.

## v0.3.0 candidate coverage (MUSEUM-001D)

The existing browser acceptance sequence now covers independent museum experiments, bounded route and exhibit imports, Volume Exchange geometry invariance, keyboard/touch modal handling, offline museum operation, derived progress, completion of all five standalone labs through actual controls, route round-trips, previous/next navigation, repeated lifecycle and fallback with unavailable audio/storage. Node tests exercise the actual registry and read-only progress queries, exact S3 model, graph invariants and Pages workflow ordering. These are coverage descriptions, not new execution receipts. A local checkout attempt in the authoring environment failed DNS resolution for github.com; current exact-checkout CI is required. See [RELEASE_ACCEPTANCE.md](RELEASE_ACCEPTANCE.md) for gates and owner playthrough. No physical gamepad, full screen-reader or measured FPS certification is claimed.

## v0.4.0 candidate (VOLUME-001)

New test coverage: 48 conversion amounts in both directions, 192 triangle/figure cases checked with independent shoelace areas, 181 integer TetraBook positions and two analytic regular positions checked against coordinate determinants, record validation and model isolation. The browser suite now completes all eight standalone labs, checks new exhibit save/restore, touch and offline access. These are coverage descriptions, not execution receipts; consult exact candidate CI. Original v0.3.0 release evidence remains historical. No new physics or universal device/accessibility certification is claimed.

Cache upgrade regression: simulate a visitor with the earlier v0.4.0-measurement-1 cache, install and activate the new worker, verify the updated Pythagorean Transfer and Conversion Desk are served offline and unrelated scope caches survive. This is a Node VM lifecycle test, not a live browser deployment receipt.

## v0.5.0 candidate (QUADRAY-001)

New coverage includes 625 integer tuples and five common offsets, exact inverse and existing basis comparison, independent parity enumeration and all-pairs adjacency for four FCC radii, edge/face incidence and centroid-fan volume oracles for three cells, malformed state rejection, eleven-lab browser completion, mobile and offline access. Service-worker regression also covers upgrades from the released v0.4.0 cache. These are coverage descriptions, not execution receipts; consult the exact candidate CI.

## v0.6.0 candidate (EPISTEMIC-001)

New coverage: 32 observer states, 326 distinct clue prefixes per world (2608 cases), all 15 nonempty four-plan sets at both stages, four plans and two disclosure orders, view isolation, truth preservation, redundancy, atomic saves, fourteen-lab browser completion, mobile and offline access. Cache upgrade tests cover v0.5.0 as well as both v0.4.0 revisions. Coverage description only; consult exact candidate CI for execution evidence.

## v0.7.0 candidate (INFERENCE-001)

Coverage: all 81 prior tuples across three parity graphs (243 exact cases), tree BP at finite propagation depth for every prior tuple, message normalization, independent cavity-product message oracle, loopy convergence/accuracy counterexample, global contradiction, atomic saves and eighteen-lab browser completion. Cache migration includes v0.6.0. Coverage descriptions are not execution receipts; consult exact candidate CI.

The separate uniform-plan benchmark checks equal one-bit information gain and unequal stage-1 mean utilities 3 and 2. Cache upgrade also covers the intermediate v0.7.0-inference-1 revision.

## v0.8.0 candidate (SIMPLEX-001)

Coverage: all 32768 masks, all 167 face-closed complexes (including the empty complex) in GF(2) and GF(3), independent kernel cardinalities, signed boundary cancellation, cycle/boundary witnesses, invalid construction/restores and twenty-one-lab browser completion. Offline upgrade includes both v0.7.0 cache revisions. Coverage descriptions are not execution receipts; consult exact candidate CI.
