# StrideStudio — Architecture

This document describes the system architecture, component tree, data flow, state management, and design decisions of StrideStudio.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Expo/React Native)                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Home    │  │  Editor  │  │Templates │  │   Profile    │   │
│  │  Feed    │  │  Screen  │  │ Gallery  │  │   Screen     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │           │
│       └──────────────┴──────┬───────┴───────────────┘           │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │   useApp() hook  │                          │
│                    │  (merged context)│                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│           ┌─────────────────┼─────────────────┐                 │
│           │                 │                  │                 │
│  ┌────────┴────────┐ ┌─────┴──────┐  ┌───────┴────────┐       │
│  │ StravaDataProvider│ │Persistent  │  │ CanvasProvider │       │
│  │ (tRPC + cache)   │ │StateProvider│  │ (layers + undo)│       │
│  └────────┬────────┘ └────────────┘  └────────────────┘       │
│           │                                                      │
│  ┌────────┴────────┐                                           │
│  │  tRPC Client     │                                           │
│  │  (TanStack Query)│                                           │
│  └────────┬────────┘                                           │
│           │ HTTP (SuperJSON)                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────────────┐
│           │              SERVER (Express + tRPC)                 │
│           │                                                      │
│  ┌────────┴────────┐                                           │
│  │  tRPC Server     │                                           │
│  │  (appRouter)     │                                           │
│  └────────┬────────┘                                           │
│           │                                                      │
│  ┌────────┴────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Strava API     │  │  Drizzle ORM  │  │  OAuth Routes │      │
│  │  Client         │  │  (MySQL)      │  │  (Manus+Strava)│     │
│  └────────┬────────┘  └──────┬───────┘  └──────────────┘      │
│           │                  │                                    │
└───────────┼──────────────────┼────────────────────────────────────┘
            │                  │
    ┌───────┴───────┐  ┌──────┴──────┐
    │  Strava API   │  │  MySQL /    │
    │  (REST)       │  │  PlanetScale│
    └───────────────┘  └─────────────┘
```

---

## Frontend Architecture

### Navigation & Routing

Expo Router 6 provides file-based routing with typed routes enabled. The navigation tree is:

```
Root Layout (_layout.tsx)
├── index.tsx                    # Landing page (if not authenticated)
├── (tabs)/_layout.tsx           # Tab navigator
│   ├── index.tsx                # Home — activity feed
│   ├── templates.tsx            # Template gallery
│   └── profile.tsx              # Profile & settings
├── editor.tsx                   # Photo editor (modal/push from any screen)
├── activity/[id].tsx            # Activity details (push from feed)
├── settings.tsx                 # Settings (push from profile)
└── oauth/callback.tsx           # OAuth redirect handler
```

**Key decisions:**
- The editor is a standalone screen (not a tab) — accessed via push navigation from the activity feed or details page
- Tab bar uses `HapticTab` for tactile feedback on press
- The landing page uses `animation: "fade"` for smooth transition to the main app

### Provider Hierarchy (Root Layout)

```
GestureHandlerRootView
  └── trpc.Provider (TanStack Query)
      └── QueryClientProvider
          └── AppProvider
              ├── StravaDataProvider     ← tRPC queries, offline cache
              │   └── PersistentStateProvider  ← AsyncStorage UI state
              │       └── AppStateProvider     ← merged context
              └── CanvasProvider         ← editor layer state, undo/redo
                  └── Stack (Expo Router)
                      ├── index
                      ├── (tabs)
                      ├── editor
                      ├── activity/[id]
                      ├── settings
                      └── oauth/callback
              └── StatusBar
