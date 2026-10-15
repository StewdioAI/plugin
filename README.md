# Stewdio

Browse, create, inspect, and edit your [Stewdio](https://www.stewdio.ai) Files from
your assistant. Read and write File XML, author Canvas scripts, and preview nodes
and Compositions. Hosts that support MCP Apps can display the File library, an
editor with live saving, and inline node previews.

## Requirements and setup

You need a Stewdio account with an active organization membership, an internet
connection, and a host that supports remote MCP servers and OAuth. File access is
limited to your own Files across active organizations. Creating and editing Files
is subject to your Stewdio plan. The Stewdio desktop application is not required.

### Claude Code

In a Claude Code session (v2.1.275 or later), run:

```text
/plugin install stewdio --marketplace StewdioAI/plugin
```

Review the plugin and choose an installation scope. Follow any reload instructions,
then run `/mcp`, select the Stewdio server, and complete OAuth sign-in in your
browser. See [Claude Code's installation guide](https://code.claude.com/docs/en/discover-plugins).

### ChatGPT and Codex

Install the Stewdio plugin and connect its MCP server. For development, connect
your deployed test endpoint as a custom MCP server and refresh the connection
after changing tool metadata or resources.

In an MCP Apps host, `view_files` opens the complete File library with thumbnails,
search, and a **New File** button. Select a File to open its editor. Supported
ChatGPT surfaces also expose **Stewdio** in the sidebar and conversation panel.
**Add to chat** attaches the current selection; ordinary selection changes supply background
context. Removing an attachment keeps it removed until you explicitly attach
again. Agents use `read_xml` to retrieve current content.

File deep links route to `/files/{fileId}` inside the global `view_files`
entrypoint. Construct a host link using the actual installed/published plugin
identity, following the [OpenAI extension reference](https://developers.openai.com/plugins/build/extensions).
Canonical Stewdio web links remain usable outside ChatGPT.

### Claude and other MCP hosts

In Claude, add a custom remote connector with the URL `https://api.stewdio.ai/mcp`,
complete OAuth sign-in, and enable the connector for your conversation. See
[Claude's connector setup guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

Other hosts can connect to the same URL using Streamable HTTP and OAuth. Hosts
without MCP Apps can still list, create, inspect, and edit Files through tools.
The embedded File library supports filtering by name; `list_files` returns all
accessible Files and has no search or pagination parameters.

## Try it

- "List my Stewdio Files."
- "Create a Stewdio File named Launch animation."
- "Open my Launch animation File and help me animate a Canvas."

If you belong to multiple organizations, specify which organization should own a
new File. Inspect the current File before requesting edits. XML writes replace
the targeted node subtree and can remove descendants omitted from the submitted
XML. Edits in the embedded editor save live.

| Tool                    | Purpose                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `read_documentation`    | Read Stewdio's XML or Canvas authoring reference.                                           |
| `list_files`            | List your Files and their organizations.                                                    |
| `create_file`           | Create a File with an initial Page.                                                         |
| `read_xml`              | Read a File or node subtree as XML.                                                         |
| `write_xml`             | Create or update a node subtree using XML.                                                  |
| `view_files`            | Open the File library in an MCP Apps host.                                                  |
| `view_file`             | Open a File in the embedded editor.                                                         |
| `view_node`             | Preview a node and its descendants.                                                         |
| `authorize_file_access` | Let the embedded app synchronize one File and access its assets; available only to the app. |

## Execution, network access, and data

The plugin configures a remote server; it installs no local server, hooks, scripts,
or package dependencies. Your host sends tool arguments and OAuth credentials to
`https://api.stewdio.ai/mcp`. Arguments can include File and organization IDs, File
names, XML, and Canvas scripts. The server returns authoring documentation, File
metadata, requested File content, and UI resources to the host. File writes are
stored by Stewdio. Sign-in uses WorkOS through `https://signin.stewdio.ai`.

In MCP Apps hosts, the embedded UI runs in the host's sandbox, connects to
`https://api.stewdio.ai` and `wss://api.stewdio.ai` for authorized File operations
and live synchronization, and retrieves thumbnails from the API. Asset imports
upload selected files to Stewdio's Cloudflare R2 storage; asset reads and uploads
use signed URLs on `29117f3a6e767d87fa15ea697a7dbec9.r2.cloudflarestorage.com`.
File access credentials are supplied to the embedded app separately from
model-visible tool results.

Canvas scripts execute in an isolated iframe at `https://stewdiousercontent.com`.
Depending on the File's content, rendering can fetch public modules and resources
from `esm.sh`, `cdn.jsdelivr.net`, `unpkg.com`, and `threejs.org`, and fonts from
`fonts.googleapis.com` and `fonts.gstatic.com`. These public resource requests omit
credentials. **Open in Stewdio** opens File links on `https://www.stewdio.ai`;
exports use the host's download capability when available.

See the [privacy policy](https://www.stewdio.ai/privacy) for data handling and the
[terms of service](https://www.stewdio.ai/terms) for use of the hosted service.

## Troubleshooting and support

- **Tools are missing:** check that the plugin or connector is enabled. In Claude
  Code, inspect `/plugin` and `/mcp`, then follow the host's reload instructions.
- **Sign-in expired or failed:** reconnect the Stewdio server through your host's
  OAuth flow and sign in with the intended Stewdio account.
- **File unavailable or access forbidden:** confirm that you own the File and
  have an active membership in its organization. For creation or editing errors,
  check your organization and plan in Stewdio.
- **Editor or preview unavailable:** use **Open in Stewdio**, or open the File URL
  returned by the view tool. Embedded UI and fullscreen support depend on the host.

For further help, contact [Stewdio support](https://www.stewdio.ai/support) with
your host name, the tool used, and the error message. Exclude access tokens and
private File content from support reports.

## Verification before release

Automated coverage includes both MCP protocol generations, access denial and
revocation, File discovery, mention-resource reads, save-before-navigation,
selection removal, deep links, and a sandboxed browser running the built UI
against the API Worker and PostgreSQL.

After deploying the changes to a test endpoint, verify ChatGPT desktop,
applicable ChatGPT Work web surfaces, and Claude Desktop. Record host versions
and check OAuth, entrypoints/mentions where supported, editor and agent edits,
asset loading/imports, node playback, ticket renewal, and display fallbacks.
Automated host tests do not establish compatibility with every host release.
Application and plugin version changes remain human-owned.

## License

This plugin package is available under the [MIT License](LICENSE). In the Stewdio
monorepo, this license applies only to `plugin/`. This license covers the distributed
plugin files; the Stewdio applications, hosted MCP server, and the rest of the
Stewdio monorepo remain proprietary.
