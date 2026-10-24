---
name: stewdio
description: Browse, create, inspect, and edit Stewdio Files through MCP. Use when working with Stewdio File XML, Graphic scripts, or animations through the plugin.
---

# Stewdio

Use the Stewdio MCP tools for the user's requested File work.

## Find or create a File

- Use a supplied File ID, or find the File with `list_files`. Search by name and
  follow `nextCursor` as needed; a single result page may not contain every File.
- Use `create_file` when the user wants a new File. If creation returns organization
  choices, resolve the intended organization before retrying. Creation returns
  the File ID as `id` and includes an initial Page.
- Call `get_file_capabilities({ fileId })` before reading or writing. Include
  `format: 4`, the returned `generation`, and `capability: "nodes-assets-v4"` on
  XML and asset calls.
- Use IDs returned by tools. Node IDs are canonical (`graphic:abcdefgh`);
  assetRefs are opaque and authorized for that File. Never invent or translate
  persisted IDs, derive refs from hashes, or copy another File's refs.
- Use `list_assets` and `get_asset` for metadata. Upload with
  `prepare_asset_upload`, PUT bytes to its returned URL with the exact supplied
  headers, then call `complete_asset_upload`. Keep one UUID `requestId` and
  unchanged metadata across retries. A `stored` prepare result is already complete.
- Place media only after finalization. Supply native media dimensions from asset
  metadata when creating image/video XML. Use `rename_asset` or `remove_asset`
  for metadata; catalog changes do not enter node undo history.
- If the generation changes, re-read capabilities and canonical targets.
  Preserve pending work; never retry old XML with a new ETag. If a tool reports
  that this client is unsupported, ask the user to update the Stewdio plugin.

## Authoring principles

- Prefer native `image` and `video` layers for media placement, playback, and
  layer transforms. Use Graphic when the result needs custom drawing or processing.
- Keep motion editable with XML keyframes: animate native fields for layer
  transforms and opacity, and named inputs for custom Graphic effects. Give effects
  separate tracks when users should be able to adjust their timing independently.
- Design controls as part of the creation. Expose meaningful ways for users to
  shape its appearance and motion, with useful defaults and ranges suited to the
  design, so they can explore variations without editing code.
- Treat each Graphic frame as a deterministic rendering of current inputs, assets,
  and dimensions. Keep timing in keyframes; cached resources may improve rendering
  performance, but previous frames must not determine the current result.

## Authoring references

- Read the [XML reference](references/xml.md) before authoring File XML. It covers
  subtree replacement, ETags, inputs, clips, animations, and write diagnostics.
- When designing Graphic controls, follow the
  [input authoring best practices](references/xml.md#input-authoring-best-practices)
  for choosing controls, labels, defaults, and ranges.
- Also read the [Graphic reference](references/graphic.md) before writing or debugging
  Graphic scripts. It covers renderer lifecycle, drawing, fonts, bound File assets,
  and rendering checks.

Inspect the exact target with `read_xml` before editing. Write the smallest subtree
that contains the change, preserve unrelated content, and use that subtree's ETag
for updates. Omitted content on expanded nodes is removed.

## Inspect the result

Read the saved subtree when needed to verify its structure and obtain a current
ETag for another update. In hosts with MCP Apps, use `open_stewdio`:

| Arguments            | Destination                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `{}`                 | File library; optionally supply `query`, `organizationId`, `limit`, or `cursor`.  |
| `{ fileId }`         | Existing File in the editor.                                                      |
| `{ fileId, nodeId }` | Read-only preview of the node and its descendants, with playback where available. |

`nodeId` requires `fileId`. Library filters and pagination cannot be combined
with a File target. Opening a view does not create a File or change its contents.
A node preview stays read-only in fullscreen; open the File without `nodeId` to
edit. Library/editor launches request fullscreen where supported; node previews
prefer inline, and the host controls presentation.

After creating or editing a File, include a clickable link to it. Prefer a plugin
deep link only when the host or a tool explicitly supplies one as supported in
the current client. Otherwise, use the File's HTTPS URL. Preserve tool-returned
URLs exactly. If no URL is returned, use `https://www.stewdio.ai/files/<fileId>`
with the File ID returned by a tool.

Report what changed and distinguish saved content from visual or playback checks
that have actually been performed.
