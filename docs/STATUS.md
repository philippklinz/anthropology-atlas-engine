# Development status · 0.1.0-dev.1

2026-11-22. First executable slice; M0, M1, M2 and M3 are **not yet complete**.

## Implemented

- Strict TypeScript; schema-generated record types; local Draft 2020-12 validation.
- Canonical IDs/paths, references and source pointers; typed assertion endpoints, event role names and parent cycles; package ownership and dependency closure.
- Gregorian epoch days, BCE/CE, precision, uncertain bounds and open/unknown time semantics.
- JSTS topology, rings/coordinates, dateline rejection, derived winding normalization; core embedded GLB checks.
- Compiler and hashed catalogue; package chunks, search/time/spatial indices and incoming/outgoing edges.
- Bundled/HTTP/immutable public Raw resolvers; configuration, revision and payload verification.
- Hash routes, direct object/source/model/search links, native navigation and browser history.
- Globe, timeline, focused network and model viewer; SVG fallbacks; DE/EN, local fonts/land and explicit fictional labels.
- Standalone content toolkit, Linux x86_64 offline dependency store, CI and opt-in Pages workflow.

## Checks

Twelve Node test groups cover calendar vectors, uncertainty, URL roundtrip and invalid routes, all three source resolvers, dateline windows, fixture/release separation, negative semantic cases, topology, actual HTTP provider loading, incoming edges, territorial gaps and payload tampering. Typecheck and production build pass. A clean local package installation uses only verified vendored archives with npm offline mode; a separate fresh copy also completed the build. The final segmented-archive format was installed again from an empty npm cache. See `tests/browser/RESULTS.md` for actual manual observations and `navigation-cases.json` for the full planned acceptance.

## Remaining acceptance work

- Complete participant type restrictions, spatial predicate-role rules, waypoint chronology, source coverage and field-level provenance. Freeze the contract only afterwards.
- Media validation beyond the currently supported embedded core GLB profile; additional formats/decoders are not certified.
- Enforce clean Git source revisions and complete resource-license/review release gates. Empty draft datasets may validate but cannot publish an atlas.
- Full index payload schemas, large-content scheduling, search weighting and performance measurements.
- WebGL2 MapLibre/Three.js checks, models anchored on the globe, horizon/polar/dateline behavior and measured 200 m/CSS-pixel zoom.
- Public GitHub Raw CORS/MIME/asset tests; content is currently private and has no historical publication.
- Full 18-case browser acceptance, narrow-screen/touch checks, focus/scroll restoration, complete filter UI, chapter steps, interpretation selection UI and timeline range gestures.
- Actual historical chapters, source reading and historical review. No synthetic fixture enters the content repository.

Close these M0/M1 gaps before broadening historical coverage or adding MariaDB.
