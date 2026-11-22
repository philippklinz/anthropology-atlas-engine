# 0002 · Direct browser distribution

Accepted 2026-11-22 at the project owner's request. This supersedes the TypeScript/Vite/Node/npm decisions in 0001 and the earlier build-tool paragraphs of SPECIFICATION.md.

The repository itself is the executable static application. Application source is plain JavaScript ESM, HTML and CSS. There is no application compilation, package installation, registry access, generated `dist/` or Node requirement for installation, source edits, tests or content authoring.

Browser-ready third-party code is checked into `vendor/` with source provenance, exact versions or upstream bundle identities, license texts and SHA-256 checksums. Library updates are explicit maintainer changes. Libraries without a suitable upstream browser bundle are supplied as checked-in readable browser modules; consumers never regenerate them. The migration converted those modules once using the previous toolchain, which is not part of the distribution.

MapLibre 6 requires a separate module worker. Both the main module and worker are shipped and `setWorkerUrl` uses an explicit local URL. The earlier bundler omitted this worker, leaving the background globe visible but GeoJSON sources unprocessed.

Content validation and catalogue generation run in `authoring.html` with browser File APIs and a virtual workspace. Export produces a ZIP for the content repo's `published/` directory. The directory/ZIP import cannot attest host symlink metadata or the source Git revision; maintainers inspect source paths and supply the actual committed revision. Structural/semantic validation does not establish historical truth.

`atlas.config.json` is the single installation configuration. Default: public content repo, `main` branch, reload policy. Alternatives: another repo/branch, pinned commit, absolute HTTP catalogue URL, relative local catalogue. Configuration changes never require compilation. Empty draft catalogues are permitted with no default chapter; empty historical releases remain invalid.

Browser checks are served at `tests/index.html`. A small Python standard-library script checks distribution file references, hashes and absence of removed toolchains in CI. Python is optional maintenance tooling, never an atlas or authoring runtime dependency. Hosting only requires a normal static web server.
