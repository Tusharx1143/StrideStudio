# StrideStudio — Product Requirements Document (PRD)

> **Tagline:** Training is an art. Artists need tools.
>
> **Elevator Pitch:** StrideStudio transforms your Strava workouts into beautiful, shareable visual stories — a camera-first, Snapchat-inspired experience for athletes. Point, shoot, swipe a Lens, share. Create stunning data-driven workout stories in under 30 seconds.
>
> > **v2 Design Direction:** See [`design-concept.md`](./design-concept.md) for the full updated UI/UX concept — camera-first editor, Lens carousel (replaces template grid), floating toolbar, contextual bottom sheets, and live WYSIWYG editing with real-time metric binding.

---

## 1. Product Overview

### 1.1 Problem Statement

Athletes and fitness enthusiasts track their workouts on Strava, but sharing those achievements is limited to basic screenshots, generic stats summaries, or the default Strava share card. There's no easy way to turn workout data into visually compelling, personalized social content that reflects an athlete's personal brand and effort.

### 1.2 Solution

StrideStudio bridges the gap between raw fitness data and beautiful visual storytelling. By connecting to Strava, users can:

- Open directly into a **full-screen camera** — capture or import an image instantly
- Apply **Lenses** (interactive live-preview overlays) that render activity stats artistically
- Swipe through a **Snapchat-inspired Lens Carousel** with real-time canvas previews
- Layer stats over photos with **instant WYSIWYG editing** — every change updates immediately
- Customize every detail: fonts, colors, metrics, opacity, shadows, blur, border, and more via a **floating vertical toolbar** and contextual bottom sheets
- Export high-quality shareable images to their camera roll, Instagram Stories, and more

### 1.3 Target Audience

| Persona | Needs |
|---|---|
| **Social Athlete** | Wants to share achievements on Instagram/Stories with style |
| **Training Journaler** | Documents progress with visual consistency |
| **Race/Event Participant** | Memorializes races with professional-looking recaps |
| **Fitness Influencer** | Needs branded, consistent workout content at scale |
| **Casual Runner/Rider** | Wants an easy way to celebrate milestones |

### 1.4 Platform

- **Primary:** iOS & Android via Expo (React Native)
- **Secondary:** Web (PWA-friendly, responsive)
- **Backend:** Node.js + Express + tRPC

---

## 2. Core User Flows

### 2.1 First-Time User Journey

```
Open App → Landing Screen → "Connect with Strava" → Strava OAuth → Profile Screen
    → Activities sync automatically → Browse templates → Create first post → Save/Share
```

1. User lands on Connection Screen with animated brand intro
2. Taps "Connect with Strava" — CTA opens Strava OAuth in browser
3. User authorizes read access to activities and profile
4. Redirected back to Profile Screen with success state
5. Activities automatically fetched and cached
6. User navigates to Home to see activity feed
7. User selects an activity → Editor opens → picks photo → picks template → customizes → saves

### 2.2 Returning User Journey

```
Open App → Home Screen (activity feed with latest workouts)
    → Select activity → Editor (photo + template + customize) → Share/Save
    OR
    → Browse Templates Gallery → Preview with data → Copy as PNG
    OR
    → Profile → Check weekly progress, achievements, stats
```

### 2.3 Content Creation Flow (Detailed)

```
Editor Screen
├── 1. Select Activity (via ActivityPickerModal)
│   └── Filter by period: All | Today | Week | Month
├── 2. Choose Background Media
│   ├── Pick from camera roll (photo or video)
│   └── Smart suggestions from activity date (±1 day)
├── 3. Apply Photo Filter (carousel strip, if photo)
│   └── Default: Vibrant (no filter applied visual)
├── 4. Choose Aspect Ratio
│   └── 9:16 (Story) | 4:5 (Post) | 16:9 (Landscape)
├── 5. Add Template Layers
│   ├── Activity tab: per-activity stats templates
│   └── Totals tab: aggregated week stats templates
├── 6. Customize Layers
│   ├── Drag to reposition
│   ├── Drag to delete zone to remove
│   ├── Style panel: font, color, size
│   └── Layer ordering (bring forward / send backward)
├── 7. Undo/Redo
├── 8. Share (system share sheet on mobile)
└── 9. Save Post → camera roll
```

