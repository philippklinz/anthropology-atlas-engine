# Development status · 0.1.0-dev.5

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
- Chapter explorer with persistent multiple selection, chronological sidebar, selected-chapter category counts/search, shared-object badges, scoped map/network/timeline and backward-compatible URLs. Explicit content membership and lazy discovery/atlas indices.
- Chapter intervals initialize the full time range; original source-calendar dates are shown separately from calculation dates. Event stations and cited place references are navigable, including derived event/place edges in the network.
- Historical draft status and chapter citations are visible; the real sample is supplied by the content repo, with no historical records hardcoded into the engine.
- Overlay navigation drawer on desktop and narrow layouts, with backdrop/Escape dismissal, focus containment and native modified links.
- Resizable timeline panel with pointer capture, keyboard bounds/reset, optional saved height and redraw of the existing map/timeline; panel changes do not navigate. Chapter changes reset the timeline window.
- Selected point events use a contrasting circle halo; line/area selection has dedicated layers, mirrored by the SVG fallback.
- MapLibre module worker is included and explicitly configured, fixing the missing-worker packaging error.

## Checks

Thirty-one native browser test groups passed in Chromium: calendar vectors, uncertainty, full URL roundtrip and invalid routes, all source resolvers, dateline windows, fixture/release separation, negative semantic cases, polygon topology, deterministic browser export and payload hashes, ZIP roundtrip, empty draft/release behavior, HTTP catalogue queries, incoming edges, territorial gaps, tamper detection, SHA-256 vectors including its HTTP fallback, and the local MapLibre worker processing the actual land GeoJSON. `python3 scripts/check-static.py` passes without third-party Python modules.

The authoring UI imported the committed content sources (214 selected files) for three historical chapters, validated 157 records and exported draft-3c169a9523d4d5edda2a from source commit 6ccc3ec0ab50db7446b89ad72dc6e8f794626be3 with zero errors/warnings. The pinned content toolkit matches the engine authoring implementation. The three new browser groups cover drawer focus/dismissal and modified links, bounded/persistent timeline height, and timeline windows on chapter changes. This exercised the real browser workflow, not a substitute compiler. See `tests/browser/RESULTS.md` for rendering/navigation observations and limitations.

## Remaining acceptance work

- Complete participant type restrictions, spatial predicate-role rules, waypoint chronology, source coverage and field-level provenance. Freeze the contract only afterwards.
- Media validation beyond the currently supported embedded core GLB profile; additional formats/decoders are not certified.
- Enforce clean Git source revisions and complete resource-license/review release gates. Empty drafts may export a valid empty catalogue; historical releases still reject them.
- Full index payload schemas, large-content scheduling, search weighting and performance measurements.
- WebGL2 MapLibre/Three.js checks, models anchored on the globe, horizon/polar/dateline behavior and measured 200 m/CSS-pixel zoom.
- Extended public GitHub Raw media and large-payload hosting tests; the small historical sample does not establish large-payload compatibility.
- Full 18-case browser acceptance, narrow-screen/touch checks, focus/scroll restoration, complete filter UI, chapter steps, interpretation selection UI and timeline range gestures.
- Independent historical review of all three research drafts and a reviewed historical release. Shared package reuse is now exercised by the maritime chapters; no synthetic fixture enters the content repository.

The two additional voyage drafts and panel controls were explicitly requested to evaluate navigation with multiple chapters. The remaining M0/M1 gaps are still open; this addition does not establish general historical-release or large-library readiness.

The chapter-explorer branch also adds separate 10k/100k discovery benchmarks. Measurements and production-scale limits are documented in decision 0003. The authoring UI exported 158 historical draft records from committed source 2ee19d3f3701af9b401febf2824adbd4d886e706 as draft-d758afe3685c558ed816 (zero errors/warnings). See browser results for the observed selection, membership, highlighting and history behavior.
