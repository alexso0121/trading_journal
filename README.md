# trading_journel_app

ASP.NET Core Web API for a trading journal app with PostgreSQL, EF Core, Swagger, and Firebase Admin authentication.

## Tech stack

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Swagger UI
- Firebase Admin SDK

## Features

- Trades CRUD
- Strategies CRUD
- Daily journals CRUD
- Firebase token-protected strategy and journal endpoints
- Swagger UI at `/swagger`

## Database and Firebase config

The app reads PostgreSQL and Firebase settings from `appsettings.json` / `appsettings.Development.json`.

```json
"Firebase": {
  "ProjectId": "your-firebase-project-id",
  "CredentialsPath": "C:\\path\\to\\firebase-service-account.json"
}
```

## Setup

1. Create the PostgreSQL database named `users`.
2. Set Firebase `ProjectId` and `CredentialsPath` in appsettings.
3. Run migrations:

```bash
dotnet ef database update
```

4. Start the app:

```bash
dotnet run
```

## Frontend app (React)

Frontend path: `src\Web`

1. Copy `src/Web/.env.example` to `src/Web/.env` and set Firebase web config values.
2. Ensure backend API base url matches `VITE_API_BASE_URL` (default `http://localhost:5116`).
3. Run frontend:

```bash
cd src\Web
npm install
npm run dev
```

## API endpoints

- `POST /api/trades`
- `GET /api/trades`
- `GET /api/trades/{id}`
- `PUT /api/trades/{id}`
- `DELETE /api/trades/{id}?lastKnownVersion=...`
- `POST /api/strategies`
- `GET /api/strategies`
- `GET /api/strategies/{id}`
- `PUT /api/strategies/{id}`
- `DELETE /api/strategies/{id}?lastKnownVersion=...`
- `POST /api/dailyjournals`
- `GET /api/dailyjournals`
- `GET /api/dailyjournals/{id}`
- `PUT /api/dailyjournals/{id}`
- `DELETE /api/dailyjournals/{id}`

## Notes

- Delete strategy is blocked when trades still reference it.
- Send Firebase ID token in `Authorization: Bearer <id-token>`.
- The backend derives a stable internal GUID from the Firebase UID if the token does not include a GUID claim.
- Trade and strategy updates/deletes use optimistic concurrency with `version` + `LastKnownVersion` / `lastKnownVersion`.
- Swagger is enabled in development.
- React frontend includes Firebase login page, strategy page, and trade page with table/calendar views.