---

## 3. Feature Specifications

### 3.1 Authentication & User Identity

| Feature | Priority | Status |
|---|---|---|
| JWT-based session cookies | P0 | ✅ Implemented |
| User persistence in MySQL via Drizzle ORM | P0 | ✅ Implemented |
| Session verification via Clerk SDK | P0 | ✅ Implemented |
| Logout (clear cookie + session) | P1 | ✅ Implemented |

**Technical Notes:**
- Session stored as `app_session_id` cookie
- User identity resolved from JWT via `sdk.verifySession()`
- Falls back to `"default"` user when no session is present (dev mode)
- User table: `openId`, `name`, `email`, `loginMethod`, `role`, `lastSignedIn`

### 3.2 Strava Integration

| Feature | Priority | Status |
|---|---|---|
| OAuth 2.0 authorization flow | P0 | ✅ Implemented |
| Token exchange & secure storage | P0 | ✅ Implemented |
| Automatic token refresh (5-min buffer) | P0 | ✅ Implemented |
| Activity fetching (paginated, 30/page) | P0 | ✅ Implemented |
| Athlete profile data | P0 | ✅ Implemented |
| Strava disconnect | P1 | ✅ Implemented |
| Athlete stats (yearly totals) | P2 | ✅ Implemented |
| DB-backed token store (MySQL) | P1 | ✅ Implemented |
| In-memory token fallback | P1 | ✅ Implemented |
| Deauthorization callback | P3 | 🔜 Planned |

**Requested Scopes:** `read`, `activity:read_all`, `profile:read_all`

**Activity Data Fields:**
- Core: `id`, `name`, `type` (run/ride/workout), `start_date`, `distance`, `moving_time`
- Extended: `elevation`, `heart_rate`, `calories`, `speed`, `pace`, `map_polyline`, `device`

### 3.3 Home Screen (Activity Feed)

| Feature | Priority | Status |
|---|---|---|
| Hero header with greeting + avatar | P1 | ✅ Implemented |
| Weekly progress ring (SVG circular) | P1 | ✅ Implemented |
| Quick stats row (horizontal pills) | P2 | ✅ Implemented |
| Period filter pills (All/Today/Week/Month) | P1 | ✅ Implemented |
| Activity feed cards with animated SVG figures | P1 | ✅ Implemented |
| Pull-to-refresh | P1 | ✅ Implemented |
| Empty state (connect Strava prompt) | P1 | ✅ Implemented |
| Error state with retry | P1 | ✅ Implemented |
| Skeleton loading state | P2 | ✅ Implemented |
| Tap activity → Editor | P0 | ✅ Implemented |
| Tap activity → Detail view | P2 | ✅ Implemented |

### 3.4 Photo Editor

| Feature | Priority | Status |
|---|---|---|
| Media picker (photo + video) | P0 | ✅ Implemented |
| Video background with loop | P2 | ✅ Implemented |
| Instagram-style photo filter carousel | P1 | ✅ Implemented |
| Aspect ratio selector (9:16, 4:5, 16:9) | P1 | ✅ Implemented |
| Template layers (drag, resize, reorder) | P0 | ✅ Implemented |
| Floating style toolbar (style/back/forward/delete) | P1 | ✅ Implemented |
| Inline layer style panel (font, color, size) | P1 | ✅ Implemented |
| Drag-to-delete zone | P2 | ✅ Implemented |
| Undo/Redo | P1 | ✅ Implemented |
| Smart photo suggestions (by activity date) | P2 | ✅ Implemented |
| Save to camera roll (via view-shot) | P0 | ✅ Implemented |
| Share (system share sheet) | P1 | ✅ Implemented |
| Copy to clipboard (web) | P2 | ✅ Implemented |
| Animated toast notifications | P2 | ✅ Implemented |
| Empty canvas state with invite to add media | P1 | ✅ Implemented |
| Loading/error states with helpful messages | P1 | ✅ Implemented |

