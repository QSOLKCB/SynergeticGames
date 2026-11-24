# Exhibit authoring contract — v1 host and future SDK

The initial reviewed-source registry and data-only route/save schemas are specified in [MUSEUM_HOST.md](MUSEUM_HOST.md). The broader external exhibit-pack SDK below remains proposed; imported records cannot register executable models.

## Minimum exhibit

An exhibit answers one question with an interaction. A proposed module has:
- Stable namespaced ID, schema and exhibit version, title, gallery, intended audience and source references.
- Learning question, optional prediction, resettable manipulation, observation, explanation and a declared success criterion (or explicit free exploration).
- Model with initial state, validated actions, bounded deterministic transitions where appropriate, serialisable state and explicit numerical conventions.
- Presentation consuming read-only snapshots; accessible controls and textual results independent of colour or audio.
- Tests and independent reference cases including incorrect inputs, boundary cases and reset behaviour.
- Licence, attribution and limitations; evidence export policy.

Suggested layout (subject to host PR):

```text
exhibits/<id>/
  manifest.json
  model.js
  view.js
  README.md
  fixtures/
tests/<id>.test.js
```

Proposed manifest example (illustrative, not accepted by the current runtime):

```json
{
  "schema": 1,
  "id": "geometry.volume-exchange",
  "version": "1.0.0",
  "title": "The Volume Exchange",
  "gallery": "measurement",
  "kind": "mathematical-demonstration",
  "model": "volume-exchange-v1"
}
```

The host must define allowed IDs, fields, values, versions, size/depth limits and reference resolution. Model keys refer to a reviewed, locally shipped allowlist, never to arbitrary module paths or URLs.

## Trust and lifecycle

Distinguish reviewed source modules (trusted application code) from imported exhibit packs (untrusted data). Packs must not execute scripts, HTML, dynamic imports, expressions or remote resources. Reject unsafe paths, duplicate IDs, unknown fields/types, accessor/prototype hazards and unbounded payloads; validate completely before committing any change. Use text-safe DOM rendering. Authored executable source enters via reviewed PR only.

Define explicit mount/unmount/reset and focus cleanup. Release event listeners, timers and audio resources on exit; input ownership stays with the host. Save envelopes carry schema, exhibit ID/version and validated state. Preserve Concentric v1 saves, do not reinterpret legacy units, and keep migrations explicit and tested. Rendering or device timing cannot decide success.

## Evidence and pedagogy

A proof requires actual proof evidence, numerical claims require an independent oracle or justified tolerance, and experimental results need inputs, algorithm/version, outputs and limits. Compare exact and approximate methods honestly. Give visitors a way to revisit assumptions and reveal explanations. Include a text equivalent for a visual-only demonstration, keyboard and touch operation, and reduced-motion handling.

Research exports must be local, bounded, versioned and explicit about seeds, parameters, units, observations and checks. Do not collect personal data by default. Preserve a current failed receipt when a test fails. Hashes bind evidence to bytes, not to the truth of a scientific hypothesis.

## Acceptance

A new exhibit can be registered without editing unrelated exhibit models. Malformed records leave existing state unchanged. An exhibit can be entered, manipulated, reset and exited repeatedly; it works offline and under keyboard/touch and storage failure. Each claimed invariant has a positive and negative test. Source revision, licence and local evidence are inspectable.
