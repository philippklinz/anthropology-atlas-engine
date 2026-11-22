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
