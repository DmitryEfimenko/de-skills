---
name: implement-spec-slice
description: Implement a thin vertical slice from an approved spec with explicit constraints and verification.
argument-hint: 'Spec link or summary, boundaries, and acceptance criteria'
disable-model-invocation: true
---

Implement exactly one small, verifiable task from a selected ticket under an approved spec. Use this skill to advance one ticket by one task without scope drift, while preserving proof that acceptance criteria were satisfied.

## Inputs and Preconditions

Required input:

- Parent spec reference (URL, issue number, or path)

Optional input:

- Ticket identifier, or `next` to select the next unblocked ticket

Before proceeding, confirm:

- A selected ticket exists (explicitly provided, or selectable as `next`)
- Acceptance criteria exist for the selected ticket
- The repo has issue-tracker conventions configured (for example via setup skills/docs)

Inference rules:

- If ticket is omitted, choose `next` deterministically.
- Stop and ask only when key identifiers cannot be inferred safely.
- If tracker conventions are missing or unclear, stop and ask the user to confirm the tracker workflow before proceeding.

## Workflow

### Step 1: Load Canonical Context

Read only what is needed to complete one task:

- The selected ticket body and comments
- The parent spec
- Relevant domain decision docs (`CONTEXT-MAP.md`, `CONTEXT.md`, ADRs), if present

If these sources conflict, treat the parent spec plus selected ticket as canonical for this slice.

### Step 2: Select One Ticket

If the user named a ticket, use it.

If the user passed `next` or omitted ticket id:

- Prefer delegating ticket-selection logic to an existing selector skill if one exists in the repo.
- Otherwise, use deterministic fallback rules: choose the first open, unblocked ticket in stable order.

Do not start another ticket in this run.

### Step 3: Break Into Tasks and Pick One

Break the selected ticket into the smallest practical tasks.

Pick exactly one task in this priority order:

1. Critical bugfixes
2. Tracer-bullet behavior for new feature flow
3. Polish and quick wins
4. Refactors

If no tasks remain for the selected ticket, output exactly `ALL TASKS COMPLETE` and stop.

### Step 4: Write a Decision Snapshot Before Coding

Create a short pre-implementation snapshot with 3-7 constraints:

- Explicit "must" statements
- Explicit "must not" statements
- Contract-shape constraints (types/interfaces/schema), where relevant

If this slice replaces or mirrors an existing path, identify the nearest reference implementation and list observable behavior dimensions to verify.

### Step 5: Clarification Gate

Before editing files, compare the planned change against the decision snapshot.

If acceptance criteria are ambiguous, parity dimensions are under-specified, or planned work conflicts with decisions: stop and ask clarifying questions.

Do not code through ambiguity.

### Step 6: Load and Delegate to Related Skills

Do not re-implement the internals of other skills. Delegate by reference:

- `setup-matt-pocock-skills` (or repo equivalent): source of tracker conventions
- `to-spec`: source of spec publication behavior
- `to-tickets`: source of ticket slicing and edge semantics
- `tdd`: source of red-green-refactor loop
- `code-review`: source of final standards/spec review flow

If runtime behavior changes, apply `tdd` workflow before implementation where practical.

### Step 7: Implement One Task Only

Implement only the selected task.

- Keep scope strictly inside ticket acceptance criteria and explicit constraints.
- Use thin, end-to-end changes first (tracer bullet), then stop.
- Do not silently add adjacent work from sibling tickets.

If the task is larger than expected, output exactly `HANG ON A SECOND`, shrink scope to a smaller safe unit, and complete only that smaller unit.

### Step 8: Enforce Parity and Integration Proof

For replication/replacement/extension slices:

- Do not treat wiring-only milestones as complete proof.
- Verify behavior across the dimensions listed in Step 4.
- Prefer direct integration proof through the new surface, not through fallback paths.

If the reference path includes behavior dimensions absent from acceptance criteria, treat this as under-specification: keep scope limited, but do not report complete parity without explicit narrowing from the ticket.

### Step 9: Run Feedback Loops

Before considering the task complete, run the project's closest equivalents of:

- Typecheck
- Tests
- Build
- Lint
- E2E

If the repository uses a different package manager or script names, run the nearest equivalents and record what was run.

### Step 10: Format and Recheck Diff

- Run repo-standard formatting command when available.
- If unavailable, run file-targeted formatting for changed files.
- Recheck git diff and keep formatting updates in the same commit.

### Step 11: Update Ticket Progress

Tracker-native state is primary. Update the selected ticket with what was completed, what remains, and blockers.

Record:

- Key decisions
- Key findings
- Files changed
- Blockers or next-step notes

### Step 12: Commit and Update Ticket

If files changed:

- Create one clear commit referencing the selected ticket.
- Then update the selected ticket acceptance checklist:
  1.  Check only fully satisfied items.
  2.  Leave partial items unchecked.
  3.  Post a concise completion comment: done, remaining, blockers.
  4.  Close the ticket only if all acceptance criteria are satisfied.

If no files changed, do not create an empty commit.

## Final Rules

- Work on one selected ticket only.
- Complete one task only.
- Prefer deterministic behavior over ad-hoc judgment where tracker state is involved.
- Stop on ambiguity and clarify before coding.
- Do not claim completion without verification evidence.

## DO

- Keep the slice thin and end-to-end.
- Keep terminology consistent with the repo's domain vocabulary.
- Keep updates synchronized between code evidence and the selected ticket.

## DON'T

- Don't execute multiple tasks in one run.
- Don't expand into sibling-ticket work.
- Don't duplicate other skills' internal logic.
- Don't mark acceptance items complete without direct proof.