### 3.5 Template System

| Feature | Priority | Status |
|---|---|---|
| 49 adaptive design templates | P0 | ✅ Implemented |
| Template categories: Activity & Totals tabs | P0 | ✅ Implemented |
| Live in-editor preview (scaled) | P1 | ✅ Implemented |
| Horizontal snap-scroll template strip | P1 | ✅ Implemented |
| Template renders adapt to activity data | P0 | ✅ Implemented |
| Color override support (for photo overlays) | P1 | ✅ Implemented |
| Template gallery: browse all, search, sort | P1 | ✅ Implemented |
| Long-press to download template PNG | P2 | ✅ Implemented |
| Full-width + half-width card layout options | P2 | ✅ Implemented |
| Error boundaries around each render | P1 | ✅ Implemented |

**Template Categories:**
| Category | File | Tab | Count | Description |
|---|---|---|---|---|
| Adaptive Core | `adaptive-core.tsx` | Activity | 10 | Dynamic stat layouts adapting to available fields |
| Fancy | `fancy.tsx` | Activity | 4 | Decorative, visually rich designs |
| Ideas | `ideas.tsx` | Activity | 4 | Experimental layouts |
| Big Stats | `big-stats.tsx` | Activity | 5 | Large bold typography stat displays |
| Combos | `combos.tsx` | Activity | 3 | Multi-stat combination layouts |
| Layouts | `layouts.tsx` | Activity | 4 | Structural layout variations |
| Style | `style.tsx` | Activity | 4 | Typography & color-focused designs |
| Extras | `extras.tsx` | Activity | 10 | Specialty and niche designs |
| Totals | `totals.tsx` | Totals | 5 | Weekly summary aggregated tables |
| **Total** | | | **49** | |

### 3.6 Profile Screen

| Feature | Priority | Status |
|---|---|---|
| Athlete profile (photo, name, location) | P0 | ✅ Implemented |
| Weekly goal progress ring (40km default) | P1 | ✅ Implemented |
| Sport breakdown bar (run/ride/workout) | P2 | ✅ Implemented |
| Stats summary (activities, distance, posts) | P1 | ✅ Implemented |
| Personal records / achievements | P2 | ✅ Implemented |
| Strava connect/disconnect management | P0 | ✅ Implemented |
| Notifications toggle | P2 | ✅ Implemented |
| Settings shortcut → full settings | P1 | ✅ Implemented |
| Pull-to-refresh from Strava | P1 | ✅ Implemented |

### 3.7 Settings Screen

| Feature | Priority | Status |
|---|---|---|
| Dark mode toggle (OLED-friendly dark) | P1 | ✅ Implemented |
| Push notification preferences | P2 | ✅ Implemented |
| Auto-share toggle | P3 | ✅ Implemented |
| Connected services management | P1 | ✅ Implemented |
| Cache clearing | P2 | ✅ Implemented |
| Privacy policy placeholder | P3 | ✅ Implemented |
| About: version, support contact | P2 | ✅ Implemented |
| Logout with confirmation | P1 | ✅ Implemented |

### 3.8 Templates Gallery

| Feature | Priority | Status |
|---|---|---|
| Grid layout (2-column, full-width support) | P1 | ✅ Implemented |
| Category filter (All/Activity/Totals) | P1 | ✅ Implemented |
| Search (debounced, name + description) | P2 | ✅ Implemented |
| Sort (default, A-Z, Z-A) | P2 | ✅ Implemented |
| Live preview with user's activity data | P1 | ✅ Implemented |
| Tap → navigate to editor | P1 | ✅ Implemented |
| Long-press → download as PNG | P2 | ✅ Implemented |
| Loading skeleton (6 cards) | P2 | ✅ Implemented |
| Empty state (connect Strava prompt) | P1 | ✅ Implemented |

---

## 4. Design System

### 4.1 Visual Identity

