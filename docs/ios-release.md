# Releasing on the App Store

The game is a Vite web build wrapped in a native iOS shell with
[Capacitor](https://capacitorjs.com/). You need a Mac with a current Xcode
and an Apple Developer account.

## First-time setup

```sh
npm ci
./scripts/ios-setup.sh      # builds the web app and runs `npx cap add ios`
npm run ios:open            # opens ios/App in Xcode
```

The app id is `com.elijahthinks.offmylawn` (see `capacitor.config.ts`).
Change it before your first upload if you publish under another team.

In Xcode, on the **App** target:

1. **Signing & Capabilities**: choose your team.
2. **General → Deployment Info**: iPhone and iPad; untick *Portrait* and
   *Upside Down* so the game is landscape only.
3. **General → Deployment Info**: tick *Requires full screen* and hide the
   status bar.
4. **App Icons**: add a 1024×1024 icon (the source shape is `public/icon.svg`).

## Every release

```sh
npm version patch           # bumps package.json
npm run ios:sync            # web build + copy into the iOS project
```

Then in Xcode: bump *Version* and *Build*, **Product → Archive**, and upload
through the Organizer. Finish the listing in App Store Connect.

## App Store notes

- **Privacy**: the app collects no data. Progress is stored on the device
  only. Answer "Data Not Collected" in the privacy questionnaire.
- **Age rating**: cartoon slapstick, no violence: rabbits run away, they are
  never hurt. This should rate 4+.
- **Guideline 4.2 (minimum functionality)**: the game is fully offline, ships
  its own fonts and sounds, and has 15 levels, which keeps it clear of the
  "repackaged website" rejection.
- Test on a real device before submitting; Web Audio only starts after the
  first touch on iOS, which the game handles.
