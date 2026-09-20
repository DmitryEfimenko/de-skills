---
name: pr-description
description: Generate a conventional commit message and a GitHub PR description from staged changes. Use when you want to commit staged changes and prepare a pull request description.
argument-hint: Optional context or notes about the changes (e.g. ticket number, intent)
disable-model-invocation: true
---

You are preparing a git commit and GitHub pull request description from staged changes.

## Step 1 — Inspect staged changes

Run the following commands to understand what has changed:

```bash
git diff --staged --quiet
git diff --staged --stat
git diff --staged
```

If `git diff --staged --quiet` returns exit code 0, stop and output exactly:

1. Commit message block (`commit`) with:
   `no staged changes`
2. PR description block (`markdown`) with:
   `No staged changes found. Stage files first, then run this skill again.`

Do not continue to Step 2 or Step 3 when there are no staged changes.

Analyze:

- Which files changed and why
- The intent of the change (feature, fix, refactor, etc.)
- The domain or component affected (use the folder/module names as scope hints)

## Step 2 — Generate commit message

Produce a **single-line conventional commit message** using the format:

```
<type>(<scope>): <short imperative description>
```

Rules:

- `type` must be one of: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `chore`
- `scope` is the affected domain or module (e.g. `header`, `auth`, `footer`, `shared`)
- Description is lowercase, imperative mood, ≤72 characters total
- Add `!` after scope for breaking changes: `feat(header)!: ...`

Output the commit message in a fenced code block labelled `commit`.

## Step 3 — Generate PR description

Produce a GitHub pull request description using this exact template:

```markdown
## User story / Ticket

[USER_STORY_LINK_OR_TICKET_NUMBER]

## Summary

## Changes

-

## Notes for reviewer
```

Guidance for filling the template (this guidance is for you, not output text):

- In **User story / Ticket**, replace the placeholder with the real link or ticket number.
- In **Summary**, write one or two sentences focused on intent and context, not file names.
- In **Changes**, provide 2 to 5 bullets, with one bullet per distinct change area.
- In **Changes**, keep bullets conceptual and focused on behavior/responsibility changes, not file names.
- In **Notes for reviewer**, include optional trade-offs, follow-up work, or decisions that matter for review.

Fill in all sections from the diff. Leave `[USER_STORY_LINK_OR_TICKET_NUMBER]` as a literal placeholder — do not guess or invent a link.

Do not hallucinate. Do not invent tests, rollout steps, risk mitigations, links, or decisions that are not present in the staged diff or user-provided context. If evidence is missing, write `not specified`.

Keep the description concise. The reviewer reads the diff to understand the details; the description should give them the _why_ and the high-level _what_, not a file-by-file changelog.

If the user provided extra context in their message, incorporate it into the Summary and Notes for reviewer sections.

## Output format

Present results in this order:

1. **Commit message** — fenced block labelled `commit`
2. **PR description** — fenced block labelled `markdown`

Do not add extra commentary around the blocks.