| Property | Value |
|---|---|
| **Style** | Vibrant & Block-based, energetic, high contrast |
| **Primary Color** | Energy Orange `#F97316` |
| **Display Font** | Barlow Condensed (headings, stats, brand) |
| **Body Font** | Barlow (labels, descriptions, UI text) |
| **Spacing** | 8px grid system |
| **Border Radius** | Rounded (8-16px cards, pill buttons) |

### 4.2 Color Tokens

| Token | Light Mode | Dark Mode |
|---|---|---|
| `primary` | `#F97316` | `#F97316` |
| `background` | `#F8FAFC` (slate-50) | `#0F172A` (slate-900) |
| `surface` | `#FFFFFF` | `#1E293B` (slate-800) |
| `foreground` | `#0F172A` | `#F8FAFC` |
| `muted` | `#64748B` | `#64748B` |
| `border` | `#E2E8F0` | `#334155` |
| `success` | `#16A34A` | `#4ADE80` |
| `warning` | `#D97706` | `#FBBF24` |
| `error` | `#DC2626` | `#F87171` |

### 4.3 Editor Theme (Separate Design System)

The editor uses its own visual identity distinct from the main app:

| Token | Value |
|---|---|
| `primary` | Violet `#8B5CF6` |
| `background` | OLED Black `#0A0A0A` |
| `surface` | Dark Gray `#171717` |
| `foreground` | White `#FFFFFF` |
| `canvas-empty` | Nested dark pattern |

### 4.4 Typography Scale

| Token | Size | Usage |
|---|---|---|
| `hero` | 48px / 900 | Landing page brand |
| `h1` | 32px / 700 | Screen titles |
| `h2` | 24px / 700 | Section headers |
| `h3` | 20px / 600 | Card titles |
| `body` | 16px / 400 | Body text |
| `bodySmall` | 14px / 400 | List items |
| `caption` | 12px / 500 | Labels, help text |
| `micro` | 10px / 600 | Badges, micro-copy |
| `stat` | 28px / 700 | Big numbers |
| `statLabel` | 12px / 500 | Stat labels (uppercase) |

### 4.5 Animation Principles

- **Entrance:** FadeInDown/FadeInUp with springify damping for content reveal
- **Transitions:** 150-350ms animated transitions between states
- **Feedback:** Haptics on tap (light impact), on success (notification), on error (none)
- **Motion:** Reanimated for gesture-based interactions (layer dragging)

---

## 5. Technical Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   EXPO CLIENT                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Expo Router │  │ React Context│  │ React     │  │
│  │ (Navigation)│  │ (App State)  │  │ Query     │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │  tRPC Client → HTTP → Express Backend         │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Native Modules: Reanimated, SVG, Gesture,   │   │
│  │  ViewShot, ImagePicker, MediaLibrary,        │   │
│  │  Video, Audio, Haptics, Notifications        │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                     │
│  ┌────────────┐  ┌───────────┐  ┌──────────────┐   │
│  │ Strava     │  │ Clerk SDK │  │ tRPC Router  │   │
│  │ OAuth+API  │  │ (Auth)    │  │ (System)     │   │
│  └────────────┘  └───────────┘  └──────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Drizzle ORM → MySQL (PlanetScale/MySQL2)    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Future: LLM integration, image generation,  │   │
│  │  voice transcription                         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Expo SDK 54 + React Native 0.81 | Cross-platform mobile + web |
| **Routing** | Expo Router 6 (file-based) | Navigation and deep linking |
| **Language** | TypeScript 5.9 | Type safety across full stack |
| **Styling** | NativeWind 4 (Tailwind for RN) + StyleSheet | Utility-first + performance |
| **Server** | Express 4 + tRPC 11 | Type-safe API layer |
| **Database** | Drizzle ORM + MySQL (mysql2) | User & token persistence |
| **State** | React Context + React Query 5 | Server state + app state |
| **Animations** | React Native Reanimated 4 | Gesture-driven animations |
| **Auth** | Clerk SDK (JWT session cookies) | User identity |
| **External API** | Strava API v3 (OAuth 2.0) | Activity data source |
| **Icons** | Expo Vector Icons (Ionicons, MaterialIcons) | Icon system |
| **Media** | expo-image-picker, expo-media-library, expo-video | Photo/video handling |
| **Export** | react-native-view-shot | PNG rendering |
| **Haptics** | expo-haptics | Tactile feedback |
| **Notifications** | expo-notifications | Push notifications |
| **Fonts** | expo-font (Barlow Condensed, Barlow) | Typography |

