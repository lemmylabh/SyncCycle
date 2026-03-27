import fs from "fs";
import path from "path";

export function loadPromptFile(filename: string): string {
  return fs.readFileSync(path.join(process.cwd(), "prompts", filename), "utf-8").trim();
}

export function loadResearchContext(): string {
  const dir = path.join(process.cwd(), "prompts/research");
  if (!fs.existsSync(dir)) return "";
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) return "";
  return files
    .map((f) => fs.readFileSync(path.join(dir, f), "utf-8").trim())
    .join("\n\n---\n\n");
}