```

### State Management

StrideStudio uses **React Context** (not Redux or Zustand) for state management. There are three providers, each with a single responsibility:

#### 1. `StravaDataProvider` (`lib/providers/strava-data.tsx`)

**Purpose:** Fetch and cache Strava activities and athlete data.

**State:**
```typescript
interface StravaDataState {
  activities: Activity[];     // From tRPC or cache
  loading: boolean;           // True only on initial fetch
  error: string | null;       // Server error message
  stravaConnected: boolean;   // Has valid Strava OAuth
  athlete: StravaAthlete | null;
  refresh: () => void;        // Manual refetch
}
```

**Data flow:**
1. On mount, loads cached activities from AsyncStorage (instant display)
2. Queries tRPC `strava.status` to check connection
3. If connected, queries tRPC `strava.activities.list` for fresh data
4. Persists fresh data to AsyncStorage for next launch

**Key pattern:** Uses a `StravaDataSource` interface for testability. The default implementation (`trpc-strava-source.ts`) wraps tRPC hooks. Tests can swap in a fixture.

#### 2. `PersistentStateProvider` (`lib/providers/persistent-state.tsx`)

**Purpose:** Persist UI selections across app launches.

**State:**
```typescript
interface PersistedUIState {
  selectedActivityId: string;
  selectedTemplateId: string;
  statToggles: StatToggles;     // Which stats to show
  savedPostsCount: number;      // Lifetime export counter
  // + setters for each field
}
```

**Note:** The audit identified that writes are not debounced — every state change triggers an AsyncStorage write. This is a known P2 issue (#9).

#### 3. `CanvasProvider` (`lib/canvas-state.tsx`)

**Purpose:** Manage the editor's draggable template layers and undo/redo history.

**State:**
```typescript
interface CanvasState {
  layers: CanvasLayer[];       // Template overlays on the canvas
  selectedLayerId: string | null;
  photoUri: string | null;     // Background image/video
  canUndo: boolean;
  canRedo: boolean;
  addLayer(templateId: string): void;
  removeLayer(id: string): void;
  updateLayer(id: string, patch: Partial<CanvasLayer>): void;
  bringForward(id: string): void;
  sendBackward(id: string): void;
  selectLayer(id: string | null): void;
  setPhoto(uri: string | null): void;
  resetCanvas(): void;
  undo(): void;
  redo(): void;
}
```

**CanvasLayer structure:**
```typescript
interface CanvasLayer {
  id: string;
  templateId: string;
  x: number;           // Centre-x, 0–1 fraction of canvas width
  y: number;           // Centre-y, 0–1 fraction of canvas height
  scale: number;       // 1 = default render size
  rotation: number;    // Radians
  paletteId: string;   // Color preset ID
  fontFamily: FontFamily;
  zIndex: number;
  backgroundStyle: 'none' | 'glass' | 'solid' | 'outlined';
}
```

**Undo/Redo:**
- Two stacks (`pastRef`, `futureRef`), each capped at 50 snapshots
- `pushHistory()` snapshots the current state (JSON clone) before any mutation
- `undo()` pops from past, pushes current to future
- `redo()` pops from future, pushes current to past
- Only `removeLayer` and manual mutations call `pushHistory` — `addLayer` and `updateLayer` operate directly for responsiveness

### Data Fetching: tRPC + TanStack Query

The tRPC client (`lib/trpc.ts`) is configured with:
- `httpBatchLink` — batches multiple tRPC calls into one HTTP request
- `superjson` transformer — handles Dates, Maps, Sets (not plain JSON)
- Bearer token auth via `Auth.getSessionToken()`
- `credentials: "include"` for cookie-based auth fallback

The `QueryClient` is configured with:
- `refetchOnWindowFocus: false` — mobile apps don't need this
- `retry: 1` — one retry on failure
- `gcTime: 5 * 60 * 1000` — 5-minute garbage collection time

### Styling

The app uses **three styling systems** for different contexts:

1. **NativeWind 4 (Tailwind)** — utility classes for general layout (`className="flex-1 p-4"`). Used in screens and generic components.

2. **Editor Design Tokens** (`constants/editor-theme.ts`) — a dedicated design system for the photo editor. Includes:
   - `EditorColors` — violet primary, cyan accent, deep navy background
   - `EditorSpace` — 4px-grid spacing scale (xs → 3xl)
   - `EditorTouch` — minimum touch targets (44px buttons, 28px icons)
   - `EditorRadius` — border radius scale (sm → full/pill)
   - `EditorType` — typography scale with size/weight/lineHeight
   - `EditorMotion` — animation durations (fast=150ms, normal=250ms, slow=350ms)

3. **StyleSheet** — React Native's built-in `StyleSheet.create()` for performance-critical styles (used in `editor.tsx` via `localStyles`).

---

## Backend Architecture

### Server Entry Point (`server/_core/index.ts`)

The Express server:
1. Finds an available port (3000–3019)
2. Sets up CORS (reflects request origin, allows credentials)
3. Registers middleware: JSON body parser (50MB limit), URL-encoded body parser
4. Registers route handlers: storage proxy, OAuth (Manus), Strava OAuth
5. Mounts tRPC at `/api/trpc`
6. Exposes health check at `GET /api/health`

### tRPC Router (`server/routers.ts`)

**Route tree:**
```
appRouter
├── system          ← systemRouter (health, diagnostics)
├── auth
│   ├── me          ← query: returns current user from session
│   └── logout      ← mutation: clears session cookie
└── strava
    ├── status      ← query: check if Strava is connected
    ├── activities
    │   └── list    ← query: fetch activities (paginated)
    └── activityById ← query: fetch single activity
