---
name: stewdio
description: Browse, create, inspect, and edit Stewdio Files through MCP. Use when working with Stewdio File XML, Graphic scripts, or animations through the plugin.
---

# Stewdio

Use the Stewdio MCP tools for the user's requested File work.

## Find or create a File

- Use a supplied File ID, or find the File with `list_files`. Search by name and
  follow `nextCursor` as needed; a single result page may not contain every File.
- Use `create_file` when the user wants a new File. Creation returns
  the File ID as `id` and starts with an empty canvas. Each File is one canvas.
- Read existing content with `read_xml({ fileId, nodeId? })` before editing.
- Use IDs returned by tools. Node IDs are canonical (`graphic:abcdefgh`). An
  Asset's `hash` is the SHA-256 of its bytes and is the same in every File, but
  a node may reference it only through a File Asset in its own File. Never invent or
  translate persisted IDs.
- Use `list_assets` and `get_asset` to read the File's File Assets: each has a `kind`
  (`image`, `video`, `audio`, or `model`) and, where they apply, `width`, `height`, and
  `duration`. To add new bytes, call `create_asset_upload` with their SHA-256 `hash`, `mime`,
  and `size`; Stewdio reads the kind and dimensions from the bytes.
  With `status: "upload"`, PUT the bytes to `upload.url` with `upload.headers`,
  then call `create_assets` with `fileId` and
  `items: [{ source: { uploadId: upload.uploadId }, name }]`. With
  `status: "existing"`, a File you can read already has these bytes as an Asset: call
  `create_assets` with the returned `source` instead of uploading. If an Upload expires or fails,
  call `create_asset_upload` again.
- Place media using the returned `hash` and native dimensions. To add a File Asset
  from another File you can read, call `create_assets` with
  `source: { fileId, hash }`; no bytes are copied and the Asset keeps the same hash,
  so copied nodes need no changes. If the File already has the Asset, its existing
  File Asset is returned, so retrying is safe. Results follow the input order.
  Use `rename_asset` for names. File Assets stay with their File; node deletion
  and undo do not remove them.
- Give each `write_xml` call a new UUID `mutationId`. After a lost response,
  retry with the same `mutationId` and XML; the File applies the edit at most once.
  Never retry old XML with a new ETag. Read again and reapply your intended changes.

## Authoring principles

- Prefer native `image` and `video` layers for media placement, playback, and
  layer transforms, and native `audio` layers in compositions for sound. Use
  Graphic when the result needs custom drawing or processing.
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
  Graphic scripts. It covers renderer lifecycle, drawing, fonts, File Asset inputs,
  and rendering checks.

Inspect the exact target with `read_xml` before editing. Write the smallest subtree
that contains the change, preserve unrelated content, and use that subtree's ETag
for updates. Omitted content on expanded nodes is removed.

## Inspect the result

Read the saved subtree when needed to verify its structure and obtain a current
ETag for another update. In hosts with MCP Apps, use `open_stewdio`:

| Arguments            | Destination                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `{}`                 | File library; optionally supply `query`, `limit`, or `cursor`.                    |
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
