# Museum design charter

A modular science museum that can be cloned, audited, played and extended.

## Visitor experience

The core teaching loop is encounter → predict → manipulate → observe → explain → try again. Do not give away a puzzle's answer before the visitor has the opportunity to discover it, but make explanation, hints, restart and exit available. Preserve free exploration; a guided route is optional. No combat, urgency, surveillance or punitive grading is needed.

The project takes inspiration from interactive science museums and the School of Tomorrow's mathematical curriculum: a change of representation can expose a relationship without changing the underlying object. Cartesian and IVM viewpoints are complementary. Use elementary experiences first, and progressively disclose mathematical details. The fictional Department of Unnecessary Cubes may joke about paperwork, not belittle learners or mathematical traditions.

Three intended modes are Explorer (interaction first), Classroom (guided routes and explanations), and Research (parameters, methods and evidence). These are design targets, not features claimed for v0.2.0.

## Platform boundaries

- Museum host: catalogue, navigation, lifecycle, input focus, accessibility, save routing, versioned registry and offline assets.
- Exhibit: bounded authoritative model, validated actions, visitor-facing view and explanation, reference fixtures, declared source and limitations.
- Shared engine: selectively pinned VANILLAJS libraries and existing RayShare / Synergetics 95 adapters. Renderers, audio and animation are presentation; they may not alter authoritative state.
- Evidence: source/version identity, reproducible inputs, observed outputs, checks, limitations and current execution status.

Concentric remains the founding collection and a supported regression target. Do not break it to build the next gallery.

## Scientific integrity

A mathematical identity, a numerical approximation, a model assumption, a conjecture and a fictional mechanic are different kinds of claim. Label them in the interface and documentation. Every equation must declare its conventions; every numeric method has an error/precision policy. A visualisation is not proof; a reproduced model is not independent validation of its physical assumptions. Exact combinatorial identities should use exact arithmetic where practical. Failed or inconclusive experiments are legitimate results.

Public teaching references: [School of Tomorrow](https://github.com/4dsolutions/School_of_Tomorrow/tree/8d30d18fa1dde164317f2e21ae7e6c29ab2060df), [RayShare](https://github.com/RyanJBuchanan/RayShare), [Synergetics 95](https://qsolkcb.github.io/synergetics2/#/home). Inspect each source and its actual licence before adaptation. Private correspondence and unpublished attachments are not public exhibit assets. Obtain permission and agree attribution before publishing material derived from them; never imply endorsement or assign collaborators work without agreement.

## Scope

The museum is independent, open-source, offline-first and inspectable. It is not an official School of Tomorrow or OMSI publication, does not represent all of Synergetics, and does not claim any new theory of physics. Concentric is the founding collection; the six expanded galleries and Contributor Workshop are implemented in the v1.0.0 candidate. The [teaching guide](TEACHING_GUIDE.md) describes how to turn research into small interactive lessons. Release acceptance remains gated by ROADMAP.md.
