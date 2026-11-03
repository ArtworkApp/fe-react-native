# ArtworkApp Mobile

React Native app using Expo SDK 57.

## Run on a physical phone

1. Install an Expo Go version compatible with SDK 57 on the phone. See [Expo Go version guidance](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) if it reports an SDK mismatch.
2. Connect the phone and computer to the same Wi-Fi network.
3. From this directory, install dependencies if needed and start Expo:

   ```bash
   npm install
   npm start
   ```

4. Scan the terminal's QR code with Expo Go. The app opens at the home route (`/`); tap **Browse Art** to open `/artworks`.

`npm start` checks the Expo CLI session first and runs interactive `expo login` when needed. Enter your credentials in the terminal, using the same Expo account as Expo Go. The full-stack VS Code task also uses `npm start`, so login happens in the dev container that runs Metro. Later starts skip login while that CLI session remains signed in. `npx expo start` bypasses this check.

Use Node.js 22.13+ on the Node 22 line or 24.3+ on the Node 24 line for SDK 57. See [Expo's SDK reference](https://docs.expo.dev/versions/latest/).

## Run in a simulator

- **iOS:** Install full Xcode 26.4 or newer and an iOS Simulator. Xcode Command Line Tools alone are insufficient.
- **Android:** Install Android Studio, Android SDK Platform 36, Android Emulator, and Platform Tools. Configure `ANDROID_HOME` and ensure `adb` is on `PATH`.

Then start Expo with `npx expo start` and press `i` for the iOS Simulator or `a` for the Android Emulator.

## Backend access from a phone

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the backend's `/api/v1` URL. Use your computer's LAN IP for a physical phone (for example, `http://192.168.1.8:3001/api/v1`). The phone and computer must share a network, and port 3001 must be reachable. For an Android emulator, use `http://10.0.2.2:3001/api/v1`; for an iOS simulator, use `http://localhost:3001/api/v1`. Restart Expo after changing the value.

The home screen links to public artwork browsing and email sign-in. `/login` and `/register` send mobile credentials to the backend; a successful response opens the guarded `/account` screen. This step keeps the session in memory only. Secure storage, restart recovery, refresh, and logout belong to MO-02. The `/artworks` route loads the first 21 available artworks. Images use the backend image endpoint, which streams files from MinIO; the app does not connect to MinIO directly. Start and seed the backend and MinIO before testing images.

Route tests live in `test/` because Expo Router treats files in `src/app/` as routes.

Run `npm test` for unit and component tests, and `npm run typecheck` for TypeScript validation.

## Code organization and refactoring preferences

- Keep each function at one level of abstraction. Workflow functions should call named steps; request construction, `fetch`, JSON decoding, validation, and state updates belong in focused functions rather than being interleaved with orchestration.
- Keep HTTP transport separate from pure rules and UI. Forms receive an `onSubmit` callback; an Expo Router screen connects that callback to the API client. The form passes a successful session to `onAuthenticated` for session handling.
- Put pure feature rules in feature directories such as `src/auth/` and visual components in `src/components/`. Organize by responsibility instead of adding folders solely to hold one file.
- Use custom hooks for React stateful workflows. Functions inside a hook are appropriate when they need its form state, refs, or callbacks; move logic that needs none of those to a module-level pure function.
- Keep `StyleSheet.create` beside a view when its styles are local to that view. Extract styles when multiple components share them or the view becomes hard to scan.
- Follow the Red → Green → Refactor cycle in `AGENTS.md`. Complete and test each behavior slice before requesting review of the next slice.
