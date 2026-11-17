# Vacation Manager

A web application for managing vacation requests, with two interfaces:

- **Requester:** submit a vacation request, follow its status, edit or cancel it while it is pending.
- **Validator:** review every request, filter and page through them, approve or reject with a comment.

Both roles share a team calendar that shows who is away and when.

**Stack:** Vue 3, Vue Router, Vuex, Axios and Tailwind CSS on the frontend. Node.js, Express, the Common Event Framework, TypeORM and PostgreSQL on the backend. TypeScript everywhere.

## Run it

The only requirement is Docker.

```bash
docker compose up --build
```

Then open **http://localhost:8080**.

This starts PostgreSQL, runs the migrations, loads the demo data, and starts the API and the web app.

| What                                     | Address                          |
| ---------------------------------------- | -------------------------------- |
| Web app                                  | http://localhost:8080            |
| API                                      | http://localhost:3000/api/v1     |
| API docs (generated from the route file) | http://localhost:3000/api/v1/doc |
| Health check                             | http://localhost:3000/health     |

### Demo accounts

The password for every account is `Password123!`. The sign-in page has a button for each account.

| Role      | Email                  |
| --------- | ---------------------- |
| Requester | requester1@example.com |
| Requester | requester2@example.com |
| Requester | requester3@example.com |
| Validator | validator@example.com  |

### Ports

If a port is taken on your machine, set another one before starting:

```bash
WEB_PORT=8081 API_PORT=3001 DB_PORT=5441 docker compose up --build
```

The same three values can also go in a `.env` file next to `docker-compose.yml`.

To stop, run `docker compose down`. Add `-v` to delete the database as well.

## Develop locally

Requirements: Node.js 22.13 or newer, and Docker for the database (or your own PostgreSQL 14 or newer).

```bash
npm install
cp backend/.env.example backend/.env
docker compose up -d db
npm run setup
npm run dev
```

The web app runs on http://localhost:5173 and the API on http://localhost:3000, both with live reload.

| Command             | What it does                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run setup`     | Runs the migrations and loads the demo data. Safe to run again.         |
| `npm run dev`       | Starts the API and the web app.                                         |
| `npm test`          | Runs the unit tests and the API tests.                                  |
| `npm run typecheck` | Type-checks all three packages.                                         |
| `npm run lint`      | Runs ESLint.                                                            |
| `npm run format`    | Formats the code with Prettier.                                         |
| `npm run codegen`   | Regenerates the handler registry after editing `backend/src/root.yaml`. |

### Database setup

- The schema is created by a TypeORM migration in `backend/src/database/migrations`. Nothing is auto-synchronised.
- `npm run setup` applies the migration and loads the demo data. The seed does nothing if users already exist.
- Without Docker, create an empty database and point `DATABASE_URL` in `backend/.env` at it. The migration needs permission to run `CREATE EXTENSION btree_gist`.

### Settings

`backend/.env` (copied from `backend/.env.example`):

| Setting                | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `PORT`                 | Port of the API. Default 3000.                                   |
| `DATABASE_URL`         | PostgreSQL connection string.                                    |
| `TEST_DATABASE_URL`    | Database used by the API tests. Created on the first test run.   |
| `JWT_SECRET`           | Secret that signs the login tokens. At least 32 characters.      |
| `JWT_EXPIRES_IN_HOURS` | Lifetime of a token. Default 8.                                  |
| `FRONT_END_URL`        | Address of the web app, the only origin allowed to call the API. |

The API refuses to start if a required setting is missing or invalid, and names it.

The web app reads one optional setting, `VITE_API_URL`. It defaults to `http://localhost:3000/api/v1`.

## Features

**Requester**

- Request form with first day, last day and an optional reason. The vacation length is shown while typing.
- The form is checked in the browser with the same rules the API uses, and API rule errors appear next to the field they belong to.
- Own requests with a status filter and paging. A rejected request shows the validator's comment.
- Edit or cancel a request while it is pending.

**Validator**

