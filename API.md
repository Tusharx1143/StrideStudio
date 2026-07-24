# StrideStudio — API Reference

This document describes the tRPC API that connects the Expo frontend to the Express backend.

---

## Overview

StrideStudio uses **tRPC 11** with **SuperJSON** serialization. Every procedure is end-to-end type-safe — changing a server procedure's input or output causes a TypeScript compile error on the client until the call site is updated.

- **Base URL:** `http://localhost:3000/api/trpc` (configurable via `API_URL` env var)
- **Transport:** HTTP POST with batching (`httpBatchLink`)
- **Serialization:** SuperJSON (handles `Date`, `Map`, `Set`, `undefined`)
- **Auth:** Bearer token in `Authorization` header, or session cookie

---

## API Routes

```
appRouter
├── system                    # Health / diagnostics
├── auth.me                   # Query: get current user
├── auth.logout               # Mutation: clear session
├── strava.status             # Query: check Strava connection
├── strava.activities.list    # Query: fetch activities (paginated)
└── strava.activityById       # Query: fetch single activity
```

---

## Procedures

### `system`

System-level diagnostic endpoints. See `server/_core/systemRouter.ts` for the full interface.

---

### `auth.me`

**Type:** Query  
**Input:** None  
**Auth:** Required (session cookie / Bearer token)  

**Response:**
```typescript
// Returns the current user object, or null if not authenticated
type Output = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
} | null;
```

**Usage (client):**
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

---

### `auth.logout`

**Type:** Mutation  
**Input:** None  
**Auth:** Required  

**Response:**
```typescript
{ success: true }
```

**Side effect:** Clears the session cookie (`Set-Cookie` header with `maxAge: -1`).

**Usage (client):**
```typescript
const logout = trpc.auth.logout.useMutation({
  onSuccess: () => { /* redirect to login */ },
});
```

---

### `strava.status`

**Type:** Query  
**Input:** None  
**Auth:** Required  

Checks whether the current user has connected their Strava account.

**Response:**
```typescript
type Output =
  | { connected: false; athlete: null }
  | {
      connected: true;
      athlete: {
        id: number;
        firstname: string;
        lastname: string;
        city: string | null;
        country: string | null;
        profile: string;       // URL to profile photo
        premium: boolean;
      } | null;               // null if token is valid but athlete fetch fails
    };
```

**Usage (client):**
```typescript
const { data } = trpc.strava.status.useQuery();
// data.connected → boolean
// data.athlete → StravaAthlete | null
```

---

### `strava.activities.list`

**Type:** Query  
**Input:** Optional pagination  
**Auth:** Required, Strava must be connected  

Fetches the user's activities from Strava. Results are cached in the database to reduce API calls.

**Input:**
```typescript
{
  page?: number;     // Page number, starting from 1. Default: 1
  perPage?: number;  // Items per page, 1–200. Default: 30
}
```

**Response:**
```typescript
{
  activities: Activity[];
}

// Activity type (shared between client and server):
interface Activity {
  id: string;
  stravaId: number;
  type: "run" | "ride" | "workout";
  title: string;
  distance: number;        // km
  duration: number;        // minutes (moving time)
  elapsedTime: number;     // minutes (total elapsed)
  date: string;
  startDate: string;       // ISO 8601
  pace?: number;           // min/km
  speed?: number;          // km/h
  maxSpeed?: number;       // km/h
  elevation?: number;      // meters
  heartRate?: number;      // avg bpm
  maxHeartRate?: number;
  calories?: number;
  averageTemp?: number;
  hasHeartrate: boolean;
  sufferScore?: number;
  startLatlng?: [number, number];
  summaryPolyline?: string;
  deviceName?: string;
}
```

**Usage (client):**
```typescript
const { data, isLoading, refetch } = trpc.strava.activities.list.useQuery(
  { page: 1, perPage: 30 },
  { enabled: stravaConnected }
);
```

---

### `strava.activityById`

**Type:** Query  
**Input:** Required (Strava activity ID)  
**Auth:** Required, Strava must be connected  

Fetches a single activity by its Strava ID.

**Input:**
```typescript
{ id: number }   // Strava activity ID
```

**Response:**
```typescript
{ activity: Activity }
```

**Usage (client):**
```typescript
const { data } = trpc.strava.activityById.useQuery({ id: 123456 });
```

---

## Error Handling

tRPC errors follow this structure:

```typescript
{
  code: "NOT_FOUND" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR" | ...;
  message: string;       // Human-readable message
  // Additional fields may be present depending on the error
}
```

**Client-side error handling:**
```typescript
const { data, error } = trpc.strava.activities.list.useQuery();

if (error) {
  // error.message contains the server error
  // error.data?.code contains the tRPC error code
}
```

Common error scenarios:
- **Strava not connected** — `strava.activities.list` and `strava.activityById` will fail if the user hasn't completed Strava OAuth
- **Token expired** — automatically handled by the token store (refresh happens server-side)
- **Rate limited** — Strava API has rate limits (100 requests/15 min, 1000/day). The server returns a 429 error.

---

## Authentication Flow

### 1. Manus OAuth (App Login)

```
User opens app → Landing page → "Connect Strava" → OAuth redirect →
  Manus auth server → callback → JWT session cookie set →
  User redirected to Home screen
```

The JWT is stored as a session cookie (`__session`). Subsequent requests include it automatically. The tRPC context (`server/_core/context.ts`) parses it to extract `user.openId`.

### 2. Strava OAuth (Activity Sync)

```
Profile → "Connect Strava" → Strava OAuth2 authorization →
  User approves → callback → Exchange code for tokens →
  Store tokens in DB (keyed by userId) → Available for API calls
```

Strava tokens are stored in the `strava_tokens` table and managed by `DrizzleTokenStore`. The `Strava` client class handles automatic token refresh when access tokens expire.

---

## Adding a New Procedure

1. **Define the procedure** in `server/routers.ts`:
   ```typescript
   export const appRouter = router({
     // ...existing routes
     myFeature: router({
       doSomething: publicProcedure
         .input(z.object({ name: z.string() }))
         .query(async ({ ctx, input }) => {
           return { greeting: `Hello, ${input.name}` };
         }),
     }),
   });
   ```

2. **Use it on the client** anywhere in the app:
   ```typescript
   const { data } = trpc.myFeature.doSomething.useQuery({ name: "World" });
   // data.greeting → "Hello, World" (fully typed)
   ```

No code generation, no OpenAPI spec, no manual type definitions — tRPC infers types from the server.

---

## Data Source Pattern (Testability)

The `StravaDataProvider` accepts an optional `StravaDataSource` for testability:

```typescript
// lib/providers/strava-source.ts
interface StravaDataSource {
  useStatus(): QueryResult<StatusData>;
  useActivities(opts: { enabled: boolean }): QueryResult<ActivitiesData>;
}
```

**Production:** `createTRPCStravaSource()` wraps tRPC hooks.  
**Testing:** Pass a fixture implementation that returns mock data synchronously.

This pattern isolates tRPC from the provider, making it testable without a running server.

---

## Related Documents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design and data flow
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Development workflow
