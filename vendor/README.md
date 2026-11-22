# Fixed browser resources

These files are directly executable browser distributions. No install or dependency resolution runs on the user's machine or host. `manifest.json` records their exact hashes, source versions, upstream archives and licenses. The original archives are provenance references, not downloads performed by the atlas.

- MapLibre: official 6.19.0 ESM main module, separate ESM worker, CSS. Both modules must be retained together.
- vis: official standalone ESM bundles for network 10.1.5 and timeline 8.5.6, including their embedded dependencies and styles. Bundle constituent versions can differ from separately acquired peer packages; the fixed bundle bytes define what runs.
- Three.js: official 0.187.0 core/module and the selected official add-ons. Bare `three` imports in add-ons were changed to local relative module URLs.
- fflate: official 0.8.3 browser ESM module, used for local ZIP import/export.
- validation: readable self-contained browser module containing Ajv 8.20.0, ajv-formats 3.0.1 and required runtime helpers.
- topology: readable browser module exposing JSTS 2.12.1 GeoJSONReader and IsValidOp.
- geo: readable d3-geo 3.1.2 module with d3-array/internmap, used for the SVG fallback.
- moment: readable 2.31.0 module for the timeline's calendar adapter.

The last four bundles were prepared once during the migration with the previous build tools. Those tools are removed from the project. The application itself is unbundled, directly editable source. Maintainers deliberately replace a library's browser files when upgrading, update provenance/licenses/checksums, and rerun browser checks. Do not add installers or fetch-on-demand code. Upstream source maps are not needed at runtime and are not shipped.
