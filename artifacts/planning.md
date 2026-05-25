# Salary Management Tool — Planning Notes

## Problem framing
HR managers at a 10,000-employee organization need a lightweight tool to maintain employee records and understand salary distribution by country and role.

## Architecture decisions

### Stack
- **Backend:** Node.js, TypeScript, Express, PostgreSQL, Prisma ORM
- **Frontend:** React (Vite), Tailwind CSS
- **Testing:** Vitest + Supertest (fast, ESM-friendly)

### Why PostgreSQL + Prisma
- Production-grade relational database suited for 10k+ employee records
- Prisma provides type-safe queries, migrations, and efficient batch inserts for seeding
- Docker Compose gives reviewers a one-command local database setup

### Backend layers
```
routes → repositories → Prisma → PostgreSQL
domain (validation + salary math) — pure, unit-tested
```

### Employee model
| Field | Purpose |
|-------|---------|
| fullName | Display + search |
| jobTitle | Role-based salary insights |
| country | Geo-based salary insights |
| salary | Core metric |
| department | Org structure filtering |
| email | Unique identifier / contact |
| hireDate | Tenure-based insights |

### API surface
- `GET/POST /api/employees` — list (paginated) + create
- `GET/PUT/DELETE /api/employees/:id` — CRUD
- `GET/POST /api/attendance` — list (paginated) + record daily attendance
- `GET /api/attendance/summary` — attendance rate and status counts
- `GET/PUT/DELETE /api/attendance/:id` — attendance CRUD
- `GET /api/insights/countries` — per-country min/max/avg/count
- `GET /api/insights/countries/:country` — country detail
- `GET /api/insights/countries/:country/job-titles/:jobTitle` — avg salary for role in country
- `GET /api/insights/summary` — org-wide headline metrics

### Seed performance
- Prisma `createMany` in batches of 1,000 within a transaction
- Target: seed 10,000 rows in under 5 seconds locally

### TDD approach
1. Red: write failing test for domain rule
2. Green: minimal implementation
3. Refactor: extract shared helpers
4. Repeat for repository → routes → seed → UI

### Attendance
- One record per employee per calendar day (`employeeId` + `date` unique)
- Statuses: `PRESENT`, `ABSENT`, `LATE`, `REMOTE`, `ON_LEAVE`
- Optional `checkIn` / `checkOut` timestamps; attendance rate counts present + late + remote
- Sample seed: last 7 days for 500 employees (3,500 records)
- **Self-service:** employees check in/out via work email on the **My device** tab (no password; suitable for internal demo)

### Payroll (attendance-based)
- `GET /api/payroll` — per-employee net pay for a date range
- `GET /api/payroll/summary` — org-wide payroll totals
- Formula: `monthlySalary = annualSalary / 12`, `dailyRate = monthlySalary / 22`
- Paid days: present, late, remote, on-leave; absent days deducted
- `netPay = dailyRate × paidDays` (computed on read from attendance)

## Rate limiting
- `express-rate-limit` on `/api/*` (100 req/min per IP) and writes on employees/attendance (30/min)
- `/health` excluded; disabled in tests via `RATE_LIMIT_ENABLED=false`

## Trade-offs
- **Pagination over infinite scroll:** predictable API for 10k records
- **No auth:** out of scope; HR tool assumed internal/trusted
- **Postgres over SQLite:** aligns with production expectations and Prisma best practices
- **Single tenant over multi-tenant SaaS:** org-wide queries and no `tenantId` keep the model simple; multi-tenancy (row-level, schema, or DB isolation) could turn this into a SaaS product later — not in scope for this assessment
- **PostgreSQL search over Elasticsearch:** list/filter uses Prisma + SQL; Elasticsearch could power richer full-text search and aggregations at larger scale — not needed for 10k records in this demo
