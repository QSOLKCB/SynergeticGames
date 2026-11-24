# Contributing to SynergeticGames

Educators, researchers, artists and software developers can contribute to the museum. No advanced mathematics or programming is required to propose an exhibit.

## Propose an exhibit

Open an issue describing:
1. The question or relationship a visitor should discover.
2. What the visitor manipulates, observes and learns.
3. Source references, mathematical assumptions and length/unit conventions.
4. A reference result and at least one case that could falsify or expose an error.
5. Attribution and permission requirements, accessibility needs and expected scope.

A sketch or public notebook is welcome. Do not upload confidential correspondence, unpublished third-party papers or material whose redistribution permission is unclear.

## Implement an exhibit

Read AGENTS.md, ROADMAP.md, docs/MUSEUM.md and docs/EXHIBITS.md. Start with the [authoring guide](docs/AUTHORING_GUIDE.md), [modding guide](docs/MODDING_GUIDE.md), [teaching guide](docs/TEACHING_GUIDE.md) and implemented [SDK](docs/SDK.md). Data packs are never executable. Use a focused branch and PR. Keep Concentric working. Prefer native browser code, small pure model functions and independent test oracles; reuse pinned engine modules only after inspecting their contracts and licence.

For gameplay changes run the Node and pinned Python Playwright checks in README.md. Record commands, tested SHA, actual results and failures; distinguish executed evidence from inspection. Update provenance and notices for adapted or vendored files, and service-worker inventory/version for shipped runtime changes.

## Review and release

Explain expected vs actual behaviour, dependencies, compatibility and scientific scope. Include tests that would fail without the change. Keep UI and source attribution clear. No merge without owner authorization; PR validation must pass and exact-head review must be accepted before release. Preserve historical receipts rather than rewriting them as successes.

See NOTICE.md for existing licences. No official affiliation or endorsement is claimed.
