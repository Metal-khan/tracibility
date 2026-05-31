# AgriTrace — Backend (Laravel)

This service provides the REST API, admin dashboard, background jobs, and database schema for the AgriTrace platform.

## Key features
- REST API for products, reviews, users, scans, and analytics
- Role-based admin and moderation panels
- QR scanning endpoints and checkpoint recording
- Migrations, seeders, and test suites for local development

## Quick environment / requirements
- PHP 8.1 or later
- Composer
- MySQL / MariaDB
- Node.js and npm (for asset building)
- Redis (optional — for queues/cache)

## Setup (local)
1. Copy environment file and set values:

```bash
cp .env.example .env
# edit .env (DB_*, APP_URL, MAIL_*, etc.)
```

2. Install PHP dependencies and node packages:

```bash
composer install --no-interaction --prefer-dist
cd public && npm install && cd ..
```

3. Generate application key, migrate and seed:

```bash
php artisan key:generate
php artisan migrate --seed
```

4. (Optional) Create symbolic link for storage:

```bash
php artisan storage:link
```

5. Run local server and queue worker:

```bash
php artisan serve --host=0.0.0.0 --port=8000
php artisan queue:work
```

## Environment variables (important)
- `APP_URL` — base URL for the app
- `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `MAIL_*` — mail driver / credentials
- `QUEUE_CONNECTION` — e.g., `sync` or `redis`
- `SANCTUM_STATEFUL_DOMAINS` / `SESSION_DOMAIN` — for SPA / mobile auth

## Tests

Run the test suite with PHPUnit:

```bash
./vendor/bin/phpunit
```

## Useful artisan commands
- `php artisan migrate` — run migrations
- `php artisan db:seed` — run seeders
- `php artisan route:list` — list routes
- `php artisan tinker` — interactive REPL

## API notes
The API mounts under `/api` (see `routes/api.php`). Authentication uses Laravel Sanctum for API tokens. Refer to `routes/api.php` and controller docs for available endpoints.

## API Examples
Authenticate and use the API with a bearer token (example):

1) Login to get token:

```bash
curl -X POST "${APP_URL:=http://localhost:8000}/api/auth/login" \
	-H "Content-Type: application/json" \
	-d '{"email":"admin@example.com","password":"secret"}'
```

2) Get products (using token):

```bash
curl "${APP_URL}/api/products" -H "Authorization: Bearer <TOKEN>"
```

3) Record a scan (example):

```bash
curl -X POST "${APP_URL}/api/scans" -H "Authorization: Bearer <TOKEN>" -d '{"product_id":123,"checkpoint":{"lat":12.34,"lng":56.78}}'
```

Update the URLs and payloads to match your backend routes and auth responses.

## CI / GitHub Actions (example)
Add a workflow to run PHP CS checks and PHPUnit on PRs:

```yaml
name: Backend CI
on: [push, pull_request]
jobs:
	test:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: shivammathur/setup-php@v2
				with:
					php-version: '8.1'
			- run: composer install --no-interaction
			- run: vendor/bin/phpunit --coverage-text
```

## Badges
You can show workflow status badges in your README. Example links for this repo:

- Backend CI badge: `https://github.com/mujtbabbas/Agritrace/actions/workflows/backend-ci.yml/badge.svg`
- Mobile CI badge: `https://github.com/mujtbabbas/Agritrace/actions/workflows/mobile-ci.yml/badge.svg`


## Deployment hints
- Use environment variables, do not commit `.env`.
- Run composer install with `--optimize-autoloader --no-dev` in production.
- Build front-end assets and place them in `public/`.
- Configure supervisor to run `php artisan queue:work`.

## Contributing
Please open issues and PRs. Follow PSR-12 for PHP code style and run tests locally before submitting.

## Contact
Maintainer: mujtbabbas (GitHub)

