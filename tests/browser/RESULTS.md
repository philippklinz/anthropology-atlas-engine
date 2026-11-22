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

## Chapter explorer · 2026-11-22

Native browser suite: 31/31 groups passed in Chromium 156 on Linux. Added coverage includes explicit chapter membership, legacy outgoing-reference fallback, accent-insensitive multiword discovery, intersected facets/date filters, bounded pagination, complete multi-selection URL roundtrips, invalid selection URLs, inverse membership export, missing-member rejection, geometry-specific highlight layers, 10k discovery records and repeated browser Back/new navigation/Back/Forward. The router history test caught the need to update the navigation deduplication URL after programmatic commits.

Browser authoring imported 216 files from committed historical source 2ee19d3f3701af9b401febf2824adbd4d886e706. Export: draft-d758afe3685c558ed816, 158 records, 0 errors/warnings, 55 active payloads verified against catalogue size and SHA-256. Catalogue SHA-256: 31982e34617b3950a337afc1fcbc77e245118b2c2258ac6a58c9a16502c665a3. Prior immutable payloads are retained.

Observed through the real UI against this export:
- Fresh entry shows the explorer, three real chapter cards, two available period/calendar groups, region/topic/date controls and a disabled open action until a chapter is selected.
- `galapagos` finds Darwin while preserving the selected set.
- Darwin alone: directory counts 3 people, 20 events, 19 places; the people list contains Darwin, FitzRoy and Covington with their chapter badges.
- All three chapters: chronological sidebar (1492, 1519, 1831), 11 people and 34 unique places. Rio is one list entry carrying both circumnavigation and Darwin chapter badges.
- Browser Back/Forward between the places list and Rio restores the three-chapter URL scope and the object.
- Selecting San Cristóbal and its map link gives a clearly visible orange point with a white halo, and the URL retains the selected event and camera.

Rendering observed here uses the SVG fallback because this environment lacks WebGL2. MapLibre highlight layer structure is covered automatically; GPU appearance remains to be checked in a WebGL2 browser. Synthetic 10k/100k benchmark measurements and their limits are in decision 0003; they do not certify network transfer or 100k-chapter atlas rendering.

Additional UI checks: a fresh tab opened the Rio deep link directly with all three chapters selected; switching the explorer to English retained all three selections. The 390px layout places filters behind an explicit disclosure so search and chapters remain reachable.

## Deep-time extension · 2026-11-22 · dev.6

The native suite reports 37/37 passed in Chromium. New checks cover million-year arithmetic, fixed BP conversion and limits; one-sided age constraints versus undated intervals; linear timeline projection; BP/image URL roundtrips; schema and capability derivation; date envelopes, open starts and projection changes with chapter scope. The historical authoring UI validates 188 draft records with zero errors/warnings. Actual chapter display observations are recorded after export below.

The pinned content toolkit exported `draft-8288a1394df57630badf` from source commit `da30cd8bd3a42294905ed50b3d983558ad11ee6c`: 248 canonical/payload files, 188 records, zero errors and warnings. The archive was produced by the browser authoring UI.

Local HTTP viewing confirmed the short chapter link, three African map points, BP axis with compact ticks, uncertainty/open-start labels, and the scoped list of three natural specimens. Both 576-pixel-wide original images loaded from verified local payloads with their credits. The image route, DE/EN captions, browser Back/Forward, catalogue rights inventory, BP discovery filtering plus reload, chronological four-chapter listing, and combined deep-time/Darwin selection were exercised. Returning to Darwin alone restores 1831–1836 calendar labels. Introductory prose now precedes chapter links and media when a text begins with a heading.

The environment reports WebGL2 unavailable; these observations use the SVG globe fallback. They do not verify MapLibre GPU rendering or constitute independent historical review.

## Genetic relationship contract · 2026-11-22 · dev.7

39/39 native browser test groups passed in Chromium through the managed static preview under `/qa/`. The genetics tests exercise directed ancestry, symmetric incoming/outgoing edges, derived capability, invalid taxonomic endpoints, reversed symmetry, missing citations/notes and disallowed migration routes. Static distribution and vendor-integrity checks passed. This does not constitute historical peer review or GPU globe validation.

## Period filter and early-expression chapter · 2026-11-22

39/39 existing native browser test groups passed in Chromium; the static distribution and vendor-integrity checker also passes. Manual UI checks use content export `draft-46f05e9c064fc97d934f` (303 draft records, zero errors/warnings): the period tile row is absent, Palaeolithic selects four chronological chapter cards, `flote` matches the new chapter, and Back/Forward plus reload preserve the search and period. Selecting all four early chapters gives the chronological selected-chapter sidebar. The new chapter alone scopes counts to four events, four places, four artifacts plus three image exhibits, three concepts, four assertions and eleven sources. Its four orientation points render in the SVG fallback; the minimum-age event retains an open older bound. DE/EN captions, original image dimensions and CC BY 4.0 / CC BY-SA 3.0 license links were checked in the real image viewer. No Node/npm or application build was used. WebGL2 is unavailable; GPU rendering remains unverified.
