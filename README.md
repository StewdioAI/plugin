# Stewdio

This repository is a plugin marketplace with one plugin, `stewdio`. The plugin
connects your assistant to the hosted [Stewdio](https://www.stewdio.ai) MCP server
at `https://mcp.stewdio.ai/mcp`. It contains no skills, hooks, or local servers.

## What you can do

- Find your Files and Files shared with you, or create a new File.
- Inspect a File or any node subtree as XML, then make targeted edits that preserve
  unrelated content.
- Write and debug Graphic scripts, including drawing, fonts, and File Asset inputs.
- Discuss Files in Comment Threads and send feedback to the Stewdio team.
- Open the File library, the File editor, or a node preview in the conversation.

Authoring guidance comes from the server: the `read_documentation` tool returns the
`overview`, `xml`, and `graphic` topics, so your assistant always reads the
documentation that matches the live server.

## Requirements

You need a Stewdio account and an assistant that supports remote MCP servers with
OAuth sign-in. Creating and editing Files is subject to your Stewdio plan. The
Stewdio desktop application is not required.

## Setup

For Claude Code, add this marketplace and install the plugin:

```sh
claude plugin marketplace add StewdioAI/plugin
claude plugin install stewdio@stewdio --scope user
```

Then run `/mcp`, select Stewdio, and complete the browser sign-in flow.

For Codex CLI, ChatGPT, and other MCP hosts, follow the
[installation guide](https://docs.stewdio.ai/installation) to connect the server
directly.

## Try it

- "List my Stewdio Files."
- "Create a Stewdio File named Launch animation."
- "Open my Launch animation File and help me animate a Graphic."

Ask your assistant to inspect a File before editing it: XML writes replace the targeted
node subtree and remove omitted descendants, except that nodes marked
`collapsed="true"` preserve their hidden content. Updating a subtree requires the
ETag from a read of that same root node; if the File changed, read again before
reapplying the edit. Edits in the embedded editor save as you work.

| Tool                                                               | Purpose                                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `read_documentation`                                               | Read the `overview`, `xml`, or `graphic` authoring documentation.                       |
| `list_files`                                                       | Search and paginate your Files or Files shared with you.                                |
| `create_file`                                                      | Create a File with an empty canvas.                                                     |
| `read_xml`                                                         | Read a File or node subtree as XML.                                                     |
| `write_xml`                                                        | Create or update a node subtree, or rewrite the File's top-level nodes, using XML.      |
| `list_assets`                                                      | Read a File's File Assets separately from node XML.                                     |
| `create_upload`, `create_assets`                                   | Upload bytes, or add File Assets from other Files, before placing media.                |
| `rename_asset`, `delete_asset`                                     | Rename or remove a File Asset independently of node history.                            |
| `list_comment_threads`, `create_comment`, `resolve_comment_thread` | Read, start, reply to, and resolve Comment Threads.                                     |
| `send_feedback`                                                    | Send feedback about Stewdio to the Stewdio team.                                        |
| `open_stewdio`                                                     | Open the File library, a File editor, or a read-only node preview in an MCP Apps host.  |
| `get_api_access`                                                   | Give the embedded app short-lived access to the regular API; available only to the app. |

`open_stewdio` selects its destination from the supplied IDs:

| Arguments            | Destination                                        |
| -------------------- | -------------------------------------------------- |
| `{}`                 | File library.                                      |
| `{ fileId }`         | Existing File in the editor.                       |
| `{ fileId, nodeId }` | Read-only preview of the node and its descendants. |

Library/editor launches request fullscreen where supported; node previews prefer
inline. The host controls presentation, and expanding a preview does not enable
editing. Opening any view does not create a File or change its contents.

## Execution, network access, and data

The plugin configures a remote server only; it installs no skills, local
server, hooks, scripts, or package dependencies. Your host sends tool
arguments and OAuth credentials to `https://mcp.stewdio.ai/mcp`. Arguments can
include File and node IDs, File names, XML, and Graphic scripts. The server
returns File metadata, requested File content, and UI resources to the host. File
writes are stored by Stewdio. Sign-in uses WorkOS through `https://signin.stewdio.ai`.

In MCP Apps hosts, the embedded UI runs in the host's sandbox, connects to
`https://api.stewdio.ai` and `wss://api.stewdio.ai` for authorized File operations
and live synchronization, and retrieves UI assets and thumbnails from
`https://mcp.stewdio.ai`. Uploads
send selected files to Stewdio's Cloudflare R2 storage; Asset downloads and Uploads
use signed URLs on `29117f3a6e767d87fa15ea697a7dbec9.r2.cloudflarestorage.com`.
File access credentials are supplied to the embedded app separately from
model-visible tool results.

Graphic scripts execute in an isolated iframe at `https://stewdiousercontent.com`,
a Stewdio domain kept separate from `stewdio.ai` so that scripts can't reach your
account. Depending on the File's content, rendering can fetch public modules,
fonts, and other resources from `esm.sh` and `cdn.jsdelivr.net` only. These public
resource requests omit credentials. **Open externally** in the editor menu opens File links
on `https://www.stewdio.ai`; exports use the host's download capability when available.

See the [privacy policy](https://www.stewdio.ai/privacy) for data handling and the
[terms of service](https://www.stewdio.ai/terms) for use of the hosted service.

Stewdio is published by Cekura, Inc. The source repository
is owned by the [StewdioAI GitHub organization](https://github.com/StewdioAI).

The listing icon is a readable SVG image containing only
static shapes. It has no scripts or external references. Packaging copies it as
an asset; release validation reads manifest versions. Neither executes the icon.

## Troubleshooting and support

- **Tools are missing:** check that the plugin or connector is enabled. In Claude
  Code, inspect `/plugin` and `/mcp`, then follow the host's reload instructions.
- **Sign-in expired or failed:** reconnect the Stewdio server through your host's
  OAuth flow and sign in with the intended Stewdio account.
- **File unavailable or access forbidden:** confirm that you own the File. For
  creation or editing errors, check your plan in Stewdio.
- **Editor or preview unavailable:** open the returned File URL in Stewdio, or use
  **Open externally** in the editor menu. Embedded UI and fullscreen support depend
  on the host.

For further help, contact [Stewdio support](https://www.stewdio.ai/support) with
your host name, the tool used, and the error message. Exclude access tokens and
private File content from support reports.

## Releases

This repository is maintained by hand. Authoring documentation is served by
the MCP server, so server updates reach you without updating the
plugin. Plugin versions change only when the marketplace or manifests change.

## License

The plugin files are available under the [MIT License](LICENSE). The Stewdio
applications and hosted MCP server are proprietary and covered by the
[terms of service](https://www.stewdio.ai/terms).
