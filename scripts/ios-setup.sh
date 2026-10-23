#!/usr/bin/env bash
# One-time creation of the native iOS project. Run on a Mac with Xcode installed.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname)" != "Darwin" ]]; then
  echo "The iOS project can only be created on macOS with Xcode installed." >&2
  exit 1
fi

npm run build
if [[ ! -d ios ]]; then
  npx cap add ios
fi
npx cap sync ios
echo "Done. Open the project with: npm run ios:open"
