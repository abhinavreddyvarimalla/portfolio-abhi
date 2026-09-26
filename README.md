# AI assistant update

Start with **AI-START-HERE.md** for the new LangChain + LangGraph assistant. It uses an optional Python service and local Ollama model alongside the existing Spring Boot/PostgreSQL setup. The browser-only retrieval demo still works without any AI service. CrewAI is not implemented.

# Abhinav Portfolio — React + Spring Boot + PostgreSQL

This version keeps the approved design and connects its Product API playground to a real backend. The public profile and projects remain frontend content. The product playground is separate from the résumé projects.

## Windows quick start (recommended)

You already have Node.js. Install/start Docker Desktop with Linux containers and Docker Compose available. Extract this ZIP into a new folder; do not merge it with the earlier React folder. Open the folder containing `compose.yaml` in VS Code.

Terminal 1, at the project root:

```powershell
docker compose up --build -d
docker compose logs -f api
```

First startup downloads Java/Maven dependencies and PostgreSQL. Wait for `Started PortfolioApplication`. Ctrl+C exits the log view; containers keep running.

Terminal 2, also initially at the project root:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:5173. In the playground, select **Create product**, submit a valid name and price, copy the returned ID, then select **Find by ID** and look it up. Refresh the page and look it up again: it remains in PostgreSQL. Products are created on every successful POST; retrying a POST can create another row.

The API health endpoint is http://localhost:8080/actuator/health. `UP` means the application and database health check are working. List products directly at http://localhost:8080/api/products.

## Stop/restart without losing data

From the root folder:

```powershell
docker compose stop
docker compose start
```

PostgreSQL data is stored in a named Docker volume. `docker compose down` also keeps that volume. Do not add `-v` unless you intend to delete your database.

## What is implemented

- Java 17, Spring Boot 3.5.16, Spring MVC, Spring Data JPA
- PostgreSQL 17 and Flyway schema/seed migration
- GET `/api/products?name=keyboard&page=0&size=20` (case-insensitive filter; size 1–100)
- GET `/api/products/{id}` (200, 400, or 404)
- POST `/api/products` (201 with Location header and database-generated ID)
- Name validation: non-blank, maximum 120 characters
- Price validation: positive decimal, at most 10 integer digits and 2 decimal digits
- Consistent error body with status, message, path, timestamp, and field errors
- Real React fetch client, loading state, timeout/cancellation, and visible connection failures
- Same-origin Vite proxy to Spring Boot; no permissive CORS configuration
- GitHub Actions configuration for frontend checks and PostgreSQL integration tests

## Scope and local-only configuration

Ports bind to loopback. `portfolio_local` is a development-only database password. This playground has no authentication or write rate limiting; it is not ready for public writable deployment. There is no admin dashboard or contact-form delivery. The email link opens a mail app. GitHub publishing has not been performed.

The résumé PDF contains the original phone number and email. Review it before committing publicly. Source repository and benchmark claims in the résumé were not independently verified.

## Testing and verification limits

Frontend: `npm.cmd test` and `npm.cmd run build` from frontend. Tests cover both the retained simulator unit and the live HTTP client; the UI uses only the live client.

Backend: `mvn test` from backend with JDK 17+ and Maven 3.6.3+ installed. Local tests use H2 in PostgreSQL compatibility mode, execute Flyway migrations, and exercise the controller/service/repository stack. H2 is test-only; the application has no fallback database. The included GitHub workflow instead runs those tests against a real disposable PostgreSQL database.

Backend compilation/runtime verification was blocked in the authoring environment by Maven dependency-network access. Docker/PostgreSQL were not available there. The workflow has been supplied but not executed. Treat first local startup and the PostgreSQL workflow as required verification before deployment.

## Native Java option

If you prefer to run Spring Boot in your IDE, start only the database with `docker compose up -d db`, then run `mvn spring-boot:run` from backend (or run PortfolioApplication in IntelliJ). The defaults connect to the local development database. Do not also start the API container on port 8080.

## Troubleshooting

- `docker` unrecognized: install Docker Desktop and reopen VS Code.
- Docker engine unavailable: start Docker Desktop and wait for the engine to be ready.
- Port 5432/8080 already in use: stop the conflicting local service or change Compose mappings and the matching connection settings.
- Connection error in playground: inspect `docker compose logs api` and `docker compose ps`; check the health endpoint.
- Port 5173 in use: stop the earlier Vite terminal with Ctrl+C.
- `npm.ps1` blocked: use `npm.cmd` as shown.

Configuration references: https://docs.spring.io/spring-boot/3.5/ and https://docs.docker.com/compose/.
