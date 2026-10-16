# Set up Stewdio

Install the Stewdio plugin to create and edit motion graphics with your agent. It bundles a `stewdio` skill and an MCP server at `https://api.stewdio.ai/mcp` using Streamable HTTP and OAuth. An MCP connection alone does not install the skill.

You need a Stewdio account with active organization membership. Creating and editing Files depends on your organization's Stewdio plan. The Stewdio desktop application is optional.

Plugin source: [StewdioAI/plugin](https://github.com/StewdioAI/plugin#setup). Look for Stewdio in your host's plugin directory first; use the repository if no listing is available. No ZIP download or build is needed.

## Installation stages for the agent

Treat a request to follow this guide as a request to install the plugin. Complete these stages using only the matching host instructions below:

1. **Identify the host.** Use explicit runtime, session, or user information to identify the app and whether it is web, desktop, or CLI. Model names, available tools, and installed CLIs do not identify the host. A web sandbox cannot configure the user's local CLI. If unclear, ask: “Which app are you using: ChatGPT web, Claude web, ChatGPT desktop, Claude desktop, Claude Code CLI, Codex CLI, or another coding agent?” Ask for the other agent's name if needed.
2. **Check requirements and existing setup.** Check host plan and workspace restrictions. Inspect installed plugins and skills, matching the repository and server URL above. Reuse the plugin and authenticated connection where supported; preserve other configuration and conflicting entries.
3. **Install.** In web and desktop apps, use available UI controls or guide the user through the next few clicks. In CLI agents, execute inspection and installation commands in that agent's environment. If blocked, explain why and provide the exact command for the user.
4. **Authenticate.** Let the user complete OAuth sign-in and consent in their browser. Never request passwords or access tokens in chat.
5. **Start a new session.** Explicitly ask the user to start a new conversation or CLI session with Stewdio enabled to load its skill and tools. Continue pending verification there.
6. **Verify.** Follow the verification checks below before reporting success.

## Claude web and desktop

Plugins require Pro, Max, Team, or Enterprise. Explain this to Free users before installation; offer another supported client if they prefer not to upgrade.

1. Open **Customize > Plugins > Discover**, find **Stewdio**, and choose **Add**.
2. If missing, choose **Add > Add marketplace > Add from a repository**, enter `https://github.com/StewdioAI/plugin`, and sync. Open **Stewdio** in that marketplace and choose **Add** or **Install**.
3. Enable the plugin, select its server's **Connect** action, and complete sign-in and consent.

Reuse an existing installation in the same Claude account. Account plugins sync to Claude Code v2.1.273 or later with Claude account sign-in, but not API-key or cloud-provider sign-in. If repository access is restricted, ask an organization owner to allow the marketplace.

If UI labels differ, check the [official Claude plugin guide](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) before proceeding.

## ChatGPT web and desktop

Open **Plugins**, find **Stewdio**, and check its source and bundled skill. If available for your account, workspace, and surface, select the plus button to install and connect its server through browser sign-in and consent.

If unavailable, a workspace admin with **Admin > Plugins** access and a GitHub account that can read the repository can import it. This repository's `.mcp.json` makes the imported plugin **Desktop only**, even with a remote HTTPS server. The import does not enable it in ChatGPT web.

The admin completes these steps in ChatGPT web:

1. Open **Admin > Plugins > Add > Import marketplace**.
2. Set **Source** to `https://github.com/StewdioAI/plugin`. Leave **Path** and **Branch, tag, or commit** empty.
3. Select **Import marketplace** and authorize GitHub access.
4. In **Import results**, open **Stewdio** and set **Installation policy** to **Available** or **Installed** for the intended role. Enable required apps and confirm user access.
5. Have the user install Stewdio from **Plugins** in ChatGPT desktop if needed and complete their own Stewdio sign-in and consent.

ChatGPT web requires an available web-compatible Stewdio plugin. If no plugin or admin import is available, explain the limitation and offer paid Claude or Codex CLI. Do not invent a ZIP upload flow, treat **Add custom MCP server** as a complete plugin installation, or send end users to the developer submission portal.

If UI labels differ, check the official guides: [plugin installation](https://learn.chatgpt.com/docs/plugins) and [marketplace import, policies, and desktop restrictions](https://learn.chatgpt.com/docs/enterprise/plugin-management).

## Claude Code CLI

Inspect existing installations, including plugins synced from the Claude account:

```sh
claude plugin list
claude plugin marketplace list
claude plugin install --help
```

If missing, install on v2.1.292 or later:

```sh
claude plugin install stewdio --marketplace StewdioAI/plugin --scope user
```

On older versions, run each command only if its marketplace or plugin is missing:

```sh
claude plugin marketplace add https://github.com/StewdioAI/plugin
claude plugin install stewdio@stewdio --scope user
```

In interactive sessions on v2.1.275 or later, `/plugin install stewdio --marketplace StewdioAI/plugin` is an alternative; choose user scope. Follow reload prompts, then have the user open `/mcp`, select the plugin's Stewdio server, and authenticate. Slash commands run inside Claude Code, not in a shell.

Reference: [Claude Code plugin guide](https://code.claude.com/docs/en/discover-plugins).

## Codex CLI

In an interactive session, open `/plugins`, find Stewdio, check its source, and install it if available.

For terminal setup or when no listing is available, inspect:

```sh
codex plugin list --json
codex plugin marketplace list
```

Add the marketplace if missing:

```sh
codex plugin marketplace add https://github.com/StewdioAI/plugin
```

Install the plugin if missing:

```sh
codex plugin add stewdio@stewdio
```

Complete authentication prompts. In the new session, use `/plugins` and `/mcp` to check that Stewdio is enabled and authenticated. Slash commands run inside Codex, not in a shell. If plugin commands are unavailable, update the CLI before continuing.

To refresh the marketplace later, run `codex plugin marketplace upgrade stewdio` and follow update or reload prompts.

Reference: [Codex plugin commands](https://learn.chatgpt.com/docs/cli/reference#codex-plugin).

## Other agents and MCP clients

For Cursor, VS Code, Gemini CLI, or another host, consult its current official plugin guide or installed CLI's `--help`. Use its supported installation path; configuration and authentication differ by host.

If it supports only MCP servers, offer a plugin-capable client above. If the user chooses tools only, connect `https://api.stewdio.ai/mcp` with Streamable HTTP and OAuth, preserve existing settings, and verify authenticated tool access. Report this as an MCP connection, not a plugin installation; it lacks the bundled skill.

Embedded File libraries, editors, and node previews require host support for MCP Apps. Otherwise, use tools to work with Files and open the returned Stewdio File links.

## Verify the installation

1. Confirm the plugin is installed and enabled and its bundled `stewdio` skill is available.
2. Discover its tools and call the read-only `list_files` tool. An authenticated response with no Files is valid if `organizations` contains at least one active organization. Configuration, a server listing, an open sign-in page, or a tool list alone does not prove authenticated access.
3. If `organizations` is empty, setup is incomplete: the account cannot create a File. Have the user finish account setup on Stewdio web or ask their organization administrator to check membership, then retry.

If the skill or tools are missing, enable the plugin in the conversation or reload the client. For authentication errors, complete or repeat OAuth. If a new session is needed, state what is installed and what remains unverified; do not report success yet.

Once verified, say the plugin is ready and ask what the user wants to create. Create a Stewdio File only when requested.