- Dashboard of all requests. It opens on pending requests, because those need a decision.
- Filters by status and by requester, with paging.
- Approve with a confirmation. Reject with a required comment.

**Both roles**

- Team calendar: a month grid with one row per requester. Approved days are solid and pending days are hatched.
- History of every request: who submitted, changed, approved or rejected it, and when.
- Filters, page number and calendar month are kept in the address bar, so links can be shared and the Back button works.
- Every list has loading, empty and error states. The app works with the keyboard alone and on a phone.

## Architecture

```
Browser (Vue 3 app)
   |  Axios, JWT in the Authorization header
   v
Express app
   helmet, cors, rate limit on login
   |
   COMMANDS: one middleware chain under /api/v1
   1. resolveRoute   web request to a CommonEvent, route looked up in root.yaml   404
   2. authenticate   Passport checks the JWT (skipped for public routes)          401
   3. authorize      CASL checks the permission the handler declares              403
   4. dispatch       input parser builds a typed command, the handler runs it     400
   5. errorHandler   every error leaves in one JSON shape
   |
handler -> service (business rules) -> repository (TypeORM) -> PostgreSQL
   |
   EVENTS: after a change is saved, the service publishes an event
   v
eventService wraps it as a queue message, the framework routes it through root.yaml
   v
event handler: saves one row of the request history
```

### Three packages in one npm workspace

