---
name: implement-issue
description: Read a GitHub issue and implement the requested change, following all project conventions from CLAUDE.md. Opens a PR with the implementation.
---

# Implement Issue

1. Read the GitHub issue number from the instructions (`gh issue view <number>`).
2. Read `CLAUDE.md` for project conventions and coding patterns.
3. Plan the implementation based on the issue body and implementation direction.
4. Create a branch named `agent/<short-description>`.
5. Implement the change following all CLAUDE.md conventions.
6. Commit with conventional commit format: `<type>(<scope>): <description>`.
7. Push and open a PR linking the issue (`Closes #N`).
