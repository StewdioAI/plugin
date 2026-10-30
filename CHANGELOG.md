# plugin

## 0.5.0

### Minor Changes

- c93b2f0: Document Graphic font inputs: `<input type="font" font="Inter" font-weight="700" font-style="italic" />` lets users pick a Google font face, and scripts load it with `graphic.inputs.key.load()` for Canvas 2D or `graphic.inputs.key.arrayBuffer()` for the WOFF2 file.
- c93b2f0: Document uniform Graphic input handles: every key of `graphic.inputs` is a stable handle with `kind` and `label`, scalar inputs read their sampled value as `.value` (for example `graphic.inputs.speed.value`), number handles expose `min`, `max`, and `step`, and select handles expose `options`. Handles can be kept from the factory. Scripts that use a scalar input as a plain value are rejected on write.

## 0.4.0

### Minor Changes

- 616e8d9: Document the schema v6 Graphic authoring contract: scripts export `defineRenderer((graphic) => ({ render, dispose? }))` and acquire their own context in the factory, the host pre-scales Canvas 2D surfaces so scripts draw in logical `graphic.size` units, File Assets are declared as typed `image`, `video`, and `model` inputs with `ref` and read as synchronous handles from `graphic.inputs`, fonts load through `FontFace` from the two allowed origins (esm.sh and jsDelivr), and XML tools use `format: 6` with `nodes-assets-v6`. The `{ setup, render, dispose }` object form, `<asset-bindings>`, `assets.get()`, and `loadFont` are removed.
- 616e8d9: XML and asset tools no longer use a File `generation`: `get_file_capabilities`, `read_xml`, and asset tools drop it, and ETags no longer embed it. `write_xml` accepts a `mutationId` UUID; retrying a lost write with the same `mutationId` returns the saved result without applying the edit twice.
- 616e8d9: Use resource-oriented asset tools: upload new bytes or add assets you can already read from another File, and keep library assets for the lifetime of their File. Asset tools identify an asset by its `hash`, the SHA-256 of its bytes, which stays the same in every File. Each asset reports its `kind` and, where they apply, `width`, `height`, and `duration` directly.

### Patch Changes

- 616e8d9: Describe File Assets, Uploads, and personal File ownership consistently in the Stewdio skill and plugin usage, and remove outdated organization references.
- 616e8d9: Update Stewdio tools to read and edit Files without file-format or capability negotiation.

## 0.3.0

### Minor Changes

- b7533bb: Support schema v5 Files with one canvas, direct root XML nodes, and no page backgrounds.

## 0.2.0

### Minor Changes

- 0cd4155: The Stewdio skill now documents only the v4 File format: canonical node IDs, `graphic` nodes, and catalog assets addressed by `assetRef`. The v3 XML reference and legacy asset instructions are removed because v3 Files and clients are no longer supported; update older plugin installations to keep editing Files.

## 0.1.0

### Minor Changes

- 9f6d2f8: Add Graphic authoring, explicit File format discovery, and asset listing, upload, rename, and removal workflows. The skill supports both retained v3 Files and canonical v4 Files during migration, preserves upload identities across retries, and requires fresh targets after a format change.

### Patch Changes

- b728209: Preserve desktop and plugin validation while colocating capability tests with their implementations. Keep plugin installation and usage guidance in the published README as repository module inventories move to structured descriptors.
- ea8b02f: Teach Canvas scripts to request SVG frames at their output pixel dimensions so enlarged artwork stays sharp.

## 0.0.9

### Patch Changes

- 50b9302: Publish the Stewdio plugin from the monorepo with verified Git distribution files and an OpenAI ZIP with release checksums.

## 0.0.8

### Patch Changes

- fix: use the dedicated Stewdio MCP endpoint (#8)

## 0.0.7

### Patch Changes

- Clarify File link fallback and add OpenAI review demo (#7)

## 0.0.6

### Patch Changes

- Update plugin guidance for unified open_stewdio navigation (#6)

## 0.0.5

### Patch Changes

- docs: add one-click starter links for the post-install session (#5)

## 0.0.4

### Patch Changes

- docs: add INSTALL.md for Stewdio plugin installation (#4)

## 0.0.3

### Patch Changes

- a9180cf: Manage plugin versions and changelogs with Changesets, keep the Claude and Codex
  manifests synchronized, and publish a verified plugin ZIP on every update to main.
- Version and release every main update with Changesets (#3)

## 0.0.2

### Patch Changes

- 8c93345: Show File thumbnails and accessible Open in Stewdio actions when assistant hosts cannot display the fullscreen editor, including scrolling within constrained views. Refresh plugin marketplace descriptions, prompts, categories, and review scenarios, and preserve manifest formatting during version synchronization.
- 11aeca5: Prepare the plugin for directory submission with complete skill metadata, review scenarios, clearer listing copy, an allowlisted ZIP builder, a configurable public domain-verification endpoint, and a privacy policy disclosure for the isolated Canvas domain.
- 11aeca5: Publish plugin updates through versioned releases after any applications released alongside them have deployed successfully.