### 5.3 Directory Structure

```
StrideStudio/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout: providers, fonts, theme
│   ├── index.tsx                 # Landing/Connection screen
│   ├── home.tsx                  # Activity feed
│   ├── editor.tsx                # Photo editor + template composer
│   ├── profile-screen.tsx        # Athlete profile + stats
│   ├── settings.tsx              # App preferences
│   ├── templates-gallery.tsx     # Browse all templates
│   ├── activity/[id].tsx         # Activity detail view
│   └── oauth/callback.tsx        # Strava OAuth callback handler
│
├── components/                   # Reusable UI components
│   ├── home/                     # Home screen specific
│   ├── editor/                   # Editor screen specific
│   ├── ui/                       # Generic UI primitives
│   └── *.tsx                     # Shared components
│
├── lib/                          # Business logic & state management
│   ├── _core/                    # Core infrastructure (auth, api, theme)
│   ├── providers/                # Context providers (strava-data, persistent-state)
│   ├── templates/                # Template system (30+ designs)
│   │   ├── activity/             # Per-activity templates
│   │   ├── totals/               # Aggregate totals templates
│   │   └── shared/              # Shared helpers & types
│   ├── app-context.tsx           # Merged app state context
│   ├── canvas-state.tsx          # Editor canvas state machine
│   ├── photo-filters.ts          # Instagram-style filter definitions
│   ├── sport-theme.ts            # Sport-specific color theming
│   └── color-presets.ts          # Template color override system
│
├── server/                       # Backend
│   ├── _core/                    # Core server modules
│   │   ├── index.ts              # Express app bootstrap
│   │   ├── strava.ts             # Strava API client + token management
│   │   ├── strava-oauth.ts       # OAuth route handlers
│   │   ├── trpc.ts               # tRPC router setup
│   │   ├── sdk.ts                # Clerk SDK wrapper
│   │   ├── oauth.ts              # Sign-in/sign-up routes
│   │   └── env.ts                # Environment config
│   ├── db.ts                     # Drizzle database client
│   └── storage.ts                # File/image storage
│
├── constants/                    # App-wide constants
│   ├── theme.ts                  # Theme re-exports
│   ├── editor-theme.ts           # Editor-specific design tokens
│   └── oauth.ts                  # OAuth providers config
│
├── shared/                       # Shared types between client & server
│
├── assets/                       # Static assets (fonts, images)
├── drizzle/                      # Drizzle schema & migrations
├── Design/                       # UI reference screenshots
│   ├── Connection Screen.png
│   ├── Authorization Screen.png
│   ├── Home Screen.png
│   ├── Editor Screen.png
│   └── Profile Screen.png
│
├── theme.config.js               # Design token definitions
├── package.json                  # Dependencies & scripts
└── PRD.md                        # This file
```

### 5.4 Data Flow

```
Strava API
    │
    ▼
ProdStrava Service (server/_core/strava.ts)
    │  OAuth token exchange, refresh, activity fetch
    ▼
Express Routes (server/_core/strava-oauth.ts)
    │  /api/strava/auth, /api/strava/callback, /api/strava/activities
    ▼
tRPC Client (lib/trpc.ts) → React Query
    │  Cached, deduplicated data fetching
    ▼
StravaDataProvider (lib/providers/strava-data.tsx)
    │  Activity[] + Athlete + loading/error/connected states
    ▼
AppContext (lib/app-context.tsx)
    │  Merged data + UI state
    ▼
Screens & Components
    ▶ Activity feed → Editor → Export
```

