# plugin

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
