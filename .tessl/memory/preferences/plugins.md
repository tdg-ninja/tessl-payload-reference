# Plugins

## Plugin directory

Where Tessl plugin directories are created (skills and rules live here):

plugins/

## Hook scripts directory

Where hook shell scripts are written (agent hook configs point here):

scripts/

## Hook script language

TypeScript (Bun) — matches the project's primary language.

## Existing non-Tessl skills

The repo already has Claude Code skills in `.claude/skills/`:
- `audit-dependencies` — fix dependency vulnerabilities from pnpm audit
- `generate-translations` — generate translation strings for new keys
- `triage-ci-flake` — triage and fix CI test failures / flaky tests
- `ui4` — UI component migration guidance
- `ui4-review` — review UI4 migration PRs
- `ui4-convert-tests` — convert tests for UI4 migration

These are Claude Code native skills, not Tessl plugins. Tessl plugins go in `plugins/`.
