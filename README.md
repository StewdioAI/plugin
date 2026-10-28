# Stewdio

## Using the plugin

Browse, create, inspect, and edit your [Stewdio](https://www.stewdio.ai) Files from
your assistant. Read and write File XML, author Graphic scripts, and preview nodes
and Compositions. Assistants that support MCP Apps can also show your File library,
an editor that saves as you work, and inline node previews.

## What you can do

- Find your Files by name, or create a new File.
- Inspect a File or any node subtree as XML, then make targeted edits that preserve
  unrelated content.
- Write and debug Graphic scripts, including drawing, fonts, and File Asset inputs.
- Open the File library, the File editor, or a node preview in the conversation.

The plugin connects the hosted Stewdio MCP server and bundles the
[stewdio skill](skills/stewdio/SKILL.md), which teaches your assistant File XML,
subtree editing, inputs, clips, animations, and Graphic renderer scripts.

## Requirements

You need a Stewdio account and an assistant that supports remote MCP servers with
OAuth sign-in. You can access only your own Files. Creating and editing Files is
subject to your Stewdio plan. The Stewdio desktop application is not required.

## Setup

Follow the [installation guide](https://docs.stewdio.ai/installation)
for Claude, ChatGPT, Codex CLI, and other MCP hosts. It covers installation,
sign-in, and verification of the plugin's skill and authenticated tools.

For Claude Code, install from the public marketplace:

```sh
claude plugin install stewdio --marketplace StewdioAI/plugin --scope user
```

## Try it

- "List my Stewdio Files."
- "Create a Stewdio File named Launch animation."
- "Open my Launch animation File and help me animate a Graphic."

Ask your assistant to inspect a File before editing it: XML writes replace the targeted
node subtree and remove omitted descendants, except that nodes marked
`collapsed="true"` preserve their hidden content. Updating a subtree requires the
ETag from a read of that same root node; if the File changed, read again before
reapplying the edit. Edits in the embedded editor save as you work.

| Tool                                   | Purpose                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `list_assets`, `get_asset`             | Read a File's File Assets separately from node XML.                                     |
| `create_asset_upload`, `create_assets` | Upload bytes, or add File Assets from other Files, before placing media.                |
| `rename_asset`                         | Rename a File Asset independently of node history.                                      |
| `list_files`                           | Search and paginate your Files.                                                         |
| `create_file`                          | Create a File with an empty canvas.                                                     |
| `read_xml`                             | Read a File or node subtree as XML.                                                     |
| `write_xml`                            | Create or update a node subtree using XML.                                              |
| `open_stewdio`                         | Open the File library, a File editor, or a read-only node preview in an MCP Apps host.  |
| `get_api_access`                       | Give the embedded app short-lived access to the regular API; available only to the app. |

`open_stewdio` selects its destination from the supplied IDs:

| Arguments            | Destination                                        |
| -------------------- | -------------------------------------------------- |
| `{}`                 | File library.                                      |
| `{ fileId }`         | Existing File in the editor.                       |
| `{ fileId, nodeId }` | Read-only preview of the node and its descendants. |

Library calls accept `query`, `limit`, and `cursor`, just like
`list_files`. Both search File names without regard to case and return up to 100
Files per page, most recently updated first. Library filters and pagination
cannot be combined with `fileId`; `nodeId` requires `fileId`.

All three destinations use one MCP App resource, `ui://stewdio/app.html`.
Library/editor launches request fullscreen where supported; node previews prefer
inline. The host controls presentation, and expanding a preview does not enable
editing. Call `open_stewdio` with only `fileId`, or select **Open in Stewdio** in
the preview, to enter the editor. Opening any view does not create a File or
change its contents; edits in the editor save to the existing File.

## Execution, network access, and data

The plugin bundles one skill and configures a remote server; it installs no
local server, hooks, scripts, or package dependencies. Your host sends tool
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

This repository contains generated release files. Plugin development, tests, and
release tooling live in `apps/plugin` in the Stewdio monorepo. Changes made here
are replaced by the next published release; report issues here for the Stewdio
maintainers to address in the source repository.

Versioned ZIPs are attached to [GitHub Releases](https://github.com/StewdioAI/plugin/releases).
Each monorepo release includes the plugin ZIP and a `release.json` receipt identifying its
source commit and artifact checksums. The same release supplies the files in this
repository for Git-based installation and the ZIP for OpenAI directory submission.
Publishing these files does not by itself publish either directory listing.

## License

The plugin files are available under the [MIT License](LICENSE). The Stewdio
applications and hosted MCP server are proprietary and covered by the
[terms of service](https://www.stewdio.ai/terms).
