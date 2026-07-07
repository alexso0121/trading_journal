# Trading Journal App

**A modern full-stack trading journal** built with **Clean Architecture** to help traders professionally track their strategies, trades, performance, and daily insights.

> Live Demo: [https://trading-journal-app.sohin0121.workers.dev](https://trading-journal-app.sohin0121.workers.dev)

---

## Project Highlights

- **Enterprise-grade Clean Architecture** using C# + .NET  with strict layer separation
- **React + TypeScript** modern frontend with rich UI/UX
- **PostgreSQL** with EF Core for robust relational data management
- **Firebase Authentication** + custom claims mapping
- **Optimistic Concurrency Control** using EF Core row versioning
- **Comprehensive Audit Trail** for full traceability
- **TestContainers** for realistic integration testing
- **Cloudflare R2** for scalable image storage
- **Rich Text Editor** with image upload support (Tiptap)
- **React + TypeScript** + modern calendar views
- **CI/CD Automation with GitHub Actions**

---

## Screenshots

**Calendar View for Daily Trade Recording**
![Calendar View](https://github.com/user-attachments/assets/b9cfc974-a0dc-4188-b2bc-e8c143d69913)

**Rich Journal Entry with Image Support**
![Journal Entry](https://github.com/user-attachments/assets/e444afc6-fa8d-46b0-bc45-adb15c3c38da)

**Audit Trail System**
![Audit Trail](https://github.com/user-attachments/assets/ad05927b-cb71-4243-ad5b-8e7c7c0bd9d9)

---

## Architecture

The application is built using **Clean Architecture** (Onion Architecture), ensuring high maintainability, testability, and clear boundaries.

### Layered Structure

| Layer              | Responsibility                              | Key Technologies                     |
|--------------------|---------------------------------------------|--------------------------------------|
| **Api**            | HTTP endpoints, middleware, validation      | ASP.NET Core, Swagger                |
| **Application**    | Business logic, use cases, DTOs             | MediatR, FluentValidation            |
| **Domain**         | Core entities, business rules, invariants  | Pure C#                              |
| **Infrastructure** | Persistence, external services, auth        | EF Core, Firebase, Cloudflare R2     |

**Request Flow**:  
`Controller → Use Case → Repository → EF Core → PostgreSQL`

---

## Key Technical Features

- **Optimistic Concurrency**: Prevents data corruption during concurrent updates
- **Full Audit Trail**: Automatically tracks who changed what and when
- **Rich Journaling**: Tiptap editor with inline image upload to R2
- **Performance Metrics**: Auto-calculated Win Rate, Profit Factor, Expectancy
- **Integration Testing**: Real PostgreSQL using **TestContainers**
- **Scalable Storage**: Cloudflare R2 with presigned URLs

---

## Tech Stack

**Backend**
- .NET 8 + ASP.NET Core
- Entity Framework Core + PostgreSQL
- Clean Architecture + MediatR
- Firebase Authentication
- TestContainers

**Frontend**
- React 18 + TypeScript
- Tiptap Rich Text Editor
- React Big Calendar
- Tailwind CSS

**Infrastructure**
- PostgreSQL
- Cloudflare R2
- Fly.io / Cloudflare Pages

---

## Local Development

**Backend**
```bash
dotnet ef database update
dotnet run --project src/trading_journel_app
