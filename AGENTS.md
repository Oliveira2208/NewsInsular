# NewsInsular Agent Guide

## Project Structure

```
NewsInsular/
├── apps/
│   ├── web/          # Next.js 16 (App Router), Tailwind CSS
│   └── mobile/       # Expo (expo-router), NativeWind
├── supabase/
│   ├── migrations/   # SQL migrations (001_initial_schema.sql → 016_fix_news_author_fk.sql)
│   └── functions/    # Edge Functions (send-welcome-email, notify-new-news, etc.)
├── package.json      # Root (pnpm, but NOT a workspace - uses `cd` scripts)
```

Note: The README mentions `packages/` but it doesn't exist. Shared code is in `apps/web/src/`.

## Dev Commands

```bash
# Root level
pnpm dev:web          # Start Next.js (apps/web)
pnpm dev:mobile       # Start Expo (apps/mobile)
pnpm build:web        # Build Next.js for production

# Inside apps/web
next dev              # Dev server
next build            # Production build
next start            # Production server
next lint             # ESLint

# Inside apps/mobile
expo start            # Dev server
expo run:android      # Run on Android
expo run:ios          # Run on iOS
```

## Key Conventions

- **TypeScript strict mode** enabled in both apps
- **Path alias**: `@/*` maps to `apps/web/src/*`
- **ESLint rules disabled**: `react/no-danger`, `@next/next/no-img-element`, `no-unused-vars`
- **Mobile entry**: `expo-router/entry` (not a traditional App.tsx)
- **Venezuelan document validation**: Format is `V|E|P-XXXXXX` (stored in SECURITY.md)

## Auth Architecture

- **better-auth** for authentication (sign in/out, session management)
- **Supabase** for database operations only (NOT for auth)
- Auth client: `lib/auth/client.ts` (use `authClient` for sign-in, sign-out, client session)
- Auth server: `lib/auth/server.ts` (use `getSession()` for server-side validation)
- Admin routes protected by `proxy.ts` using `getSessionCookie` from `better-auth/cookies`

## Installed Libraries

| Library | Purpose |
|---------|---------|
| better-auth | Authentication (replaced Supabase Auth) |
| @tanstack/react-table | Admin data tables |
| chart.js | Admin dashboard charts |
| framer-motion | Animations |
| zustand | Global state management |
| pragmatic-drag-and-drop | Drag and drop for admin |
| hotkeys-js | Keyboard shortcuts |

## Environment Setup

- Web: `apps/web/.env.local` (NEVER commit)
- Mobile: `apps/mobile/.env` (NEVER commit)
- Supabase secrets: `supabase secrets set KEY=value`

## Supabase

```bash
# Push migrations
npx supabase db push

# Deploy edge functions
supabase functions deploy send-welcome-email
supabase functions deploy notify-new-news
supabase functions deploy send-weekly-digest
supabase functions deploy send-custom-email

# Set secrets
supabase secrets set RESEND_API_KEY=your_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Mobile Builds (EAS)

```bash
cd apps/mobile
eas build --platform android
eas build --platform ios
```

Build artifacts are gitignored (`android/`, `ios/`, `build/`, `.eas/`).

## Architecture Notes

- File uploads go to Supabase Storage bucket `news-images` (public read, authenticated write)
- Admin pages use Supabase client (`lib/supabase/server.ts`) for database queries
- Admin routes protected by `apps/web/src/proxy.ts` using better-auth session validation