# 0003 · Chapter discovery and explicit reading scope

Accepted 2026-11-22 following the project owner's navigation feedback.

The first visit opens a chapter explorer. Visitors search or filter by period, region, topic and overlapping dates, select chapters, and open the atlas. An explicit atlas/object URL bypasses this entry screen. The explorer shows available content, not a claim of complete world-history coverage. Period labels are content-owned, regional and potentially overlapping. Time groups are selected through the period filter only; the result area shows chapter cards without a duplicate period-tile row. Related chapters reuse broad time groups instead of creating a time group for each chapter. The selected group's explanation remains visible above the results.

`state.chapters` is the selected reading scope; `state.chapter` is the focused chapter. Changing focus preserves selection, time and camera. The sidebar lists only selected chapters, in chronological order. “Edit selection” returns to discovery with the choice retained. Opening the selection fits its full time range; a separate time reset restores that range later. The directory and its counts cover selected chapter members across all dates. Map and network queries additionally apply map-time filters. Timeline items cover the full selected reading scope; multiple chapters get labelled groups. A shared object has one identity and multiple chapter badges.

## Content contract (still draft 0.1.0)

Chapters may supply `recordIds` and `discovery` (localized summary; period, region and topic facets). New discoverable chapters require explicit membership. Membership includes needed sources, geometry and outgoing references; it must contain focus IDs and cannot contain packages or other chapters. It is independent of canonical package ownership. The validator checks reference closure and focus coverage. Source citations can target `/discovery/periods` or other fields.

The compiler publishes an optional `entrypoints.discovery` (role `discovery`) containing chapter cards, initial states and searchable names/aliases. Full membership stays in the record index and records; index records also carry inverse `chapterIds`. Discovery does not load full atlas indices or geometry. Opening the atlas lazily loads those indices; record chunks and payloads retain their existing on-demand behavior. Older catalogues use outgoing reference traversal from chapter highlights as a compatibility fallback, never all package dependencies. They can omit items not reachable from highlights and should be re-exported with explicit membership.

Hash-route v1 gains `chapters` and `browse-*` parameters. Older links without `chapters` select their single focused chapter. Chapter selection, language, search, facets, date bounds and result page survive deep links and browser history. Directory scope `chapters` means selected chapters, all dates; legacy `catalog` now respects selected chapter membership too. An explicit empty selection matches no records.

The explorer normalizes accents, requires all query words, ranks title matches first and otherwise sorts chronologically. Member names explain indirect matches. At most 24 chapter cards are rendered per page. Selection is independent of the current search result. All application resources remain local and buildless; MariaDB is not required.

## Limits and measured next step

`tests/discovery-benchmark.html` generates 10,000 and 100,000 synthetic metadata records only. It exercises the production discovery query and result rendering. It does not create historical content or measure network transfer, full atlas indices, media, WebGL or low-memory/mobile performance.

The first Chromium run (Linux, Chrome 156) measured 100,000 cards at 1,136.6 ms preparation, 70.9 ms median / 74.1 ms maximum query, 73.5 ms page rendering, and 24 DOM cards. The uncompressed synthetic discovery JSON was 82.44 MiB. At 10,000: 120.9 ms preparation, 3.5 / 6.6 ms query, 28.9 ms rendering, 8.21 MiB. These are observations, not performance guarantees.

The single discovery payload and global atlas indices are intentionally not certified for a 100,000-chapter production library. Before that scale, split metadata/search and atlas indices into independently loadable shards, deduplicate facet dictionaries, move expensive preparation off the main thread, and measure transfer/cache/memory on representative devices. The current three-chapter test establishes the navigation model, not worldwide atlas readiness.

Chapter text supports internal reading links using the stable chapter ID, for example `[Continue reading](chapter:example)`. A link in a single-chapter view opens the destination’s own dates and map. In a multi-chapter comparison it retains the shared year and camera and includes the destination in the selection. Link targets must be chapters in the loaded catalogue.
