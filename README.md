# ArtworkApp Mobile

React Native app using Expo SDK 54.

## Run on a physical phone

1. Install an Expo Go version compatible with SDK 54 on the phone. If Expo Go reports an SDK mismatch, use a development build.
2. Connect the phone and computer to the same Wi-Fi network.
3. From this directory, install dependencies if needed and start Expo:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the terminal's QR code with Expo Go.

Expo SDK 54 requires Node.js 20.19 or newer. See [Expo's environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/).

## Run in a simulator

- **iOS:** Install full Xcode 16.1 or newer and an iOS Simulator. Xcode Command Line Tools alone are insufficient.
- **Android:** Install Android Studio, Android SDK Platform 36, Android Emulator, and Platform Tools. Configure `ANDROID_HOME` and ensure `adb` is on `PATH`.

Then start Expo with `npx expo start` and press `i` for the iOS Simulator or `a` for the Android Emulator.

## Backend access from a phone

When backend integration is added, configure the API URL with an address reachable from the phone. `localhost` on a phone refers to the phone itself, not the development computer.

The current app is an Expo starter screen; the artwork listing is not implemented yet.
