# StrideStudio — UI/UX Concept v2 (Camera-First Editor)

> **Tagline:** Training is an art. Artists need tools.
> **Design Philosophy:** Snapchat's camera-first immediacy × Instagram Story creation × professional sports graphics — optimized for athletes creating beautiful, data-driven workout stories in seconds.

---

## 1. Executive Summary

StrideStudio transforms your Strava workouts into stunning, shareable visual stories. v2 reimagines the editor from the ground up: **the camera is the entry point**, **templates become Lenses** (interactive live-preview overlays), and **every edit is instant WYSIWYG**.

The rest of the product (auth, Strava connection, home feed, profile, settings) remains unchanged from the existing implementation. This document details only what changes in v2.

---

## 2. Core Philosophy

| Principle | Description |
|---|---|
| **Camera-first** | The app opens into a full-screen camera. Capture or import an image first, edit second. |
| **Zero friction** | A finished post in under 30 seconds. No Apply buttons, no modal wizard steps. |
| **One-handed** | Every interaction is reachable with a thumb. Floating toolbar, bottom sheets, gesture controls. |
| **Live WYSIWYG** | Every change is instant — swap a metric, change a font, apply a lens. The canvas updates immediately. |
| **Minimal chrome** | Maximum canvas visibility. UI elements are translucent, auto-hide, and context-aware. |

---

## 3. Changed Flows

### 3.1 Entry Point & Navigation

**Before (v1):** Home Screen → Select Activity → Editor (gallery first) → Customize → Export

**After (v2):** Open App → Camera (full-screen) → Capture/Import → Lens Carousel → Edit → Export

```
App opens → Full-screen Camera
├── Capture photo → Lens carousel auto-opens
├── Gallery import → same flow
├── Stock images → same flow
├── Preset backgrounds → same flow
└── Back gesture → Home Screen (existing)

Camera → Lens → Floating Toolbar → Export
  All within the same view — no screen transitions
```

The user can still navigate to Home, Profile, and Settings via a subtle swipe-down or edge gesture (or bottom tab bar in the existing layout). But the **primary entry point** is now the camera.

### 3.2 User Journey (Updated)

```
Open App → Full-screen Camera
  (Activity auto-selected from most recent Strava activity)
  │
  ├── Capture photo OR import from Gallery / Stock / Backgrounds
  │
  ├── Lens Carousel appears (horizontal scroll, live preview)
  │   └── Swipe through Lenses — canvas updates in real time
  │
  ├── Floating Toolbar (vertical, right side)
  │   ├── Select a Lens → contextual bottom sheet
  │   ├── Tap Stats picker → grouped metrics with live preview
  │   ├── Font / Color / Effects → instant canvas update
  │   └── Gesture controls: pinch, rotate, drag
  │
  ├── Export
  │   ├── Save to Camera Roll
  │   ├── Share Sheet
  │   ├── Live Story Preview (Instagram, Facebook, WhatsApp)
  │   └── Copy to Clipboard
  │
  └── Swipe down → Home Screen (existing activity feed)
```

---

## 4. Camera Screen (New)

The editor IS the camera. No separate landing page.

