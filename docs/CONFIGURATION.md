# Installation and central configuration

Clone or download the repository into an HTTP(S) web root, then open `index.html` through that web server. No application installation, package manager, compilation or backend is needed. Edit the JavaScript in `src/` directly and reload. Opening files with `file://` is not supported because browsers restrict module and JSON loading there.

All program libraries, fonts, workers and the physical basemap are local. The only optional remote requests are to the explicitly configured content source and source links opened by a visitor. The content repository must contain a published catalogue; raw source records alone are not an index.

## Default: content repository, main branch

The installed `atlas.config.json` selects:

```json
{
  "configVersion": "1",
  "instanceId": "anthropology-atlas",
  "defaultLanguage": "de",
  "content": {
    "mode": "github-raw",
    "owner": "philippklinz",
    "repository": "anthropology-atlas-content",
    "branch": "main",
    "catalogPath": "published/catalog.json",
    "updatePolicy": "on-reload"
  }
}
```

Change `owner`, `repository` and `branch` to choose another public repository or branch, including a branch such as `feature/research`. Reloading reads the catalogue again. Nothing is installed or rebuilt. A raw GitHub source must be public; never put credentials in this file. Branches are mutable: use a commit profile for a reproducible archive.

## Local clone or own server

Replace only the `content` object:

```json
{
  "mode": "http",
  "catalogUrl": "http://localhost:8080/anthropology-atlas-content/published/catalog.json",
  "updatePolicy": "on-reload"
}
```

Use the actual URL at which your web server exposes the clone, whether localhost, LAN or a hoster. A filesystem path is not a URL. For a different origin, the content host must allow browser requests with CORS. An HTTPS atlas needs an HTTPS content URL except for browser-supported loopback development. `localhost` always refers to the visitor's computer.

A clone inside the same installation can use a relative URL:

```json
{
  "mode": "bundled",
  "catalogUrl": "./content/published/catalog.json",
  "updatePolicy": "on-reload"
}
```

All relative paths resolve beneath the installation's own URL, including a GitHub Pages project subpath. Serve `.js`/`.mjs` as JavaScript and `.json` as JSON. Hash routing requires no server rewrite rules.

## Fixed revision

Use `commit` instead of `branch`, a full 40-character commit SHA, `updatePolicy: "pinned"`, and `expectedCatalogSha256` containing the SHA-256 of the exact catalogue bytes. Both hashes are required for a pinned GitHub profile. The authoring export reports the catalogue hash. Never set both `branch` and `commit`.

Every payload is verified against the catalogue's byte size and SHA-256 regardless of profile. Keep old `published/files/` files when updating a branch so visitors using the previous catalogue can finish loading it. A link pinned to an unavailable release reports the mismatch; it does not silently pretend to restore the old state.

## Demo and empty data

The default source is always the configured content repo. An empty draft catalogue shows the globe and a clear welcome message. There is no silent fallback to invented history.

The optional top-level `demo` profile enables `?demo=1`, using the explicitly synthetic content shipped under `demo/content/`. A demo URL retains this query when navigating and sharing links. Delete the `demo` property to disable that entry point. The file format is documented in `schemas/0.1.0/config.schema.json`.

## GitHub Pages

The supplied **Publish atlas files to Pages** workflow copies the checked-in files and publishes them. It performs no application build or package installation. Keep Settings → Pages → Source set to GitHub Actions, then run that workflow; future pushes to `main` publish automatically.

Alternatively disable/remove the publishing workflow and choose **Deploy from a branch → main → /(root)**. `.nojekyll` is included. Both options serve the same files. Your own host only needs a file copy or git clone.

GitHub's publishing actions are hosting infrastructure maintained by GitHub; they are not dependencies of the atlas. Raw content is a configurable separate host, not unlimited storage or a guarantee against GitHub bandwidth/file limits.
