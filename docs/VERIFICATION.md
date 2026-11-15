# Verification evidence

The original repository base was `df5b183c9cc3b67aac1bd2ab4d4360b1767dace6` (README and Apache-2.0 license only).

Executed locally: Node's built-in tests cover the actual geometry meshes, collision, sight and mutual facing, complete simulated expedition, wrong puzzle inputs, owned/validated save data, fixed-clock partitions, and deterministic PCM/WAV output. The original soundtrack WAV SHA-256 is recorded in SOURCES.md and checked by the browser export test.

Local browser attempts are preserved here as failed environment checks: the installed Playwright package first requested a missing bundled browser; both system Chromium and an existing cached Chromium subsequently failed to start with `socket() failed: Operation not permitted`. The cloud browser also reported `ERR_CONNECTION_REFUSED` for the local HTTP preview. Those attempts do not establish browser gameplay or layout correctness.

The pull-request workflow runs the packaged game in Chromium and writes `browser-receipt.json` for the tested checkout, including FAIL status if any assertion raises. Screenshots and the receipt are uploaded even when the browser test fails. The test server and browser run in the same runner; no external preview hosting is needed.

Browser coverage: actual movement and strafing; pause/held-input clearing; all four experiments through their controls; two-observer finale and post-victory exploration; JSON save/download/restore and rejection; original WAV byte identity; explicit sound toggle; offline reload with progress; 390/320 px touch layouts and motion preference; absent audio and blocked storage.

Not established by automated checks: subjective musical quality, physical touch-device behaviour, screen-reader usability, other browser engines, or bit-identical floating-point movement across engines. Geometric and narrative scope is specified in SOURCES.md. Consult the latest PR check and its exact checkout receipt for browser execution status.