### 4.1 Layout

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │                   │  │
│  │   FULL-SCREEN     │  │
│  │   CAMERA VIEW     │  │
│  │   (no chrome)     │  │
│  │                   │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  ┌─┐ ┌─┐ ┌─┐ ┌─────┐   │
│  │⚡│ │◄►│ │🔦│ │GALLERY│  │
│  └─┘ └─┘ └─┘ └─────┘   │
│     ┌────────┐          │
│     │  ⚪⏺   │          │
│     └────────┘          │
└─────────────────────────┘
```

- **Viewfinder:** Full-screen camera preview with no visible controls until tapped
- **Bottom bar (appears on tap):**
  - **Flash toggle** — Auto / On / Off
  - **Flip camera** — Front/rear switch
  - **Timer** — 3s / 10s countdown
  - **Gallery** — Thumbnail of last photo → opens system picker
  - **Stock images** — Curated library of fitness-oriented stock photos
  - **Preset backgrounds** — Gradient/pattern backgrounds (the existing 12 gradient presets)
  - **Capture button** — Large circular shutter at bottom centre
- **Activity pill:** Top-left shows the currently selected activity name; tap to switch activities (existing modal)
- **Settings / Profile:** Edge-swipe or double-tap top-right to access

### 4.2 Post-Capture Flow

1. Photo captured → subtle shutter animation
2. Lens Carousel auto-opens from the bottom (spring-animated)
3. First lens (Recently Used or Trending) applies immediately
4. Floating toolbar fades in on the right side
5. User is now in the **Editor** — no screen transition

### 4.3 Image Sources

All sources converge to the same editor experience:

| Source | Entry |
|---|---|
| **Camera capture** | Primary — instant capture |
| **Gallery** | Bottom bar icon → system picker |
| **Stock images** | Bottom bar icon → in-app stock browser |
| **Preset backgrounds** | Bottom bar icon → gradient/pattern selector (existing 12 presets) |
| **Activity photo** | Auto-suggested from activity date (±1 day) when available |

---

## 5. Lenses (Replaces Templates)

Templates are no longer static cards in a grid. They are **Lenses** — interactive, live-preview overlays inspired by Snapchat's Lens Carousel.

### 5.1 Lens Carousel

```
┌──────────────────────────────────────────┐
│  Canvas with live lens preview           │
│                                          │
│                                          │
│         ← Lens 1 │ Lens 2 │ Lens 3 →    │
│                   ⬤⬤⬤⬤⬤                 │
│  Categories: [Recently Used] [Favorites] │
│              [Trending] [Running] ...     │
└──────────────────────────────────────────┘
```

- **Horizontal scrolling carousel** at the bottom of the screen
- **Live preview** — swiping between lenses updates the canvas in real time (no tap-to-confirm)
- **Snap-to behavior** with spring animation
- **Category chips** above the carousel:
  - Recently Used / Favorites / Trending
  - Distance / Pace / Time / Elevation (metric-specific lenses)
  - Heart Rate / Cycling / Running / Swimming / Hiking / Gym (activity-specific)
  - Custom (user-saved)
- Each Lens is a **full design preset** (layout + colors + typography + stat bindings), not a fixed sticker

### 5.2 Lens Thumbnail

Each lens card in the carousel renders a **live mini-preview** with the user's actual activity data, not a generic mockup. Cards are:
- Rounded rectangles, ~72px tall
- Show a representative stat + the lens name
- Currently selected lens has a highlighted border (accent color)

### 5.3 Lens Categories

| Category | Description | Examples |
|---|---|---|
| **Trending** | Most-used lenses across the community | |
| **Recently Used** | Last 10 lenses the user applied | |
| **Favorites** | User-bookmarked lenses | |
| **Distance** | Lenses focused on distance display | Long Run, Sprint, Ultra |
| **Pace** | Pace-centric designs | Tempo, Interval, Goal Pace |
| **Time** | Duration-focused | Elapsed, Moving Time, Split |
| **Elevation** | Elevation-focused | Hill Climb, Mountain, Grade |
| **Heart Rate** | HR-focused | Zone, Max HR, Recovery |
| **Cycling** | Cycling-specific layouts | Power, Speed, Cadence |
| **Running** | Running-specific layouts | Stride, Cadence, Form |
| **Swimming** | Swimming-specific layouts | Laps, SWOLF, Stroke |
| **Hiking** | Hiking-specific layouts | Ascent, Trail, Duration |
| **Gym** | Gym/workout layouts | Reps, Volume, Intensity |
| **Custom** | User-modified and saved | |

### 5.4 Lens as Design Preset

Each Lens encapsulates:

```
Lens {
  id: string
  name: string
  category: string
  thumbnail: () => ReactNode    // Live preview render
  canvas: {
    layers: LensLayer[]          // Pre-configured stat layers
    palette: PaletteId           // Color scheme
    font: FontConfig             // Font family, weight, style
    background: LensBackground   // Optional background style
  }
}
```

A `LensLayer` binds a specific Strava metric to a visual element:

```
LensLayer {
  type: 'stat' | 'label' | 'decoration' | 'chart'
  metric: StravaMetric           // What data to display
  style: TextStyle               // Font, color, size, alignment
  geometry: { x, y, w, h, rotation, scale }
  effects: { shadow, blur, border, opacity }
}
```

The first 49 existing templates are converted to Lenses, organized by their current categories.

---

## 6. Strava Metric System (Expanded)

Every text field on the canvas is **dynamically bound** to an activity statistic. Users can swap any text element between available metrics.

### 6.1 Smart Stats Picker

When the user taps a stat element (or chooses "Stats" from the toolbar), a contextual bottom sheet opens with grouped metrics:

```
┌──────────────────────────────────────┐
│  🔍 Search metrics...                │
│                                      │
│  RUNNING                             │
│  ○ Distance       12.4 km ◁ preview  │
│  ○ Pace           5:32 /km ◁ preview │
│  ○ Moving Time    1h 23m ◁ preview   │
│  ○ Elapsed Time   1h 45m ◁ preview   │
│  ○ Splits         5:18 avg ◁ preview │
│                                      │
│  PERFORMANCE                         │
│  ○ Avg Heart Rate  152 bpm           │
│  ○ Max Heart Rate  178 bpm           │
│  ○ Power           245 W             │
│  ○ Cadence         82 rpm            │
│  ○ Calories        1,240 kcal        │
│                                      │
│  ELEVATION                           │
│  ○ Elevation Gain   342 m            │
│  ○ Max Elevation    1,245 m          │
│  ○ Average Grade    4.2%             │
│                                      │
│  RIDE METRICS                        │
│  ○ Speed         28.6 km/h           │
│  ○ Max Speed     52.3 km/h           │
│  ○ Average Speed 24.1 km/h           │
│                                      │
│  ACHIEVEMENTS                        │
│  ○ PR            10K ✓               │
│  ○ Achievement Count  3              │
│  ○ Segment Results  2/3              │
└──────────────────────────────────────┘
```

- **Search bar** at top for quick filtering
- **Grouped sections** matching the activity type
- **Live preview** — tapping a metric briefly shows it on the canvas before confirming
- **"◁ preview"** indicator means hovering/selecting shows a live canvas preview
- Metrics not available for the current activity are visually dimmed with a reason

### 6.2 Metric Mapping

Users can freely re-map any text element:

```
Current:  Distance  →  12.4 km
Change to: Pace     →  5:32 /km
                   ↓
