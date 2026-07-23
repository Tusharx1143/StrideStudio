# Share Aura Clone - Mobile App Design

## Overview
Share Aura is a creative tool for sharing workouts to social media. The app allows users to connect fitness tracking devices, sync their activities, and create beautiful shareable posts using customizable stat templates. The design emphasizes simplicity, visual hierarchy, and a dark aesthetic with vibrant accents.

## Design Principles
- **Portrait Orientation (9:16):** All screens designed for vertical mobile use
- **One-Handed Usage:** Primary interactions within thumb reach
- **Dark Aesthetic:** Black/dark gray backgrounds with white and vibrant accent colors
- **Minimalist Navigation:** Bottom tab bar for main sections
- **Visual Hierarchy:** Large, bold typography for key stats; subtle secondary information

## Color Palette
- **Primary Background:** #000000 (Pure Black)
- **Secondary Background:** #1A1A1A (Dark Gray)
- **Accent Color:** #FF6B35 (Vibrant Orange/Red)
- **Secondary Accent:** #4A90E2 (Vibrant Blue)
- **Text Primary:** #FFFFFF (White)
- **Text Secondary:** #B0B0B0 (Light Gray)
- **Border/Divider:** #333333 (Dark Gray)

## Screen List

### 1. Onboarding Flow
**Purpose:** Welcome new users and guide them through initial setup.

**Screens:**
- **Splash Screen:** Logo, tagline "Training is an art. Artists need tools."
- **Permission Screen:** Request location and photo library access
- **Device Connection:** Connect Garmin, Strava, or other tracking devices (mock integration)
- **Profile Setup:** Enter name, email, and preferred sharing platforms

### 2. Home Screen (Activity Feed)
**Purpose:** Display synced workouts and recent activities.

**Content:**
- Header with user greeting and quick stats (total runs, miles this week)
- List of recent activities (runs, rides, workouts) in card format
- Each card shows: activity type icon, distance, duration, date, and a thumbnail preview
- Floating action button (FAB) to create a new post or sync activities
- Pull-to-refresh functionality

**Layout:**
- Safe area padding at top and bottom
- Cards with rounded corners, subtle shadow
- Activity cards are tappable to view details or edit

### 3. Editor Screen (Core Feature)
**Purpose:** Allow users to create beautiful shareable posts with custom templates.

**Content:**
- Template gallery at the top (horizontal scrollable grid of 45+ templates)
- Live preview of the selected template with user's activity data overlaid
- Customization options below preview:
  - Background image selector (from camera roll or activity photo)
  - Stat toggle switches (distance, pace, duration, elevation, heart rate, etc.)
  - Text color and font selection
  - Layout adjustment sliders (stat position, size)
- Action buttons at bottom: Save to Camera Roll, Share to Instagram, Copy to Clipboard

**Layout:**
- Full-screen preview area (60% of screen)
- Scrollable customization panel below (40% of screen)
- Bottom action buttons in a horizontal row

### 4. Template Gallery
**Purpose:** Browse and select from all available templates.

**Content:**
- Grid view of all 45+ templates (3 columns)
- Each template shows a thumbnail preview
- Tap to select and preview with user's data
- Search/filter bar at top (by category: running, cycling, general fitness)

**Layout:**
- Full-screen grid with safe area padding
- Smooth scrolling, lazy loading for performance

### 5. Activity Details Screen
**Purpose:** View detailed information about a specific workout.

**Content:**
- Activity header: type, date, distance, duration
- Map view showing GPS route (if available)
- Detailed stats table: pace, elevation gain, heart rate zones, calories
- Option to edit and create a new post from this activity
- Share button to open editor with this activity's data

**Layout:**
- Header with activity info
- Scrollable content area with map and stats
- Bottom action buttons

### 6. Profile Screen
**Purpose:** Manage user account and settings.

**Content:**
- User avatar and name at top
- Account statistics: total activities, total distance, personal records
- Connected devices section (Garmin, Strava, etc.)
- Saved posts gallery (recent posts created)
- Settings link

**Layout:**
- Scrollable profile card layout
- Section dividers
- Tappable rows for connected devices and saved posts

### 7. Settings Screen
**Purpose:** Configure app preferences and account options.

**Content:**
- Theme toggle (light/dark mode)
- Notification preferences
- Connected services management
- Privacy and data sharing options
- About and support links
- Logout button

**Layout:**
- List-based settings with toggle switches and disclosure indicators
- Grouped sections with headers

## Key User Flows

### Flow 1: Create and Share a Workout Post
1. User opens Home screen
2. Taps on a recent activity or FAB to create new post
3. Navigates to Editor screen
4. Selects a template from gallery
5. Customizes stats, background, and layout
6. Taps "Share to Instagram" or "Save to Camera Roll"
7. Post is created and shared

### Flow 2: Connect a Fitness Device
1. User opens Profile screen
2. Taps "Connected Devices"
3. Selects device type (Garmin, Strava, etc.)
4. Authenticates with device service
5. Grants permissions to sync activities
6. Activities appear in Home feed

### Flow 3: Browse and Manage Templates
1. User opens Editor screen
2. Swipes through template gallery
3. Taps a template to preview with their data
4. Customizes the template
5. Saves or shares the result

## Navigation Structure
- **Bottom Tab Bar (4 tabs):**
  - Home (activity feed)
  - Editor (create posts)
  - Templates (browse gallery)
  - Profile (account and settings)

- **Modal Screens:**
  - Activity Details (from Home)
  - Settings (from Profile)
  - Device Connection (from Profile)

## Typography
- **Headings:** Bold, large (28-32px), white text
- **Body Text:** Regular, medium (16-18px), white text
- **Secondary Text:** Regular, small (12-14px), light gray text
- **Stats/Numbers:** Bold, large (24-28px), accent color (orange/blue)

## Interaction Patterns
- **Tap Feedback:** Slight opacity change on card/button press
- **Swipe:** Horizontal swipe for template gallery
- **Pull-to-Refresh:** Vertical pull on Home screen to sync activities
- **Long Press:** Long press on saved post to show share/delete options
- **Haptic Feedback:** Light haptic on button press (iOS/Android)

## Accessibility Considerations
- Sufficient color contrast (white text on dark backgrounds)
- Large touch targets (minimum 44x44 pt)
- Clear labeling for all interactive elements
- Support for system text size scaling
