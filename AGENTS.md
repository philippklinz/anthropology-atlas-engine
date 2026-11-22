# Engine work rules

Read `docs/SPECIFICATION.md` before implementing a feature. It is the authoritative project specification. This checkout contains the first executable development slice. Read `docs/STATUS.md` for implemented behavior and remaining acceptance work.

- Keep the historical domain independent from MapLibre, vis, Three.js and DOM APIs.
- Historical content belongs in the content repository. Engine fixtures must remain explicitly synthetic.
- Distinguish structural JSON Schema validation from semantic and historical review.
- Keep IDs stable and relationships typed. Never infer language ancestry from script ancestry, or historical absence from missing records.
- Keep an independent content build and configurable catalogue URLs. Support bundled, HTTP and public GitHub Raw branch or pinned-commit profiles through the same static data contract.
- Runtime code dependencies must be vendored. Content requests may use only the explicitly configured content source. Never embed credentials in browser code.
- Update schema, examples and specification together while the contract is a draft. After the contract is frozen, provide versioning and migration for changes.
- Report checks actually run. Browser/hosting compatibility and historical correctness cannot be claimed from schema validation.
- Follow M0 and M1 acceptance criteria before broad UI or historical-content expansion.

- Meaningful views must have real deep links. Restore essential state from the URL without prior browser storage. Preserve native link behavior and functional browser Back/Forward; group continuous gestures without overwriting the preceding view.

- The repository is the executable static app. Use native browser JavaScript, HTML and CSS. Do not reintroduce Node.js, npm, TypeScript compilation, package installation or an application build.
- Keep atlas.config.json central; default to the content repo's main branch. Changing configuration must work on reload without compilation.
- Check in complete browser libraries including workers, fonts, licenses and checksums. Library updates are explicit maintainer commits.
- Content tools and tests must run in a browser without installing a toolchain. Optional Python standard-library checks may inspect distribution files, never become an app dependency.
- Read docs/decisions/0002-native-browser-distribution.md; it supersedes the earlier toolchain decisions.
