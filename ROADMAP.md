# The Living Museum — Development Roadmap

Status: MUSEUM-000 establishes the direction and design contract only. Released baseline: v0.2.0 Concentric. Everything below is proposed until implemented, tested and released. Keep main playable; no bulk rewrite.

## Release sequence

| Target | Phase | Deliverable |
| --- | --- | --- |
| v0.3.0 | MUSEUM-001 | Modular host, legacy Concentric access, selective engine upgrade, first Volume Exchange exhibit |
| v0.4.0 | VOLUME-001 | S3 expansion, Pythagorean area transfer and TetraBook |
| v0.5.0 | QUADRAY-001 | Quadray and IVM construction workshop |
| v0.6.0 | EPISTEMIC-001 | Observer-specific information and selective revelation |
| v0.7.0 | INFERENCE-001 | Exact enumeration and belief propagation |
| v0.8.0 | SIMPLEX-001 | Oriented simplicial complexes and elementary homology |
| v0.9.0 | RESEARCH-001 | Research annex; elastic-loop reproduction if source and permission gates pass |
| v1.0.0 | MUSEUM-002 | Stable authoring contract, curated museum routes, reproducibility and accessibility |

Versions are targets, not release commitments. A gated research exhibit may be deferred or replaced with a clearly scoped public-source numerical exhibit; it must never block preservation of a playable museum.

## MUSEUM-001 — first implementation release