Canvas updates instantly, font size auto-adjusts if needed.
```

---

## 7. Floating Editing Toolbar

Replaces the traditional bottom editing controls with a Snapchat-inspired vertical floating toolbar.

### 7.1 Default State (Nothing Selected)

```
┌───────────────────────┐
│       ┌─────┐         │
│       │  ◑  │  Edit   │  ← Tool icon only
│       │     │  Lens   │     (label on long-press)
│       ├─────┤         │
│       │  ≡  │  Stats  │
│       ├─────┤         │
│       │  A  │  Font   │
│       ├─────┤         │
│       │  ◉  │  Colors │
│       ├─────┤         │
│       │  ☰  │  Layers │
│       │     │         │
│       ├─────┤         │
│       │  ⊞  │  More   │  ← Expandable sub-menu
│       └─────┘         │
└───────────────────────┘
```

- **Position:** Right side, vertically centred, ~8px from edge
- **Size:** Each button is 42×42px with translucent background
- **Visibility:** Always visible but low-opacity until interaction
- **Order (top to bottom):** Edit Lens, Stats, Font, Colors, Theme, More

### 7.2 Expanded State (Element Selected)

When a layer/element is selected, the toolbar expands:

```
┌───────────────────────┐
│       ┌─────┐         │
│       │  ◑  │  Edit   │
│       ├─────┤         │
│       │  ≡  │  Stats  │
│       ├─────┤         │
│       │  A  │  Font   │
│       ├─────┤         │
│       │  ◉  │  Colors │
│       ├─────┤         │
│       │  ☰  │  Layers │
│       ├─────┤         │
│       │  ⊞  │  ...    │  ← Tap to reveal more
│       └─────┘         │
│  ───────────────       │
│  Additional controls   │  ← Context-aware section
│  ┌───┐ ┌───┐ ┌───┐    │     appears below main rail
│  │▪▪▪│ │▤▤▤│ │▢▢▢│    │
│  │Dup│ │Lock│ │Del│    │
│  └───┘ └───┘ └───┘    │
│  ┌───┐ ┌───┐ ┌───┐    │
│  │☰☰│ │◐◐│ │☁☁│    │
│  │Fwd│ │Bwd│ │Sdw│    │
│  └───┘ └───┘ └───┘    │
└───────────────────────┘
```

**Additional controls revealed on expand:**
- **Duplicate** — Clone the selected layer
- **Lock** — Lock position/editing
- **Opacity** — Slider (0–100%)
- **Shadow** — Toggle
- **Blur** — Toggle
- **Effects** — Visual effects sub-menu
- **Alignment** — Left/Centre/Right text alignment
- **Undo** / **Redo**
- **Delete** — Red, with confirmation haptic

### 7.3 Toolbar Behavior

| State | Behavior |
|---|---|
| Nothing selected | Core tools visible (Edit Lens, Stats, Font, Colors, Theme, More) |
| Stat layer selected | Core + per-element controls (Duplicate, Lock, Opacity, Delete, alignment) |
| Decoration selected | Core + Duplicate, Lock, Opacity, Delete |
| Text layer selected | Core + alignment, font variant, Duplicate, Lock, Delete |
| Multi-select (future) | Group actions visible |

Each toolbar tap opens the **contextual bottom sheet** — never navigates away.

---

## 8. Contextual Bottom Sheet

Replaces modal screens for all editing actions. The sheet slides up from the bottom, keeping the user in the editor.

### 8.1 Sheet Behavior

```
┌──────────────────────────────────┐
│  ─── (drag handle)              │
│                                  │
│  [Section Title]                 │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Sheet content (scrollable)│  │
│  │  - Changes preview on       │  │
│  │    the canvas in REAL TIME │  │
│  │                             │  │
│  └────────────────────────────┘  │
│                                  │
│  No Apply button — always live   │
└──────────────────────────────────┘
```

### 8.2 Sheet Contexts

| Trigger | Sheet Content |
|---|---|
| **Edit Lens** | Lens browser + categories (full carousel alternative) |
| **Stats** | Smart Stats Picker (grouped metrics with live preview) |
| **Font** | Font Family + Weight + Style + Size + Alignment pickers |
| **Colors** | Color palette selector (presets + custom) + gradients |
| **Theme** | Quick Style Presets (Minimal, Neon, Marathon, etc.) |
| **Layers** | Layer list with reorder, visibility toggles, delete |
| **Effects** | Shadow, Blur, Border, Corner Radius, Opacity sliders |
| **Background** | Photo/Gradient/Color background picker |

### 8.3 Sheet Design

- **Drag handle** at top for swipe-dismiss
- **Background:** `rgba(10,10,11,0.98)` with backdrop blur
- **Corners:** 22px top radius
- **Animation:** Spring with damping, 220ms
- **Keyboard-aware:** Sheet adjusts when text input is active
- **Max height:** 54% of screen (or full-height for complex pickers)

---

## 9. Lens Customization (All Properties)

Every Lens remains fully editable. The following properties are available through the toolbar and sheet system:

### 9.1 Typography

| Property | Control |
|---|---|
| **Font Family** | System fonts + custom (Barlow Condensed, Barlow, Inter, etc.) |
| **Font Weight** | 100–900 slider or preset pills |
| **Font Style** | Normal / Italic |
| **Font Size** | Slider (8–120px) with live preview |
| **Text Alignment** | Left / Centre / Right |
| **Letter Spacing** | Slider (tracking control) |
| **Line Height** | Slider |
| **Text Transform** | None / Uppercase / Lowercase / Capitalize |

### 9.2 Color & Fill

| Property | Control |
|---|---|
| **Text Color** | Solid / Gradient picker from palette |
| **Background Color** | Solid / Gradient / None |
| **Accent Color** | Palette override per element |
| **Gradient Direction** | Horizontal / Vertical / Diagonal / Radial |

### 9.3 Graphic Properties

| Property | Control | Default |
|---|---|---|
| **Opacity** | Slider (0–100%) | 100% |
| **Shadow** | Toggle + offset/blur/color | Off |
| **Blur** | Toggle + intensity slider | Off |
| **Border** | Toggle + width/color | Off |
| **Corner Radius** | Slider (0–40px) | 0 |
| **Rotation** | Gesture (two-finger twist) + slider | 0° |
| **Position** | Gesture (drag) + coordinates | Auto |
| **Scale** | Gesture (pinch) + slider | 1.0 |
| **Spacing** | Padding slider (inner margin) | 8px |

### 9.4 Metric Binding

| Property | Control |
|---|---|
| **Bound Metric** | Stats Picker (tap to reassign) |
| **Format** | Full / Short / Label-only / Value-only |
| **Unit Display** | Show / Hide / Auto |
| **Decimal Places** | 0 / 1 / 2 / Auto |
| **Prefix/Suffix** | Custom text before/after value |

### 9.5 Metric Re-mapping Examples

```
Distance   → Pace          (auto-format to mm:ss /km)
Pace       → Heart Rate    (auto-format to bpm)
Elevation  → Calories      (auto-format to kcal)
Moving Time → Average Speed (auto-format to km/h)
Power      → Cadence       (auto-format to rpm)
Distance   → Elevation     (auto-format to m)
Any → PR / Achievement / Segment Results
```

Every field is dynamically bound. Changing the activity or selected metric instantly propagates to all layers referencing that binding.

---

## 10. Live Editing Experience

There is no "Apply" button. The canvas is always live.

### 10.1 Real-Time Updates

| Action | Visual Feedback |
|---|---|
| Switch Lens | Canvas cross-fades to new design (150ms) |
| Change metric | Text morphs to new value + format (100ms) |
| Change font | All text in selected layer re-renders instantly |
| Change color | Accent colors update across design (200ms) |
| Change palette | All elements update with transition |
| Adjust opacity | Layer fades in real time as slider moves |
| Toggle shadow/blur | Effect applies immediately with animation |
| Drag layer | Layer follows finger, snap guides appear |
| Pinch/resize | Layer scales continuously |
| Delete layer | Layer scale-down + fade-out animation (200ms) |

### 10.2 Performance Target

| Operation | Target |
|---|---|
| Lens switch | < 150ms |
| Metric swap | < 100ms |
| Font change | < 50ms |
| Color change | < 50ms |
| Gesture response | 60fps (16ms frame budget) |
| Canvas snapshot (export) | < 2s |
| Undo/Redo restore | < 100ms |

---

## 11. Gesture Controls

| Gesture | Action |
|---|---|
| **Pinch** | Resize selected layer |
| **Two-finger rotate** | Rotate selected layer |
| **Drag** | Move selected layer |
| **Long-press** | Duplicate layer with spring animation |
| **Swipe down (canvas)** | Dismiss editor → Home |
| **Swipe down (layer)** | Trigger delete zone (red zone at bottom) |
| **Double tap (layer)** | Enter text edit mode |
| **Tap outside** | Deselect all layers |
| **Tap (empty canvas)** | Show/hide toolbar |
| **Edge swipe (left)** | Back to camera |
| **Edge swipe (right)** | Open activity switcher |

### 11.1 Gesture Feedback

| Gesture | Haptic |
|---|---|
| Lens switch | Light impact |
| Snap alignment | Light impact |
| Apply style preset | Medium impact |
| Select metric | Light impact |
| Delete layer | Warning-style haptic |
| Export/save | Success haptic (notification) |
| Layer snap to guide | Light tick haptic |

---

## 12. Quick Style Presets

One-tap visual style overrides that transform the current Lens without changing the layout.

| Preset | Description |
|---|---|
| **Minimal** | Clean, white, maximum whitespace, thin fonts |
| **Neon** | Vibrant neon colors, glow effects, bold type |
| **Marathon** | High-contrast, race-day theme, bib-inspired |
| **Trail** | Earth tones, rugged textures, organic shapes |
| **Premium** | Metallic accents, serif fonts, elegant spacing |
| **Dark** | Pure black background, white text, high contrast |
| **White** | Clean white background, dark text |
| **Gradient** | Full-bleed gradient backgrounds, white text |
| **Glass** | Frosted glass effect on cards, blurred backdrop |
| **Bold** | Heavy typography, solid color blocks, big numbers |

Each preset is a combination of:
- Color palette override
- Font family + weight preset
- Background treatment
- Effect toggles (shadow, blur, border)
- Opacity defaults

Tapping a preset applies it instantly with a 200ms cross-fade.

---

## 13. AI & Smart Features

### 13.1 AI Auto Layout

When a photo is imported, the system automatically:
1. **Analyzes the image** for faces, text, and key subjects (using on-device ML)
2. **Positions stat elements** in areas without important content (open sky, road, grass, walls)
3. **Avoids faces** — stat layers are placed around, not over, people's faces
4. **Adapts to image composition** — rule-of-thirds-aware placement
5. **Falls back** to default layout if analysis fails or is slow

### 13.2 Smart Color Extraction

1. Analyzes the imported photo for dominant colors
2. Generates a **harmonious 5-color palette** matching the image
3. Shows extracted palette as the first option in the color picker
4. Updates Lens colors to match if "Auto Color" is enabled
5. Supports light and dark variants of extracted palettes

### 13.3 Smart Suggestions

- When importing a photo, suggests the most visually compatible Lenses first
- When switching activities, preserves the current Lens but updates data
- Suggests font/color combinations that have worked well for similar photos

---

## 14. Live Story Preview

Before exporting, users can preview how the design will appear on different social platforms:

```
┌──────────────────────────────┐
│  📱 Live Story Preview       │
│                              │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  IG  │ │ IG  │ │ FB  │   │  ← Platform pills
│  │Story │ │Post │ │Story│   │
│  └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  WA  │ │Threads│ │TW/X │ │
│  │Status│ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘   │
│                              │
│  [Current design rendered    │
│   at platform aspect ratio]  │
│                              │
│         Share  │  Save       │
└──────────────────────────────┘
```

- One-tap preview of the design at each platform's native aspect ratio
- Shows crop boundaries, safe zones, and text cutoff areas
- Cached render (no re-export for each platform)
- Accessible from a "Preview" button in the top bar

---

## 15. Export Flow

### 15.1 Export Options

| Action | Trigger | Result |
|---|---|---|
| **Save to Camera Roll** | Top-right "Save" button | PNG saved, success toast |
| **Share** | Share icon | Native system share sheet |
| **Story Preview** | "Preview" button | Platform preview sheet |
| **Copy** | Hidden shortcut (long-press) | PNG to clipboard (web) |

### 15.2 Export states

| State | Visual |
|---|---|
| **Idle** | Show "Save" / "Share" buttons in top bar |
| **Exporting** | Spinner overlay on canvas, "Rendering..." text |
| **Success** | Checkmark animation, haptic, toast "Saved to camera roll" |
| **Error** | Red toast with error message, retry button |
| **Permission denied** | Explanation toast + settings deep-link |

---

## 16. Suggested Visual Language

### 16.1 Editor Color Palette

| Token | Value | Usage |
|---|---|---|
| `editor-bg` | `#000000` | Full-screen camera/editor background |
| `editor-surface` | `#0A0A0B` | Bottom sheet background |
| `editor-rail-bg` | `rgba(0,0,0,0.55)` | Floating toolbar background |
| `editor-btn-bg` | `rgba(255,255,255,0.08)` | Toolbar button inactive |
| `editor-btn-active` | `#FF6B35` | Active button / accent |
| `editor-btn-danger` | `#FF453A` | Delete actions |
| `editor-text` | `#FFFFFF` | Primary text |
| `editor-text-dim` | `rgba(255,255,255,0.45)` | Secondary labels |
| `editor-border` | `rgba(255,255,255,0.12)` | Card / sheet borders |
| `editor-overlay` | `rgba(0,0,0,0.6)` | Backdrop overlay |

