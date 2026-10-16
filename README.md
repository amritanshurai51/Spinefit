# SpineFit (React Native / Expo)

## Run
    npm install
    cp .env.example .env      # put the backend URL
    npx expo start            # press a (Android) or i (iOS), or scan QR with Expo Go

Video + push tokens need a dev build for full features: `npx expo run:android` / `npx expo run:ios`.

## Flow
Welcome (logo, Get Started, "Already member? Login") -> Plans (X top-left closes) -> Login
(Welcome back, Forgot email/password, Create account) -> Tabs: Home, Wellness Tips, Tracker, Favourite, Profile.

## Backend contract (ask backend team to match, or edit src/api/endpoints.ts)
POST /auth/login {email,password} -> {token,user}
POST /auth/register {name,email,password} -> {token,user}
POST /auth/forgot-password {email}
GET  /sessions?q=&category=&days=  -> Session[]   (videoUrl = mp4 or HLS .m3u8)
GET  /sessions/:id | GET /tips | GET /plans
POST/DELETE /favourites/:id
Until the API is live, the app shows mock data automatically. "[dev] Skip login" appears only in dev builds.

## Theme
Light / Dark / System in Profile (src/theme/themes.ts to tweak colours).

## Notifications
Local reminders (steps, water, exercise) respect quiet hours 9PM-7AM (src/services/notifications.ts).
registerForNotifications() returns a push token - send it to the backend for remote push (FCM/APNs).
Remote push on Android/iOS needs FCM + APNs credentials (via EAS).
