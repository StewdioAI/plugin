# Developing the Stewdio plugin

This repository bundles a skill, assets, and configuration for the hosted Stewdio
MCP server. It contains no server implementation or runtime dependencies.

- `skills/stewdio/SKILL.md` is the skill entry point; keep detailed XML and Canvas
  guidance in `skills/stewdio/references/` and link it from the skill.
- `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` describe the plugin.
  Keep shared metadata consistent. The matching marketplace files live in
  `.agents/plugins/` and `.claude-plugin/`.
- `.mcp.json` configures the hosted server. Keep its URL aligned with
  `skills/stewdio/agents/openai.yaml` and `README.md`.
- Use Node.js 24 (or a version allowed by `package.json`), `zip`, and `unzip`.
  Run `npm ci`, then `npm run test:integration` and `npm run package` before handoff.
  Bundles are written to `dist/stewdio-plugin-<version>.zip`.
- `scripts/package-plugin.mjs` explicitly lists bundled files. Keep tooling,
  local settings, and credentials out of bundles; update packaging tests when
  changing bundle contents.
- Every update to `main` is released automatically with at least a patch bump.
  Use `npm run changeset` for a specific release note or a minor/major bump;
  commit the `.changeset/*.md` entry with the change.
- Leave versions and `CHANGELOG.md` to CI. `npm run version:plugin` applies
  Changesets, syncs both manifests from `package.json`, and updates the lockfile.
  CI tests, packages, commits, tags, and publishes without a separate release PR.
  GitHub Releases do not submit to the OpenAI directory.
