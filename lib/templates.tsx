/**
 * Templates barrel file — maintained for backward compatibility.
 *
 * All templates are now dynamic (data-adaptive) and live in
 * `./dynamic-templates.tsx`. Prefer importing from there directly.
 */
export {
  DYNAMIC_TEMPLATES,
  computeWeekTotals,
  type TemplateDef,
  type WeekTotals,
} from "./dynamic-templates";

/** @deprecated Use DYNAMIC_TEMPLATES directly */
export { DYNAMIC_TEMPLATES as ALL_TEMPLATES } from "./dynamic-templates";