```

### Context (`server/_core/context.ts`)

Each tRPC request receives a context created from the Express `req`/`res`:
- `user` — parsed from JWT cookie (contains `openId`)
- `req`, `res` — Express request/response objects

### Strava Integration (`server/_core/strava.ts`)

**Token Store:**
- **DrizzleTokenStore** — persists tokens to `strava_tokens` MySQL table (production)
- **InMemoryTokenStore** — fallback for development without a database
- Auto-upgrades: if the in-memory store is in use, the Drizzle store is tried first on next operation

**Strava API Client:**
- Manages OAuth2 token lifecycle (access/refresh tokens, expiry)
- Proxies requests to Strava REST API with automatic token refresh
- Maps Strava activity fields to the app's `Activity` type
- Paginates through activity history (default 30 per page, max 200)

### Database (`drizzle/schema.ts`)

**Tables:**

| Table | Purpose |
|-------|---------|
| `users` | Core user records (openId, name, email, role) |
| `strava_tokens` | Strava OAuth2 tokens per user (access, refresh, expiry) |
| `strava_activities` | Cached Strava activities (JSON data + raw API response) |

**Connection:** Lazy-initialized Drizzle instance via `getDb()`. Falls back gracefully if `DATABASE_URL` is not set — the server runs but database operations are no-ops with warnings.

---

## Key Design Decisions

### 1. Context over Redux/Zustand

**Decision:** Use React Context for state management.

**Rationale:** The app has exactly **three** state domains (Strava data, UI persistence, canvas layers). Each is consumed by a well-defined set of screens. The overhead of Redux or Zustand (additional dependency, boilerplate, middleware configuration) is not justified at this scale. If the state graph grows significantly, Zustand is the natural migration path (minimal boilerplate, works outside React).

### 2. tRPC over REST/GraphQL

**Decision:** Use tRPC for client-server communication.

**Rationale:** The API surface is small (auth + Strava proxy). tRPC provides end-to-end type safety without code generation — change a server procedure and the client gets a compile error. This is critical for a TypeScript-first codebase. The `superjson` transformer ensures Date objects survive the network round-trip.

### 3. Monorepo (client + server in one repo)

**Decision:** Keep frontend and backend in the same repository.

**Rationale:** The team is small, the backend is thin (mostly a Strava proxy), and shared types (`shared/types.ts`) are a single source of truth. At this scale, the overhead of a multi-repo or monorepo tool (Turborepo, Nx) is not justified. The `shared/` directory is the contract boundary — if the backend ever grows into a separate deployable, it's a simple extraction.

### 4. Editor as standalone screen (not a tab)

**Decision:** The photo editor is a push screen, not a tab.

**Rationale:** The editor requires full-screen attention. It's always accessed with a specific activity context (from feed or activity details). Making it a tab would require managing "empty" state when accessed without an activity, and the tab bar would consume precious vertical space on the editing canvas.

### 5. CanvasProvider at root level

**Decision:** `CanvasProvider` wraps the entire app in `_layout.tsx`.

**Trade-off:** Canvas state leaks across screens (audit finding #15). The benefit is that navigating to/from the editor doesn't reset the canvas. This is deliberate for now — users can leave the editor to browse templates and return to their work. If this causes issues, the provider can be scoped to the editor screen with state lifted via navigation params.

### 6. Offline-first with AsyncStorage cache

**Decision:** Cache Strava activities locally and show them instantly on launch.

**Rationale:** Strava API calls are slow (~500ms–2s). Showing a skeleton on every launch would be poor UX. The cache provides instant display while tRPC fetches fresh data in the background. The trade-off is potential staleness (a few seconds until the refresh completes).

---

## Performance Considerations

- **Template rendering:** Templates are pure functions with no side effects. Preview cards render at 0.35× scale inside 152×180dp containers. This is performant on modern devices but could benefit from `React.memo` (audit #18).
- **Reanimated animations:** `FadeIn`/`FadeInDown` objects are created inline in `editor.tsx`, causing re-creation on every render. These should be hoisted to module constants (audit #19).
- **Canvas layer sorting:** Layers are sorted by `zIndex` on every render via inline `.sort()`. For small layer counts (< 10), this is negligible. If users regularly create 20+ layers, `zIndex` should be maintained as a sorted structure.
- **`addLayer` stale closure:** Now fixed — uses functional `setLayers((prev) => ...)` to compute `maxZ` from the current state, avoiding stale-closure bugs when rapidly adding layers (audit #10).

---

## Related Documents

- **[API.md](./API.md)** — tRPC API reference
- **[TEMPLATES.md](./TEMPLATES.md)** — Template authoring guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Development workflow
- **[design.md](./design.md)** — UI/UX design specifications
