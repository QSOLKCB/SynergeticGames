# Browser compatibility and older Macs

The runtime uses native ES modules, BigInt, private fields, Object.hasOwn, Array.at, structuredClone, native dialogs, Canvas 2D and standard web APIs. The intended Safari baseline is 15.4 or later on a compatible macOS installation; the exact minimum is a target, not a certified result. No WebGL or GPU-specific API is required. Chrome/Chromium and Firefox are supported targets. Use a current browser supported by your operating system; do not install an unsupported OS or browser merely to run the museum.

## Automated acceptance

The same full packaged acceptance script runs under Chromium, Firefox and Playwright WebKit. Evidence includes exact checkout SHA, engine and browser version, checks, errors and screenshots in test-results/<engine>/. A native fullscreen denial is explicitly tested as a fallback, not reported as native fullscreen support. WebKit on Linux is not the actual Safari application or an Intel Mac device.

On macOS or Linux:

```sh
uv run --no-project --python 3.12 --with playwright==1.62.0 python -m playwright install chromium firefox webkit
BROWSER_ENGINE=webkit uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py
BROWSER_ENGINE=firefox uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py
BROWSER_ENGINE=chromium uv run --no-project --python 3.12 --with playwright==1.62.0 python tests/browser.py
```

On Linux use --with-deps when system libraries are missing. Use BROWSER_EXECUTABLE only for an existing Chromium. Browser installation is development-only; visitors need only the static site.

## Actual Safari manual gate

Record Mac model, Intel/Apple Silicon, macOS and Safari version, release SHA and observations. Test initial load, catalogue search, each gallery, native dialog keyboard navigation, Workshop author/preview/download, pack install, route download/load, save/restore, evidence verification, local storage denial, optional sound, fit window, native fullscreen or documented fallback, offline reload after service-worker installation, and the original expedition. Test Economy graphics on older hardware. Record failures and skipped checks; do not treat WebKit CI as a Safari device receipt.

## Troubleshooting

- Use HTTPS or localhost HTTP, not file://. External reference links are not runtime dependencies.
- If offline caching is unavailable, the site still works while connected. Keep downloaded records. First complete service-worker installation before disconnecting.
- If a new release is stale, close all museum tabs so the updated worker can activate, then reopen. Avoid clearing unrelated site data.
- If fullscreen is unavailable, Fit window works without it.
- If sound is unavailable, continue silently; audio is not required for any experiment.
- Economy graphics limits the world canvas to 640 pixels wide and targets roughly 15 frames/s; normal mode caps at 960 and roughly 30 frames/s. The fixed 60 Hz simulation is unchanged. The raycaster does not redraw behind the museum or notebook.
- No arbitrary old Safari version or unsupported operating system is certified. Report exact browser/OS and the failing operation.