### 16.2 Typography (Editor)

| Role | Font | Weight | Size |
|---|---|---|---|
| Lens name | Barlow Condensed | 700 | 10px |
| Toolbar label | Barlow | 600 | 9px |
| Sheet title | Barlow | 800 | 14px |
| Sheet body | Barlow | 500 | 13px |
| Stat label | Barlow | 700 | 9px (tracked) |
| Stat value | Barlow Condensed | 700 | 28px |

### 16.3 Animation Tokens

| Token | Value |
|---|---|
| Lens switch | 150ms ease-out |
| Sheet open | 220ms spring (damping 20) |
| Toolbar fade | 200ms ease-out |
| Gesture response | 100ms / 60fps |
| Export render | < 2s (view-shot) |
| Delete layer | 200ms scale-down + fade |

---

## 17. State Coverage

| State | Implementation |
|---|---|
| **Camera loading** | Permissions request flow (camera/gallery) |
| **Camera denied** | Explanation toast + settings link + Gallery-only fallback |
| **Photo captured** | Shutter animation → auto-open Lens carousel (300ms delay) |
| **No activity selected** | Show default empty state lens ("Connect Strava to see stats") |
| **No Strava data** | Edit is still possible — text layers with manual input fallback |
| **Exporting** | Canvas freeze, spinner overlay, "Rendering..." |
| **Export success** | Checkmark toast + haptic |
| **Export error** | Error toast + retry |
| **Gallery loading** | Skeleton grid matching final layout |
| **Gallery empty** | Contextual illustration + "Take a photo instead" CTA |
| **Gallery error** | Error message + retry |
| **Lens loading** | Carousel shows skeleton cards |
| **No lenses** | "Create your first custom lens" prompt |
| **AI analysis in progress** | Subtle processing indicator on photo |
| **AI analysis fails** | Fallback to default layout (no error shown to user) |
| **Undo empty** | Undo button disabled (opacity 0.25) |
| **Redo empty** | Redo button disabled |
| **Keyboard open** | Bottom sheet adjusts, canvas scrolls up |

