# Tessl Agent Harness — Payload CMS Reference Implementation

This document walks through the complete Tessl agent harness built on top of the
[Payload CMS](https://github.com/payloadcms/payload) monorepo. It demonstrates
every piece of the self-improving agent workflow on a real, production-grade
TypeScript codebase.

**Fork:** [tdg-ninja/tessl-payload-reference](https://github.com/tdg-ninja/tessl-payload-reference)
**Upstream:** [payloadcms/payload](https://github.com/payloadcms/payload)

---

## Why Payload CMS?

Payload is an ideal reference because it already has agent infrastructure:

- **Claude Code skills** (6 skills in `.claude/skills/`) — dependency audit, translations, CI triage, UI migration
- **Agent hooks** (`.claude/hooks/post-write-format.sh`) — auto-formats on write
- **MCP servers** — Playwright and Payload admin panel
- **A hand-rolled AI reviewer** (`.github/actions/ai-reviewer/`) — custom Node.js action
- **Comprehensive conventions** (`CLAUDE.md`) — 200+ lines of coding patterns

This means we're not starting from zero — we're showing how Tessl layers onto
a repo that's already invested in agents, and makes it **systematically better**.

---

## What Tessl Adds

| Piece | Before Tessl | After Tessl |
|-------|-------------|-------------|
| **Code conventions** | Documented in CLAUDE.md, enforced by human review | Verified by LLM-as-judge on every PR (`tessl change verify`) |
| **PR review** | Hand-rolled AI reviewer, one monolithic prompt | Structured review with composable skills (`tessl change review`) |
| **Merge decisions** | Every PR requires human review | Risk gate classifies PRs; low-risk can skip review (`tessl change risk`) |
| **Learning loop** | None — same mistakes repeat | Weekly cron mines PR feedback for improvements (`find-optimizations`) |
| **Project memory** | Agent context in CLAUDE.md only | Durable memory for all Tessl tools (`.tessl/memory/`) |

---

## Repository Structure (Tessl additions)

```
payload-reference/
├── .tessl/
│   ├── memory/
│   │   ├── index.md                          # Memory index (read at start of every session)
│   │   ├── goals.md                          # Project goals and bottlenecks
│   │   └── preferences/
│   │       ├── agents.md                     # Supported agents, defaults, existing configs
│   │       ├── plugins.md                    # Plugin directory, hook language
│   │       ├── source-control-and-ci.md      # CI, deterministic checks, verify setup
│   │       └── issue-tracking.md             # GitHub Issues config
│   ├── review-sample.json                    # Sample review output (local trial)
│   └── risk-sample.json                      # Sample risk assessment (local trial)
├── verifiers/
│   ├── access-control.json                   # Security: overrideAccess + user on operations
│   ├── no-barrel-exports.json                # Convention: no export * from
│   ├── object-params.json                    # Convention: object params on exported functions
│   ├── rsc-client-imports.json               # Convention: RSC client boundary imports
│   └── test-cleanup.json                     # Testing: clean up created records
├── .github/
│   ├── pr-review-gate/
│   │   ├── config.json                       # Risk gate configuration
│   │   └── policy.md                         # Risk gate policy (Payload-customized)
│   └── workflows/
│       ├── tessl-verify.yml                  # PR gate: verifier checks
│       ├── tessl-review.yml                  # PR gate: structured code review
│       ├── tessl-risk.yml                    # PR gate: risk assessment + merge decision
│       └── tessl-weekly-optimizations.yml    # Cron: weekly learning loop
├── tessl.json                                # Tessl manifest with verify groups
└── TESSL-HARNESS.md                          # This file
```

---

## Phase-by-Phase Walkthrough

### Phase 0: Foundation

**What we did:**
1. Forked Payload CMS to `tdg-ninja/tessl-payload-reference`
2. Enabled GitHub Issues on the fork
3. Ran `tessl init --agent claude-code` to create `tessl.json` and MCP config
4. Created project memory in `.tessl/memory/` by scanning the repo

**What the Tessl agent discovered during memory setup:**
- **Agents:** Claude Code (with 6 skills, hooks, commands, MCP servers), Codex (with MCP config)
- **Deterministic checks:** ESLint with 5 custom rules, Prettier, TypeScript strict mode
- **Gaps identified:**
  - No structural search tool (ast-grep/Semgrep)
  - Access control pattern enforced only by human review
  - RSC/client boundary partially covered by ESLint but not fully
  - No automated learning loop

---

### Phase 1: Verifier Checks

**5 verifiers** created, each enforcing a convention from CLAUDE.md that can't
be caught by existing ESLint rules:

#### `access-control.json` (Security group)
- **Rule:** Server operations must pass `overrideAccess: false` and `user`
- **Why it matters:** Without these, operations run with full admin access — a security vulnerability
- **Why not ESLint:** The pattern requires understanding call context (server function vs. test vs. seed script) and checking two properties together
- **Scope:** `packages/next/`, `packages/ui/`, `packages/payload/` source files (excluding tests/migrations)

#### `no-barrel-exports.json` (Conventions group)
- **Rule:** No `export * from` in package source files
- **Why it matters:** Barrel exports break tree-shaking and RSC/client boundaries in production
- **Why not ESLint:** There is an ESLint rule for imports-from-exports-dir but no rule preventing barrel re-exports in arbitrary module files
- **Scope:** All `packages/*/src/` files

#### `object-params.json` (Conventions group)
- **Rule:** Exported functions with 2+ params must use destructured object parameter
- **Why it matters:** Payload's backwards-compatibility policy — adding to an object is non-breaking
- **Why not ESLint:** Requires distinguishing exported vs. internal functions, React props vs. function params, and counting positional parameters
- **Scope:** All `packages/*/src/` files

#### `rsc-client-imports.json` (Conventions group)
- **Rule:** Server components must import client components from `exports/client/index.js`, not relative paths
- **Why it matters:** Relative imports don't respect `'use client'` boundaries in production builds
- **Why not ESLint:** Partially covered by `payload/no-imports-from-exports-dir` but that only fires on specific patterns. The verifier catches the broader case
- **Scope:** `packages/ui/`, `packages/next/` source files

#### `test-cleanup.json` (Testing group)
- **Rule:** Test files that create records via `payload.create` must clean them up
- **Why it matters:** Leaked records cause non-deterministic failures in other tests
- **Why not ESLint:** Requires tracking create-delete pairs across test functions and afterEach hooks
- **Scope:** `test/**/*.spec.ts`, `test/**/*.test.ts`

**Sample run result:** On 10 random test files, the test-cleanup verifier found
**6 real violations** — files that create database records without cleanup.

---

### Phase 2: PR Review

**What changed from the hand-rolled reviewer:**

The existing AI reviewer (`.github/actions/ai-reviewer/`) is a 200-line
custom Node.js action that:
- Splits diffs by file
- Sends each to Anthropic API
- Merges results
- Posts as a PR review

`tessl change review` replaces this with:
- Composable review skills (swap in different review lenses)
- Structured JSON output (parseable, archivable, backtestable)
- Parallel multi-skill execution in a single pass
- Built-in hunk position mapping for accurate inline comments

**Sample review output** (from `.tessl/review-sample.json`):

On the `refactor!: remove default config export` commit, the reviewer caught:
1. An exported helper that mutates its input in place but has a signature suggesting it returns a new object
2. A local variable name that reuses the deleted export's name, misleading readers

Both are real legibility issues that a human reviewer would (or should) flag.

---

### Phase 3: Risk Gate

**Policy customized for Payload**, adding always-review paths for:
- `packages/payload/src/auth/` — access control logic
- `packages/db-*`, `packages/drizzle/` — database adapters
- `exports/client/index.js`, `exports/server/index.js` — admin UI bundling boundary
- `packages/payload/src/config/` — core configuration defaults
- `packages/eslint-plugin/` — ESLint rule changes

**Sample risk assessment** (from `.tessl/risk-sample.json`):

The `remove default config export` commit was correctly classified as **HIGH RISK**
(confidence: 92%) because it touches `packages/payload/src/config/defaults.ts` —
exactly matching the policy's always-review path. Risk factors cited:
- Modifies core configuration defaults
- Modifies public API surface (index.ts)
- 77 LOC churned suggests meaningful behavioral changes

---

### Phase 4: CI Workflows

Four GitHub Actions workflows automate the harness:

#### `tessl-verify.yml` — Verifier gate
- **Trigger:** PR open/sync
- **What it does:** Dry-runs scope, then verifies changed files against all verifier groups
- **Blocking:** Error-severity findings block the PR

#### `tessl-review.yml` — Structured PR review
- **Trigger:** PR open/sync, or `/tessl-review` comment
- **What it does:** Runs code-legibility review skill, posts structured PR review with inline comments
- **Advisory:** Posts as COMMENT, not REQUEST_CHANGES

#### `tessl-risk.yml` — Risk assessment
- **Trigger:** PR open/sync
- **What it does:** Assesses PR risk, posts emoji-coded assessment as a comment
- **Advisory initially:** Does not block merges. Promote to required after observing real PRs

#### `tessl-weekly-optimizations.yml` — Learning loop
- **Trigger:** Monday 09:00 UTC cron, or manual dispatch
- **What it does:** Scans last week's merged PRs, extracts review feedback and CI failures, files GitHub issues labeled `harness-improvement` for new verifiers/rules/skills

---

## The Self-Improving Loop

This is the key architectural insight — the pieces connect:

```
Developer opens PR
        │
        ▼
┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ Existing CI   │────►│ tessl change │────►│ tessl change │
│ (lint, type,  │     │ verify       │     │ review       │
│  tests)       │     │ (5 verifiers)│     │ (legibility) │
└───────────────┘     └──────────────┘     └──────┬───────┘
     pass/fail             pass/fail              │
                                                  ▼
                                           ┌──────────────┐
                                           │ tessl change │
                                           │ risk         │
                                           └──────┬───────┘
                                                  │
                                    ┌─────────────┴──────────┐
                                    │                        │
                              low-risk                 high-risk
                                    │                        │
                              auto-merge              human review
                              eligible                required
                                    │                        │
                                    └────────┬───────────────┘
                                             │
                                             ▼
                                    Monday cron runs
                                    find-optimizations
                                             │
                                             ▼
                                    Files GitHub issues
                                    for new verifiers,
                                    rules, or skills
                                             │
                                             ▼
                                    Team implements top
                                    items → harness gets
                                    stricter → fewer
                                    review issues →
                                    more PRs auto-merge
```

---

## Getting Started

### Prerequisites

- [Tessl CLI](https://tessl.io) installed (`tessl --version` ≥ 0.88)
- GitHub CLI (`gh`) authenticated
- `TESSL_TOKEN` — generate at [tessl.io](https://tessl.io)
- `ANTHROPIC_API_KEY` — for Claude Code agent tasks

### Clone and set up

```bash
gh repo clone tdg-ninja/tessl-payload-reference
cd tessl-payload-reference
tessl install
```

### Run verifiers locally

```bash
# Lint all verifier JSON
for f in verifiers/*.json; do tessl change verify lint "$f"; done

# See what files each verifier targets (no LLM calls)
tessl change verify --dry-run --all --show-files

# Sample 10 test files for cleanup violations
tessl change verify --all --sample 10 --group testing

# Run on your current diff
tessl change verify --base origin/main
```

### Run PR review locally

```bash
# Review current diff against code legibility skill
tessl change review \
  --skill tessl/code-review#review-code-legibility \
  --base origin/main --json

# Review a specific commit range
tessl change review \
  --skill tessl/code-review#review-code-legibility \
  --base HEAD~3 --json
```

### Run risk assessment locally

```bash
# Assess risk of current diff
tessl change risk --base origin/main --json

# Assess risk of the last commit
tessl change risk --base HEAD~1 --json
```

### Set up CI secrets (to enable workflows)

```bash
# In your fork:
gh secret set TESSL_TOKEN
gh secret set ANTHROPIC_API_KEY
```

---

## Sample Outputs

### Verifier finding (test-cleanup)

```
test/_community/int.spec.ts
  ❌ Tests clean up created records (testing#test-cleanup)  FAIL
    ❌ cleanup-mechanism-exists — There is no afterEach or afterAll mechanism
       for deleting records created by payload.create
    ❌ no-orphaned-creates — The call to payload.create inside 'local API example'
       test is not followed by any delete/cleanup mechanism
```

**6 out of 10 random test files** had this violation — demonstrating that even
well-maintained OSS codebases have patterns that slip through without automated checks.

### Review finding (code legibility)

```json
{
  "path": "packages/payload/src/index.ts",
  "line": 1411,
  "body": "Exporting addDefaultsToConfig as the public replacement surfaces a
    helper whose (config: Config): Config signature does not convey that it
    mutates the input in place and returns the same reference..."
}
```

### Risk assessment

```json
{
  "decision": "human-review-required",
  "judgment": {
    "riskLevel": "high",
    "confidence": 0.92,
    "summary": "Changes touch packages/payload/src/config/defaults.ts,
      which the policy explicitly marks as always requiring human review..."
  }
}
```

---

## Comparison: Before vs. After

| Dimension | Before (hand-rolled) | After (Tessl harness) |
|-----------|---------------------|----------------------|
| **Convention enforcement** | CLAUDE.md + human review | 5 verifiers, CI-gated, with line-level findings |
| **Review quality** | One monolithic prompt, no composability | Composable skills, structured JSON, backtestable |
| **Review scope** | Triggered by `/ai-review` comment only | Automatic on every PR + manual re-trigger |
| **Merge decisions** | All PRs need human review | Risk-scored; low-risk PRs can skip |
| **Learning** | None | Weekly cron mines feedback, files improvement issues |
| **Memory** | CLAUDE.md only | Durable project memory for all tools |
| **Extensibility** | Edit custom Node.js action | Add a verifier JSON file or swap a review skill |

---

## Integration Diagrams

See [docs/tessl-integration-diagrams.md](docs/tessl-integration-diagrams.md) for detailed
architecture diagrams covering:

1. **Input sources** — what Tessl reads from the existing codebase
2. **PR pipeline** — the full sequence of checks on every pull request
3. **Learning loop** — how the weekly cron feeds improvements back
4. **Project memory** — the shared context layer connecting all tools
5. **Check destination triage** — decision tree for routing invariants to the right tool

---

## Next Steps

1. **Add CI secrets** (`TESSL_TOKEN`, `ANTHROPIC_API_KEY`) to enable workflows
2. **Open a test PR** to see all four workflows fire
3. **Promote risk gate** to required status check after 2 weeks of advisory observation
4. **Run `find-optimizations`** on upstream Payload PRs to discover more verifier candidates
5. **Add ast-grep** for structural patterns ESLint can't express
6. **Create a Payload-specific review skill** that encodes the conventions from `.github/ai-reviewer-prompt.md`
