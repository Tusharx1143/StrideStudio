# Contributing to StrideStudio

Welcome! This guide covers the development workflow, code conventions, testing, and PR process.

---

## Development Setup

### Prerequisites

- **Node.js** 22.x (or ≥ 20)
- **pnpm** 9.12+ (`npm install -g pnpm`)
- **MySQL** (optional — only needed for backend development)
  - Use [PlanetScale](https://planetscale.com/) for a free serverless MySQL instance
  - Or install MySQL locally

### First-time setup

```bash
# Clone
git clone https://github.com/Tusharx1143/StrideStudio.git
cd StrideStudio

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env   # if available
# Edit .env with your database URL, Strava credentials, etc.

# Start development
pnpm dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (required for backend features)
DATABASE_URL=mysql://user:password@host:3306/stridestudio

# Strava API (required for activity syncing)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret

# Auth
JWT_SECRET=your_secret
OAUTH_SERVER_URL=https://your-auth-server.com
OWNER_OPEN_ID=your_openid

# Optional
API_URL=http://localhost:3000
EXPO_PORT=8081
```

> Without `DATABASE_URL`, the app runs in **offline mode** with local sample data and an in-memory token store.

---

## Development Workflow

### Running the app

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start API server + Metro bundler concurrently |
| `pnpm dev:server` | Start only the API server (hot-reload via tsx watch) |
| `pnpm dev:metro` | Start only the Metro bundler (web preview) |
| `npx expo start` | Start Expo dev server with QR code (for phone testing) |

### Before committing

Run these checks before submitting a PR:

```bash
pnpm check    # TypeScript type-checking (tsc --noEmit)
pnpm lint     # ESLint
pnpm format   # Prettier formatting
pnpm test     # Vitest test suite
```

All must pass. The PR checks will also run these automatically once CI/CD is set up (planned — audit #18).

### Database migrations

After changing the Drizzle schema (`drizzle/schema.ts`):

```bash
pnpm db:push
```

This runs `drizzle-kit generate` (creates SQL migration files) followed by `drizzle-kit migrate` (applies them to the database).

---

## Code Conventions

### TypeScript

- **Strict mode** is enabled. Do not use `as any` unless absolutely necessary — prefer proper types. (17 `as any` casts are a known P1 issue — audit #11.)
- **No implicit returns.** Always explicitly type function return types for exported functions.
- **Use the shared types** from `shared/types.ts` for domain objects (Activity, etc.). Do not redefine them.

### React Components

- **File structure:** One component per file (exceptions: small sub-components that are only used within that file).
- **Component order within a file:**
  1. Imports
  2. Constants
  3. Types/interfaces (if local)
  4. Helper functions
  5. Main component
  6. StyleSheet (if any)
- **Props:** Use inline type definitions for simple props, interfaces for complex ones.
- **Hooks:** Custom hooks live in `hooks/`. State logic should be in providers (`lib/providers/`), not scattered across components.
- **No console.log in production code.** Use proper error reporting. (50+ console.log statements are a known P1 issue — audit #9.)

### Styling

- **General screens:** Use NativeWind (`className="flex-1 p-4"`).
- **Editor components:** Use the `EditorColors`, `EditorSpace`, `EditorType` design tokens from `constants/editor-theme.ts`.
- **Performance-critical styles:** Use `StyleSheet.create()` for styles that don't change (avoids object creation on every render).

### Naming

- **Components:** PascalCase (`ActivityFeedCard`, `FilterCarousel`)
- **Files:** kebab-case for utilities (`color-presets.ts`), PascalCase for components (`ActivityFeedCard.tsx`)
- **Functions:** camelCase (`formatDuration`, `computeWeekTotals`)
- **Types/Interfaces:** PascalCase (`Activity`, `CanvasLayer`, `TemplateDef`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants, camelCase for derived/config objects

### Imports

- Use `@/` path alias for project imports (maps to project root)
- Group imports: React/RN → third-party → project (separated by blank lines)
- No circular imports — keep the dependency graph acyclic

---

## Project Conventions

### Adding a Screen

1. Create the file in `app/` (Expo Router)
2. Use `ScreenContainer` as the root wrapper
3. Follow the screen template pattern:
   ```typescript
   export default function MyScreen() {
     const { ... } = useApp();

     // Loading state
     if (loading) return <Skeleton />;

     // Error state
     if (error) return <ErrorState onRetry={refresh} />;

     // Empty state
     if (data.length === 0) return <EmptyState />;

     // Main content
     return <ScreenContainer>...</ScreenContainer>;
   }
   ```
4. Handle all four states: loading, error, empty, and populated.

### Adding an API Endpoint

1. Add the procedure to `server/routers.ts`
2. Use Zod schemas for input validation
3. Re-export types if needed in `shared/types.ts`
4. Client usage auto-completes via tRPC type inference — no manual type wiring needed

### Adding a Template

See **[TEMPLATES.md](./TEMPLATES.md)** for a complete guide.

---

## Testing

StrideStudio uses **Vitest** with **React Native Testing Library** (planned — currently only unit tests exist).

### Running tests

```bash
pnpm test              # Run all tests once
pnpm vitest            # Watch mode
pnpm vitest --coverage # With coverage report
```

### Test structure

```
tests/
├── lib/
│   ├── helpers.test.ts        # formatDuration, formatPace, computeWeekTotals
│   └── sport-theme.test.ts    # getSportConfig, relativeTime, achievements
└── server/
    └── token-store.test.ts    # InMemoryTokenStore CRUD operations
```

### Writing tests

- Test files mirror the source structure: `lib/foo.ts` → `tests/lib/foo.test.ts`
- Use `describe`/`it` blocks with clear, behavior-focused names
- Mock external dependencies (tRPC, AsyncStorage, Strava API)
- Test edge cases: empty arrays, null/undefined values, boundary conditions

### Known gaps

- No component or integration tests for the editor, canvas state, or server routes (audit #16)
- No snapshot tests for templates
- The `StravaDataSource` interface is designed for testability but not yet used in tests

---

## Pull Request Process

1. **Branch naming:** `feature/description`, `fix/description`, `refactor/description`
2. **Keep PRs small:** Aim for < 500 lines changed. Split large changes into stacked PRs.
3. **PR description:** Explain what changed, why, and how to test it. Link related issues.
4. **Review checklist:**
   - [ ] `pnpm check` passes (TypeScript)
   - [ ] `pnpm lint` passes (ESLint)
   - [ ] `pnpm format` applied (Prettier)
   - [ ] `pnpm test` passes
   - [ ] All four UI states handled (loading, error, empty, populated)
   - [ ] No new `console.log` statements
   - [ ] No new `as any` casts
   - [ ] New features documented (README, ARCHITECTURE, API, or TEMPLATES as appropriate)

---

## Architecture Decision Records

Major architectural decisions are documented in **[ARCHITECTURE.md](./ARCHITECTURE.md)**. Before proposing a significant change, review the existing decisions:

1. Context over Redux/Zustand (small state graph)
2. tRPC over REST/GraphQL (type safety, small API surface)
3. Monorepo client+server (small team, shared types)
4. Editor as standalone screen (full-screen, context-dependent)
5. CanvasProvider at root level (preserve state across navigation)
6. Offline-first with AsyncStorage cache (instant display, background refresh)

---

## Getting Help

- **Codebase overview:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API details:** See [API.md](./API.md)
- **Templates:** See [TEMPLATES.md](./TEMPLATES.md)
- **UI design:** See [design.md](./design.md)
- **Known issues:** See the [audit tracker](../memory/stride-studio-audit.md) and [GitHub Issues](https://github.com/Tusharx1143/StrideStudio/issues)

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): description
fix(scope): description
refactor(scope): description
test(scope): description
docs(scope): description
chore(scope): description
```

Examples:
- `feat(editor): add brightness/contrast adjustment sliders`
- `fix(canvas): prevent duplicate zIndex on rapid addLayer`
- `refactor(templates): extract adaptive-core to separate file`
- `test(helpers): add edge case tests for formatDuration`
- `docs(readme): update tech stack and features list`
