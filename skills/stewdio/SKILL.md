---
name: stewdio
description: Browse, create, inspect, and edit Stewdio Files through MCP. Use when working with Stewdio File XML, Canvas scripts, or animations through the plugin.
---

# Stewdio

Use the Stewdio MCP tools for the user's requested File work.

## Find or create a File

- Use a supplied File ID, or find the File with `list_files`. Search by name and
  follow `nextCursor` as needed; a single result page may not contain every File.
- Use `create_file` when the user wants a new File. If creation returns organization
  choices, resolve the intended organization before retrying. Creation returns
  the File ID as `id` and includes an initial Page.
- Use IDs returned by tools. Asset IDs must refer to existing assets in the same
  File; users import assets through Stewdio's editor.

## Authoring references

- Read the [XML reference](references/xml.md) before authoring File XML. It covers
  subtree replacement, ETags, inputs, clips, animations, and write diagnostics.
- Also read the [Canvas reference](references/canvas.md) before writing or debugging
  Canvas scripts. It covers renderer lifecycle, drawing, fonts, bound File assets,
  and rendering checks.

Inspect the exact target with `read_xml` before editing. Write the smallest subtree
that contains the change, preserve unrelated content, and use that subtree's ETag
for updates. Omitted content on expanded nodes is removed.

## Inspect the result

Read the saved subtree when needed to verify its structure and obtain a current
ETag for another update. In hosts with MCP Apps, `view_file` opens the editor and
`view_node` opens an inline preview. Report what changed and distinguish saved
content from visual or playback checks that have actually been performed.
