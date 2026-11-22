# Anthropology Atlas Engine

An open, static atlas of people, places and connections through time. Development version 0.1.0-dev.3. The default content source offers a small, sourced historical research draft about the first circumnavigation (1519–1522).

## Run and configure

Clone or copy this repository into your web server and open its URL. **No Node.js, npm, package installation or application build.** The application source is editable browser JavaScript in `src/`; all libraries, workers, fonts and the physical basemap are checked in.

Edit **[atlas.config.json](atlas.config.json)** to select the content installation. Default: `philippklinz/anthropology-atlas-content`, branch `main`, `published/catalog.json`. Another repository, branch, own host or local clone served by HTTP works through the same catalogue format. See [configuration examples and Pages instructions](docs/CONFIGURATION.md).

Open the atlas normally for the historical chapter. Chapters and the **Browse by type** directory are separate: people, communities, events, places, objects and sources have their own counted lists. Empty categories remain under “More categories”. Category links work independently of the map date and preserve browser history.

The explicitly fictional technical fixture is only available at **`?demo=1`** for software checks. It links back to the normal historical atlas. Empty content sources still get a welcome view. Use an HTTP(S) URL, not `file://`.

## Content tools and tests

Open **[authoring.html](authoring.html)**, choose a content folder or ZIP, and validate/export it in the browser. Files stay local to that browser. Exported catalogue files belong in the content repo's `published/` directory. The `draft`, `fixture` and `release` profiles preserve the distinction between editorial drafts, synthetic tests and historical publication.

Open **[tests/index.html](tests/index.html)** for browser checks. Optional CI/file-integrity check: `python3 scripts/check-static.py` (standard library only). Python is not required to run, edit or publish the atlas or its content tools.

## Repository guide

- `src/`: directly executable application modules and styles.
- `vendor/`: fixed browser libraries; versions, sources, hashes in `vendor/manifest.json`.
- `fonts/`, `basemap/`, `licenses/`: local assets, provenance and legal notices.
- `schemas/0.1.0/`: draft data contract and controlled vocabulary.
- `tools/`, `authoring.html`: standalone browser validator/compiler.
- `fixtures/`, `demo/content/`: synthetic test sources and ready-to-use demo catalogue.
- `docs/`: product specification, configuration and implementation status.

[Specification](docs/SPECIFICATION.md) · [Status and limitations](docs/STATUS.md) · [Architecture decision](docs/decisions/0002-native-browser-distribution.md)

The existing GNU GPL v2 [LICENSE](LICENSE) is preserved. [Third-party notices](THIRD_PARTY_NOTICES.md) list the shipped open-source components and local license texts. Updates are explicit maintainer changes; nothing downloads newer code at runtime.
