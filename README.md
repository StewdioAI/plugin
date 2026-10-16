# Stewdio

Browse, create, inspect, and edit your [Stewdio](https://www.stewdio.ai) Files from
your assistant. Read and write File XML, author Canvas scripts, and preview nodes
and Compositions. Assistants that support MCP Apps can also show your File library,
an editor that saves as you work, and inline node previews.

## What you can do

- Find Files by name across your organizations, or create a new File.
- Inspect a File or any node subtree as XML, then make targeted edits that preserve
  unrelated content.
- Write and debug Canvas scripts, including drawing, fonts, and bound File assets.
- Open the File library, the File editor, or a node preview in the conversation.

The plugin connects the hosted Stewdio MCP server and bundles the
[stewdio skill](skills/stewdio/SKILL.md), which teaches your assistant File XML,
subtree editing, inputs, clips, animations, and Canvas renderer scripts.

## Requirements

You need a Stewdio account with an active organization membership and an assistant
that supports remote MCP servers with OAuth sign-in. You can access only your own
Files in your active organizations. Creating and editing Files is subject to your
organization's Stewdio plan. The Stewdio desktop application is not required.

## Setup

### Claude

Add Stewdio from Claude's directory, then connect it and sign in with your Stewdio
account when prompted. Plugins added from the directory also load in Claude Code.

You can also add a [custom connector](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
with the URL `https://api.stewdio.ai/mcp`. A connector alone provides the tools
without the skill.

### Claude Code

To install from Stewdio's marketplace instead of the directory, run this in a
Claude Code session (v2.1.275 or later):

```text
/plugin install stewdio --marketplace StewdioAI/plugin
```

Choose an installation scope and follow any reload instructions. Then run `/mcp`,
select the Stewdio server, and complete sign-in in your browser.

### ChatGPT and Codex

Install Stewdio from the plugin directory and sign in with your Stewdio account. In
supported ChatGPT surfaces, you can also open Stewdio from the sidebar and use
**Add to chat** to attach your current selection to a conversation.

### Other MCP hosts

Connect to `https://api.stewdio.ai/mcp` using Streamable HTTP and OAuth. Hosts
without MCP Apps can still list, create, inspect, and edit Files through tools.

## Try it

- "List my Stewdio Files."
- "Create a Stewdio File named Launch animation."
- "Open my Launch animation File and help me animate a Canvas."

If you belong to multiple organizations, say which one should own a new File. Ask
your assistant to inspect a File before editing it: XML writes replace the targeted
node subtree and remove descendants omitted from the submitted XML. Edits in the
embedded editor save as you work.

| Tool             | Purpose                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `list_files`     | Search and paginate your Files and their organizations.                                                    |
| `create_file`    | Create a File with an initial Page.                                                                        |
| `read_xml`       | Read a File or node subtree as XML.                                                                        |
| `write_xml`      | Create or update a node subtree using XML.                                                                 |
| `view_files`     | Open the File library in an MCP Apps host.                                                                 |
| `view_file`      | Open a File in the embedded editor.                                                                        |
| `view_node`      | Preview a node and its descendants.                                                                        |
| `get_api_access` | Give the embedded app short-lived access to the regular API in an organization; available only to the app. |

`list_files` and `view_files` search File names without regard to case, can filter
by organization, and return up to 100 Files per page, most recently updated first.

## Execution, network access, and data

The plugin bundles one skill and configures a remote server; it installs no
local server, hooks, scripts, or package dependencies. Your host sends tool
arguments and OAuth credentials to `https://api.stewdio.ai/mcp`. Arguments can
include File and organization IDs, File names, XML, and Canvas scripts. The server
returns File metadata, requested File content, and UI resources to the host. File
writes are stored by Stewdio. Sign-in uses WorkOS through `https://signin.stewdio.ai`.

In MCP Apps hosts, the embedded UI runs in the host's sandbox, connects to
`https://api.stewdio.ai` and `wss://api.stewdio.ai` for authorized File operations
and live synchronization, and retrieves thumbnails from the API. Asset imports
upload selected files to Stewdio's Cloudflare R2 storage; asset reads and uploads
use signed URLs on `29117f3a6e767d87fa15ea697a7dbec9.r2.cloudflarestorage.com`.
File access credentials are supplied to the embedded app separately from
model-visible tool results.

Canvas scripts execute in an isolated iframe at `https://stewdiousercontent.com`,
a Stewdio domain kept separate from `stewdio.ai` so that scripts can't reach your
account. Depending on the File's content, rendering can fetch public modules and
resources from `esm.sh`, `cdn.jsdelivr.net`, `unpkg.com`, and `threejs.org`, and
fonts from `fonts.googleapis.com` and `fonts.gstatic.com`. These public resource
requests omit credentials. **Open in Stewdio** opens File links on
`https://www.stewdio.ai`; exports use the host's download capability when available.

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
- **File unavailable or access forbidden:** confirm that you own the File and
  have an active membership in its organization. For creation or editing errors,
  check your organization and plan in Stewdio.
- **Editor or preview unavailable:** use **Open in Stewdio**, or open the File URL
  returned by the view tool. Embedded UI and fullscreen support depend on the host.

For further help, contact [Stewdio support](https://www.stewdio.ai/support) with
your host name, the tool used, and the error message. Exclude access tokens and
private File content from support reports.

## Build the plugin bundle

From a checkout of this repository, run:

```sh
npm run package
```

This requires Node.js 24 (or another version allowed by `package.json`) and the
system `zip` command. Packaging alone needs no dependency installation or Stewdio
monorepo checkout. The command writes
`dist/stewdio-plugin-<version>.zip`, using the version in `.codex-plugin/plugin.json`.
To choose another output path, run `npm run package -- /path/to/plugin.zip`.

The ZIP contains `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`.codex-plugin/plugin.json`, `.mcp.json`, `skills/`, `assets/`, `LICENSE`, and
`README.md` at its root. Claude and Codex share the same MCP configuration,
skills, and assets. The builder excludes repository tooling and local settings,
and replaces an existing archive so removed files do not remain in a later build.

For Claude Code, load the ZIP for a session with:

```sh
claude --plugin-dir "./dist/stewdio-plugin-<version>.zip"
```

Replace `<version>` with the packaged version.

Upload the ZIP to the existing Stewdio plugin in the
[OpenAI plugin portal](https://platform.openai.com/plugins). See the
[submission guide](https://developers.openai.com/plugins/deploy/submission) for
upload and review requirements. Packaging does not change the version or publish
the plugin.

For development, run `npm ci` to install the Changesets tooling, then
`npm run test:integration` to check packaging and versioning. Tests also require
`unzip`.

### Download a bundle from GitHub Actions

The [CI workflow](https://github.com/StewdioAI/plugin/actions/workflows/ci.yml)
runs integration tests and builds a plugin ZIP for every pull request. Every push
to `main` also versions and publishes the plugin. Use **Run workflow** to build
an artifact manually without publishing.

Open a successful run and download `stewdio-plugin-<version>.zip` from **Artifacts**.
That file is the plugin ZIP for Claude Code and OpenAI plugin submissions.
Artifacts are retained for 30 days; rerun the workflow to rebuild an expired
bundle.

### Download or publish a release

Versioned plugin ZIPs are attached to [GitHub Releases](https://github.com/StewdioAI/plugin/releases).
Download `stewdio-plugin-<version>.zip` from the release's **Assets**.
Release assets remain available beyond the 30-day Actions artifact retention period.

Every push to `main` automatically publishes a release after validation. CI uses
[Changesets](https://changesets.dev/guide/cli) to update `package.json` and
`CHANGELOG.md`, then synchronizes both plugin manifests and the npm lockfile.
It tests and packages the result, commits the version changes to `main`, and
creates a `v<major>.<minor>.<patch>` tag and GitHub Release with the verified ZIP.
There is no separate release PR or manual tag step.

Each merge gets at least a patch bump using its commit subject as the release
note. To request a larger bump or add a more detailed note, run:

```sh
npm run changeset
```

Select `plugin`, choose the bump type, and commit the generated `.changeset/*.md`
file with your changes. CI applies all pending entries using the highest requested
bump, so changes without an entry still ship. Leave versions and `CHANGELOG.md`
unchanged in feature branches. `npm run version:plugin` is available to exercise
the versioning step locally in a disposable checkout with pending changesets.

Releases run one at a time and include the latest `main` at the time of packaging.
The workflow needs permission to push its version commit and tag; branch rules
must allow the Actions bot to update `main`. Bot pushes use `GITHUB_TOKEN` so
they do not trigger another release. Rerunning a failed run reuses its existing
version commit and tag if they were already pushed. GitHub Releases do not
publish to npm or submit the plugin to the OpenAI plugin directory.

## License

The plugin files are available under the [MIT License](LICENSE). The Stewdio
applications and hosted MCP server are proprietary and covered by the
[terms of service](https://www.stewdio.ai/terms).
