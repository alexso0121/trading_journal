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

You should run the EF Core migrations against the Fly Postgres database after the first deploy.

One straightforward approach is:

```bash
fly ssh console -a trading-journel-app-api
./trading_journel_app --help
```

If you prefer, add a dedicated migration command later. Right now migrations are not auto-run in the container.

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

- `src/Web/public/_redirects`

That file is required because the app uses `BrowserRouter`, and direct requests like `/calendar` or `/strategies` must fall back to `index.html`.

Cloudflare Pages settings:

- Framework preset: `Vite`
- Root directory: `src/Web`
- Build command: `npm run build`
- Build output directory: `dist`

Cloudflare Pages env var:

```text
VITE_API_BASE_URL=https://trading-journel-app-api.fly.dev
```

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
