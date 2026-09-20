---
name: address-pr-comments
description: 'Address GitHub pull request review feedback: group related comments, get a recommendation for each, and work through changes and replies with the user. Use when addressing PR feedback, responding to review comments, resolving review threads, or fixing PR comments.'
argument-hint: '[pr-number]'
---

# Address PR Comments

## Purpose

Read all outstanding feedback on a pull request — unresolved inline review threads and general conversation comments — group it into related concerns, get a researched recommendation for each, work through them one at a time with the user, then commit, push, and reply to the original threads/comments with what was done.

## Prerequisites

- `gh` CLI installed and authenticated
- Working on the PR's branch, with the PR open

## Workflow

This workflow has three phases. Phase 1 flows directly into Phase 2 — Phase 2's own per-concern stops (Step 6) are the checkpoint, so there's no separate stop between them. Phase 2 ends with a hard stop before Phase 3: present a final summary of everything about to be committed, then end your turn — never start Phase 3 in the same turn. Phase 3 only begins once the user's next message gives an explicit go-ahead (see the boundary after Step 6).

### Phase 1: Discovery & Analysis

### Step 1: Verify Environment

```bash
git remote -v
git status --short
git rev-parse --abbrev-ref HEAD
```

**STOP if:**

- No remote exists → ask the user to add one (`git remote add origin <url>`).
- On `main`/`master` → ask the user to check out the PR's branch first (`gh pr view <number> --json headRefName` finds it).
- Uncommitted changes exist → ask the user to commit or stash first; this skill needs a clean tree so its own commit at Step 7 only contains the changes it made.

### Step 2: Identify the PR

```bash
gh pr view --json number,state,title,headRefName,url
```

If no PR is associated with the current branch, ask the user for a PR number and re-run with `gh pr view <number> --json ...`. If the PR is not `OPEN`, tell the user and stop.

### Step 3: Fetch Review Feedback

Run [get-review-feedback.sh](./scripts/get-review-feedback.sh):

```bash
bash ./scripts/get-review-feedback.sh
```

Returns one JSON object:

```json
{
  "reviewThreads": [
    /* unresolved inline threads */
  ],
  "issueComments": [
    /* general PR conversation comments */
  ]
}
```

If both arrays are empty, tell the user there's nothing to address and stop.

### Step 4: Group Into Concerns

Group related threads/comments yourself by reading through the fetched data — this is a judgment call, not scripted. A **concern** is one or more threads/comments about the same underlying point (a single thread/comment is also a valid concern of size one). Threads/comments can belong to the same concern even when they're on different files — group by whether they discuss the same underlying point, using signals such as: same file and nearby lines, explicit cross-references ("same as above", "see other comment"), or shared topic/keywords regardless of location.

List the resulting concerns briefly for the user (one line each) and track them with the todo list tool.

Also initialize a scratch progress file at `tmp/address-pr-comments/pr-<number>-concerns.md` listing each concern with: a short title, its grouped thread/comment ids, status `pending`, and `user_approved: false`. This file is the durable record of where things stand — later steps update it as they go, so progress survives even if this conversation's context grows large.

### Step 5: Analyze Each Concern

For each concern, spawn a read-only `Explore` subagent (via `runSubagent`, `agentName: Explore`) with:

- The full text of every thread/comment in the concern (author, body, file/line, whether outdated)
- Instructions to research the current code at that location, verify whether the feedback still applies, and return exactly one recommendation:

1. `code-change` — the specific recommended change and reasoning
2. `suggest-reply` — a suggested reply and reasoning (no code change needed)
3. `discuss-first` — the ambiguity/disagreement and why it needs human input
4. `skip` — reasoning why no action is needed (e.g. stale, already fixed, invalid)

- An explicit instruction that it must not edit any files — research and recommend only.

Independent concerns can be analyzed in parallel. Record each concern's recommendation and reasoning in the progress file.

Present the full list of concerns and their recommendations to the user, then continue directly into Phase 2 in the same turn — there is no separate stop here; Step 6's per-concern stops are the checkpoint.

### Phase 2: Concern Walkthrough

### Step 6: Walk Through Each Concern With the User