Engine bridge (PR #5) and modular host (PR #6) are merged. MUSEUM-001C adds the Volume Exchange through the reviewed registry. Final presentation, validation and release acceptance remain MUSEUM-001D; this is not a completed v0.3.0 release.

Four sequential reviewable PRs, each based on accepted main (no overlapping unmerged dependencies):

1. **Engine bridge.** Audit and selectively vendor from VANILLAJS v3.5.0 commit `9d95d74b355ec17add32db0b55f0f71130f9c004`. Check actual API contracts, dependencies, licensing and file hashes; retain existing versions where replacement adds no benefit. Candidate modules: exact-rational, exact-geometry, exact-graph, input/gamepad, scene-graph and render-lit. Evaluate optional render-webgl/fx-pipe later against measured needs; preserve Canvas 2D fallback. No rendering-authority coupling. Demonstrate equivalent legacy gameplay, saves and WAV bytes.
2. **Museum host.** Define a bounded, versioned exhibit registry and explicit lifecycle; separate model, interaction and presentation. Register existing four experiments and Concentric finale without altering accepted v1 save interpretation. Introduce a gallery entry/catalogue, return/reset paths, free exploration and a guided route. Validate duplicate IDs, bad references and unsupported versions; reject invalid imports atomically. Prove that a new exhibit can be registered without changes to unrelated exhibit logic.
3. **Volume Exchange.** First new exhibit through the actual registry. Compare an R-edged cube and D-edged regular tetrahedron (D=2R). Toggle conventions and change scale without changing physical geometry. Include exact algebraic identities and independent numeric/mesh checks. Teach that equal-edge comparisons and radius/diameter comparisons use different reference units.
4. **Polish and acceptance.** Keyboard/touch navigation, controller if the engine bridge supports it, reduced motion, legible diagrams, optional sound, focus/visibility handling, offline cache inventory, stable performance and mobile layouts. Test actual UI entry/exit, legacy and new save paths, malformed packs, repeated resets and offline reload. Update receipts and current-vs-planned docs.

Acceptance: original expedition completable through real browser controls; no regressions in existing suites; old saves readable; new exhibit accessible by keyboard and touch; source-pinned provenance; no network needed for core play after install; no unsupported scientific claims; owner playthrough and exact-head review before release.

## VOLUME-001 — the measurement gallery

- S3: with D=2R, tetrahedron volume is (2 sqrt(2)/3) R^3; cube volume is R^3. Their physical ratio V_cube/V_tet = sqrt(9/8). Expressing the same physical volume in R^3 units and D-edged tetrahedron units gives a numerical conversion factor S3 from XYZ to IVM and 1/S3 in reverse. Equal-edge unit tetrahedron instead gives 6 sqrt(2) per cubic unit. State conventions next to every number.
- Pythagoras: area transfer with squares and similar non-square shapes, with right-angle and similarity assumptions explicit. Use geometric area checks, not animation as proof.
- TetraBook: inspect Kirby's public notebook before implementing hinge geometry. Calculate volumes from explicit vertices and verify endpoint and intermediate configurations against an independent determinant oracle.

## QUADRAY-001 — geometry workshop

Canonical integer quadrays modulo the common offset; exact integer identity under translation of all four components; bounded coordinates and overflow policy. Cartesian conversion is a rendering boundary with declared basis/scale. Build FCC neighbours, tetrahedral/octahedral cells and concentric polyhedra. Verify adjacency, uniqueness, incidence, volume and round-trip properties independently. Candidate upstream references: Mapping_Quadrays.ipynb, QuadraysResearch.ipynb, Rendering_IVM.ipynb, Qvolume.ipynb and QuadCraft2.html; inspect exact revisions and file-specific terms first. A full hinged Jitterbug requires its own validated kinematics.

## EPISTEMIC-001 — information gallery

Extend RayShare's two perspectives into explicit per-observer information sets. Separate hidden model state, observations, disclosures and action policy. Demonstrate truthful constraints, redundant evidence and order effects where a specified model permits them. Compare strategic disclosure and random disclosure in small extensive games with an exhaustive oracle. Use the public paper arXiv:2611.17084 as a research reference, not a claim of implementation equivalence to any private theory. No psychological manipulation of real visitors; reveal rules are visible and reversible.

## INFERENCE-001 — hidden tetrahedron

Start with small binary factor graphs, uniform and nonuniform priors, XOR constraints and exact enumeration. Implement sum-product BP separately with explicit schedule, normalisation, convergence/iteration bounds and contradiction handling. Verify tree cases against exact marginals; report loopy errors, nonconvergence and correlations not captured by individual marginals. Compare information gain with decision utility as distinct objectives; maximin is not sum-product. QEC extension requires a separately verified syndrome model and logical error criterion, not just a graph shaped like a tetrahedron. Reference: arXiv:2209.05464.

## SIMPLEX-001 — topology gallery

Construct oriented vertices, edges, faces and tetrahedra. Define coefficient field explicitly, validate face closure and orientation, demonstrate boundary-of-boundary zero and calculate small Betti numbers using independent rank checks. Contrast a tetrahedral surface with a filled tetrahedron. Explore graph and complex relationships without assuming a lattice proves a physical theory. Consider exact-graph and finite-field modules only where their contracts fit.

## RESEARCH-001 — experimental annex

Source/permission gate before use of unpublished or privately circulated material. A candidate elastic-loop exhibit should reproduce a public or author-approved model and its numerical example first, with explicit parameters, units, discretisation, convergence checks and independent references. Distinguish transient configurations from equilibria and phenomenological scalar potentials from relativistic stress-energy or graviton claims. No novel physical conclusions implied by successful reproduction. A tetrahedral discretisation is a separate experimental extension. Retain failed receipts; export observations, algorithm/version, source revision, settings, seeds where applicable, numerical error and limitations.

## MUSEUM-002 — a museum others can extend

Stabilise the exhibit registry and pack format; add a local authoring workflow, example pack, catalogue/route editor, standalone inspection where practical and evidence export/import validation. Allow a second contributor to build an exhibit without altering the host or unrelated model code. Validate offline, keyboard and touch behaviour, reader-oriented explanations, storage failure and optional renderer fallbacks. Run clean-checkout reproducibility, complete visitor playthrough and curator review. No cloud or mandatory runtime framework.

## Every release

Follow AGENTS.md and the exhibit contract. Preserve licence notices, historical evidence, original game access and explicit migration compatibility. Test actual behaviour, not just the existence of a module. Record exact source/checkouts, commands, PASS/FAIL and limitations. Owner approves merge and tags releases only after accepted evidence. Update roadmap status and documentation only for work actually delivered.
