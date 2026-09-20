# de-skills

Personal skills repository modeled after the structure of `mattpocock/skills`, tuned for lightweight local use.

## Goals

- Keep skills portable across agent harnesses.
- Organize skills with a stable taxonomy that scales.
- Keep v1 simple: local checks only, no release automation.

## Install

Install directly from this repository using `skills.sh`:

```bash
npx skills add DmitryEfimenko/de-skills
```

## Repository Structure

```text
skills/
  engineering/
  misc/
  deprecated/
docs/
  engineering/
  productivity/
scripts/
```

## Skill Authoring Rules

- One skill per folder, folder name in lowercase dash-case.
- Every skill folder must include `SKILL.md`.
- Frontmatter keys required in each `SKILL.md`:
  - `name`
  - `description`
  - `disable-model-invocation`
- `name` must match the folder name.
- Default for personal skills is user-invoked (`disable-model-invocation: true`).

## Local Validation

Run:

```bash
npm run check:skills
```

Checks include:

- bucket presence and naming
- `SKILL.md` existence
- frontmatter key presence
- folder and frontmatter name alignment
- docs mirror presence for promoted buckets (`engineering` and `productivity`)

## v1 Scope

Included:

- personal skill definitions
- five-bucket taxonomy
- mirror-ready docs layout
- local structural checks

Deferred to phase 2:

- `.claude-plugin/` metadata
- `.changeset/` release automation
- CI workflows
- governance/ADR package