Process concerns one at a time (update the todo list as you go), branching on the subagent's recommendation:

**STOP after presenting each concern:**

- Do not move to the next concern until the user has responded to the current one.
- Do not make or delegate any edit for the current concern until the user has approved it.
- This applies to every concern, including `skip` recommendations — never skip a concern without confirming with the user first.
- Once the user approves a concern, record `user_approved: true` for it in the progress file. If the user later asks to change something about an already-approved concern, reset that concern's `user_approved` back to `false` and get it re-confirmed before Step 7 — a stale approval must never survive a later edit.

**How to get that confirmation:** present the concern and its recommendation as your response, then end your turn immediately — issue no further tool calls and do not start any implementation. Wait for the user's next message before continuing. If an interactive question/ask tool is available in this environment, prefer it for a clearer prompt; otherwise a plain chat message followed by ending the turn is sufficient and still mandatory.

**`code-change`**

- Show the recommended change and reasoning.
- Work with the user to approve it as-is or come up with an alternative (use the `grill-me` or `grill-with-docs` skill if there's real design disagreement).
- Once a path forward is approved, record the approved plan in the progress file, then delegate its execution to a subagent (via `runSubagent`, omitting `agentName` so it keeps full read/write tooling). Give it the approved plan, the relevant file/context pointers from Step 5's analysis, and instructions to apply the `tdd` skill where a test can meaningfully cover the change, run the project's full feedback loops (the whole test suite, typecheck, lint, build — not just the tests it thinks are affected) and confirm they're green before considering the change complete, and report back the files it changed plus a one-line summary of each — without committing or pushing.
- Show the user the subagent's file list and summary, then end your turn and get an explicit go-ahead before moving to the next concern (see the gate above); nothing is committed yet, so the user can inspect the actual diff themselves (e.g. `git diff`) if they want more than the summary. Record the outcome and changed files in the progress file.

**`suggest-reply`**

- Show the recommended reply and reasoning.
- End your turn and confirm it with the user (see the gate above), adjust the wording, or — if the user decides a code change is actually needed — fall through to the `code-change` flow above (including its subagent delegation).

**`discuss-first`**

- Show the ambiguity as described by the subagent.
- Propose a grilling session (`grill-me` or `grill-with-docs` skill) to resolve it.
- If that produces a decision to change code, fall through to the `code-change` flow above (including its subagent delegation).

**`skip`**

- Show the reasoning for skipping.
- End your turn and confirm with the user that skipping is appropriate before moving on (see the gate above).

If a reply will be posted for this concern per Step 8's guidance, draft its exact text as part of this walkthrough and get the user's approval on that text before moving to the next concern — don't defer drafting to Step 8. Write the draft in ASD-STE100 Simplified Technical English (short sentences, one instruction or fact per sentence, active voice, plain approved-style vocabulary). Reuse the ubiquitous language from the repo's `CONTEXT.md` — if the repo has more than one bounded context, follow `CONTEXT-MAP.md` to the `CONTEXT.md` relevant to the concern's area first. Skip this if the repo has neither file. Record the approved text (or the decision that no reply is needed) in the progress file, update the concern's status, then move on.

**STOP after Phase 2 completes:** re-read the progress file and refuse to proceed if any concern's `user_approved` is not `true` — go back to Step 6 for that concern instead. Once every concern is resolved and approved, present a final summary of everything about to be committed, then end your turn immediately — no further tool calls, and do not begin Phase 3 in the same turn.

Interpret the user's next message rather than requiring an exact keyword:

- An unambiguous go-ahead → proceed into Phase 3.
- A request to change something about an already-approved concern → address it (this resets that concern's `user_approved` back to `false` per Step 6's rule, so re-confirm it before re-presenting), still without entering Phase 3, until an explicit go-ahead is given.

### Phase 3: Commit, Reply & Report

### Step 7: Commit and Push

Use the per-concern summaries to write the commit message, then commit and push. Exclude the scratch progress file itself from the commit — this repo's `tmp/` isn't gitignored, so a plain `git add -A` would otherwise sweep it into the PR:

```bash
git add -A -- . ':!tmp/address-pr-comments'
git status
git commit -m "<summary of changes addressing review feedback>"
git push
```

### Step 8: Reply to Each Thread/Comment

Read each concern's approved reply text and thread/comment ids back from the progress file rather than relying on conversation memory — this keeps the final step correct even after covering a lot of ground to get here.

For every concern that was processed, reply describing what was done (change made, reply given, or why it was skipped). Write the reply body to a temp file first (e.g. `.git/tmp-reply-body.md`) rather than passing it inline — multiline text passed as a single quoted shell argument is prone to breaking on escaping/formatting.

When a concern groups more than one thread/comment, reply to every one of them so each set of participants gets notified — each thread/comment notifies only its own participants. Post the full explanation once, on the most substantive thread/comment in the group (the "primary"), then post a short cross-reference on each remaining one linking to the primary's reply (e.g. "Addressed together with the thread above: <url>"). Capture the primary reply's URL from the script/command output to use in those cross-references. Evaluate the reply-only-if-needed judgment and the `--resolve` decision below separately for each thread/comment in the group — a sibling thread can be pure praise while another in the same concern is substantive feedback.

- Inline review threads — [reply-thread.sh](./scripts/reply-thread.sh):

```bash
bash ./scripts/reply-thread.sh "<thread_id>" "<path-to-body-file>"
```

Default to **not** passing `--resolve` — leave that to the reviewer. The reviewer should be able to open the PR, see what they originally asked for, and judge for themselves whether it was addressed before closing the thread themselves. A PR author should never assume a reviewer's thread is closed on their behalf, even when the change made is exactly what was requested. The only case where `--resolve` is appropriate is a thread that was pure praise/acknowledgment with no actionable feedback (nothing for the reviewer to double-check).

After posting, spot-check at least one reply by fetching it back (e.g. `gh api repos/<owner>/<repo>/pulls/comments/<id> --jq .body`, where `<id>` is the numeric suffix of the returned URL's `#discussion_r<id>` fragment) and confirming it contains the actual reply text, not a literal file path — `gh api`'s `@file` file-reading behavior only works with `-F/--field`, not `-f/--raw-field`, so a `-f` typo silently posts the literal `@path` string instead of the file's contents.

- General PR conversation comments:

```bash
gh pr comment <number> --body-file "<path-to-body-file>"
```

Only post a reply if it adds information the reviewer can't already get from the commit/diff — e.g. the comment asked a direct question, the concern was skipped or only partially addressed, a `discuss-first` point was resolved a particular way, or the fix isn't obviously connected to the comment. Skip the reply if the code change is self-evident and no question was asked; don't post a reply just to say "done". Since these don't nest under the original comment, quote or link the original comment's URL when it isn't otherwise clear what you're replying to.

Keep replies concise and professional.

### Step 9: Report Completion

Summarize: concerns addressed (and how many threads/comments each grouped), files changed, replies posted, and anything skipped with its reasoning.

## Guidelines

**DO**

- Verify environment and PR state before doing anything else
- Group related feedback before analyzing, so the user isn't asked about the same point multiple times
- Keep Step 5 analysis subagents strictly read-only
- Delegate a code change's implementation and verification to a subagent once the plan is approved, keeping the main conversation focused on discussion and approval
- Get explicit user approval before making or pushing any code change, and again after a subagent reports back before moving to the next concern
- Keep the progress file current as each concern is resolved
- Write reply bodies to a file and use `--body-file` rather than inline shell arguments
- Write reply text in ASD-STE100 Simplified Technical English, using the repo's ubiquitous language from `CONTEXT.md`/`CONTEXT-MAP.md` when those exist
- Reply on every thread/comment in a multi-thread concern — full explanation on the primary, cross-reference on the rest
- Track progress across concerns with the todo list tool

**DON'T**

- Make or push code changes without user approval
- Let a code-change subagent commit or push — the single commit at the end covers everything
- Include the scratch progress file in the final commit
- Post a general-comment reply that adds no information beyond the diff
- Resolve a thread unless it was pure praise with no actionable feedback — default to leaving it unresolved for the reviewer
- Skip a concern without confirming with the user first
- Post the same full explanation on every thread in a multi-thread concern, or leave any of them without at least a cross-reference reply
