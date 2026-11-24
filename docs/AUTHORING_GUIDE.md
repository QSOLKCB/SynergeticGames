# Authoring guide — no code required

Open [Contributor Workshop](https://qsolkcb.github.io/SynergeticGames/workshop.html). Everything runs locally in your browser.

## Create your first exhibit

1. Give it a unique ID such as pack.volume-class, a short title, gallery, learning question, author and licence for your original contribution.
2. Choose a reviewed template. The editor supplies its valid initial JSON. You can leave the JSON untouched or change supported values.
3. Select Validate and preview. The preview runs the actual template, not a mock. Try the controls, reset and read the explanation. Editing the fields invalidates the preview; validate again.
4. Download pack. Return to the museum and use Load exhibit, route, pack or evidence. The pack appears as an independent experiment with its own state and attribution.
5. Save exhibit to retain progress. Reinstall the same pack before restoring its save in a new page.

### Worked example: teach the two volume conventions

Choose Volume Exchange. Set a learning question like "If we double R, does the XYZ-to-IVM conversion factor change?" Use the supplied initial state, or set radius to 200 (hundredths of a length unit), unit to xyz, prediction to null and measured to false. Validate. Predict and measure, then vary radius. Explain that physical volume changes with the cube of the radius, while the ratio of reference volumes is unchanged. Link the existing template's source rather than inventing a new physical model.

### Worked example: observer-specific knowledge

Choose Observer Room. Its reviewed initial state has truth, shared and observer fields. Leave the defaults for a first lesson, or use truth 0..3 with shared 0 and observer 0. Ask visitors to switch views before sharing. The source is the existing RayShare-inspired teaching model; it is not a security boundary.

## Create a route

Select an exhibit and Add stop. Reorder using Up/Down; remove unwanted stops. For a custom pack, validate it and click Make pack available to route editor first. Download the route JSON. Install all referenced packs in the museum before loading the route. The route preserves order; it does not include executable code or pack bytes.

## Research evidence and sharing

Run a research experiment, download evidence, load it in the Workshop and inspect the verified JSON. A FAIL is still an observation. Share the pack and route together when needed; include source attribution, licences and your learning objectives. Imported data packs configure reviewed models only; for new mathematics see [modding](MODDING_GUIDE.md) and [teaching](TEACHING_GUIDE.md).
