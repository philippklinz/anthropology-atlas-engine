# Engine work rules

Read `docs/SPECIFICATION.md` before implementing a feature. It is the authoritative project specification. This checkout contains the first executable development slice. Read `docs/STATUS.md` for implemented behavior and remaining acceptance work.

- Keep the historical domain independent from MapLibre, vis, Three.js and DOM APIs.
- Historical content belongs in the content repository. Engine fixtures must remain explicitly synthetic.
- Distinguish structural JSON Schema validation from semantic and historical review.
- Keep IDs stable and relationships typed. Never infer language ancestry from script ancestry, or historical absence from missing records.
- Keep an independent content build and configurable catalogue URLs. Support bundled, HTTP and pinned public GitHub Raw profiles through the same static data contract.
- Runtime code dependencies must be vendored. Content requests may use only the explicitly configured content source. Never embed credentials in browser code.
- Update schema, examples and specification together while the contract is a draft. After the contract is frozen, provide versioning and migration for changes.
- Report checks actually run. Browser/hosting compatibility and historical correctness cannot be claimed from schema validation.
- Follow M0 and M1 acceptance criteria before broad UI or historical-content expansion.

- Meaningful views must have real deep links. Restore essential state from the URL without prior browser storage. Preserve native link behavior and functional browser Back/Forward; group continuous gestures without overwriting the preceding view.