### 5.5 State Management

| State | Provider | Persistence |
|---|---|---|
| Activities, athlete, connection | `StravaDataProvider` | React Query cache + AsyncStorage |
| Selected activity, template, period | `PersistentStateProvider` | AsyncStorage |
| Editor canvas (layers, photo, filters) | `CanvasProvider` | In-memory (per-editor session) |
| Theme (dark/light) | `ThemeProvider` | In-memory |
| Saved posts count | `PersistentStateProvider` | AsyncStorage |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|---|---|
| First contentful paint (web) | < 2s |
| Activity feed load (cached) | < 500ms |
| Editor canvas render | < 1s |
| PNG export (view-shot) | < 2s |
| Template gallery scroll | 60fps |
| Animated transitions | 60fps |

### 6.2 Accessibility

- Minimum touch target: 44×44px (WCAG 2.1)
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Switch elements have `accessibilityState`
- Color contrast ratios meet WCAG AA (in progress)
- Back buttons positioned outside ScrollView to avoid `aria-hidden` conflicts

### 6.3 Error Handling

- **Network errors:** Retry button with descriptive error message
- **Auth errors:** Redirect to connection screen
- **Token expiry:** Automatic refresh 5 minutes before expiration
- **Template render errors:** Per-template ErrorBoundary — one broken template doesn't crash the gallery
- **Database unavailable:** Graceful fallback to in-memory token store
- **Media permissions:** Clear permission request flow with explanation

### 6.4 States Coverage

Every screen handles these states:

| State | Implementation |
|---|---|
| **Loading** | Skeleton screens matching final layout shape |
| **Empty** | Contextual illustrations + CTA to get started |
| **Error** | Error icon + message + retry button |
| **Success** | Data rendered with entrance animations |
| **Offline** | Cached data shown, stale indicator if applicable |

### 6.5 Testing

| Type | Framework | Count | Status |
|---|---|---|---|
| Unit tests | Vitest | 43+ | ✅ Passing |
| Component tests | — | 0 | 🔜 Planned |
| Integration tests (editor/canvas) | — | 0 | 🔜 Planned |
| Server route tests | — | 0 | 🔜 Planned |
| Template snapshot tests | — | 0 | 🔜 Planned |
| CI/CD pipeline | GitHub Actions | — | 🔜 Planned |

### 6.6 Known Technical Debt

| Issue | Severity | Description |
|---|---|---|
| `as any` type casts | P1 | ~17 instances — needs proper typing |
| Console.log statements | P1 | ~50 log statements in production code |
| AsyncStorage writes | P2 | No debouncing on cache writes |
| Inline animation objects | P2 | `FadeIn`/`FadeInDown` recreated every render |
| React.FC usage | P2 | 77 instances — deprecated pattern |
| Demo device integrations | P3 | Garmin, Apple Health, Fitbit — mock toggles only |
| Onboarding flow | P2 | Designed in `design.md` but not implemented |

### 6.7 Security

- Strava tokens stored server-side, never exposed to client
- JWT session cookies with HttpOnly/Secure/SameSite flags
- Strava OAuth state parameter used for CSRF protection
- User identity verified on every authenticated API call
- No hardcoded secrets — all via environment variables

---

## 7. Roadmap & Future Features

### Phase 1 — MVP (Current) ✅

- [x] Strava OAuth connect/disconnect
- [x] Activity feed with period filters
- [x] 30+ adaptive templates
- [x] Photo editor with filters + layers
- [x] Save to camera roll / share
- [x] Profile with stats & achievements
- [x] Dark mode
- [x] Settings screen

### Phase 2 — Polish (Current Sprint)

- [ ] Push notification delivery (weekly summaries, achievements)
- [ ] Video template support (animated exports)
- [ ] Multiple photo support (carousel posts)
- [ ] Template favorites/bookmarking
- [ ] Custom color themes for templates
- [ ] Route map overlay on photos (Strava GPX visualization)
- [ ] Social sharing analytics (which platforms used most)

### Phase 3 — Growth

