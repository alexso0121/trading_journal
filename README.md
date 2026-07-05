# Trading Journal App

Backend API for a trading journal system where authenticated users can manage strategies, trades, and daily notes with auditability and concurrency safety.


**What problems it solves:**
1. Keeps each user's trading activity organized (strategies, trades, daily journals).
2. Prevents silent overwrite issues during concurrent updates (`Version` + `lastKnownVersion` checks).
3. Improves traceability with automatic audit logs on create/update/delete operations.

## Architecture overview

The codebase follows a clean/layered style:

- **Api layer (`src\Api`)**: HTTP controllers, request/response wiring, auth gates.
- **Application layer (`src\Application`)**: use cases, validators, orchestration, repository contracts.
- **Domain layer (`src\Domain`)**: core entities and domain invariants.
- **Infrastructure layer (`src\Infrastructure`)**: EF Core DbContext, repository implementations, authentication handler, persistence configuration.

### Request flow

`Controller` -> `UseCase` -> `Repository interface` -> `Repository implementation` -> `EF Core DbContext` -> `PostgreSQL`

### Project structure

```text
src
├─ Api
│  ├─ Controllers
│  └─ Authentication
├─ Application
│  ├─ Features
│  ├─ DependencyInjection
│  └─ Repositories
├─ Domain
│  ├─ Entities
│  └─ Enums
├─ Infrastructure
│  ├─ Authentication
│  ├─ DependencyInjection
│  ├─ Persistence
│  └─ Repositories
├─ Program.cs
└─ appsettings*.json
```

## Core design decisions

- **Authentication**: custom Firebase authentication handler validates bearer tokens and builds user claims.
- **User mapping**: if token claim is not a GUID, backend creates a stable GUID from Firebase UID.
- **Concurrency control**: trade and strategy update/delete flows return `409 Conflict` when versions mismatch.
- **Audit logging**: `AuditLogInterceptor` captures added/updated/deleted entity payloads during `SaveChanges`.
- **Domain integrity**: entities enforce invariants (required fields, value bounds, lifecycle rules).

## Tech stack

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core (Npgsql provider)
- PostgreSQL
- Firebase Admin SDK (token verification)
- FluentValidation
- Swagger/OpenAPI

## Configuration

The backend reads values from:

- `src\appsettings.json`
- `src\appsettings.Development.json`

Required sections:

```json
{
  "ConnectionStrings": {
    "TradingJournalDb": "Host=localhost;Port=5432;Database=users;Username=app_user;Password=12345678"
  },
  "Firebase": {
    "ProjectId": "your-firebase-project-id",
    "CredentialsPath": "C:\\path\\to\\firebase-service-account.json"
  }
}
```

## Local setup

1. Create a PostgreSQL database (example: `users`).
2. Set `ConnectionStrings:TradingJournalDb`.
3. Set Firebase `ProjectId` and `CredentialsPath`.
4. Apply migrations:

```bash
dotnet ef database update --project src\trading_journel_app.csproj
```

5. Run the API:

```bash
dotnet run --project src\trading_journel_app.csproj
```

Swagger is available at `/swagger` in Development.

## Frontend (React)

Frontend path: `src\Web`

1. Copy `src\Web\.env.example` to `src\Web\.env`.
2. Set Firebase web config values.
3. Set `VITE_API_BASE_URL` (default `http://localhost:5116`).
4. Start frontend:

```bash
cd src\Web
npm install
npm run dev
```

## API surface

- **Trades**: `POST/GET/GET by id/PUT/DELETE`
  - `DELETE /api/trades/{id}?lastKnownVersion=...`
- **Strategies**: `POST/GET/GET by id/PUT/DELETE`
  - `DELETE /api/strategies/{id}?lastKnownVersion=...`
- **Daily Journals**: `POST/GET/GET by id/PUT/DELETE`

All endpoints are protected with bearer auth.

## Business rules and notes

- Strategy deletion is blocked while related trades exist.
- Use `Authorization: Bearer <firebase-id-token>`.
- Swagger only in development mode.
