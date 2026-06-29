# Goals

## Onboarding goals

- [ ] Set up issue tracking locally so tessl agent can file issues
- [x] Run the `/find-optimizations` skill for the last week of PRs and file issues
- [ ] Run the `/find-automations` skill for the last week of PRs and file issues

## Top line goals

- Demonstrate the full Tessl agent harness on a real, production-grade OSS codebase (Payload CMS)
- Show how Tessl layers onto a repo that already has agent infrastructure (Claude Code skills, hooks, AI reviewer)
- Prove the self-improving feedback loop: review → find-optimizations → new verifiers/rules → better reviews
- Create a reference implementation that someone can clone and use as a template

## Current bottlenecks

- The existing AI reviewer (`.github/actions/ai-reviewer/`) is hand-rolled, not improvable via skills or feedback loops
- No verifier checks — conventions in CLAUDE.md (access control, RSC boundaries, logger usage) are enforced only by human review
- No risk gate — every PR requires human review regardless of risk
- No structural search tool (ast-grep) — some patterns can't be caught by ESLint alone
- No automated learning loop — PR review feedback is not mined for harness improvements
