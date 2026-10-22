# SpineFit (React Native / Expo)

## Run
    npm install
    cp .env.example .env      # put the backend URL
    npx expo start            # press a (Android) or i (iOS), or scan QR with Expo Go

Video + push tokens need a dev build for full features: `npx expo run:android` / `npx expo run:ios`.

## Flow
Welcome (logo, Get Started, "Already member? Login") -> Plans (X top-left closes) -> Login
(Welcome back, Forgot email/password, Create account) -> Tabs: Home, Wellness Tips, Tracker, Favourite, Profile.

## Backend and authentication
Email/password sign-in, account creation, and password reset use Firebase Authentication.
Set the Firebase web config values in `src/config.ts` before running the app.

The API base URL and video/profile/favourite endpoints are defined in `src/config.ts` and
`src/api/endpoints.ts`. Authenticated API requests use a current Firebase ID token.
Wellness tips and plans remain static in-app data because the backend does not provide those endpoints.

## Theme
Light / Dark / System in Profile (src/theme/themes.ts to tweak colours).

## Notifications
Local reminders (steps, water, exercise) respect quiet hours 9PM-7AM (src/services/notifications.ts).
registerForNotifications() returns a push token - send it to the backend for remote push (FCM/APNs).
Remote push on Android/iOS needs FCM + APNs credentials (via EAS).
