# Anthropology Atlas · Engine

An open atlas of places, people, languages, institutions and their connections through time. This repository holds the software, data contract and explicitly synthetic fixtures. Historical research belongs in [anthropology-atlas-content](https://github.com/philippklinz/anthropology-atlas-content).

**Version 0.1.0-dev.1: first working development slice.** Globe, timeline, relationship network, source details, DE/EN UI, search and GLB viewer. This is a technical demo, not a historical release. Read [status](docs/STATUS.md) and [specification](docs/SPECIFICATION.md) before extending it.

## Run locally

Toolchain profile: Linux x86_64 glibc, Node.js 24.22.3, npm 11.19.1. Dependencies are included as verified npm archives. The normal install uses no package server. Large package archives are split into ordered parts; the installer rejoins them and verifies the complete upstream archive before installation.

```bash
node tools/install-offline.mjs
npm test
npm run demo
npm run dev
```

Open the printed local HTTP URL, not a `file://` path. The demo contains two fictional chapters and 39 records, including an intentional territorial gap in 1300–1304.

## Build and deploy

```bash
npm run typecheck
npm run demo
npm run build
```

Serve the contents of `dist/` from any static host, including a project subdirectory. Hash routes need no rewrite. The manual **Publish synthetic demo to Pages** workflow is provided: enable GitHub Pages with Actions as its source, then run the workflow when ready. Development does not change repository visibility or automatically publish a site.

For your own content, replace `public/atlas.config.json` before building or `dist/atlas.config.json` afterwards. `npm run demo` intentionally replaces the development config. The configuration schema defines `bundled`, `http` and pinned public `github-raw` profiles. Another content origin needs CORS. Payload hashes and content revision are checked. No browser token or MariaDB is required.

## Content tools

```bash
node tools/cli.ts validate /path/to/content --profile draft
node tools/cli.ts build /path/to/content --profile release --out build/content
npm run authoring:build
```

`build/authoring/` is standalone: copy it to `tooling/` in the content repo and use `node tooling/tools/cli.js validate . --profile draft`. It needs Node 24, but no engine checkout or npm install. Validation distinguishes `draft`, `fixture` and `release`; it does not establish historical truth.

## Rendering

MapLibre GL JS supplies the main globe; vis supplies time and connections; Three.js loads embedded GLB models. d3-geo provides an SVG globe without WebGL2. Three.js has a limited SVG fallback for simple untextured models. GPU/globe integration still needs WebGL2 browser acceptance. Lists and genuine links accompany canvas views; URLs retain time, camera, filters, language and content revision.

## Dependencies and licenses

The existing GNU GPL v2 [LICENSE](LICENSE) is preserved. Third-party terms remain separate. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), `public/licenses/` and `vendor/manifest.json` contain versions, sources, hashes and license texts. `npm run vendor` is an explicit online maintenance command, not a normal build step.

`src/domain`, `catalog`, `query`, `state` form the independent core; `map`, `timeline`, `network`, `models` are adapters; `ui`, `i18n` handle presentation. `tools/` builds and checks content. `fixtures/` remains synthetic. `tests/unit/` is executable; `tests/browser/` separates planned cases from observed QA.
