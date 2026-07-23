/**
 * Templates barrel file — maintained for backward compatibility.
 *
 * All templates now live in individual category files under
 * `./templates/activity/` and `./templates/totals/`, aggregated
 * through `./templates/index.ts`.
 *
 * For new templates: create a file in the appropriate directory,
 * export a `TemplateDef[]`, then add it to `./templates/index.ts`.
 */
export {
  DYNAMIC_TEMPLATES,
  computeWeekTotals,
  type TemplateDef,
  type WeekTotals,
} from "./templates/index";

/** @deprecated Use DYNAMIC_TEMPLATES directly */
export { DYNAMIC_TEMPLATES as ALL_TEMPLATES } from "./templates/index";
