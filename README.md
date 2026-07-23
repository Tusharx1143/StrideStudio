# StrideStudio

StrideStudio is a mobile app for turning workouts into beautiful, shareable graphics — inspired by [Aura](https://play.google.com/store/apps/details?id=com.auramovement.aura). Pick an activity, choose from 41 hand-crafted templates, and copy or save a story-ready card for Instagram and other social platforms.

Built with **Expo (React Native)** and **TypeScript**, it runs on iOS, Android, and the web from a single codebase.

---

## Features

- **Activity feed** — story-style cards for each workout (runs, rides, workouts) with day headings and monospace stat overlays
- **Share screen** — "TAP TO COPY / PRESS + HOLD TO SAVE" flow with an activity picker and **Activity | Totals** tabs
- **41 live-rendered templates** — serif stats, bold KM, terminal/system log, barcode, LED matrix, iMessage bubble, WASTED, weekday red, editorial, polaroid, quote cards, weekly totals tables, and more
- **Templates gallery** — browse every design with live previews driven by your selected activity, filterable by Activity/Totals
- **Activity details** — dark monochrome layout with monospace stat rows and one-tap "Create Post from Activity"
- **Profile** — activity stats, connected device toggles (Garmin, Strava, Apple Health, Fitbit), and app settings
- **Local persistence** — selections and settings persist across launches via AsyncStorage

> Note: Sharing to Instagram and saving to the camera roll are currently simulated. Sample activity data is bundled for demo purposes.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Expo SDK 54](https://expo.dev/) / React Native 0.81 / React 19 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router 6 (file-based routing, typed routes) |
| Styling | NativeWind 4 (Tailwind CSS for React Native) + StyleSheet |
| State | React Context + AsyncStorage persistence |
| Data fetching | TanStack Query + tRPC 11 client |
| Backend (optional) | Express + tRPC server, Drizzle ORM, PostgreSQL |
| Animation & UX | react-native-reanimated 4, expo-haptics |
| Tooling | pnpm, ESLint, Prettier, Vitest |

## Project Structure

```
app/                    # Screens (Expo Router file-based routing)
  (tabs)/
    index.tsx           # Home — story-style activity feed
    editor.tsx          # Share screen — template grid with Activity/Totals tabs
    templates.tsx       # Templates gallery with live previews
    profile.tsx         # Profile, devices, and settings
  activity/[id].tsx     # Activity details page
  _layout.tsx           # Root layout with providers
components/             # Reusable UI components (ScreenContainer, etc.)
lib/
  templates.tsx         # Template renderer library (all 41 designs)
  app-data.ts           # Types, sample activities, formatting helpers
  app-context.tsx       # Global app state (Context + AsyncStorage)
server/                 # Express + tRPC backend (optional, for cloud sync)
drizzle/                # Database schema and migrations
assets/images/          # App icon, splash screen, favicons
design.md               # Interface design document
todo.md                 # Feature tracker
```

## Getting Started

### Prerequisites

- **Node.js** 22.x (or ≥ 20)
- **pnpm** 9.x — `npm install -g pnpm`
- **Expo Go** app on your phone (optional, for native testing) — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 1. Clone and install

```bash
git clone https://github.com/Tusharx1143/StrideStudio.git
cd StrideStudio
pnpm install
```

### 2. Run the app

```bash
pnpm dev
```

This starts both the Metro bundler (web preview on `http://localhost:8081`) and the API server (port 3000) concurrently.

Alternatively, run only the Expo dev server:

```bash
npx expo start --web        # web preview
npx expo start              # QR code for Expo Go (iOS/Android)
```

### 3. Open on your device

- **Web:** open `http://localhost:8081` in a browser (use responsive mode / mobile viewport for best results)
- **Phone:** scan the QR code printed in the terminal with the Expo Go app

### Useful scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API server + Metro bundler (web) |
| `pnpm check` | TypeScript type-checking |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run Vitest unit tests |
| `pnpm android` / `pnpm ios` | Open on a connected device/emulator |
| `pnpm db:push` | Generate and run Drizzle database migrations (backend only) |

### Environment variables (optional backend)

The app works fully offline with local sample data. The optional backend (auth, database sync) reads its configuration from `.env`:

```
DATABASE_URL=postgres://user:pass@host:5432/db   # PostgreSQL connection string
```

If you don't need cloud features, no environment setup is required.

## Roadmap

- [ ] Photo backgrounds — overlay templates on user workout photos
- [ ] Real export — render templates to PNG with copy-to-clipboard and save-to-camera-roll
- [ ] Template customization — color and typography pickers
- [ ] Manual activity entry form
- [ ] Real device integrations (Garmin, Strava, Apple Health, Fitbit)

## License

This project is a design study / educational clone and is not affiliated with Aura or Aura Movement Technologies. All trademarks belong to their respective owners.
