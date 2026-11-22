# 0005 · Genetic ancestry and individual kinship

2026-11-22; additive extension of the unfrozen 0.1.0 contract, engine/compiler dev.7.

The encounters chapter needs to distinguish ancestry in a lineage from kinship between sampled individuals. Language descent, cultural influence and event co-participation cannot express those findings.

| Predicate | Endpoints | Direction |
|---|---|---|
| `has-genetic-ancestry-from` | person or specimen → taxon | Directed |
| `genetically-related-to` | person or specimen ↔ person or specimen | Symmetric; store lexicographically smaller ID first |

For specimen endpoints the statement concerns the represented individual. Do not use an undifferentiated collection of multiple individuals. `note` explains the genetic method, the individual represented, any estimated degree/generational distance and limits. It is not an identity, language, ethnicity or cultural membership claim. No transitive relations are inferred.

`time` anchors the sampled individual(s) or explicitly described evidence envelope. It does not date conception, a migration or the original admixture unless independently established. Unknown ages remain unknown. `epistemic` describes the inference separately from dating uncertainty. A source with role `supports` and a nonempty locator and an explanatory note are required even in drafts. Structural checks cannot establish the adequacy of a genetic study.

Spatial representation is optional. Only `connection` is permitted: a line links findspots and is not an actual journey or proof that mating happened at either endpoint. Point locations belong to separately cited attestation events. The compiler and viewer retain citation access and symmetric edges in both directions.

Synthetic positive examples and negative cases are in `tests/genetics.test.js`. They cover incorrect lineage endpoints, reversed symmetric endpoints, absent evidence, forbidden route semantics and capability derivation. Historical data remain exclusively in the content repository.

Migration: existing records are unchanged. New records require the registered `genetic-relationships` capability, derived by the compiler even when omitted from a package. Older viewers fail their capability check rather than displaying an unknown relationship. Update the engine, then the content repository's pinned browser toolkit, then export the chapter from committed sources. No new dependency or build step is introduced.
