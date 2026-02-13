import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SkillFrontmatter, ValidationResult } from "../types.js";

const FM_DELIMITER = "---";

export function extractFrontmatter(content: string): { raw: string; body: string } | null {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== FM_DELIMITER) return null;

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === FM_DELIMITER) {
      endIdx = i;
      break;
    }
  }

  if (endIdx < 0) return null;

  const raw = lines.slice(1, endIdx).join("\n");
  const body = lines.slice(endIdx + 1).join("\n");
  return { raw, body };
}

export function parseFrontmatter(raw: string): SkillFrontmatter | null {
  let name = "";
  let description = "";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    const nameMatch = trimmed.match(/^name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch) {
      name = nameMatch[1];
      continue;
    }
    const descMatch = trimmed.match(/^description:\s*["']?(.+?)["']?\s*$/);
    if (descMatch) {
      description = descMatch[1];
    }
  }

  if (!name) return null;
  return { name, description };
}

export function fixSkillFrontmatter(content: string): string {
  const extracted = extractFrontmatter(content);
  if (!extracted) return content;

  const parsed = parseFrontmatter(extracted.raw);
  if (!parsed) return content;

  // Rebuild clean frontmatter with only name and description
  const cleanFm = [
    FM_DELIMITER,
    `name: ${parsed.name}`,
    `description: ${parsed.description}`,
    FM_DELIMITER,
  ].join("\n");

  return cleanFm + "\n" + extracted.body.replace(/^\n+/, "\n");
}

export function validateSkillDir(skillDir: string, skillName: string): ValidationResult {
  const result: ValidationResult = {
    skill: skillName,
    valid: true,
    errors: [],
    warnings: [],
  };

  const skillMd = join(skillDir, "SKILL.md");
  if (!existsSync(skillMd)) {
    result.valid = false;
    result.errors.push("Missing SKILL.md");
    return result;
  }

  let content: string;
  try {
    content = readFileSync(skillMd, "utf-8");
  } catch {
    result.valid = false;
    result.errors.push("Cannot read SKILL.md");
    return result;
  }

  const extracted = extractFrontmatter(content);
  if (!extracted) {
    result.valid = false;
    result.errors.push("Missing or malformed frontmatter delimiters (---)");
    return result;
  }

  const parsed = parseFrontmatter(extracted.raw);
  if (!parsed) {
    result.valid = false;
    result.errors.push("Cannot parse name from frontmatter");
    return result;
  }

  if (!parsed.description) {
    result.warnings.push("Missing description in frontmatter");
  } else if (parsed.description.length < 80) {
    result.warnings.push(`Description too short (${parsed.description.length} chars, recommend 80+)`);
  } else if (parsed.description.length > 1024) {
    result.warnings.push(`Description too long (${parsed.description.length} chars, max 1024)`);
  }

  // Check for non-standard fields
  const standardFields = ["name", "description"];
  for (const line of extracted.raw.split("\n")) {
    const keyMatch = line.match(/^(\w[\w-]*):/);
    if (keyMatch && !standardFields.includes(keyMatch[1])) {
      result.warnings.push(`Non-standard field: ${keyMatch[1]}`);
    }
  }

  if (parsed.name !== skillName) {
    result.warnings.push(`Name mismatch: frontmatter says "${parsed.name}", directory is "${skillName}"`);
  }

  if (extracted.body.trim().length < 50) {
    result.warnings.push("SKILL.md body is very short (less than 50 chars)");
  }

  if (result.errors.length > 0) result.valid = false;

  return result;
}
