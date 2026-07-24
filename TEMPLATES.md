# StrideStudio — Template Authoring Guide

This document describes the template system: how templates work, how to create new ones, and the design conventions to follow.

---

## Overview

StrideStudio templates are **pure render functions** that transform activity data into React Native JSX. They're the visual heart of the app — each template is a distinct graphic design that users overlay on their photos and share to social media.

### Key Characteristics

- **Stateless** — templates are functions `(activity, totals, colors?) => JSX.Element`. No hooks, no side effects.
- **Scalable** — the same function renders at full size on the editor canvas (~360×520dp) and at 0.35× scale in the template picker preview.
- **Composable** — shared helpers (`analyse-fields.ts`, `styling.ts`, `helpers.ts`) provide formatting, field selection, and visual primitives.
- **Color-aware** — templates accept an optional `TemplateColors` override for photo-overlay use (white text on dark backgrounds vs. dark text on light cards).

### Template Categories (9 total)

| Category | File | Tab | Style |
|----------|------|-----|-------|
| **Adaptive Core** | `activity/adaptive-core.tsx` | Activity | Dynamic stat layouts that adapt to available fields |
| **Fancy** | `activity/fancy.tsx` | Activity | Decorative, visually rich designs |
| **Ideas** | `activity/ideas.tsx` | Activity | Experimental and creative layouts |
| **Big Stats** | `activity/big-stats.tsx` | Activity | Large typography, bold numbers |
| **Combos** | `activity/combos.tsx` | Activity | Multi-stat combination layouts |
| **Layouts** | `activity/layouts.tsx` | Activity | Structural layout variations |
| **Style** | `activity/style.tsx` | Activity | Typography and color-focused designs |
| **Extras** | `activity/extras.tsx` | Activity | Specialty and niche designs |
| **Totals** | `totals/totals.tsx` | Totals | Weekly summary tables and aggregates |

---

## Template Anatomy

### TemplateDef Interface

```typescript
// lib/templates/index.tsx → lib/templates/shared/types.ts
interface TemplateDef {
  id: string;          // Unique identifier, e.g. "big-km", "terminal-log"
  name: string;        // Display name in the template picker
  tab: "activity" | "totals";
  render: TemplateRenderFn;
  /** Optional badge shown on the template card (e.g. "New") */
  badge?: string;
}

type TemplateRenderFn = (
  activity: Activity,
  totals: WeekTotals,
  colors?: TemplateColors,
) => React.ReactElement;
```

### WeekTotals Interface

```typescript
interface WeekTotals {
  runKm: number;
  otherKm: number;     // aggregate of all non-run activities
  totalKm: number;
  totalMinutes: number;
  items: Array<{
    day: string;
    km: number;
    type: string;
  }>;
}
```

### TemplateColors Interface

```typescript
interface TemplateColors {
  textPrimary: string;     // e.g. "#FFFFFF"
  textSecondary: string;   // e.g. "rgba(255,255,255,0.7)"
  textMuted: string;       // e.g. "rgba(255,255,255,0.4)"
  border: string;          // e.g. "rgba(255,255,255,0.15)"
  accent: string;          // e.g. "#FF6B35"
  accentSecondary: string; // e.g. "#FF453A"
  background: string;      // e.g. "rgba(0,0,0,0.4)"
  shadow: string;          // e.g. "rgba(0,0,0,0.6)"
}
```

---

## Shared Helpers

Templates should use these shared helpers instead of inline formatting:

### Field Analysis (`lib/templates/shared/analyse-fields.ts`)

```typescript
// Determine which stat fields are available for this activity
analyseFields(activity: Activity): AvailableField[]

// Get the primary/hero stat for the activity
heroField(activity: Activity): AvailableField
```

### Formatting (`lib/templates/shared/helpers.ts`)

```typescript
formatDuration(minutes: number): string;   // "1h 23m"
paceStr(activity: Activity): string;       // "5:12 /km"
timeStr(date: string): string;             // "08:30 AM"
fmtDateShort(date: string): string;        // "Mon 15"
fmtDateFull(date: string): string;         // "Monday, January 15"
fmtWeekday(date: string): string;          // "Monday"
```

### Styling (`lib/templates/shared/styling.ts`)

```typescript
ts(size: number, weight?: FontWeight): TextStyle;  // Type scale helper
ff(family: string): { fontFamily: string };          // Font family shorthand
typeEmoji(type: string): string;                     // 🏃 for run, 🚴 for ride
typeLabel(type: string): string;                     // "Run", "Ride", "Workout"
```

### Color Resolution (`lib/color-presets.ts`)

```typescript
resolveColors(paletteId: string, customColors?: Partial<TemplateColors>): TemplateColors;
```

---

## Creating a New Template

### Step 1: Pick the right category file

Choose the category that best fits your template's visual style:
- **Adaptive Core:** if it dynamically shows different stats based on availability
- **Big Stats:** if it features large, bold numbers
- **Fancy/Ideas/Extras:** if it's decorative or experimental
- **Layouts:** if it's a structural variation
- **Totals:** if it shows weekly aggregate data

### Step 2: Write the render function

Create your template in the appropriate file under `lib/templates/activity/` or `lib/templates/totals/`.

