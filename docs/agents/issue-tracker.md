# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue:** `gh issue create --title "..." --body-file <file>`. Use a file or heredoc for multi-line bodies.
- **Read an issue:** `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues:** `gh issue list --state open --json number,title,body,labels`.
- **Blocking:** add each ticket's open blockers in the body as `Blocked by: #<n>, #<n>` and, where available, as native GitHub issue dependencies. A ticket is unblocked when every blocker is closed.
- **Apply / remove labels:** `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Close:** let the merging PR close tickets with `Closes #<n>` lines. Otherwise `gh issue close <n> --comment "..."`.

The spec issue is the parent; each ticket body starts with `Part of #<spec>`.

## Pull requests as a triage surface

**PRs as a request surface: no.**