| Package    | Content                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared`   | The contract both apps import: role and status constants, zod schemas for every request, response types, the permission policy, and generic services such as `timeService`. |
| `backend`  | The API.                                                                                                                                                                    |
| `frontend` | The web app.                                                                                                                                                                |

A changed field breaks compilation in both apps instead of failing at runtime. The form in the browser and the input parser in the API validate with the same schema.

### Express and the Common Event Framework

- **Express** is the web server: security headers, CORS, rate limiting, the Passport token check and error responses.
- **The Common Event Framework (CEF)** is the application layer. Routes are declared in `backend/src/root.yaml`. Each route names its handler (`x-handler`) and its input parser (`x-inputParser`). `cef-gen-handlers` generates the handler registry from that file.
- Express turns each web request into a `CommonEvent` and passes it to CEF, which finds the route, the parser and the handler.
- CEF can serve HTTP on its own. Express was added for its standard middleware and for Passport.

### Commands and events

- **Commands** arrive over HTTP. The input parser validates the `CommonEvent` and returns a typed command, for example `UpdateVacationRequestCommand`. The handler passes it to one service function.
- **Events** are published after a change is saved: request submitted, updated, approved or rejected. `eventService` wraps the event in the queue format CEF already understands (the SQS shape), and CEF routes it through the same `root.yaml` to an event handler that records the history.
- The queue is in-process here. With a real queue only `eventService` changes. The event handler stays as it is.
- Event routes are internal. The middleware chain answers them with 404 when they are called over HTTP.

### Auth layer

- **Authentication:** `POST /auth/login` checks the password with bcrypt and returns a JWT (HS256, 8 hours). Passport's JWT strategy verifies it on every other request. The user travels inside the token, so the API keeps no sessions and needs no database lookup per request.
- **Authorization:** one policy file, `shared/src/services/permissionService.ts`, maps each role to permissions with CASL.

| Role      | Permissions                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Requester | Create a request. Read, update and cancel their own requests. Read the history of their own requests. Read the team calendar. |
| Validator | Read all requests and their history. Approve. Reject. Read the user list. Read the team calendar.                             |

The policy is enforced in three places:

1. **Route level.** Every handler declares `public`, `authenticated`, `internal` or a required permission. A handler with no declaration is never served, so a forgotten check cannot expose a route.
2. **Record level.** Services check ownership on the loaded record.
3. **Web app.** The same policy decides which pages, menu items and buttons appear. This is for usability only. The API is the authority.

Adding a role means adding one entry to the policy file.

### Services

Generic functions live in a `services` folder, one file per topic, named `<topic>Service.ts`:

- `shared/src/services`: functions both apps use (`timeService`, `permissionService`, `validationService`, `vacationRuleService`).
- `backend/src/services`: tokens, password hashing, paging, request parsing, errors, responses, events and the CEF bridge.
- `frontend/src/services`: the Axios client, one API service per resource, error reading, presentation and routing helpers.

Logic that belongs to one feature stays in that feature's folder under `backend/src/modules`.

## API

All paths are under `/api/v1`. Every route except login needs `Authorization: Bearer <token>`.

| Method and path                       | Permission         | Purpose                                                      |
| ------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `POST /auth/login`                    | public             | Sign in. Returns a token and the user.                       |
| `GET /auth/me`                        | signed in          | The current user.                                            |
| `POST /vacation-requests`             | create request     | Submit a request.                                            |
| `GET /users/me/vacation-requests`     | read own requests  | Own requests. Query: `status`, `page`, `pageSize`.           |
| `PUT /vacation-requests/:id`          | update own request | Edit a pending request.                                      |
| `DELETE /vacation-requests/:id`       | cancel own request | Cancel a pending request.                                    |
| `GET /vacation-requests`              | read all requests  | All requests. Query: `status`, `userId`, `page`, `pageSize`. |
| `POST /vacation-requests/:id/approve` | approve            | Approve a pending request.                                   |
| `POST /vacation-requests/:id/reject`  | reject             | Reject a pending request. Body: `{ "comment": "..." }`.      |
| `GET /vacation-requests/:id/history`  | read history       | History of one request.                                      |
| `GET /users`                          | read user list     | Requesters, for the dashboard filter.                        |
| `GET /team-calendar`                  | read team calendar | Query: `from`, `to`. No reasons or comments.                 |
| `GET /doc`                            | public             | API docs generated by CEF from `root.yaml`.                  |

- Paged responses: `{ items, page, pageSize, totalItems, totalPages }`. The default page size is 10 and the maximum is 50.
- Errors: `{ "error": { "code", "message", "fields" } }`. `fields` maps a field name to its message.
- Status codes: 400 invalid input, 401 not signed in, 403 not permitted, 404 not found, 409 rule conflict, 429 too many failed sign-in attempts.

## Business rules

| Rule                                         | Where it is enforced                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1. End date on or after the start date       | Shared schema (browser and API), and a database check constraint                                                                       |
| 2. No overlapping requests for the same user | Service, with a clear 409, and a database exclusion constraint                                                                         |
| 3. Approved requests cannot be modified      | Service. Edit, cancel, approve and reject only work on a pending request, and the status is checked again in the statement that writes |
| 4. No requests in the past                   | Shared schema (browser and API)                                                                                                        |
| 5. A rejection needs a comment               | Shared schema, and a database check constraint                                                                                         |
| 6. Only validators approve or reject         | Permission check before the handler runs                                                                                               |

Two interpretations to know about:

- A one-day vacation is allowed. The end date may equal the start date.
- A rejected request frees its dates, so the same dates can be requested again.

## Database

**users:** `id`, `name`, `email` (unique), `password` (bcrypt hash), `role`, `created_at`.

**vacation_requests:** `id`, `user_id`, `start_date`, `end_date`, `reason`, `status`, `comments`, `created_at`, `updated_at`.

**vacation_request_events:** `id`, `vacation_request_id`, `type`, `actor_user_id`, `details`, `created_at`. This table is an addition to the brief. It holds the request history.

- Dates are stored as `date` and travel as `YYYY-MM-DD` strings, so they never shift with time zones.
- The overlap rule is a PostgreSQL exclusion constraint. It also holds when two requests arrive at the same moment.
- Indexes: `(user_id, start_date)` for a requester's list, `(status, created_at)` for the dashboard, `(vacation_request_id, created_at)` for the history.
- Lists sort by date and then by id, so rows do not move between pages.

## Technical decisions

| Decision                                       | Reason                                                                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Express in front of CEF                        | Standard middleware and Passport. CEF keeps the routes, events, parsers and handlers.                                                                                                                           |
| Passport with `passport-jwt`                   | The standard Express way to check tokens. Another login method later means another strategy.                                                                                                                    |
| CASL for permissions                           | The same rules run in the API and in the browser. It supports "own records only" conditions and has an official Vue package. Casbin is built for policies edited at runtime, and accesscontrol is backend only. |
| A shared workspace package with zod            | Types and validation from one definition, with no code generation. tRPC is not REST, and ts-rest and Zodios had no recent releases.                                                                             |
| Database constraints as well as service checks | The service gives the clear message. The database guarantees the rule under concurrent requests.                                                                                                                |
| Status changes written only while pending      | If two validators decide the same request at once, one succeeds and the other gets a 409.                                                                                                                       |
| Migrations instead of auto-sync                | The schema, constraints and indexes are explicit and reviewable.                                                                                                                                                |
| `tsx` to run the backend                       | One tool chain for running and testing, and it loads the shared TypeScript package directly.                                                                                                                    |
| Filters and page number in the address bar     | Shareable links and a working Back button.                                                                                                                                                                      |
| No comments in the code                        | Names and small functions carry the intent. Explanations live in this file.                                                                                                                                     |

## Tests

```bash
docker compose up -d db
npm test
```

- **Unit tests (25):** date functions, vacation rules, request schemas and the permission policy.
- **API tests (59):** Supertest against the real Express app and a PostgreSQL test database. They cover every business rule, every permission, paging and filters, the history events, and two concurrency cases (two identical submissions, two decisions on one request).
- The test database (`vacation_manager_test`) is created and migrated on the first run.

The app was also clicked through in a real browser, on a desktop and a phone-sized screen, in both the local and the Docker setup: sign-in, submit, edit, cancel, filters, paging, approve, reject, history, the calendar, the permission redirects and keyboard use.

## Known limitations

- The token is kept in `localStorage`. An httpOnly cookie would be safer. There are no refresh tokens and no sign-up screen.
- The role is inside the token, so a role change applies at the next sign-in.
- The login rate limit is kept in memory, per API instance.
- Events are handled in-process, right after the change is saved. A crash between the two could lose one history entry. A real queue with an outbox table would close that gap.
- Cancelling a pending request deletes it together with its history, because the brief defines exactly three statuses.
- "Today" is the server's date for the API and the browser's date for the form. There is no per-user time zone.
- Vacation length counts calendar days. Weekends and public holidays are not excluded.
- Validators cannot submit their own requests.
- There is one team. The calendar and the requester filter list every requester and are not paged.
- Light theme only.
- The API runs as an Express server. An AWS Lambda entry point is not included, and `cef-build` is not used.
- CEF prints a line to the console for each event it handles.
- The generated API docs page loads its viewer from a CDN, so it needs an internet connection.
- `npm audit` reports issues in the dependencies of `commoneventframework` (`adm-zip`, `aws-sdk`, `esbuild`). They come with the required package.
- There are no end-to-end browser tests in the repository and no CI pipeline.

## Project structure

```
.
├── docker-compose.yml          database, API and web app
├── Dockerfile                  one file, two images: api and web
├── shared/src
│   ├── schemas/                zod schemas for every request body and query
│   ├── services/               timeService, permissionService, validationService, vacationRuleService
│   ├── dtos.ts                 response types
│   └── roles.ts, vacationRequestStatus.ts, vacationRequestEventType.ts
├── backend
│   ├── tests/                  API tests
│   └── src
│       ├── index.ts            starts the server
│       ├── app.ts              Express app and middleware chain
│       ├── root.yaml           CEF routes: HTTP routes and the event route
│       ├── generated/          handler registry generated from root.yaml
│       ├── middlewares/        resolveRoute, authenticate, authorize, dispatch, errorHandler
│       ├── services/           generic functions, one file per topic
│       ├── modules/            auth, users, vacationRequests, requestHistory, teamCalendar
│       ├── database/           data source, migrations, seed
│       └── config/             settings
└── frontend/src
    ├── router/                 routes, login guard, permission guard
    ├── store/                  Vuex modules
    ├── services/               Axios client, API services, helpers
    ├── plugins/                CASL ability
    ├── views/                  one file per screen
    └── components/             reusable components
```
