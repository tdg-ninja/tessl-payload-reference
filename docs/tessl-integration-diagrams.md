# Tessl Agent Integration Diagrams

How Tessl agent integrates into the Payload CMS codebase — every touchpoint,
data flow, and feedback loop mapped.

---

## 1. Where Tessl reads from (input sources)

Shows what existing Payload artifacts Tessl agent mined to build the harness,
and what it produced from each.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYLOAD CMS CODEBASE                                    │
│                                                                                 │
│  ┌─────────────────────────┐     ┌──────────────────────────────────────────┐   │
│  │ EXISTING INFRASTRUCTURE │     │ WHAT TESSL AGENT ADDED                   │   │
│  │                         │     │                                          │   │
│  │ CLAUDE.md ──────────────┼──►──┤ Mined conventions → 5 verifier JSON     │   │
│  │   200 lines of rules    │     │   verifiers/access-control.json         │   │
│  │   that agents "should"  │     │   verifiers/no-barrel-exports.json      │   │
│  │   follow                │     │   verifiers/object-params.json          │   │
│  │                         │     │   verifiers/rsc-client-imports.json     │   │
│  │ .github/ai-reviewer- ──┼──►──┤   verifiers/test-cleanup.json           │   │
│  │   prompt.md             │     │                                          │   │
│  │   (review conventions)  │     │ Mined sensitive paths → risk policy     │   │
│  │                         │     │   .github/pr-review-gate/policy.md      │   │
│  │ .claude/skills/ ───────┼──►──┤                                          │   │
│  │   6 existing skills     │     │ Scanned repo → project memory           │   │
│  │                         │     │   .tessl/memory/preferences/*.md        │   │
│  │ eslint.config.js ──────┼──►──┤                                          │   │
│  │   5 custom rules        │     │ Identified gaps in source-control-      │   │
│  │                         │     │   and-ci.md (no ast-grep, no            │   │
│  │ .github/workflows/ ───┼──►──┤   verifiers, no risk gate)               │   │
│  │   main.yml (CI)         │     │                                          │   │
│  └─────────────────────────┘     └──────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key point:** Tessl agent doesn't replace anything Payload already has. It reads
what exists, identifies gaps, and adds a layer that connects everything into a
self-enforcing, self-improving system.

---

## 2. PR pipeline (what happens on every pull request)

Shows the sequence of checks that fire when a PR is opened or updated,
and how each gates or informs the merge decision.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PR PIPELINE (what happens on every PR)                   │
│                                                                                 │
│  Developer (or agent) opens PR                                                  │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────────┐  EXISTING                                                 │
│  │ main.yml         │  Payload's CI                                             │
│  │                  │                                                           │
│  │ • ESLint         │──── 5 custom rules catch import boundaries,              │
│  │ • TypeScript     │     logger usage, monorepo imports                        │
│  │ • Vitest         │                                                           │
│  │ • Playwright     │──── deterministic pass/fail                               │
│  └────────┬─────────┘                                                           │
│           │ passes                                                              │
│           ▼                                                                     │
│  ┌──────────────────┐  NEW — tessl-verify.yml                                   │
│  │ tessl change     │                                                           │
│  │ verify           │  Reads: verifiers/*.json + tessl.json                     │
│  │                  │  Checks: only files changed in this PR                    │
│  │ 5 LLM-as-judge  │                                                           │
│  │ verifiers across │  ┌─────────────────────────────────────────────┐          │
│  │ 3 groups:        │  │ security:    overrideAccess + user          │          │
│  │                  │  │ conventions: barrel exports, object params, │          │
│  │                  │  │              RSC client imports             │          │
│  │                  │  │ testing:     test record cleanup            │          │
│  │                  │  └─────────────────────────────────────────────┘          │
│  │                  │                                                           │
│  │ ERROR = blocks   │──── ❌ or ✅ (gates the PR)                               │
│  └────────┬─────────┘                                                           │
│           │ passes                                                              │
│           ▼                                                                     │
│  ┌──────────────────┐  NEW — tessl-review.yml                                   │
│  │ tessl change     │                                                           │
│  │ review           │  Reads: tessl/code-review#review-code-legibility          │
│  │                  │  Posts: structured PR review with inline comments          │
│  │ advisory —       │                                                           │
│  │ COMMENT, not     │──── 💬 (informational, not blocking)                      │
│  │ REQUEST_CHANGES  │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐  NEW — tessl-risk.yml                                     │
│  │ tessl change     │                                                           │
│  │ risk             │  Reads: .github/pr-review-gate/policy.md                  │
│  │                  │         .github/pr-review-gate/config.json                │
│  │ Scores the PR    │                                                           │
│  │ against policy:  │  ┌─────────────────────────────────────────────┐          │
│  │                  │  │ Always review:                              │          │
│  │                  │  │   packages/payload/src/auth/                │          │
│  │                  │  │   packages/db-*, packages/drizzle/          │          │
│  │                  │  │   packages/payload/src/config/              │          │
│  │                  │  │   exports/client/index.js (RSC boundary)    │          │
│  │                  │  │   packages/eslint-plugin/                   │          │
│  │                  │  │                                             │          │
│  │                  │  │ Low-risk (can skip review):                 │          │
│  │                  │  │   docs-only, test-only, formatting,        │          │
│  │                  │  │   trivial renames, no behavior change       │          │
│  │                  │  └─────────────────────────────────────────────┘          │
│  │                  │                                                           │
│  │ Posts:           │──── 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH                         │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ├── LOW ────── ✅ eligible to merge without human review               │
│           │                                                                     │
│           └── HIGH ───── ⚠️ human review required                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Learning loop (weekly self-improvement cron)

Shows how the Monday cron scans PR history, identifies recurring patterns,
files issues, and feeds improvements back into the harness — making the
system stricter over time without manual effort.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LEARNING LOOP (Monday 09:00 UTC cron)                         │
│                                                                                 │
│  tessl-weekly-optimizations.yml                                                 │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────────┐                                                           │
│  │ Scans last 7     │  Reads: merged PRs, review comments,                     │
│  │ days of merged   │         CI failures, fix-up commits                       │
│  │ PRs              │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐                                                           │
│  │ Identifies       │  "Reviewers flagged missing formatAdminURL 3 times"       │
│  │ patterns         │  "Agents keep passing inline arrays to hooks"             │
│  │                  │  "Translation generation is always manual"                │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐                                                           │
│  │ Files GitHub     │  Issue #1: [verifier] formatAdminURL                      │
│  │ issues           │  Issue #2: [verifier] qs-esm for query strings            │
│  │                  │  Issue #3: [verifier] memoize hook args                   │
│  │ label:           │  Issue #4: [automation] auto-generate translations        │
│  │ harness-         │                                                           │
│  │ improvement      │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐                                                           │
│  │ Team implements  │  New verifier JSON → added to verifiers/                  │
│  │ top items        │  New ast-grep rule → added to rules/                      │
│  │                  │  New automation → added to .github/workflows/             │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  Next week's PRs are checked against the new rules                              │
│  → fewer review comments needed                                                 │
│  → more PRs qualify as low-risk                                                 │
│  → system gets stricter automatically                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Project memory (the shared context layer)

Shows how `.tessl/memory/` connects every Tessl tool — each preference file
is read at the start of every session, so no skill or workflow has to re-ask
"what agents do you use?" or "where does CI run?"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROJECT MEMORY (reads that power everything)                  │
│                                                                                 │
│  .tessl/memory/index.md ──► loaded at start of every Tessl session              │
│         │                                                                       │
│         ├── goals.md                                                            │
│         │     "demonstrate full harness, prove self-improving loop"             │
│         │                                                                       │
│         ├── preferences/agents.md                                               │
│         │     "claude-code is default, codex available, 6 existing skills"      │
│         │         │                                                             │
│         │         └──► workflows know which --agent to use                      │
│         │         └──► plugin-creator knows what hooks exist                    │
│         │                                                                       │
│         ├── preferences/source-control-and-ci.md                                │
│         │     "ESLint has 5 custom rules, no ast-grep, verify is configured"   │
│         │         │                                                             │
│         │         └──► find-optimizations routes checks to right tool           │
│         │         └──► plugin-creator knows where to put new rules              │
│         │         └──► workflow-automator knows CI secrets + naming              │
│         │                                                                       │
│         ├── preferences/plugins.md                                              │
│         │     "plugins/ dir, scripts/ for hooks, TypeScript/Bun"               │
│         │                                                                       │
│         └── preferences/issue-tracking.md                                       │
│               "GitHub Issues, tdg-ninja/tessl-payload-reference"               │
│                   │                                                             │
│                   └──► weekly cron knows where to file issues                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Check destination triage (where each invariant lives)

Shows the decision tree for routing a convention or rule to the right
enforcement tool — deterministic first, LLM verifier when needed.

```
  "This convention should be enforced"
         │
         ▼
  Can a linter or typechecker catch it?
         │
    YES ──┼──► ESLint custom rule (packages/eslint-plugin/)
         │    or TypeScript strict mode
         │
         │    Examples already in Payload:
         │      payload/no-relative-monorepo-imports
         │      payload/no-imports-from-exports-dir
         │      payload/proper-payload-logger-usage
         │
    NO ───┼──► Can a structural pattern match catch it?
         │
    YES ──┼──► ast-grep rule (rules/ast-grep/)     ◄── GAP: not yet added
         │
         │    Examples that would work:
         │      try/finally in e2e tests
         │      inline array literals passed to hooks
         │      payload.find() without overrideAccess
         │
    NO ───┼──► Is it a binary invariant observable in the file?
         │
    YES ──┼──► Tessl verifier (verifiers/*.json)    ◄── 5 VERIFIERS ADDED
         │
         │    Examples in this repo:
         │      access-control (overrideAccess + user)
         │      no-barrel-exports
         │      object-params
         │      rsc-client-imports
         │      test-cleanup
         │
    NO ───┼──► Is it workflow or process guidance?
         │
    YES ──┼──► Skill or rule (plugins/ or .claude/skills/)
         │
         │    Examples already in Payload:
         │      .claude/skills/audit-dependencies
         │      .claude/skills/generate-translations
         │
    NO ───┼──► Document it (CLAUDE.md, AGENTS.md)
              or test it (test/**/*.spec.ts)
```

---

## Summary: what touches what

| Tessl Component | Reads From | Writes To | Trigger |
|---|---|---|---|
| **Project memory** | Repo structure, agent configs, CI workflows, eslint config | `.tessl/memory/preferences/*.md` | One-time setup |
| **Verifiers** | CLAUDE.md conventions, AI reviewer prompt | `verifiers/*.json`, `tessl.json` | One-time setup + learning loop |
| **Risk gate** | Repo structure, sensitive paths | `.github/pr-review-gate/` | One-time setup |
| **tessl-verify.yml** | `verifiers/*.json`, `tessl.json` | PR annotations (block/pass) | Every PR |
| **tessl-review.yml** | Review skill, PR diff | PR review comments | Every PR |
| **tessl-risk.yml** | Risk policy, PR diff | PR comment (risk score) | Every PR |
| **tessl-weekly-optimizations.yml** | Merged PRs, review comments | GitHub issues | Monday cron |
