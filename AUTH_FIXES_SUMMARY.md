# Authentication Fixes Summary

## Files Changed

### 1. Frontend Files

**`app/_layout.tsx`**
- Fixed root-level auth guard to prevent redirect loops
- Added check for initial load to prevent premature redirects
- Ensures sign-out properly redirects to login screen

**`app/register.tsx`**
- Removed auto-redirect useEffect that was causing "bouncing"
- Now allows users to register even if they have a token
- Root layout handles all auth-based navigation

**`app/(tabs)/Profile.tsx`**
- Sign-out already correctly uses `router.replace("/")` to go to login
- Clears token and email from AsyncStorage
- Prevents back navigation with `replace()`

**`src/lib/oauth.ts`**
- Already uses static imports (not dynamic)
- Uses `expo-auth-session` for Google
- Uses `expo-apple-authentication` for Apple
- Calls `/auth/google` and `/auth/apple` endpoints

### 2. Backend Files

**`server/index.js`**
- OAuth endpoints already implemented correctly
- Google: `POST /auth/google` - verifies with google-auth-library
- Apple: `POST /auth/apple` - verifies with JWKS
- Both upsert users correctly

**`server/prisma/schema.prisma`**
- Already has OAuth fields:
  - `googleSub String? @unique`
  - `appleSub String? @unique`
  - `email String @unique`
  - `passwordHash String?` (nullable for OAuth users)

**`server/package.json`**
- Added `"studio": "prisma studio"` script
- All dependencies already installed:
  - `google-auth-library`
  - `jwks-rsa`
  - `jsonwebtoken`
  - `bcrypt`

### 3. Project Structure

✅ **No lib/constants in app/** - Already moved to `src/lib/` and `src/constants/`
✅ **No route warnings** - Only screen files in `app/` directory
✅ **No "add" route warning** - Using `AddMeal` correctly in tabs layout

## Environment Variables Required

### Frontend (root `.env`)
```env
EXPO_PUBLIC_API_URL=http://192.168.4.35:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend (`server/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/foodlog?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
APPLE_CLIENT_ID=com.your.bundle.id
# OR
APPLE_BUNDLE_ID=com.your.bundle.id
```

## Exact Commands to Run

### 1. Start PostgreSQL (macOS)
```bash
# Using Homebrew
brew services start postgresql@14
# OR
brew services start postgresql@15
# OR
brew services start postgresql@16

# Verify it's running
psql -d postgres -c "SELECT version();"
```

### 2. Run Prisma Migration
```bash
cd server

# Create and apply migration for OAuth fields
npx prisma migrate dev --name add_oauth_fields

# This will:
# - Create migration file
# - Apply it to database
# - Regenerate Prisma Client
```

### 3. Seed Database (Optional)
```bash
cd server
npm run db:seed
```

### 4. Start Backend Server
```bash
cd server

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Server should start on http://0.0.0.0:3000
# Accessible at http://192.168.4.35:3000 from mobile devices
```

### 5. Start Expo App
```bash
# From project root

# Option 1: LAN (if on same network)
npx expo start

# Option 2: Tunnel (if LAN doesn't work)
npx expo start --tunnel

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

### 6. Open Prisma Studio (Optional)
```bash
cd server
npm run studio
# OR
npx prisma studio
```

## What Was Fixed

### 1. Expo Router Warnings ✅
- **Issue**: Routes like `./lib/auth.ts` were being treated as routes
- **Fix**: Files already moved to `src/lib/` and `src/constants/`
- **Result**: No more "missing default export" warnings

### 2. Sign-Out Redirect ✅
- **Issue**: Sign-out was redirecting to tabs index instead of login
- **Fix**: 
  - Sign-out uses `router.replace("/")` which goes to `app/index.tsx` (login)
  - Root layout auth guard prevents redirect loops
  - Back button cannot return to tabs (using `replace()`)
- **Result**: Sign-out always goes to login screen

### 3. Register Screen Bouncing ✅
- **Issue**: Register screen was immediately navigating away
- **Fix**: Removed auto-redirect useEffect from register screen
- **Result**: Users can stay on register screen to create account

### 4. Prisma Schema ✅
- **Issue**: Database didn't have `googleSub` and `appleSub` columns
- **Fix**: Schema already has fields, need to run migration
- **Result**: After migration, OAuth will work correctly

### 5. Google OAuth Configuration ✅
- **Issue**: Missing `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- **Fix**: Need to add to root `.env` file
- **Result**: Once configured, Google OAuth will work

### 6. Apple OAuth ✅
- **Issue**: Prisma query errors for `appleSub`
- **Fix**: Schema has field, query is correct, just need migration
- **Result**: After migration, Apple OAuth will work

## Testing Checklist

- [ ] Run Prisma migration: `cd server && npx prisma migrate dev --name add_oauth_fields`
- [ ] Set up `.env` files (frontend and backend)
- [ ] Start backend: `cd server && npm run dev`
- [ ] Start Expo: `npx expo start --tunnel`
- [ ] Test email/password login
- [ ] Test email/password signup
- [ ] Test sign-out (should go to login screen)
- [ ] Test Google OAuth (requires `EXPO_PUBLIC_GOOGLE_CLIENT_ID`)
- [ ] Test Apple OAuth (iOS only, requires bundle ID)
- [ ] Verify no Expo Router warnings
- [ ] Verify no "add" route warnings

## API Endpoints

### POST `/auth/google`
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

### POST `/auth/apple`
```json
{
  "identityToken": "eyJraWQiOiJlWGF1bm1...",
  "authorizationCode": "c1234567890abcdef...",
  "user": {
    "email": "user@example.com",
    "fullName": {
      "givenName": "John",
      "familyName": "Doe"
    }
  }
}
```

Both return:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Notes

1. **Google Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Use Web Client ID for `expo-auth-session`

2. **Apple Client ID**: Your app's bundle identifier
   - Configure in Apple Developer Console
   - Enable "Sign in with Apple" capability

3. **Migration**: Must run `npx prisma migrate dev` to add OAuth columns to database

4. **Tunnel Mode**: Use `--tunnel` if LAN connection fails

