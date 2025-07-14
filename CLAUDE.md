# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linda is a React Native app built with Expo that enables users to track the cities where their friends live. It's a privacy-focused friend location tracker that shows locations at the city level rather than exact coordinates.

**Core Features:**
- Phone number authentication with SMS verification
- City-level friend location tracking with map visualization
- Move planning and countdown timers for upcoming relocations
- Friend request system with mutual approval
- Privacy-first design with encrypted location data

## Development Commands

### Core Development
- `npm run dev` - Start development server (uses APP_VARIANT=development)
- `npm run start` - Start Expo development server
- `npm run android` - Run on Android simulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run web version

### Code Quality
- `npm run lint` - Run ESLint and Prettier checks
- `npm run format` - Auto-fix ESLint issues and format code with Prettier
- `npm run test` - Run Jest tests
- `npm run healthcheck` - Run doctor, lint, and test commands

### Build & Deploy
- `npm run prebuild` - Generate native code
- `npm run doctor` - Check Expo environment
- `npm run clean` - Clean node_modules and package-lock.json

## Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 52
- **Routing**: expo-router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Testing**: Jest with React Native Testing Library
- **Error Tracking**: Sentry
- **Maps**: expo-maps
- **Fonts**: SpaceMono font loaded via expo-font

### Project Structure
```
src/
├── app/                    # expo-router pages
│   ├── __tests__/         # Test files
│   │   ├── __snapshots__/
│   │   └── header.test.tsx
│   ├── _layout.tsx        # Root layout with Sentry wrapper
│   ├── global.css         # Global styles
│   ├── index.tsx          # Entry point
│   ├── login/
│   │   └── login.tsx      # Login page
│   └── logged-in/         # Authenticated user pages
│       ├── _layout.tsx    # Auth layout with Header/Footer
│       ├── index.tsx      # Main home (redirects to map)
│       ├── social/
│       │   └── map.tsx    # Map View (core screen)
│       ├── city/
│       │   └── [cityName].tsx  # City Page
│       ├── friends/
│       │   ├── [friendId].tsx  # Friend Page
│       │   └── addFriends.tsx  # Add Friends Page
│       ├── profile/
│       │   ├── +not-found.tsx  # 404 page
│       │   └── [userId].tsx    # Profile Page
│       └── create/
│           └── account.tsx     # Account Creation Page
├── components/            # Reusable components
│   ├── header.tsx
│   └── footer.tsx
│   └── moveModal.tsx
└── assets/               # Images, fonts, etc.
```

### Key Configuration
- **Path Aliases**: Uses TypeScript path mapping (`~/*` for src, `app/*`, `components/*`, `assets/*`)
- **Environment Variants**: Supports development/preview/production builds via APP_VARIANT
- **Bundle Identifiers**: com.jhk.linda (with .dev/.preview suffixes for variants)

### Authentication Architecture
- **Phone-based authentication**: SMS verification only (no email/password)
- Uses expo-router's file-based routing with protected routes
- `logged-in/_layout.tsx` acts as auth guard (currently hardcoded to true)
- Redirects unauthenticated users to `/login`
- New users flow: Login → Account Creation → Map View
- Existing users flow: Login → Map View

### Styling System
- NativeWind for Tailwind CSS classes in React Native
- Global CSS imported in root layout
- Configured for `src/**/*.{js,ts,jsx,tsx}` content paths

### Testing Setup
- Jest with jest-expo preset
- React Native Testing Library
- Coverage reporting enabled
- TypeScript support via ts-jest

## Development Notes

### Known Issues
- Uses deprecated `@testing-library/jest-native` - needs upgrade to react-native-testing-library
- Some babel presets commented out in babel.config.js

### Build Variants
The app supports three build variants controlled by APP_VARIANT:
- `development`: Linda (Dev) - com.jhk.linda.dev
- `preview`: Linda (Preview) - com.jhk.linda.preview  
- `production`: Linda: Connected, Globally - com.jhk.linda

### Maps Integration
- Uses expo-maps for location display
- Android requires GOOGLE_MAPS_API_KEY environment variable
- Configured for city-level location tracking (not exact coordinates)
- **Map Features:**
  - Friend pins with profile pictures and names
  - City pins with friend counts for multiple friends
  - Upcoming move lines with countdown timers
  - Special styling for user's own city pin
  - FAB (Floating Action Button) for adding moves

### Deployment
- EAS Build configured for updates
- Sentry integration for error tracking
- Supports both native and web deployment

## Key User Flows

### Authentication & Onboarding
1. **Login Page**: Phone number + SMS verification
2. **Account Creation** (new users): Name + current city selection
3. **Map View**: Core app experience with friend locations

### Core Features
- **Map View**: Primary interface showing friend locations on world map
- **Add Move**: FAB button opens modal to schedule future moves
- **Friend Management**: Add friends by phone number, manage friend requests
- **City Pages**: View all friends in a specific city
- **Friend Pages**: View individual friend's move history and details
- **Profile**: Manage personal info, move history, and settings

### Privacy & Security
- **Friend-only visibility**: Location data only shared with mutual friends
- **City-level granularity**: No street addresses or GPS coordinates
- **End-to-end encryption**: Location data encrypted on server
- **Automatic move updates**: Scheduled moves update location automatically