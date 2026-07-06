# Trading Journal App

A full-stack **trading journal application** built with **Clean Architecture**, designed to help traders track strategies, trades, daily notes, and performance with strong emphasis on **auditability**, **data integrity**, and **concurrent safety**.

## Project Highlights

- **Clean Architecture** with clear separation of concerns
- **Firebase Authentication** + custom token validation
- **Optimistic Concurrency Control** using Entity Framework Core row versioning
- **Comprehensive Audit Trail** for all CRUD operations
- **Integration Tests** with **TestContainers** + PostgreSQL
- **Cloudflare R2** for image storage (screenshots & charts)
- **React + TypeScript** frontend with modern UI
- **EF Core Code-First** with PostgreSQL migrations

---

## Architecture Overview

The backend follows **Clean Architecture** (also known as Onion Architecture), ensuring:

- **Independence** of the Domain layer from frameworks and infrastructure
- **Testability** and maintainability
- **Clear boundaries** between concerns

### Layer Structure

| Layer              | Responsibility                                      | Key Technologies          |
| ------------------ | --------------------------------------------------- | ------------------------- |
| **Api**            | HTTP layer, controllers, middleware, OpenAPI        | ASP.NET Core, Swagger     |
| **Application**    | Business logic, use cases, validation, DTOs         | MediatR, FluentValidation |
| **Domain**         | Core business entities, value objects, domain rules | Pure C#                   |
| **Infrastructure** | Data access, external services, persistence         | EF Core, Firebase, R2     |

**Request Flow:**
Controller → Command/Query → Handler (Use Case) → Repository (Interface) → Repository Impl → EF Core → PostgreSQL

## Core Technical Features

- **Authentication**: Firebase Auth (JWT Bearer) with custom claims mapping
- **Concurrency Control**: Optimistic concurrency using `RowVersion` + `lastKnownVersion` checks (returns 409 Conflict on conflict)
- **Audit Trail**: Automatic logging of all entity changes (CreatedBy, CreatedAt, LastModifiedBy, LastModifiedAt, Original Values)
- **Storage**: Cloudflare R2 for trade screenshots and chart images with presigned URLs
- **Testing**:
  - Unit tests
  - Integration tests using **TestContainers** (real PostgreSQL containers)
- **Database**: PostgreSQL with EF Core migrations and many-to-many relationships
- **Frontend**: React + TypeScript + modern component architecture

---

## Tech Stack

**Backend**

- .NET 10 preview / ASP.NET Core Web API
- Entity Framework Core + Npgsql
- Clean Architecture
- Firebase Admin SDK
- FluentValidation
- TestContainers

**Frontend**

- React 18 + TypeScript
- React Calendar / React Big Calendar
- Tailwind CSS
- Tiptap (Rich Text Editor with image support)

**Infrastructure**

- PostgreSQL
- Cloudflare R2 (Object Storage)
- Docker-ready

---

## Project Structure

```text
src/
├── Api/                    # Controllers, Middleware, Filters
├── Application/            # Use Cases, DTOs, Validators, Interfaces
├── Domain/                 # Entities, Enums, Domain Events, Exceptions
├── Infrastructure/         # EF Core, Repositories, Firebase, R2 Service
└── Web/                    # React + TypeScript Frontend
tests/                      # Integration and repository tests
docs/                       # Architecture and deployment notes
```

## Local Development Setup

### Backend

Update [src/appsettings.Development.json](src/appsettings.Development.json) with your PostgreSQL, Firebase, and R2 settings.

Apply database migrations:

```bash
dotnet ef database update --project src/trading_journel_app.csproj
```

Run the API:

```bash
dotnet run --project src/trading_journel_app.csproj
```

### Frontend

From [src/Web](src/Web):

```bash
npm install
npm run dev
```

Set the frontend API base URL with `VITE_API_BASE_URL` if needed for your environment.

## Deployment Flow

### API on Fly.io

1. Create the Fly app.
2. Create Fly Postgres.
3. Attach or manually configure the PostgreSQL connection string.
4. Set Fly secrets for:

- `ConnectionStrings__TradingJournalDb`
- `Firebase__ProjectId`
- `FIREBASE_CREDENTIALS_JSON`
- `Cors__AllowedOrigins__0`
- `Storage__S3__BucketName`
- `Storage__S3__ServiceUrl`
- `Storage__S3__AccessKeyId`
- `Storage__S3__SecretAccessKey`
- `Storage__S3__AuthenticationRegion`
- `Storage__S3__ForcePathStyle`
- `Storage__S3__PublicBaseUrl`
- `Storage__S3__UploadUrlExpiryMinutes`
- `Storage__S3__DownloadUrlExpiryMinutes`
- `Storage__S3__KeyPrefix`

5. Deploy with `fly deploy`.
6. Run EF Core migrations against the Fly Postgres database.

### Frontend on Vercel

- Project root: [src/Web](src/Web)
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Required env var: `VITE_API_BASE_URL=https://your-fly-api.fly.dev`

### Frontend on Cloudflare Pages

You only need this if you choose Cloudflare Pages instead of Vercel.

- Root directory: [src/Web](src/Web)
- Build command: `npm run build`
- Output directory: `dist`
- Required env var: `VITE_API_BASE_URL=https://your-fly-api.fly.dev`
- SPA routing fallback is already included via [src/Web/public/\_redirects](src/Web/public/_redirects)

### GitHub Actions

The included workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) expects these secrets:

- `FLY_API_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

And this repository variable:

- `VITE_API_BASE_URL`

## Firebase and CORS Checklist

For production, make sure you add your deployed frontend domain to:

- Firebase Authentication authorized domains
- backend CORS allowed origins

## Key Design Decisions

- Optimistic concurrency: prevents silent data loss during concurrent edits
- Auditability: every change is tracked for compliance and debugging
- Image handling: images are stored in Cloudflare R2 with app-managed file references
- Many-to-many relationships: strategies and tags use explicit relational mapping
- Rich journaling: Tiptap editor supports image upload and persisted file references

## Deployment Overview

- API: Fly.io
- Database: Fly Postgres
- Frontend: Vercel
- Optional frontend alternative: Cloudflare Pages
- Object storage: Cloudflare R2

Deployment files included in this repo:

- [Dockerfile](Dockerfile)
- [fly.toml](fly.toml)
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- [src/Web/vercel.json](src/Web/vercel.json)
- [src/Web/public/\_redirects](src/Web/public/_redirects)

For the full step-by-step deployment guide, see [docs/deployment.md](docs/deployment.md).