---

## 18. Comparison: v1 Editor vs v2 Editor

| Aspect | v1 (Current) | v2 (Proposed) |
|---|---|---|
| **Entry point** | Activity feed → Editor link | Full-screen camera |
| **First action** | Pick a template | Capture or import a photo |
| **Templates** | Grid of static cards in a bottom sheet | Lens Carousel with live preview |
| **Toolbar** | Horizontal row at bottom | Floating vertical rail on right |
| **Editing** | Tap tools in top bar | Tap toolbar → contextual bottom sheet |
| **Apply button** | Implicit via tool buttons | Never — all changes are instant |
| **Stat picker** | Choose from sticker list | Smart Stats Picker with grouped/searchable metrics |
| **Metric binding** | Fixed per sticker design | Fully dynamic — swap any metric |
| **Photo filters** | Horizontal carousel strip | Optional — Lens handles visual treatment |
| **Gestures** | Drag + pinch + rotate | Full gesture set + long-press dup + swipe delete |
| **AI features** | None | Auto Layout + Smart Color Extraction + Suggestions |
| **Style presets** | None | 10 one-tap presets (Minimal, Neon, etc.) |
| **Export** | Save + Share | Save + Share + Live Story Preview |
| **Creation time** | 60–120 seconds | < 30 seconds |

