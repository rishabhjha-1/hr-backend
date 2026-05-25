# HR Portal — Backend API

Incubyte assessment: REST API for employee records, attendance, payroll, and salary insights. Built with TDD (Vitest + Supertest).

**Companion repo:** [hr-frontend](https://github.com/rishabhjha-1/hr-frontend)

## Stack

- Node.js, TypeScript, Express, PostgreSQL, Prisma
- Rate limiting via `express-rate-limit`

## Quick start

### 1. Start PostgreSQL

From the monorepo root (parent folder with `docker-compose.yml`):

```bash
docker compose up -d postgres
```

Or use any local Postgres instance and set `DATABASE_URL` in `.env`.

### 2. Backend setup

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm db:seed:attendance   # optional: attendance only (keeps employees)
pnpm dev
```

API runs at `http://localhost:3000`.

## Tests

```bash
pnpm test
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (not rate limited) |
| GET | `/api/employees` | List employees (paginated) |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/attendance` | List attendance (paginated, filters) |
| POST | `/api/attendance` | Record attendance |
| GET | `/api/attendance/summary` | Attendance rate and status breakdown |
| GET | `/api/attendance/:id` | Get attendance record |
| PUT | `/api/attendance/:id` | Update attendance record |
| DELETE | `/api/attendance/:id` | Delete attendance record |
| GET | `/api/payroll` | Payroll by period (from attendance + salary) |
| GET | `/api/payroll/summary` | Total payroll cost for a period |
| POST | `/api/self/identify` | Employee profile lookup by work email |
| GET | `/api/self/attendance?email=` | Employee recent attendance (14 days) |
| POST | `/api/self/check-in` | Employee check-in (`office` or `remote`) |
| POST | `/api/self/check-out` | Employee check-out |
| GET | `/api/insights/summary` | Organization-wide metrics |
| GET | `/api/insights/countries` | Salary stats by country |
| GET | `/api/insights/countries/:country` | Country detail + job titles |
| GET | `/api/insights/countries/:country/job-titles/:jobTitle` | Avg salary for role |

## Rate limiting

Configure in `.env` (see `.env.example`):

- **Reads:** 100 requests / minute on `/api/*`
- **Writes:** 30 POST/PUT/DELETE / minute on employees, attendance, and self-service
- Set `RATE_LIMIT_ENABLED=false` for local development or tests

## Docker (this repo)

```bash
docker compose up --build
```

- API: `http://localhost:3000`
- Postgres: `localhost:5432`

Seed after containers are up: `pnpm db:seed` (from your host, with `.env` pointing at `localhost:5432`).

## Deployment

- Set `DATABASE_URL` for your Postgres instance
- Run `pnpm db:generate && prisma migrate deploy` before or on startup
- Start with `pnpm build && pnpm start`

## Architecture

See [`artifacts/planning.md`](artifacts/planning.md) for design notes, TDD approach, and trade-offs.
