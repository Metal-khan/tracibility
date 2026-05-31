# AgriTrace — Traceability for Agricultural Products

AgriTrace is a full-stack platform (Laravel backend + React Native mobile app) that enables product provenance, admin moderation, and QR-based scanning for traceability across the supply chain.

![Repo size](https://img.shields.io/github/repo-size/mujtbabbas/Agritrace)
![Top language](https://img.shields.io/github/languages/top/mujtbabbas/Agritrace)
![License](https://img.shields.io/github/license/mujtbabbas/Agritrace)
![Backend CI](https://github.com/mujtbabbas/Agritrace/actions/workflows/backend-ci.yml/badge.svg)
![Mobile CI](https://github.com/mujtbabbas/Agritrace/actions/workflows/mobile-ci.yml/badge.svg)


## Contents
- `agritrace-backend/` — Laravel API, admin dashboard, and worker scripts.
- `AgriTraceMobileApp/` — React Native (Expo) mobile application used by farmers, buyers, and logistics.

## Highlights
- Product traceability with checkpoints and QR scanning
- Role-based access (admin, farmer, buyer, logistics)
- Moderation workflow for products and reviews
- Mobile-first UX with native device integrations (camera, storage)

## Tech stack
- Backend: PHP 8.x, Laravel
- Mobile: React Native (Expo), TypeScript
- Database: MySQL / MariaDB (configurable)
- Dev tools: Composer, npm/yarn, Artisan, Expo

## Quick start (full stack)
1. Clone the repo:

```bash
git clone https://github.com/mujtbabbas/Agritrace.git
cd Agritrace
```

2. Backend: see `agritrace-backend/README.md` for full setup and commands.
3. Mobile: see `AgriTraceMobileApp/README.md` for setup and running the mobile app.

## Project structure
- `agritrace-backend/` — API, migrations, seeders, admin UI.
- `AgriTraceMobileApp/` — client app, screens, navigation, services.

## Screenshots
Add images to `docs/screenshots/` and reference them below. Example:

![App Home](docs/screenshots/app-home.png)

If you want, I can generate basic placeholder images and add them here.

## Contributing
Please open issues or pull requests. Follow code style in each subproject and run tests where available.

## License
MIT — see license in each subproject if present.

## Contact
Project maintainer: mujtbabbas (GitHub)

## Continuous Integration
Example GitHub Actions workflows live in `.github/workflows/`. A simple CI that runs backend tests and mobile install can look like:

```yaml
name: CI
on: [push, pull_request]
jobs:
	backend-tests:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup PHP
				uses: shivammathur/setup-php@v2
				with:
					php-version: '8.1'
			- run: composer install --no-interaction --prefer-dist
			- run: vendor/bin/phpunit --testsuite=Unit

	mobile-check:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: '16'
			- run: cd AgriTraceMobileApp && npm install
```

## Repo secrets for EAS/Expo
To enable the EAS publish job you must add the following repository secrets in GitHub:

1. Go to `Settings` → `Secrets and variables` → `Actions` in your repository on GitHub.
2. Click `New repository secret` and add:
	- `EAS_TOKEN` — your EAS CLI token (use `eas login` and `eas token:create`).
	- `EXPO_TOKEN` — your Expo token if required.
3. Keep these secrets private. The CI reads them as `${{ secrets.EAS_TOKEN }}` and `${{ secrets.EXPO_TOKEN }}`.

After adding the secrets, tag a commit to trigger the `eas_publish` job (workflow triggers on tag pushes).

