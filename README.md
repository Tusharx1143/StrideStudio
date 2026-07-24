# StrideStudio

**Turn workouts into beautiful, shareable graphics.**

StrideStudio is a mobile app for athletes and fitness enthusiasts. Pick an activity from Strava, choose from 45+ dynamic templates, customize colors and typography, add photo backgrounds, and create story-ready cards for Instagram and other social platforms.

Built with **Expo (React Native)** and **TypeScript**, it runs on iOS, Android, and the web from a single codebase.

<p align="center">
  <img src="./assets/images/icon.png" width="120" alt="StrideStudio logo" />
</p>

---

## Features

- **Strava integration** — connect your Strava account to sync activities (runs, rides, workouts) with athlete profile display
- **Activity feed** — story-style cards for each workout with day headings, monospace stat overlays, and haptic feedback
- **Photo editor** — add photo/video backgrounds, apply Instagram-style filters, adjust brightness/contrast/saturation/warmth, and choose aspect ratios (9:16, 4:5, 16:9)
- **45+ live-rendered templates** — across 9 categories: Adaptive Core, Fancy, Ideas, Big Stats, Combos, Layouts, Style, Extras, and Weekly Totals
- **Template styling** — custom color presets, font families (System, Serif, Mono, Bold, Light), layer reordering, and undo/redo
- **Templates gallery** — browse every design with live previews driven by your selected activity, filterable by Activity/Totals tabs
- **Activity details** — dark monochrome layout with monospace stat rows, GPS route preview placeholder, and "Create Post" shortcut
- **Profile** — Strava connection status, athlete info, total posts count, device integrations (Garmin, Apple Health, Fitbit), and settings
- **Export & share** — save composites to camera roll (PNG), copy to clipboard, or share via the system share sheet
- **Offline caching** — previously fetched activities are persisted to AsyncStorage for instant display on relaunch
- **Local persistence** — UI selections and settings persist across launches via AsyncStorage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Expo SDK 54](https://expo.dev/) / React Native 0.81 / React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Navigation | Expo Router 6 (file-based routing, typed routes) |
| Styling | NativeWind 4 (Tailwind CSS for RN) + StyleSheet + custom design tokens |
| State | React Context + AsyncStorage persistence + TanStack Query cache |
| API layer | tRPC 11 (end-to-end type safety) + SuperJSON serialization |
| Backend | Express 4 + tRPC server, Drizzle ORM, MySQL/PlanetScale |
| Auth | Manus OAuth (session cookies) + Strava OAuth2 |
| Animation | react-native-reanimated 4 + expo-haptics |
| Gestures | react-native-gesture-handler (drag, resize, rotate on canvas) |
| Testing | Vitest (53 tests across helpers, sport-theme, token-store) |
| Tooling | pnpm 9, ESLint (flat config), Prettier, esbuild |

## Project Structure

```
StrideStudio/
├── app/                          # Screens — Expo Router file-based routing
│   ├── _layout.tsx               # Root layout: providers, navigation, SafeArea
│   ├── index.tsx                 # Landing page — Strava Connect CTA
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar (Home, Templates, Profile)
│   │   ├── index.tsx             # Home — story-style activity feed
│   │   ├── templates.tsx         # Template gallery with live previews
│   │   └── profile.tsx           # Profile, devices, and settings
│   ├── editor.tsx                # Photo editor — canvas, filters, templates
│   ├── activity/[id].tsx         # Activity details page
│   ├── settings.tsx              # App settings
│   └── oauth/callback.tsx        # OAuth redirect handler
├── components/                   # Reusable UI components
│   ├── editor/                   # Editor-specific components
│   │   ├── ActivityPickerModal.tsx
│   │   ├── AdjustmentSlider.tsx
│   │   ├── DeleteZone.tsx
│   │   ├── FilterCarousel.tsx
│   │   ├── LayerGesture.tsx
│   │   └── ToolPanel.tsx
│   ├── home/                     # Home screen components
│   │   ├── ActivityFeedCard.tsx
│   │   ├── HeroHeader.tsx
│   │   ├── HomeEmptyState.tsx
│   │   ├── QuickStatsRow.tsx
│   │   └── WeekProgressRing.tsx
│   ├── ErrorBoundary.tsx         # React error boundary
│   ├── skeleton.tsx              # Shimmer loading skeletons
│   ├── stride-button.tsx         # Reusable button with loading state
│   └── animated-toast.tsx        # Toast notification component
├── lib/                          # Core library code
│   ├── app-context.tsx           # Merged AppProvider (Strava + UI state)
│   ├── app-data.ts               # Types, formatting helpers
│   ├── canvas-state.tsx          # Canvas layer state + undo/redo
│   ├── color-presets.ts          # Color/font preset system
│   ├── photo-filters.ts          # Instagram-style photo filters (CSS)
│   ├── sport-theme.ts            # Fitness theme tokens & helpers
│   ├── templates/                # Template system
│   │   ├── index.tsx             # Aggregation barrel
│   │   ├── activity/             # Activity templates (8 categories)
│   │   │   ├── adaptive-core.tsx
│   │   │   ├── fancy.tsx
│   │   │   ├── ideas.tsx
│   │   │   ├── big-stats.tsx
│   │   │   ├── combos.tsx
│   │   │   ├── layouts.tsx
│   │   │   ├── style.tsx
│   │   │   └── extras.tsx
│   │   ├── totals/               # Weekly totals templates
│   │   │   └── totals.tsx
│   │   └── shared/               # Shared template helpers
│   │       ├── analyse-fields.ts
│   │       ├── helpers.ts
│   │       ├── styling.ts
│   │       └── types.ts
│   ├── providers/                # Data providers
│   │   ├── strava-data.tsx       # Strava data + offline caching
│   │   ├── persistent-state.tsx  # UI state + AsyncStorage
│   │   ├── strava-source.ts      # Strava data source interface
│   │   └── trpc-strava-source.ts # tRPC-backed implementation
│   ├── trpc.ts                   # tRPC client setup
│   └── theme-provider.tsx        # Dark/light theme provider
├── server/                       # Express + tRPC backend
│   ├── _core/
│   │   ├── index.ts              # Server entry point
│   │   ├── context.ts            # tRPC context (user session)
│   │   ├── trpc.ts               # tRPC init (procedures)
│   │   ├── strava.ts             # Strava API client + token store
│   │   ├── strava-oauth.ts       # Strava OAuth2 routes
│   │   ├── oauth.ts              # Manus OAuth routes
│   │   ├── cookies.ts            # Session cookie helpers
│   │   ├── env.ts                # Environment config
│   │   ├── storageProxy.ts       # Asset storage proxy
│   │   ├── systemRouter.ts       # System health endpoints
│   │   └── ...                   # LLM, notifications, heartbeat, etc.
│   ├── routers.ts                # tRPC appRouter (auth, strava, system)
│   ├── db.ts                     # Drizzle DB connection + user queries
│   └── storage.ts                # S3-compatible storage client
├── shared/                       # Shared types (client + server)
│   └── types.ts                  # Activity type (canonical source)
├── drizzle/                      # Database
│   ├── schema.ts                 # Drizzle schema (users, tokens, activities)
│   └── migrations/               # SQL migration files
├── constants/                    # Design tokens & constants
│   ├── editor-theme.ts           # Editor color/spacing/type tokens
│   ├── theme.ts                  # Global theme colors
│   └── oauth.ts                  # OAuth configuration
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication state hook
│   └── use-colors.ts             # Theme color hook
├── tests/                        # Test suites (Vitest)
│   ├── lib/
│   │   ├── helpers.test.ts       # 26 tests — formatting, analysis
│   │   └── sport-theme.test.ts   # 20 tests — config, stats
│   └── server/
│       └── token-store.test.ts   # 7 tests — token CRUD
├── assets/images/                # App icon, splash, favicon
├── design.md                     # UI/UX design document
├── ARCHITECTURE.md               # System architecture deep-dive
├── API.md                        # tRPC API reference
├── TEMPLATES.md                  # Template authoring guide
└── CONTRIBUTING.md               # Development setup & conventions
```

## Getting Started

### Prerequisites

- **Node.js** 22.x (or ≥ 20)
- **pnpm** 9.12+ — `npm install -g pnpm`
- **Expo Go** app on your phone (optional, for native testing) — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 1. Clone and install

```bash
git clone https://github.com/Tusharx1143/StrideStudio.git
cd StrideStudio
pnpm install
```

### 2. Set up environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env   # if available, or create .env from scratch
```

Required environment variables (see [ARCHITECTURE.md](./ARCHITECTURE.md) for details):

```env
# Database (MySQL / PlanetScale)
DATABASE_URL=mysql://user:password@host:3306/stridestudio

# Strava API (for activity syncing)
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Auth
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=https://your-auth-server.com
```

> The app runs in **offline mode** with local sample data if no backend is configured.

### 3. Run the app

```bash
pnpm dev
```

This starts both the Metro bundler (web preview on `http://localhost:8081`) and the API server (port 3000) concurrently.

Alternatively, run only the Expo dev server:

```bash
npx expo start --web        # web preview
npx expo start              # QR code for Expo Go (iOS/Android)
```

### 4. Open on your device

- **Web:** open `http://localhost:8081` in a browser (use responsive mode / mobile viewport)
- **Phone:** scan the QR code printed in the terminal with the Expo Go app

### Useful scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API server + Metro bundler (web) |
| `pnpm dev:server` | Start only the API server with hot-reload |
| `pnpm dev:metro` | Start only the Metro bundler |
| `pnpm check` | TypeScript type-checking (`tsc --noEmit`) |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run Vitest unit tests |
| `pnpm android` | Open on a connected Android device/emulator |
| `pnpm ios` | Open on a connected iOS device/simulator |
| `pnpm build` | Build the API server for production |
| `pnpm db:push` | Generate and run Drizzle database migrations |

## How It Works (Quick Tour)

### Data Flow

```
Strava API ←→ Express/tRPC Server ←→ MySQL (tokens, cache)
                      ↕ tRPC (type-safe)
              React Native App (Expo)
                      ↕ React Context
         Screens (Home, Editor, Templates, Profile)
```

### Key Patterns

- **Context composition** — `AppProvider` composes `StravaDataProvider` (server data) and `PersistentStateProvider` (UI state) into a single `useApp()` hook. Screens that need only one concern can import the sub-provider directly.
- **Offline-first** — Strava activities are cached to AsyncStorage. The app shows cached data instantly while fresh data loads in the background.
- **Canvas state** — `CanvasProvider` manages draggable/resizable/rotatable template layers with undo/redo (50-entry history stack). Each layer has position, scale, rotation, z-index, color preset, font family, and background style.
- **Template system** — Templates are pure render functions `(activity, totals, colors?) => JSX.Element`. They're organized into category files, aggregated through a barrel index, and rendered at any scale (live previews at 0.35×, full-size on canvas).

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — system design, component tree, data flow, state management, route design
- **[API.md](./API.md)** — tRPC API reference with all procedures, inputs, and outputs
- **[TEMPLATES.md](./TEMPLATES.md)** — how to create, style, and register new templates
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — development workflow, code conventions, testing, PR process

## Roadmap

- [x] Strava OAuth integration with persistent token storage
- [x] Photo backgrounds with Instagram-style filters and adjustments
- [x] Canvas layer system with undo/redo
- [x] Export to camera roll, clipboard, and share sheet
- [x] 45+ dynamic templates across 9 categories
- [x] Offline activity caching
- [x] Test suite (53 tests)
- [ ] Onboarding flow (designed, not implemented — see [`design.md`](./design.md))
- [ ] Settings screen (designed, not implemented)
- [ ] Real device integrations (Garmin, Apple Health, Fitbit — currently mock)
- [ ] Search and sort for templates
- [ ] Advanced photo editing (crop, rotate, more filters)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] App Store / Google Play deployment

## License

Built with React Native (Expo), tRPC, and Drizzle ORM.
