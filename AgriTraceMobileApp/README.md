# AgriTrace Mobile App

This directory contains the AgriTrace mobile client built with React Native and Expo. It provides the mobile UX for farmers, buyers, and logistics teams to scan products, view provenance, and manage listings.

## Tech
- React Native (Expo)
- TypeScript
- Navigation: React Navigation

## Prerequisites
- Node 16+ (use Node Version Manager `nvm` if needed)
- npm or yarn
- Expo CLI (optional global install): `npm install -g expo-cli`

## Setup
1. Install dependencies:

```bash
cd AgriTraceMobileApp
npm install
# or
yarn install
```

2. Start development server:

```bash
npm start
# then run on device/emulator via Expo
```

3. Common run commands:

- `npm run android` — start and open Android emulator (Expo)
- `npm run ios` — start and open iOS simulator (macOS only)
- `npm run web` — run web build

## Environment
Copy any environment template files and set API endpoints (point to backend `APP_URL`):

```bash
# create .env or use app config
```

## Build for production
Follow Expo build/publish docs or use `eas` if configured.

## Troubleshooting
- If assets fail to load, clear cache: `expo start -c` or `npm start -- --clear`
- For dependency issues, remove `node_modules` and reinstall.

## Contributing
Follow TypeScript rules and run linter/tests if present. Keep UI and API contract changes in sync with backend.

## Contact
Maintainer: mujtbabbas (GitHub)

## Screenshots
Place screenshots in `docs/screenshots/mobile/` and reference them like:

![Mobile Home](docs/screenshots/mobile/home.png)

## Example CI (GitHub Actions)
Simple workflow to install and run TypeScript checks:

```yaml
name: Mobile CI
on: [push, pull_request]
jobs:
	test:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: actions/setup-node@v4
				with:
					node-version: '16'
			- run: npm ci
				working-directory: ./AgriTraceMobileApp
			- run: npm run lint
				working-directory: ./AgriTraceMobileApp
```

## EAS / Expo secrets
To allow CI to publish builds with EAS, add these secrets in your GitHub repository settings:

- `EAS_TOKEN` — generated from `eas token:create` (or via `eas login` instructions)
- `EXPO_TOKEN` — optional, for Expo services

Add them at: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

The CI workflow reads these values as `${{ secrets.EAS_TOKEN }}` and `${{ secrets.EXPO_TOKEN }}`.


