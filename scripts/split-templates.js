/**
 * Splits dynamic-templates.tsx into category files.
 * Run: node scripts/split-templates.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "lib", "dynamic-templates.tsx");
const DST = path.join(__dirname, "..", "lib", "templates");

// Read and normalize line endings
let content = fs.readFileSync(SRC, "utf-8").replace(/\r\n/g, "\n");

// Extract header (imports + types)
const headerMatch = content.match(/^([\s\S]*?)export const DYNAMIC_TEMPLATES: TemplateDef\[\] = \[/);
if (!headerMatch) { console.error("Could not find array start"); process.exit(1); }
const header = headerMatch[1].trimEnd();

// Extract footer (computeWeekTotals)
const footerMatch = content.match(/\];\s*\n(\s*\/\*\*[\s\S]*)$/);
const footer = footerMatch ? footerMatch[1] : "";

// Get array body
const bodyMatch = content.match(/export const DYNAMIC_TEMPLATES: TemplateDef\[\] = \[([\s\S]*?)\];\s*\n(\s*\/\*\*)/);
if (!bodyMatch) { console.error("Could not extract array body"); process.exit(1); }
const arrayBody = bodyMatch[1];

// Split on the pattern: newline + 2 spaces + { + newline + 4 spaces + id: + space + "
const re = /\n  \{\n    id: "/g;
const starts = [];
let m;
while ((m = re.exec(arrayBody)) !== null) {
  starts.push(m.index + 1); // past the \n
}

console.log(`Found ${starts.length} template starts`);

const templates = [];
for (let i = 0; i < starts.length; i++) {
  const start = starts[i];
  const end = i < starts.length - 1 ? starts[i + 1] : arrayBody.length;
  let raw = arrayBody.slice(start, end).trimEnd();
  if (raw.endsWith(",")) raw = raw.slice(0, -1);
  if (raw.trim()) templates.push(raw.trim());
}

console.log(`Extracted ${templates.length} templates`);

// Parse IDs and categorize
const CATEGORY_MAP = {
  "adaptive-core": ["auto-adapt","smart-hero","activity-shape","adaptive-grid","story-card","field-stack","speed-demon","peak-elevation","data-explorer","minimal-insight"],
  "fancy": ["gradient-glow","badge-medal","cinematic","neon-sign"],
  "ideas": ["blue-bar-quote","stats-strip","minimal-dot","data-dash"],
  "big-stats": ["big-distance","big-duration","big-pace","big-speed","big-elevation"],
  "combos": ["combo-dist-pace","combo-dist-time","combo-elev-hr"],
  "layouts": ["layout-left","layout-right","grid-2x2","mini-stats-row"],
  "style": ["thin-line","bold-block","magazine","retro-led"],
  "extras": ["split-diagonal","badge-corner","hero-bottom","stripes","pill-stats","watermark-bg"],
  "totals": ["dynamic-week","type-breakdown","mini-activity","week-big-total","week-breakdown-pills"],
};

const categorized = {};
for (const cat of Object.keys(CATEGORY_MAP)) categorized[cat] = [];

for (const t of templates) {
  const idMatch = t.match(/id:\s*"([^"]+)"/);
  const id = idMatch ? idMatch[1] : "unknown";
  let found = false;
  for (const [cat, ids] of Object.entries(CATEGORY_MAP)) {
    if (ids.includes(id)) { categorized[cat].push({ id, content: t }); found = true; break; }
  }
  if (!found) console.warn(`  UNCATEGORIZED: ${id}`);
}

// Write files
const activityDir = path.join(DST, "activity");
const totalsDir = path.join(DST, "totals");
fs.mkdirSync(activityDir, { recursive: true });
fs.mkdirSync(totalsDir, { recursive: true });

const indexImports = [];
const indexEntries = [];

for (const [cat, tmpls] of Object.entries(categorized)) {
  if (tmpls.length === 0) continue;
  const isTotals = cat === "totals";
  const dir = isTotals ? totalsDir : activityDir;
  const filePath = path.join(dir, `${cat}.tsx`);
  const importName = cat.replace(/-/g, "_").toUpperCase();

  const ext = "tsx";
  let fileContent = header + "\n\n";
  fileContent += `// ─── ${cat.replace(/-/g, " ").toUpperCase()} ───\n\n`;
  fileContent += `export const ${importName}: TemplateDef[] = [\n`;
  fileContent += tmpls.map((t) => `  ${t.content},`).join("\n\n");
  fileContent += "\n];\n";

  fs.writeFileSync(filePath, fileContent, "utf-8");
  console.log(`  ${tmpls.length} templates → ${isTotals ? "totals" : "activity"}/${cat}.tsx`);

  const relDir = isTotals ? "./totals" : "./activity";
  indexImports.push(`import { ${importName} } from "${relDir}/${cat}";`);
  indexEntries.push(`...${importName}`);
}

// Write index.ts
const indexContent = `${header}

// ── Aggregated template registry ──
// Templates organized by category. Add new templates by creating files
// in templates/activity/ or templates/totals/ and importing them here.

${indexImports.join("\n")}

/** All dynamic templates — aggregated from category files */
export const DYNAMIC_TEMPLATES: TemplateDef[] = [
  ${indexEntries.join(",\n  ")},
];

${footer}`;

const indexPath = path.join(DST, "index.tsx");
fs.writeFileSync(indexPath, indexContent, "utf-8");
console.log(`\n  index → templates/index.tsx`);
console.log(`Done! ${templates.length} templates → ${Object.values(categorized).filter(a => a.length > 0).length} categories.`);
