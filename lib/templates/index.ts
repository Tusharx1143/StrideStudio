/**
 * Templates package — public barrel.
 *
 * Re-exports all template types, helpers, and the template registry.
 * Individual template files in ./templates/ can be extracted incrementally.
 */
export type { TemplateDef, WeekTotals } from "./shared/types";
export { DYNAMIC_TEMPLATES, computeWeekTotals } from "@/lib/dynamic-templates";
