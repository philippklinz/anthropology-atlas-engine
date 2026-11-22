# Development status · 0.1.0-dev.2

2026-11-22. First executable slice; M0, M1, M2 and M3 are **not yet complete**.

## Implemented

- Native JavaScript modules, HTML/CSS and local Draft 2020-12 validation; no application build, Node.js or npm.
- Canonical IDs/paths, references and source pointers; typed assertion endpoints, event role names and parent cycles; package ownership and dependency closure.
- Gregorian epoch days, BCE/CE, precision, uncertain bounds and open/unknown time semantics.
- JSTS topology, rings/coordinates, dateline rejection, derived winding normalization; core embedded GLB checks.
- Compiler and hashed catalogue; package chunks, search/time/spatial indices and incoming/outgoing edges.
- Central atlas.config.json; relative/HTTP/public GitHub Raw branch or pinned-commit resolvers, revision and payload verification.
- Hash routes, direct object/source/model/search links, native navigation and browser history.
- Globe, timeline, focused network and model viewer; SVG fallbacks; DE/EN, local fonts/land and explicit fictional labels.
- Browser content toolkit with folder/ZIP import and local validated ZIP export; browser tests and optional static-integrity CI. Pages copies checked-in files.
- Empty draft catalogues render a welcome view; the fictional demo is explicit (?demo=1).
- MapLibre module worker is included and explicitly configured, fixing the missing-worker packaging error.

## Checks

Eighteen native browser test groups passed in Chromium: calendar vectors, uncertainty, full URL roundtrip and invalid routes, all source resolvers, dateline windows, fixture/release separation, negative semantic cases, polygon topology, deterministic browser export and payload hashes, ZIP roundtrip, empty draft/release behavior, HTTP catalogue queries, incoming edges, territorial gaps, tamper detection, SHA-256 vectors including its HTTP fallback, and the local MapLibre worker processing the actual land GeoJSON. `python3 scripts/check-static.py` passes without third-party Python modules.

The authoring UI imported the content repo's empty dataset as a ZIP and exported the committed draft catalogue with zero errors/warnings and the supplied source commit. This exercised the real browser workflow, not a substitute compiler. See `tests/browser/RESULTS.md` for rendering/navigation observations and limitations.

## Remaining acceptance work

- Complete participant type restrictions, spatial predicate-role rules, waypoint chronology, source coverage and field-level provenance. Freeze the contract only afterwards.
- Media validation beyond the currently supported embedded core GLB profile; additional formats/decoders are not certified.
- Enforce clean Git source revisions and complete resource-license/review release gates. Empty drafts may export a valid empty catalogue; historical releases still reject them.
- Full index payload schemas, large-content scheduling, search weighting and performance measurements.
- WebGL2 MapLibre/Three.js checks, models anchored on the globe, horizon/polar/dateline behavior and measured 200 m/CSS-pixel zoom.
- Extended public GitHub Raw media and large-payload hosting tests; no historical publication exists yet.
- Full 18-case browser acceptance, narrow-screen/touch checks, focus/scroll restoration, complete filter UI, chapter steps, interpretation selection UI and timeline range gestures.
- Actual historical chapters, source reading and historical review. No synthetic fixture enters the content repository.

Close these M0/M1 gaps before broadening historical coverage or adding MariaDB.