```typescript
// lib/templates/activity/big-stats.tsx

import React from "react";
import { Text, View } from "react-native";
import type { Activity } from "@/lib/app-data";
import type { TemplateColors } from "@/lib/color-presets";
import type { WeekTotals } from "../shared/types";
import { formatDuration, paceStr } from "../shared/helpers";
import { heroField } from "../shared/analyse-fields";
import { ts, typeEmoji } from "../shared/styling";

export const BIG_STATS: TemplateDef[] = [
  // ...existing templates

  // Your new template
  {
    id: "my-new-template",
    name: "My New Template",
    tab: "activity",
    badge: "New",  // Optional
    render(activity, totals, colors) {
      const c = colors;  // Use if provided, otherwise fall back to defaults

      return (
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}>
          {/* Template content here */}
          <Text style={{
            color: c?.textPrimary ?? "#FFFFFF",
            fontSize: 48,
            fontWeight: "900",
          }}>
            {activity.distance.toFixed(1)} km
          </Text>
          <Text style={{
            color: c?.textSecondary ?? "rgba(255,255,255,0.7)",
            fontSize: 16,
            marginTop: 8,
          }}>
            {formatDuration(activity.duration)} · {paceStr(activity)}
          </Text>
        </View>
      );
    },
  },
];
```

### Step 3: Register the template

If you created a new category file, import and add it to `lib/templates/index.tsx`:

```typescript
import { MY_NEW_CATEGORY } from "./activity/my-new-category";

export const DYNAMIC_TEMPLATES: TemplateDef[] = [
  ...ADAPTIVE_CORE,
  ...FANCY,
  // ...other categories
  ...MY_NEW_CATEGORY,  // ← Add here
];
```

If you added to an existing category file, no registration is needed — it's already exported from that file's array.

---

## Design Conventions

### Layout

- **Container:** The render function receives no size constraints from the outside. Assume a ~360×520dp canvas and use `flex: 1` with padding.
- **Text alignment:** Center-aligned for hero stats, left-aligned for lists and tables.
- **Spacing:** Use the `EditorSpace` scale (4px grid) or consistent multiples of 4/8/12/16/24.

### Typography

- **Hero numbers:** `fontSize: 48–72`, `fontWeight: "900"`, track tight (`letterSpacing: -1` or `-2`)
- **Labels:** `fontSize: 12–14`, `fontWeight: "600"`, uppercase with `letterSpacing: 1–2`
- **Body text:** `fontSize: 14–16`, `fontWeight: "400"` or `"500"`
- **Mono fonts:** Use `fontFamily: "Courier"` for terminal/log-style templates
- **Serif fonts:** Use `fontFamily: "Georgia"` for editorial/quote templates

### Colors

- **Always** accept the optional `colors` parameter. Fall back to reasonable defaults:
  ```typescript
  const textColor = colors?.textPrimary ?? "#FFFFFF";
  const accentColor = colors?.accent ?? "#FF6B35";
  ```
- **Dark backgrounds:** Most templates render on dark/photo backgrounds. Use white/light text.
- **Light card templates:** Some templates (editorial, notes, polaroid) simulate a light card. These should render correctly on both light and dark backgrounds — use the `colors` override to adapt.

### Responsiveness

- Templates render at different scales (1× on canvas, 0.35× in picker). Use relative sizing where possible:
  - ✅ `padding: "10%"` (relative to container)
  - ✅ `fontSize: 14` (scales with transform)
  - ❌ Hardcoded pixel-perfect layouts that break at small scale
- Test your template at both sizes: the picker card is 152×180dp with a 0.35× scale transform.

---

## Color Preset System

The color preset system (`lib/color-presets.ts`) provides named color schemes that users can apply to template layers:

```typescript
export const ALL_PRESETS = [
  { id: "bright-white", name: "Bright White", colors: { ... } },
  { id: "energy-orange", name: "Energy Orange", colors: { ... } },
  { id: "ocean-blue", name: "Ocean Blue", colors: { ... } },
  // ...more presets
];
```

Each preset defines all `TemplateColors` fields. Users can also pick custom colors from a 16-color grid (`CUSTOM_COLORS`).

### Font Families

```
System      → System font (San Francisco on iOS, Roboto on Android)
Serif       → Georgia
Mono        → Courier
Bold System → System font, weight 900
Light       → System font, weight 300
```

---

## Testing Templates

Templates are visual by nature, but you can write snapshot-style tests:

```typescript
// tests/templates/my-template.test.tsx
import { render } from "@testing-library/react-native";
import { describe, it, expect } from "vitest";

describe("My Template", () => {
  it("renders without crashing", () => {
    const activity = { /* mock activity */ };
    const totals = { /* mock totals */ };
    // const { toJSON } = render(template.render(activity, totals));
    // expect(toJSON()).toMatchSnapshot();
  });
});
```

**Manual testing checklist:**
1. Does it render correctly at full size on the editor canvas?
2. Does it look good at 0.35× scale in the template picker?
3. Does it work with both light and dark color presets?
4. Does it handle missing optional stats (e.g., no heart rate data)?
5. Does it work with different activity types (run, ride, workout)?

---

## Related Documents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design overview
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Development workflow and conventions
