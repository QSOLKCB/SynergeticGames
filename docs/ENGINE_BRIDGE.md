# MUSEUM-001 — engine bridge

Baseline: VANILLAJS v3.5.0, commit `9d95d74b355ec17add32db0b55f0f71130f9c004`. The existing math, fixed clock, audio2d, soundtrack, audio API, effect player and display controller match this release byte-for-byte, as does LICENSE. Original source commits remain in the manifest, with verifiedAt recording the additional release match. The old NOTICE is retained and the new release NOTICE is shipped alongside it.

New modules: exact-rational (no imports), exact-graph (imports exact-rational). These support exact model coefficients and finite graph topology. The engine bridge adds bounded S3 and tetrahedral graph models, not a new visitor-facing exhibit. No conversion from graph triangles to physical faces is assumed beyond the specified tetrahedral graph.

The S3 model uses R in hundredths of a fixed Cartesian length unit. It keeps cube volume and the coefficient of sqrt(2) in tetrahedron volume exact; only the display/independent mesh comparison needs binary64. Tests cover all 200 permitted radii. The topology model is limited to four named vertices, and tests enumerate all 64 strut subsets.

The existing expedition, runtime imports, save model, WAV generation, service worker and Pages workflow are unchanged. New helpers are not yet runtime imports; the host PR must extend the offline cache inventory when it ships them as runtime assets.

PR #4 moved Pages staging/upload into validation ahead of deployment. The Node regression checks the actual workflow structure, step order, main/non-PR gates and deployment dependency, and exercises negative mutations including the old ordering. It does not simulate GitHub's remote artifact consistency or prove that service-side races are impossible.

Evidence: see current CI on the exact candidate. Historical receipts are not reissued.
