---
name: commit-message
description: Generate commit messages for staged changes across every git repo in the project (main repo plus submodules and nested repos), one message per repo, in English, prefixed with the branch's ticket ID. Use whenever the user asks for a commit message, "mensaje de commit", "write my commit", or wants to know what to write for their staged work. Does NOT commit — it only produces the message text.
---

# Commit message generator

Produce a commit message for the staged changes of **every** git repository in the project, one message per repo.

## Output format

A single line, no body, no trailing period:

```
<TICKET>: <Imperative summary of what the change does>
```

Reference example of the target style and length:

```
STORE-6081: Honor skipToMyOrder config when preorder is already closed and enable it for televenta
```

Rules for the line:

- **English**, always, regardless of the language the user writes in.
- **Imperative mood** — "Add", "Fix", "Honor", "Remove", not "Added" / "Adds".
- **Capital letter** after the ticket colon.
- Roughly **60–110 characters** total. Long enough to be genuinely informative, short enough to read at a glance.
- Describe the **behavioral outcome**, not a file-by-file inventory. Refactors that exist only to enable the real change are not the headline.
- When one commit legitimately covers two related things, join them with "and" (as in the example). If they are unrelated, say so and suggest splitting into separate commits.
- No body paragraphs unless the user explicitly asks for one. No `Co-Authored-By`, no emoji, no `🤖 Generated with` footer.
- Match the conventions visible in that repo's own `git log` if they differ from the above — the repo's existing history wins.

## Procedure

1. **Find every repo.** From the project root:
   - the root repo itself,
   - submodules: read `.gitmodules`, or `git submodule status`,
   - any other nested repos: `find . -name .git -maxdepth 4 -not -path "*/node_modules/*"`.

2. **Per repo, always pass an explicit path** (`git -C <abs-path> …`). The shell's working directory persists between tool calls and silently drifts, which makes an empty diff look like "no changes" when it is really the wrong repo. Never trust a bare `git diff` after a `cd`.

3. **Read the staged work** with `git --no-pager -C <path> diff --cached`. Note:
   - `git status --short` column 1 is the **staged** state, column 2 is unstaged. `M ` is staged; ` M` is not.
   - If a repo has nothing staged, say so plainly for that repo and move on — do not invent a message, and do not fall back to unstaged changes without saying that is what you did.
   - Read enough of the diff to understand intent. If the diff is large, read the full thing rather than a truncated head.

4. **Derive the ticket ID from the branch name**: `git -C <path> rev-parse --abbrev-ref HEAD`. A branch like `STORE-6077` or `STORE-5860-v1` yields `STORE-6077` / `STORE-5860`.
   - If the branch is generic (`dev`, `main`, `develop`, `HEAD` when detached) there is no ticket to derive. Infer the project's ticket prefix from recent `git log` subjects, emit the message with `PREFIX-XXXX:` as a placeholder, state clearly that the branch carries no ticket, and ask the user for the number.
   - Never guess a ticket number.

5. **Present** one message per repo, each in its own fenced code block, labeled with the repo name so it can be copied directly. Follow with a two-or-three-line summary of what actually changed, using clickable `file.js:42` style references.

## Scope

Generate the message only. Do not run `git add`, `git commit`, or `git push` unless the user asks for it in that same request.
