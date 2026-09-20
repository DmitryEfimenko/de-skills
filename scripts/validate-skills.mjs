import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skillsRoot = path.join(root, 'skills');
const docsRoot = path.join(root, 'docs');

const requiredBuckets = [
  'engineering',
  'productivity',
  'misc',
  'in-progress',
  'deprecated',
];

const promotedBuckets = ['engineering', 'productivity'];
const dashCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    frontmatter[key] = value;
  }

  return frontmatter;
}

async function listDirectories(target) {
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function main() {
  const errors = [];

  if (!(await exists(skillsRoot))) {
    errors.push('Missing skills/ directory.');
  }

  for (const bucket of requiredBuckets) {
    const bucketPath = path.join(skillsRoot, bucket);
    if (!(await exists(bucketPath))) {
      errors.push(`Missing bucket directory: skills/${bucket}`);
      continue;
    }

    if (!dashCase.test(bucket)) {
      errors.push(`Bucket name is not dash-case: ${bucket}`);
    }

    const skillFolders = await listDirectories(bucketPath);
    for (const skillFolder of skillFolders) {
      const skillPath = path.join(bucketPath, skillFolder);
      const skillFile = path.join(skillPath, 'SKILL.md');

      if (!dashCase.test(skillFolder)) {
        errors.push(
          `Skill folder is not dash-case: skills/${bucket}/${skillFolder}`,
        );
      }

      if (!(await exists(skillFile))) {
        errors.push(
          `Missing SKILL.md: skills/${bucket}/${skillFolder}/SKILL.md`,
        );
        continue;
      }

      const content = await fs.readFile(skillFile, 'utf8');
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter) {
        errors.push(
          `Missing frontmatter block: skills/${bucket}/${skillFolder}/SKILL.md`,
        );
        continue;
      }

      for (const key of ['name', 'description', 'disable-model-invocation']) {
        if (!frontmatter[key]) {
          errors.push(
            `Missing frontmatter key '${key}' in skills/${bucket}/${skillFolder}/SKILL.md`,
          );
        }
      }

      if (frontmatter.name && frontmatter.name !== skillFolder) {
        errors.push(
          `Frontmatter name '${frontmatter.name}' does not match folder '${skillFolder}' in skills/${bucket}/${skillFolder}/SKILL.md`,
        );
      }

      if (promotedBuckets.includes(bucket)) {
        const docPath = path.join(docsRoot, bucket, `${skillFolder}.md`);
        if (!(await exists(docPath))) {
          errors.push(`Missing mirrored doc: docs/${bucket}/${skillFolder}.md`);
        }
      }
    }
  }

  for (const bucket of promotedBuckets) {
    const promotedDocsDir = path.join(docsRoot, bucket);
    if (!(await exists(promotedDocsDir))) {
      errors.push(`Missing promoted docs directory: docs/${bucket}`);
    }
  }

  if (errors.length > 0) {
    console.error('Skill structure validation failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Skill structure validation passed.');
}

main().catch((error) => {
  console.error('Validator crashed.');
  console.error(error);
  process.exit(1);
});
