# Three voyages and panel controls · 2026-11-22 · 0.1.0-dev.4

The browser authoring UI imported 214 files archived from committed content source 6ccc3ec0ab50db7446b89ad72dc6e8f794626be3. It validated 157 records with zero errors/warnings and exported draft-3c169a9523d4d5edda2a. The implementation matches the pinned content toolkit. All 54 catalogue payload sizes and SHA-256 hashes were independently checked; earlier hash-named files are retained.

Twenty-three native browser test groups passed. The optional static check passes: local imports/CSS resources, 19 vendor files, licenses and 19 fixture payloads. The three new groups cover drawer focus/dismissal and modified clicks, bounded/persistent panel height including unavailable storage, and chapter-window changes even inside the previous time range.

Manual Chromium checks on the static preview verified:

- Closed menu leaves the main content at x=0. Open navigation overlays it at x=0 with width 320; the map keeps its width. Focus moves to Close; Escape returns it to Menu. Chapter selection closes the drawer.
- Actual pointer drag expands the panel from 232 to 388 CSS px. ArrowUp changes it to 412 px; the historical URL stays unchanged. Reload preserves that height. Double-click resets to the default.
- Three chapter links and catalogue counts appear: 11 people, 2 communities, 43 events, 34 places, 5 artifacts, 1 assertion and 17 sources.
- Darwin's chapter initializes 1831–1836; its journey shows 19 ordered stations. DE → EN → reload retains the event and height; Back/Forward restores German/English.
- Columbus's chapter initializes 1492–1493, with 10 ordered stations, original Julian dates and visible Guanahani uncertainty/source-critical chapter text.

WebGL2 is unavailable here: visual checks use the SVG fallback. GPU rendering and physical touch-device acceptance remain unverified. Schema and integration checks are not independent historical review. The content repository documents source reading, geography and remaining editorial work.

# Historical sample and directory observations · 2026-11-22 · 0.1.0-dev.3

The default historical sample is maintained in the content repo, not engine fixtures. Browser authoring validated 48 records from 61 files with zero errors/warnings and exported draft-912feca6745a8f341943 from committed source 3814f2f7d39f4c646e301bef4a3a2d5b15fb98ad. Payload hashes pass the optional Python check.

Twenty native browser test groups pass, including the new directory/kind filtering and original-calendar/interval cases. Manual Chromium checks on the static preview verified:

- Historical chapter loads with its full 1519–1522 range, local globe, schematic route and dated points.
- Counts: 4 people, 1 community, 12 events, 9 places, 1 artifact, 1 assertion, 8 sources; empty categories remain accessible with a clear no-data explanation.
- Person directory → Magellan → browser Back → directory → Forward → Magellan; relationships remain visible after leaving a type filter.
- Event → map-centering action → DE/EN → reload preserves selected event, camera, time and language.
- Journey shows 11 ordered waypoint entries; Mactan opens the place and linked event; vis-network creates its canvas for the place focus.
- A source detail links to its recorded external publication. Julian source date labels are visible without replacing the normalized calculation dates.
- Selecting year 2000 does not hide catalogue-wide event directory entries: all 12 remain listed and the scope is explained.

WebGL2 remains unavailable in this environment. The screenshots use SVG fallback; no new claim of GPU or mobile acceptance is made. Historical draft/source reading is documented in the content repo and is not an independent scholarly review.

The following dev.2/dev.1 notes are retained as dated observations.

# Native distribution observations · 2026-11-22 · 0.1.0-dev.2

The preview serves repository files directly with an ordinary static server, without Node/npm/Vite. Eighteen checks at `tests/index.html` passed, including a real module worker that processes `basemap/land.geojson`; this worker test does not require WebGL. The authoring UI successfully imported the empty content ZIP, validated it and downloaded a draft catalogue ZIP. DE/EN UI remains available.

The demo rendered the local land, fictional features, chapter text, local fonts and timeline through native JavaScript modules. This Chromium environment lacks WebGL2: the map uses the SVG fallback. GPU MapLibre/Three.js rendering remains unverified. The missing MapLibre worker is now included and its actual GeoJSON processing is tested, but that is not a substitute for the user's GPU/browser check.

Additional dev.2 UI checks: chapter navigation, DE/EN change, browser Back/Forward and reload restore the selected language/chapter. The native standalone vis-network renders a canvas. A direct model URL with at=0 loads the local Three.js add-ons and GLB through the SVG fallback and displays 1 BCE. A relative local empty-content profile renders the connected-source welcome view and globe; no fixture history is substituted.

The observations below are retained as **historical dev.1 results**, not current build instructions or proof of complete dev.2 acceptance.

# Browser observations · 2026-11-22

First development slice, `0.1.0-dev.1`. These are manual observations in the connected Chromium browser, not a claim that all cases in `navigation-cases.json` pass.

The development preview served the actual Vite production build under `/qa/bundled/` and `/qa/http/`. The HTTP profile loaded its catalogue from `http://localhost:4173/content/catalog.json` while the app ran on `http://127.0.0.1:4173/qa/http/`: distinct origins, not merely distinct paths. This development middleware is excluded from the production build.

| Check | Observed result |
|---|---|
| Production build at a nested path | Passed: config, chunks, local fonts, land and fixture data load. |
| Separate HTTP content origin | Passed: chapter, five matching spatial records and time controls load. |
| Globe fallback | Passed: orthographic world, clipped land and fictional features visible. |
| Focused vis-network | Passed: fictional nodes and labelled edges render. |
| Search | Passed: `Hafen A` returns the matching place; result opens entity detail. |
| Source navigation | Passed using keyboard activation; source details load with preserved search/time/camera context. Pointer activation of the scrolled citation was inconclusive in this browser tool and needs a dedicated follow-up. |
| Reload and browser Back/Forward | Passed for entity/source and chapter/network paths; full URLs retain their context. |
| DE/EN switching | Passed for shell/chapter labels and URL; timeline labels were subsequently localized and German labels visually rechecked. |
| Direct model URL, astronomical year 0 | Passed: simple tetrahedron appears through Three.js SVG fallback; time control and timeline show `1 BCE`, not a displayed year zero. |
| Missing record URL | Passed: explicit `RECORD_MISSING` page; no silent substitution. |

WebGL2 is disabled in this browser. The MapLibre GPU renderer and Three.js WebGL renderer therefore remain **unverified**; successful SVG fallback is not evidence that their GPU paths pass. No claim is made for textured SVG models.

Still outstanding: all 18 navigation cases as a complete suite, clean-profile/native new-tab behavior, touch/narrow screens, focus and scroll restoration, gesture/history grouping, full filter/range UI, globe scale/horizon/dateline checks, public GitHub Raw hosting and a network-request allowlist audit. No real historical material was reviewed in this technical test.