- [ ] AI template suggestion (based on activity type + photo content)
- [ ] AI-generated alt-text for accessibility
- [ ] AI-powered photo auto-enhancement
- [ ] Custom template builder (drag-and-drop, no code)
- [ ] Template marketplace (user-submitted designs)
- [ ] Multi-platform export presets (Instagram Story, TikTok, Twitter)
- [ ] Scheduled posting
- [ ] Activity streaks and badges

### Phase 4 — Monetization

- [ ] Premium template packs
- [ ] AI-powered "magic edit" (one-tap perfect post)
- [ ] Branded templates for races/events
- [ ] Team/Club plan for running clubs and cycling teams
- [ ] Strava segment challenge integration

---

## 8. Success Metrics (KPIs)

| Metric | Target |
|---|---|
| Strava connect conversion rate | > 60% |
| Posts created per connected user (monthly) | > 4 |
| Template gallery browse-to-use rate | > 30% |
| Share rate (posts shared / posts created) | > 50% |
| 7-day retention | > 40% |
| 30-day retention | > 25% |
| App store rating | ≥ 4.5 |

---

## 9. Competitive Landscape

| Product | Strengths | StrideStudio Advantage |
|---|---|---|
| Strava native share | Built-in, instant | Static, one design, boring |
| Canva | Massive template library | Not fitness-aware, no auto-data fill |
| Strava Art / statshunters | Route visualization | Maps only, no photo overlay |
| StravaKudos+ | Activity insights | No visual content creation |
| Runkeeper/MapMyRun | Built-in sharing | Platform-locked, limited designs |

| Product | Strengths | StrideStudio Advantage |
|---|---|---|---|
| Strava native share | Built-in, instant | Static, one design, boring |
| Canva | Massive template library | Not fitness-aware, no auto-data fill, not camera-first |
| Snapchat | Camera-first, lenses, instant creation | No fitness data integration |
| Instagram Stories | Camera-first, stickers, creation tools | No Strava data, generic stickers |
| Strava Art / statshunters | Route visualization | Maps only, no photo overlay |
| StravaKudos+ | Activity insights | No visual content creation |
| Runkeeper/MapMyRun | Built-in sharing | Platform-locked, limited designs |

**StrideStudio's unique position:** The ONLY tool that combines Snapchat's camera-first immediacy with Strava's fitness data. Point, shoot, swipe a Lens, share. No design skills required.

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Activity** | A single Strava workout (run, ride, swim, etc.) |
| **Lens** | A dynamic design preset (replaces "template") that combines a layout, color palette, typography, and metric bindings into an interactive overlay with live preview |
| **Lens Layer** | A single visual element within a Lens — bound to a specific Strava metric or serving as a decoration/chart |
| **Metric Binding** | The dynamic link between a text/label element on the canvas and a Strava activity statistic (e.g., "this label shows Distance in km") |
| **Canvas** | The editor's compositing area where photo + Lens layers combine |
| **Layer** | A single element on the canvas — draggable, resizable, rotatable, stylable (term shared with existing editor) |
| **Filter** | A visual preset applied to the background photo (e.g., Vibrant, Mono, Warm) |
| **Floating Toolbar** | Vertical rail of editing tools on the right side of the editor, inspired by Snapchat |
| **Contextual Sheet** | Bottom sheet that opens contextually based on the selected tool (font picker, stats picker, color picker, etc.) |
| **Lens Carousel** | Horizontal scrollable row of live-preview Lens cards at the bottom of the editor |
| **Quick Style Preset** | One-tap visual style override (Minimal, Neon, Marathon, etc.) that transforms the Lens appearance without changing the layout |
| **Smart Stats Picker** | Grouped, searchable interface for selecting which Strava metric a text element displays |
| **Period** | Time range filter: All, Today, This Week, This Month |
| **Post** | The final exported image — a photo overlaid with Lens layers and activity statistics |
| **ViewShot** | react-native-view-shot — captures any React Native view as a PNG |

---

*Last updated: 2026-07-27 · Version 1.0 · Status: Active Development*