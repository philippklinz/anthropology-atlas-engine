# Development status · 0.1.0-dev.3

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
- Data-driven category directory with catalogue-wide counts and URL scope, populated and empty category navigation, and filter reset when opening an object.
- Chapter intervals initialize the full time range; original source-calendar dates are shown separately from calculation dates. Event stations and cited place references are navigable, including derived event/place edges in the network.
- Historical draft status and chapter citations are visible; the real sample is supplied by the content repo, with no historical records hardcoded into the engine.
- MapLibre module worker is included and explicitly configured, fixing the missing-worker packaging error.

## Checks

Twenty native browser test groups passed in Chromium: calendar vectors, uncertainty, full URL roundtrip and invalid routes, all source resolvers, dateline windows, fixture/release separation, negative semantic cases, polygon topology, deterministic browser export and payload hashes, ZIP roundtrip, empty draft/release behavior, HTTP catalogue queries, incoming edges, territorial gaps, tamper detection, SHA-256 vectors including its HTTP fallback, and the local MapLibre worker processing the actual land GeoJSON. `python3 scripts/check-static.py` passes without third-party Python modules.

The authoring UI imported 61 source files for the content repo’s 48-record first-circumnavigation sample and exported a draft catalogue from source commit 3814f2f7d39f4c646e301bef4a3a2d5b15fb98ad with zero errors/warnings. The two new browser test groups cover category scopes/kinds, interval defaults, original date labels and navigation roundtrips. This exercised the real browser workflow, not a substitute compiler. See `tests/browser/RESULTS.md` for rendering/navigation observations and limitations.

## Remaining acceptance work

- Complete participant type restrictions, spatial predicate-role rules, waypoint chronology, source coverage and field-level provenance. Freeze the contract only afterwards.
- Media validation beyond the currently supported embedded core GLB profile; additional formats/decoders are not certified.
- Enforce clean Git source revisions and complete resource-license/review release gates. Empty drafts may export a valid empty catalogue; historical releases still reject them.
- Full index payload schemas, large-content scheduling, search weighting and performance measurements.
- WebGL2 MapLibre/Three.js checks, models anchored on the globe, horizon/polar/dateline behavior and measured 200 m/CSS-pixel zoom.
- Extended public GitHub Raw media and large-payload hosting tests; the small historical sample does not establish large-payload compatibility.
- Full 18-case browser acceptance, narrow-screen/touch checks, focus/scroll restoration, complete filter UI, chapter steps, interpretation selection UI and timeline range gestures.
- Independent historical review of the first research draft, a second reuse chapter, and a reviewed historical release. No synthetic fixture enters the content repository.

Close these M0/M1 gaps before broadening historical coverage or adding MariaDB.
