# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo React Native application called "Linda" built with TypeScript and Expo Router for file-based navigation. The project uses Expo SDK 54 with the new architecture enabled and React Compiler experimental features.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Start development server:**
```bash
npx expo start
# or
npm start
```

**Platform-specific commands:**
```bash
npm run android  # Start on Android emulator
npm run ios      # Start on iOS simulator
npm run web      # Start for web
```

**Lint:**
```bash
npm run lint
```

## Architecture

### Routing Architecture

The app uses Expo Router with file-based routing and route protection based on authentication state:

- **Root Layout** (`app/_layout.tsx`): Wraps the entire app with `SessionProvider` and manages route guards
- **Protected Routes**: Routes in `app/(app)/` require authentication (session exists)
- **Public Routes**: `app/sign-in.tsx` is only accessible when not authenticated
- **Route Groups**: The `(app)` directory is a route group (parentheses are excluded from the URL path)

Route guards use `Stack.Protected` with guard conditions that automatically redirect:
- Authenticated users trying to access `/sign-in` are redirected to the app
- Unauthenticated users trying to access app routes are redirected to `/sign-in`

### Authentication Flow

Authentication is managed through a Context API pattern:

1. **SessionProvider** (`components/ctx.tsx`): Provides authentication state and actions
2. **useSession hook**: Accesses authentication context from any component
3. **Storage**: Uses `expo-secure-store` for native platforms and `localStorage` for web
4. **Session State**: Currently a simple string ("true" when signed in, null when signed out)

The authentication implementation in `useStorageState` hook handles platform-specific storage:
- Native (iOS/Android): Uses `expo-secure-store` for encrypted storage
- Web: Uses browser `localStorage`

### Path Aliases

The project uses `@/*` as a path alias that resolves to the project root, configured in `tsconfig.json`. Use this for all imports:

```typescript
import { useSession } from '@/components/ctx';
import { useStorageState } from '@/hooks/useStorageState';
```

## Project Structure

```
app/
├── _layout.tsx           # Root layout with SessionProvider and route guards
├── sign-in.tsx          # Sign-in screen (public route)
└── (app)/               # Protected app routes (route group)
    ├── _layout.tsx      # App layout for authenticated routes
    └── index.tsx        # Main app screen

components/
└── ctx.tsx              # SessionProvider and useSession hook

hooks/
└── useStorageState.ts   # Platform-agnostic persistent storage hook
```

## Key Patterns

### Splash Screen Management

The app uses `expo-splash-screen` to prevent the splash screen from hiding until authentication state is determined:
- `SplashScreen.preventAutoHideAsync()` is called at module level in `app/_layout.tsx`
- Splash screen hides when `isLoading` becomes false (auth state determined)
- Navigation doesn't render until auth state is known

### Storage State Hook

`useStorageState` returns a tuple: `[[isLoading, value], setValue]`
- First render always has `isLoading: true` while fetching from storage
- Automatically syncs in-memory state with persistent storage
- Platform detection happens automatically

### Context Usage

Always use the `use()` hook from React 19 to consume context:
```typescript
const value = use(AuthContext);
```

## Configuration

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Experimental feature enabled
- **Typed Routes**: Expo Router generates TypeScript types for routes
- **TypeScript**: Strict mode enabled
- **Edge-to-Edge**: Enabled on Android
- **Scheme**: `linda://` for deep linking
