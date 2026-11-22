# 0001 · First executable foundation

2026-11-22 · App 0.1.0-dev.1 · schema/index contracts remain draft.

This is the first integrated development slice, not the completed 0.1.0 release. M0 and M1 remain open until the acceptance gaps in `docs/STATUS.md` are closed.

- Preserve the GPL v2 LICENSE files already present in both GitHub repositories. Per-asset licenses remain separate.
- Generate TypeScript record types from the canonical JSON Schema; semantic checks run separately. JSTS validates polygon topology. The current import profile requires dateline-crossing segments to be split by the author; automatic cutting is not implemented.
- Compile package chunks and record/search/time/relation/spatial indices into immutable, hash-verified files. Every index declares its release and version. Original payloads are preserved; compiled polygon winding is normalized.
- Data providers use one transport contract for bundled, HTTP and pinned public GitHub Raw. Private credentials are forbidden in browser configuration. A missing or different release fails visibly.
- All-zero `sourceRevision` is a reserved sentinel ONLY for uncommitted local synthetic previews. Real draft/release builds require a source commit. Generated releases must be built from clean source checkouts; this will become an enforced release gate before M3.
- Hash URLs are the state authority. Complete links include time, camera, source/release, filters and selections. Human year display omits year zero. Calendar arithmetic uses integer epoch days, never SQL DATE or Date(year,...).
- MapLibre GL JS is the primary globe. The current cloud QA browser has no WebGL2. A d3-geo SVG globe preserves usable geographic exploration on those devices. Three.js also has a limited SVG fallback for simple untextured models. Neither fallback certifies GPU rendering.
- Runtime code and resources are local. A complete npm archive store is prepared for Linux x86_64 glibc, Node 24. Normal installation consumes that store offline; vendor refresh is an explicit maintenance command.
- Historical research stays in the content repository. The engine includes only synthetic fixtures. The content repository starts empty, with a standalone validator/compiler and authoring templates.

The full application specification continues to define the intended final behavior. This document records implementation choices and explicit temporary limits; it does not waive the remaining acceptance criteria.
