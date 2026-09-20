# Skill Authoring

Use this checklist when creating a new skill.

## Folder Placement

- Choose one bucket: `engineering`, `misc`, or `deprecated`.
- Create one folder per skill with lowercase dash-case naming.

## Required File

- Add `SKILL.md` in the skill folder.

## Required Frontmatter

```yaml
---
name: your-skill-name
description: One-line purpose of the skill
disable-model-invocation: true
---
```

Optional key:

- `argument-hint`

## Conventions

- Keep the `name` value equal to the folder name.
- Default to user-invoked skills (`disable-model-invocation: true`).
- Use clear process steps and explicit guardrails.

## Docs Mirror

For skills in promoted buckets (`engineering`, `productivity`), add a mirror doc page:

- `docs/<bucket>/<skill-name>.md`

## Validate

Run:

```bash
npm run check:skills
```
