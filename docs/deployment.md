# Deployment Guide

## Architecture

- API: Fly.io
- Database: Fly Postgres
- Frontend: Vercel or Cloudflare Pages
- Object storage: Cloudflare R2

## Fly.io API setup

### 1. Create the Fly app

```bash
fly launch --name trading-journel-app-api --no-deploy
```

### 2. Create Fly Postgres

```bash
fly postgres create --name trading-journel-app-db --region sin
```

### 3. Attach Postgres to the API app

```bash
fly postgres attach --app trading-journel-app-api trading-journel-app-db
```

This usually creates `DATABASE_URL`. For this app, also set `ConnectionStrings__TradingJournalDb` explicitly if needed.

### 4. Set Fly secrets

These are runtime secrets for the Fly app. The Docker image does not bake them in; Fly injects them when the container starts.

```bash
fly secrets set \
  ConnectionStrings__TradingJournalDb="Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true" \
  Firebase__ProjectId="your-firebase-project-id" \
  Firebase__CredentialsJsonBase64="$(cat service-account.json | base64 | tr -d '\n')" \
  Cors__AllowedOrigins__0="https://your-frontend-domain.vercel.app" \
  Storage__S3__BucketName="your-r2-bucket" \
  Storage__S3__ServiceUrl="https://<accountid>.r2.cloudflarestorage.com" \
  Storage__S3__AccessKeyId="your-r2-access-key" \
  Storage__S3__SecretAccessKey="your-r2-secret-key" \
  Storage__S3__AuthenticationRegion="auto" \
  Storage__S3__ForcePathStyle="true" \
  Storage__S3__PublicBaseUrl="" \
  Storage__S3__UploadUrlExpiryMinutes="15" \
  Storage__S3__DownloadUrlExpiryMinutes="60" \
  Storage__S3__KeyPrefix="journals"
```

The server can decode `Firebase__CredentialsJsonBase64` directly. You do not need to write the Firebase JSON to a file in the container.

### 5. Deploy API

```bash
fly deploy
```

### 6. Run migrations on Fly

Fly is configured to run migrations as a `release_command` during deploy:

```toml
[deploy]
  release_command = "dotnet trading_journel_app.dll --migrate"
```

That means the migration runs from the new image before Fly promotes the release to live traffic.

For manual troubleshooting, you can still run the same command yourself:

```bash
fly ssh console -a trading-journel-app-api --command "dotnet trading_journel_app.dll --migrate"
```

## Vercel frontend setup

Project root should be:

```text
src/Web
```

Build settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables:

```text
VITE_API_BASE_URL=https://trading-journel-app-api.fly.dev
```

GitHub secrets for workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- repo variable: `VITE_API_BASE_URL`

## Cloudflare Pages frontend setup

You do not need Cloudflare Pages if you are deploying the frontend to Vercel.

If you want the same frontend to work on Cloudflare Pages instead, this repo now includes:

Cloudflare Pages already treats the app as a single-page application when there is no top-level `404.html`, so direct requests like `/calendar` or `/strategies` fall back to the SPA automatically.

Cloudflare Pages settings:

- Framework preset: `Vite`
- Root directory: `src/Web`
- Build command: `npm run build`
- Build output directory: `dist`

Cloudflare Pages env var:

```text
VITE_API_BASE_URL=https://trading-journel-app-api.fly.dev
```

## Cloudflare Worker frontend setup (Wrangler)

If you deploy to a Workers domain (for example `*.workers.dev`) using `wrangler deploy`, use the Wrangler config at `src/Web/wrangler.toml`.

The config pins the Worker name and static asset directory:

- `name = "trading-journal-app"`
- `[assets].directory = "./dist"`
- SPA route fallback with `not_found_handling = "single-page-application"`

Deploy commands:

```bash
cd src/Web
pnpm install
pnpm build
wrangler deploy
```

To disable Wrangler anonymous telemetry in CI/local shell:

```bash
WRANGLER_SEND_METRICS=false
```

If you see "A Worker named \"trading-journal-app\" already exists", it usually means deploy was executed without loading `wrangler.toml` from `src/Web`. Run the command in `src/Web` (or pass `--config src/Web/wrangler.toml`).

## Firebase configuration

For either Vercel or Cloudflare Pages, make sure your Firebase project allows your frontend domain:

- `https://your-app.vercel.app`
- or `https://your-app.pages.dev`
- plus any custom domain you attach

You may also need to add the deployed domain to:

- Firebase Authentication authorized domains
- backend CORS allowed origins on Fly

## GitHub Actions secrets

Required secrets:

- `FLY_API_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required repository variable:

- `VITE_API_BASE_URL`

If you want to manage the API runtime values from GitHub as documentation only, keep them aligned with the Fly secret names listed above. The workflow itself only needs the deploy tokens plus `VITE_API_BASE_URL` for the frontend build.
