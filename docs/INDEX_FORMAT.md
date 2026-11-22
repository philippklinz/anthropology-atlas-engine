# Runtime index contract · version 1 (draft)

The catalogue envelope is `schemas/0.1.0/catalog.schema.json`. Files are UTF-8 JSON except declared binary/text/geometry payloads. Paths resolve from the catalogue directory and must remain within it. Each file has its exact byte length and SHA-256. Chunks contain compiled copies of authoring records; their payload references are rewritten to catalogue-relative hashed paths.

| Role | Payload |
|---|---|
| records | `{indexVersion, dataReleaseId, records: {id: record}}` · one chunk per owner package |
| record-index | `{indexVersion, dataReleaseId, records: {id: {path, packageId, kind, type, labels}}, chapters: Chapter[]}` |
| time | Envelope with `items: {id: {possible: {from,to} or null, certain: {from,to} or null, kind, partial}}`; integer half-open epoch days |
| relations | Envelope with `items: {endpointId: [{id,from,to,predicate,symmetric,event?}]}`; both incoming and outgoing edges indexed |
| search | Envelope with `items: [{id,labels,aliases,text,type}]`; original text retained, normalization at query time |
| spatial | Envelope with `items: [{recordId,geometryId,path,role,bbox}]`; bounding boxes yield candidates, not exact intersections |
| licenses | Envelope with `items: [{id,license,creators,attribution,sourceUrl?,originNote?}]` |

Envelope means `{indexVersion: "1", dataReleaseId, items}`. Consumers reject incompatible versions or mixed releases. The browser verifies declared byte counts and hashes before parsing. Katalog hashes are supplied by `atlas.config.json`, except explicit `http/on-reload` development deployments.

The current search array is deliberately small and replaceable; it is not a large-scale search implementation. Geography, history and provenance never depend on a database. MariaDB remains optional.
