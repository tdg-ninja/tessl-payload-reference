# Source control and CI

## Hosting platform

github

## Repository

tdg-ninja/tessl-payload-reference

## Upstream repository

payloadcms/payload

## Default branch

main

## CI platform

GitHub Actions

## CI workflows directory

.github/workflows/

## Workflow file naming convention

No specific prefix convention. Existing workflows use descriptive names.

## Required CI secrets

Secrets that must be set for agent-driven CI workflows:

- `TESSL_TOKEN` (also required for `tessl change verify` CI gates)
- `ANTHROPIC_API_KEY` (for claude-code — already configured in upstream, needs setup in fork)

## Deterministic invariant checks

Records the repo's non-LLM tools for enforcing broad invariants.

- **Lint / format tools**: ESLint (with custom @payloadcms/eslint-config and @payloadcms/eslint-plugin), Prettier
- **Structural search tools**: none — gap identified
- **Typecheck tools**: TypeScript (strict mode, `pnpm run test:typecheck` / `tsc`)
- **Schema/config validators**: none
- **Import-boundary or architecture checks**: Custom ESLint rules enforce boundaries:
  - `payload/no-relative-monorepo-imports` (error) — prevents cross-package relative imports
  - `payload/no-imports-from-exports-dir` (error) — enforces RSC/client boundary
  - `payload/no-imports-from-self` (error) — prevents circular self-imports
  - `payload/no-jsx-import-statements` (warn) — prevents JSX import statements
  - `payload/proper-payload-logger-usage` (error) — enforces logger call signature
- **Generated-artifact sync checks**: none
- **Contract/golden checks with broad invariant value**: none
- **Broad invariant test suites**: Integration tests (`pnpm run test:int`), E2E tests (`pnpm run test:e2e`), component tests, type tests
- **Primary CI workflows that run these checks**: `.github/workflows/main.yml` (lint, typecheck, tests on PR and push to main)
- **Preferred destination for new deterministic checks**: Custom ESLint rules in `packages/eslint-plugin/customRules/` for code patterns; ast-grep would be a good addition for structural patterns ESLint can't express
- **Missing deterministic guardrail gaps**:
  - No structural search tool (ast-grep / Semgrep) for patterns beyond ESLint's reach
  - No schema validation for config files
  - Access control pattern (`overrideAccess: false` + `user`) is documented in CLAUDE.md but only enforced by human review — prime verifier candidate
  - RSC/client component boundary violations beyond what the ESLint rule catches
- **Recommended first tool to add**: ast-grep for structural TypeScript patterns that ESLint custom rules can't express efficiently

## Tessl verify

- **Configured**: yes
- **Manifest**: `tessl.json` (repo root)
- **Verifier files**: `verifiers/*.json` — 5 verifiers across 3 groups:
  - `security` group (error): access-control.json
  - `conventions` group (error): no-barrel-exports.json, object-params.json, rsc-client-imports.json
  - `testing` group (error): test-cleanup.json
- **Monorepo child manifests**: none
- **CI gate**: `.github/workflows/tessl-verify.yml` — runs on PR open/sync
- **TESSL_TOKEN for verify**: required as CI secret

## Existing AI review

The repo has a hand-rolled AI reviewer:
- `.github/workflows/ai-reviewer.yml` — triggered by `/ai-review` comment
- `.github/actions/ai-reviewer/` — custom Node.js action using Anthropic API directly
- `.github/ai-reviewer-prompt.md` — review prompt covering security, correctness, Payload conventions, performance, testing, naming

This is a candidate for augmentation with `tessl change review`.

## GitHub auth

Default `GITHUB_TOKEN` for annotation/comment workflows. Consider Tessl Helper GitHub App if workflows need to push commits or open PRs that trigger CI.

## Branch conventions

- PR required before merging to main
- Conventional commits enforced via `.github/workflows/pr-title.yml`
- PR title format: `<type>(<scope>): <title>` (lowercase first letter)