---

## 19. Files to Update / Create

### New Files
| File | Purpose |
|---|---|
| `components/editor/CameraScreen.tsx` | Full-screen camera viewfinder with controls |
| `components/editor/LensCarousel.tsx` | Horizontal scrolling lens carousel with live preview |
| `components/editor/FloatingToolbar.tsx` | Vertical floating toolbar on the right edge |
| `components/editor/StatsPicker.tsx` | Grouped, searchable stats picker bottom sheet |
| `components/editor/ContextualSheet.tsx` | Reusable contextual bottom sheet component |
| `components/editor/QuickStyles.tsx` | One-tap style preset chips |
| `components/editor/StoryPreview.tsx` | Multi-platform export preview sheet |
| `components/editor/AIAutoLayout.tsx` | On-device image analysis + smart placement |
| `components/editor/SmartColorExtraction.tsx` | Dominant color extraction from photos |
| `components/editor/ColorPicker.tsx` | Full color + gradient picker |
| `components/editor/FontPicker.tsx` | Font family + weight + style picker |
| `components/editor/EffectsPanel.tsx` | Shadow, blur, border, radius controls |
| `lib/lenses/types.ts` | Lens type definitions |
| `lib/lenses/registry.ts` | Lens registry (converted from stickers) |
| `lib/lenses/lens-categories.ts` | Lens category definitions (Recently Used, Trending, etc.) |
| `lib/lenses/metrics.ts` | Metric definitions with groups, formats, and units |
| `hooks/use-camera.ts` | Camera state management hook |

### Modified Files
| File | Change |
|---|---|
| `app/editor.tsx` | Full rewrite — camera-first layout, lens carousel, floating toolbar |
| `lib/canvas-state.tsx` | Add Lens type, metric binding, dynamic data layers |
| `lib/stickers/registry.ts` | Extend to support Lens metadata and metric bindings |
| `lib/stickers/types.ts` | Add `StravaMetric` type, `LensDef`, binding types |

### Unchanged Files
All other screens and flows (auth, home, profile, settings, templates gallery) remain as-is.

---

*Last updated: 2026-07-27 · Version 2.0 · Status: Design Concept*
