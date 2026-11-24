# MUSEUM-001B — Modular host v1

Use Museum catalogue from the Concentric toolbar. Four founding standalone experiments use the same puzzle transition logic as the expedition, but own separate state. The Volume Exchange is a fifth independent lab registered through the same API; it does not modify founding models or the host lifecycle. Closing or switching exhibits preserves in-memory work; Reset exhibit resets only the mounted lab. A new page load starts fresh standalone labs; Save exhibit downloads a record, Load exhibit or route restores it. The original expedition continues using its own v1 save and storage key.

The Concentric Engine entry returns to the original expedition, where the existing positional and mutual-facing requirements apply. It does not award a seal or bypass the finale. The catalogue stops the expedition clock, clears held input and owns modal focus; keyboard shortcuts are blocked while it is open. Free exploration lists every reviewed entry; Guided route preserves the authored order and offers Previous/Next stop, route download and Restore founding route. It is a suggested order, not a progression lock. Status is derived from the model's current done value, with visited/unvisited labels and a count of completed standalone labs in the current catalogue. Expedition-only entries are excluded from the count. Completion does not grant game seals. Explanation is revealed automatically on completion and can be hidden again.

## Reviewed source API

`js/museum/registry.js`: createRegistry(definitions), createSession(registry), validateRoute(registry, record), parseData(text). Definitions have a version-1 manifest (schema, id, version, title, gallery, kind, question, source) and, for lab kind, initial(), validate(state), transition(frozenState, action) returning {state,ok,message}, describe(frozenState) returning {readout,actions,done,explanation}, optional draw(canvas,frozenState). Each action descriptor has label, action (plain data), disabled, optional pressed. Register reviewed definitions in catalogue.js; founding.js adapts existing models. No dynamic code from imports. Model validation must return owned, valid plain data. Session mounts one lab at a time, retains bounded state for registered labs, exposes frozen snapshots and validates before publishing transitions/restores. Registry size <=32; IDs have two dot-separated lowercase components of at most 32 characters each.

## Data records

```json
{"kind":"museum.exhibit.v1","schema":1,"id":"concentric.tetra","version":1,"state":{"lab":["AB"],"selected":null}}
```

```json
{"kind":"museum.route.v1","schema":1,"id":"school.geometry","title":"Geometry tour","exhibits":["concentric.tetra","concentric.quadray","concentric.engine"]}
```

Records are bounded to 64 KiB UTF-8, depth 8, 1024 nodes, arrays of at most 64 entries, strings of at most 512 characters. Fields are exact, references must resolve to reviewed entries, duplicate route IDs are rejected within the route's exhibit list, and unsupported versions or unknown fields are rejected. No scripts, paths, remote module URLs, HTML or arbitrary model definitions are accepted. Route packs only select existing IDs; full exhibit-pack authoring remains planned. Imports validate before state changes. Asynchronous imports are invalidated by navigation, model actions, reset and close. Legacy Concentric save handling remains separate.

## Verification

Node tests cover registry, models, route validation, frozen snapshots, reset and atomic import rejection. Browser tests exercise actual catalogue, navigation, file download/restore, malformed records, keyboard Escape, mobile touch and offline reload; existing expedition and WAV tests remain. The service worker includes the actual new import closure; Pages staging already includes js and vendor. PR #4 workflow regression remains unchanged. See exact candidate CI for executed evidence. No research-mode UI or full external SDK is claimed.
