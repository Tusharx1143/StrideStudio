# Share Aura Clone - Project TODO

## Phase 1: Core Navigation & Layout
- [x] Set up tab bar navigation (Home, Editor, Templates, Profile)
- [x] Create ScreenContainer wrapper for all screens
- [x] Implement dark theme with custom color palette
- [x] Create reusable UI components (buttons, cards, inputs)

## Phase 2: Home Screen (Activity Feed)
- [x] Design and implement activity feed layout
- [x] Create activity card component
- [x] Implement pull-to-refresh functionality
- [x] Add mock activity data for testing
- [x] Create floating action button (FAB)
- [x] Implement activity list with FlatList

## Phase 3: Editor Screen (Core Feature)
- [x] Design editor layout with preview and customization panels
- [x] Create template gallery component (horizontal scroll)
- [x] Implement template selection and live preview
- [x] Build stat toggle switches
- [x] Add activity selector chips
- [x] Add save and share action buttons with feedback
- [ ] Background image selector (real image picker integration)

## Phase 4: Template System
- [x] Design representative template set (15 templates across styles)
- [x] Implement template data structure (style + accent color)
- [x] Create template gallery grid view
- [x] Add template category filtering
- [x] Implement template preview with user data overlay

## Phase 5: Activity Details Screen
- [x] Create activity details layout
- [x] GPS route preview placeholder
- [x] Display detailed stats (pace, elevation, heart rate, calories)
- [x] Add create post button linking to editor with activity pre-filled

## Phase 6: Profile Screen
- [x] Design profile layout with user info
- [x] Display account statistics (live from app state)
- [x] Create connected devices section with toggles
- [x] Settings section (notifications, privacy, support)
- [x] Logout button

## Phase 7: Device Integration (Mock)
- [x] Device connection toggles (Garmin, Strava, Apple Health, Fitbit)

## Phase 8: State Management & Data
- [x] Set up Context API for app state (AppProvider)
- [x] Persist selections and post count with AsyncStorage
- [x] Shared data layer with types and helpers

## Phase 9: Polish & Testing
- [x] Haptic feedback for interactions
- [x] Action feedback banners in editor
- [x] Verified all four tabs and details screen render correctly
- [ ] Real share-to-Instagram integration (currently simulated)

## Phase 10: Branding & Assets
- [x] Generate app logo
- [x] Copy logo to splash/favicon/android icon locations
- [x] Update app.config.ts with branding

## Phase 11: Final Delivery
- [ ] Create checkpoint
- [ ] Deliver to user with known limitations documented
