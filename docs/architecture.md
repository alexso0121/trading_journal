# Trading Journal Architecture

## Overview

Trading Journal is a full-stack trading log application built with:

- **Frontend**: React + Vite + TypeScript + Tailwind
- **Backend**: ASP.NET Core Web API
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Auth**: Firebase Admin SDK

The backend follows a layered architecture with a small Clean Architecture style split:

1. **API layer** for HTTP endpoints
2. **Application layer** for use cases and validation
3. **Domain layer** for business entities and rules
4. **Infrastructure layer** for persistence, Firebase auth, and external integrations

## High-level flow

1. React calls the API with a Firebase ID token.
2. The API validates the Firebase token through a custom authentication handler.
3. The authenticated user is mapped to a stable internal user id.
4. Application use cases execute business logic.
5. Repositories load and save data through EF Core.
6. The database persists strategies, trades, and daily journals.

## Backend structure

### API

Responsibilities:

- Expose REST endpoints
- Handle HTTP status codes
- Read the current authenticated user
- Return DTOs and conflict responses

Main controllers:

- `TradesController`
- `StrategiesController`
- `DailyJournalsController`

### Application

Responsibilities:

- Orchestrate use cases
- Apply validation rules
- Map entities to response models
- Enforce user-scoped queries
- Handle optimistic concurrency results

Patterns used:

- **Use Case pattern**
- **Repository pattern**
- **Unit of Work**
- **FluentValidation**
- **DTO mapping**

### Domain

Responsibilities:

- Store business entities and invariants
- Keep write rules close to the model
- Own state mutation methods such as `Create` and `Update`

Important entities:

- `Trade`
- `Strategy`
- `DailyJournal`

### Infrastructure

Responsibilities:

- EF Core DbContext and table mappings
- Repository implementations
- Firebase Admin authentication
- PostgreSQL connection
- Audit log interception and persistence

## Data model

### Strategy

- Belongs to a user
- Has many trades
- Uses `Version` for optimistic concurrency

### Trade

- Belongs to a user
- Belongs to one strategy
- Uses `Version` for optimistic concurrency

### DailyJournal

- Belongs to a user
- Stores daily reflections

### AuditLogEntry

- Stores append-only change history
- Captures entity type, entity id, user id, event type, version, and JSON payload
- Written automatically from the EF Core save pipeline

## Authentication

Firebase authentication is handled server-side with Firebase Admin SDK.

Flow:

1. Frontend signs in with Firebase
2. Frontend sends Firebase ID token as bearer token
3. Backend verifies token
4. Backend creates a claims principal
5. Controllers resolve the current user from claims

## Concurrency

The app uses **optimistic concurrency** with an explicit `version` column on:

- `strategies`
- `trades`

Write requests must provide the last known version.

If the version is stale, the API returns `409 Conflict`.

## Audit logging

The app uses a lightweight event/audit model instead of full event sourcing.

Flow:

1. A write request changes a domain entity.
2. EF Core tracks the entity state.
3. A `SaveChangesInterceptor` creates an `audit_logs` row.
4. The audit row is saved in the same transaction as the business change.

This gives:

- traceability
- a historical record of writes
- a clear path toward future event sourcing or outbox processing

## Notable backend technologies


- **ASP.NET Core Web API**
- **Entity Framework Core**
- **PostgreSQL**
- **Firebase Admin SDK**
- **FluentValidation**
- **Swagger / OpenAPI**
- **Dependency Injection**
- **Repository + Unit of Work**
- **Optimistic Concurrency**
- **RESTful API design**
- **Claims-based authentication**

## Folder summary

- `src/Api` - controllers and HTTP concerns
- `src/Application` - use cases, DTOs, validators, repository interfaces
- `src/Domain` - entities and enums
- `src/Infrastructure` - persistence, repositories, Firebase auth

## Frontend overview

- Firebase Google login
- Protected routes
- Strategies CRUD page
- Trades page with table view and calendar view
- Token-based API client

## Next improvements

- Add integration tests for auth and CRUD
- Add dashboard metrics
- Add trade filters and analytics
- Add deployment configuration for frontend and backend
