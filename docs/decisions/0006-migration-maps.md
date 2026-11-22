# 0006 · Migration hypotheses, landscape snapshots and chapter steps

2026-11-22 · accepted for the development contract; capability `migration-maps`, compiler dev.8. The schema remains the explicitly unfrozen `0.1.0` contract. Older viewers fail closed on the new capability.

## Meaning and ownership

An attestation event and a reconstructed migration are independent records. Never generate a migration from genetic kinship, a language relationship, or two dated findspots. A directed `spatial` entry must be explicitly authored, cited with a locator, and explained in the event note. Coordinates express geometry only: they are not dated stops and cannot establish a travel speed or population size.

```json
{
  "geometryId": "geometry:example-route",
  "role": "route",
  "direction": "forward"
}
```

`direction` is optional and permits `forward`, `reverse`, `both`; only `route` geometry on `migration`, `journey` or `campaign` events can carry it. `forward` follows coordinate order independently within each component of a LineString/MultiLineString. Split at the dateline; never invent a connecting segment. Existing undirected geometry remains undirected. Migration events occupy the `migrations` layer; other movement events keep `events`.

A route can represent an explicitly described model scenario or environmental opportunity window. That time does not become a dated journey. The event must say what its time means. The viewer does not animate interpolated movement or infer dates for intermediate vertices.

## Alternatives

Interpretation members may be assertions or migration events. Chapter `interpretationChoices` accepts exactly one of the existing `assertionId` and new `recordId` (assertion/event), plus `interpretationId` and bilingual `reason`. The chosen record must belong to the group. Event alternatives retain separate geometry and citations.

The detail panel can select a member or compare all. Map and timeline exclude other members when one is chosen. Independent findspots remain. Comparison uses distinct colour/dash styles for the current A/B route pair and a visible alternative-explanation notice; it is not a combined itinerary. More than two route alternatives are legal records but the current map style cycles to A after B; authors should use paired comparisons for clear visual discrimination. Do not use line width as probability.

Choices live in the existing `interpretations` URL object. The encoder always writes it, including `{}`: explicit comparison must survive chapter defaults, reload and history. Missing old-link parameters still use chapter defaults. Groups outside the current time window do not fill the chapter detail panel.

## Land and ice

`land-reconstruction` and `ice-reconstruction` are polygon roles on cited `extent-of` assertions between region entities. They require `time.kind = instant`: a dated snapshot. A date envelope may express reconstruction uncertainty; it never authorizes continuous display through unrelated times. The `landscapes` layer has separate ochre land/blue ice treatment and the legend links to each visible snapshot's date and source detail. The modern basemap remains labelled as modern orientation. Selected schematic areas must state limited coverage and unknown accuracy; a marker's outline is not an exact ancient coastline.

The viewer displays only time-matching snapshots and reports when none is visible. It does not morph coastline geometry or extrapolate a snapshot. Polygons and routes have distinct layers and click targets. Source figures are assets with their own licenses, not automatically GPL map geometry.

## Chapter steps

Existing `steps` now support localized `labels` and `summary`. IDs are unique. Each step can supply the existing `initialState` shape (camera, time, layers). Selecting a step changes these together and uses the existing URL `step` parameter. Overview restores the chapter initial state. Explicit URL time/camera/layers override the step defaults; short direct links use them. Changing the time manually clears the step label. Panning retains it. Steps do not remove other selected chapters or turn off independent evidence.

The compiler puts steps and default interpretation choices into the lazy discovery index, so a direct link can resolve them before full content loads. No new external dependencies or server are introduced. Authoring-toolkit copies must include `src/domain/cartography.js`.

## Validation and tests

`tests/migrations.test.js` builds synthetic examples through the real browser compiler, verifies provider filtering, capability gating, discovery defaults, snapshot gaps, comparison/step URL roundtrips, direction rules, and SVG arrow clipping. Negative cases reject unsupported direction, uncited landscape records, interval snapshots, non-migration event alternatives and duplicate step IDs. Existing genetic-route prohibition remains covered separately.

Both renderers consume one semantic feature representation. SVG arrows are sampled from the horizon-clipped projected path; MapLibre uses locally generated image data with line placement. No remotely fetched icon is required. GPU rendering needs a WebGL-capable browser; the fallback tests do not certify it.
