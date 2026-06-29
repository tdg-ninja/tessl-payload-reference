# Agents

## Supported agents

Agents installed and available for CI and local use:

- claude-code
- codex

## Default agent

claude-code

## Preferred models

- claude-code (default): claude-sonnet-4-6

## Agent ids

- claude-code
- codex

## Existing agent configs

- `.claude/settings.json` — permissions, hooks (post-write-format), MCP servers (playwright, payload), superpowers plugin
- `.claude/hooks/post-write-format.sh` — runs Prettier on written files
- `.claude/commands/` — triage.md, analyze-issue.md, respond-to-discussion-features.md
- `.claude/skills/` — audit-dependencies, generate-translations, triage-ci-flake, ui4, ui4-review, ui4-convert-tests
- `.codex/config.toml` — MCP servers (playwright, payload)
- `.cursor/mcp.json` — MCP server config
- `CLAUDE.md` — comprehensive project conventions, architecture, and coding patterns
- `AGENTS.md` — points to CLAUDE.md
