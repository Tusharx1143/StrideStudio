# Source

repo: Tusharx1143/StrideStudio
branch: main

## Last sync

date: 2026-07-26T10:40:00Z

### Updated in this project
- Recreated the live app's five core screens (home feed, activity detail, sticker/template gallery, editor, profile) from source, then evolved them into a Snapchat-style capture → edit → share flow.
- New screens designed on top: splash, auth, Strava connect, activity sync, camera capture, background picker, export/share, saved projects.
- Editor rebuilt as a real canvas: drag, pinch, rotate, scale/rotate handles, snap guides, layer stack, undo/redo, drop-to-delete, palettes, filters, opacity.
- Sticker registry expanded to 54 data-driven designs across 8 themes (LED, minimal mono, terminal, glass, chart, poster, tape, editorial serif) with `Not specified` fallbacks for missing Strava fields.

## Screen map

| Project screen | Built from |
|---|---|
| Home feed | `app/(tabs)/index.tsx` (StoryCard, mono stat block), `lib/app-data.ts` |
| Activity detail | `app/activity/[id].tsx` (stat rows, Create Post CTA) |
| Sticker library | `app/(tabs)/templates.tsx`, `lib/templates.tsx`, `lib/dynamic-templates.tsx` |
| Editor | `app/editor.tsx` + `app/(tabs)/editor.tsx` (layer gestures, trash zone, ratios, filters), `lib/canvas-state.tsx` |
| Profile / settings | `app/(tabs)/profile.tsx` (sources, settings rows, stat cards) |
| Bottom navigation | `app/(tabs)/_layout.tsx` |
| Palettes / fonts / filters | `lib/color-presets.ts`, `lib/photo-filters.ts` |
| Design tokens (black / #FF6B35 / #1A1A1A / #1C1C1E) | `theme.config.js`, `lib/_core/theme.ts`, `design.md` |
| Sticker data model + adaptive field ranking | `lib/dynamic-templates.tsx` (`analyseFields`), `lib/app-data.ts` |

Note: no commit sha recorded — the tree hash returned by the API is not a commit.
