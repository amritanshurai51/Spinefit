# SpineFit (React Native / Expo)

## Run
    npm install
    cp .env.example .env      # put the backend URL
    npx expo start            # press a (Android) or i (iOS), or scan QR with Expo Go

Video + push tokens need a dev build for full features: `npx expo run:android` / `npx expo run:ios`.

## Legal documents

Edit the source HTML in `src/assets/legal/`:

- `user-agreement.html` → `legalDocuments.userAgreement`
- `terms-of-service.html` → `legalDocuments.termsOfService`
- `privacy-policy.html` → `legalDocuments.privacyPolicy`

Signup and Profile display these documents offline through `LegalDocumentModal`.
`src/assets/legalDocuments.ts` is generated from the HTML. Metro synchronizes it
on startup for development and builds. After editing HTML while Metro is already
running, run `npm run legal:sync` or restart Metro. Use `npm run legal:check` to
verify that the bundled content matches all three source files.

Links inside the documents open in the browser or email app. The hosted Google
Sites policies and account-deletion instructions are separate published copies;
updating the bundled HTML does not publish changes to those pages. Health Connect
uses the hosted Privacy Policy URL configured in `app.json` and `src/config.ts`.

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
