# 0004 · Deep time, natural specimens and local images

Status: implemented draft extension, 2026-11-22, compiler/engine dev.6.

## Problem

An atlas that accepts only years after -10000 cannot represent early human fossils. JavaScript Date also cannot represent every required year. An uncertain archaeological occurrence must not become a point at its earliest possible date or a seemingly continuous occupation. Fossils are not manufactured artifacts, and image files need the same local provenance and integrity controls as other assets.

## Time contract

- Domain: astronomical Gregorian integer epoch days, years -1000000 through 2100. Out-of-range values fail; no silent clipping of supplied calendar dates.
- Existing calendar estimates remain valid. The alternative age estimate uses `basis: "years-before"`, `referenceYear: 1950`, `older`, `younger`, `precision: "year"`, and `qualifier`. `older >= younger`; nonnegative integer ages cannot exceed 1001950.
- Optional `central` lies within the age interval. Optional `uncertaintySigma` is 1, 2 or 3 and requires a central value and symmetric, nonzero uncertainty. This records the source's reporting convention; the engine neither converts sigma levels nor calibrates radiocarbon dates.
- Conversion: astronomical year = 1950 − age. Whole-year bounds produce the same half-open epoch-day intervals as calendar estimates. The fixed BP reference is an atlas comparison convention; sources must retain the original estimate and method. Statistical envelopes are operational query ranges, not absolute limits on a probability distribution.
- `kind: "before"` with `bound: TimeEstimate` means explicitly older than a dated constraint. Its normal form includes `openStart: true`, the normalized `bound`, and `certain: null`. `possible.from` is the engine's lower domain boundary solely for overlap filtering. It cannot satisfy `contained` and is never described as a finite duration. Unknown/null interval endpoints still remain undated; they are not silently interpreted as before/after constraints.
- The time index retains original `display` data alongside normalization, so labels can preserve central values, sigma and one-sided evidence.

## Rendering and navigation

The vis timeline is retained. If the current time or any scoped dated record precedes year -10000, a **linear** display adapter maps 1000 historical days to one renderer day. Inverse conversion restores historical days and years; the synthetic renderer calendar never enters sources, URLs, queries or visible labels. Normal voyage-only views retain their daily calendar precision. Deep views have a one-year minimum window; this is a display limit, not data precision.

Date envelopes for uncertain instants have hatching and tooltips explicitly distinguishing uncertainty from duration. Before constraints use a left-open bar and directional prefix. BP, BCE and CE controls use the same year domain. Discovery filters can select BP; their URL `browse-scale` stores the input convention while `browse-from/to` retain normalized astronomical years. Mixed prehistory/recent chapter selections stay on the linear deep-time scale, so small recent events cluster together until the user zooms or narrows selection.

## Specimens and media

`specimen` (`entities/specimens`) and `taxon` (`entities/taxa`) have their own IDs and directory categories. Existing event participant and asset references accept them. `attested-at` supports specimens/taxa; no biological ancestry is represented as language ancestry or political membership.

Image assets use the existing metadata/rights contract. JPEG, PNG and WebP signatures and a 20 MiB limit are checked before display; active SVG/HTML formats are rejected. This is not a full codec or decompression-budget validator. The normal content provider verifies origin, file length and SHA-256. Images load on demand, use local blob URLs cached for that provider session, show alt text/captions and credit, and have shareable `#/v1/image/<asset-id>` routes. The browser releases blob resources with the document. Chapter hero images are the first image in explicit focus membership; no historical ID is hardcoded in the engine. The license page includes the catalogue's content-rights inventory.

## Compatibility

The 0.1.0 contract remains a draft. New catalogues advertise `deep-time`, `natural-history` and/or `image-viewer`; the compiler derives them from selected records even if their owner package omitted a declaration. Older engines reject unsupported capabilities clearly. Deploy the engine before publishing new content. Old catalogues and original calendar estimates still work; new exports preserve source display data.

## Verification and limits

Six native browser groups cover million-year arithmetic and linear projection, one-sided versus undated constraints, BP URL restoration, schemas/capability derivation, and timeline envelopes/selection/scope changes. Existing chapter, geometry, compiler and history tests remain in the same suite. Real chapter authoring and viewing are checked separately; no historical content enters engine fixtures. These checks do not establish the historical interpretation or GPU rendering correctness.
