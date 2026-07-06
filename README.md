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
text---

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

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core + Npgsql
- Clean Architecture
- Firebase Admin SDK
- FluentValidation + MediatR
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

Local Development Setup
Backend

Update appsettings.Development.json with your PostgreSQL connection string and Firebase settings.
Apply database migrations:

Bashdotnet ef database update --project src/trading_journel_app

Run the API:

Bashdotnet run --project src/trading_journel_app
Frontend
Bashcd src/Web
cp .env.example .env
npm install
npm run dev

Key Design Decisions

Optimistic Concurrency: Prevents silent data loss during concurrent edits
Auditability: Every change is tracked for compliance and debugging
Image Handling: Screenshots stored in R2 with clean URL generation
Many-to-Many Relationships: Between Strategies and Trades
Rich Journaling: Tiptap editor with image upload support
```
