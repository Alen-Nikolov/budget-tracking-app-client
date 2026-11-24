# Budget Tracker API contract

Base URL (local): `http://localhost:8080`. JSON in/out. Dates are ISO `yyyy-MM-dd`, timestamps are ISO-8601 UTC.
Money (`amount`, `total`, `totalAmount`) is a JSON number with up to 2 decimals.
This file is the source of truth for clients (Next.js admin panel, Android app). Keep it in sync with the code in `src/main/java/com/budgettracker`.

## Authentication model
- Access token: JWT, valid **1 hour**. Send on every request except the public ones: `Authorization: Bearer <accessToken>`.
- Refresh token: opaque string, valid **90 days**, **single use**. `POST /refresh` returns a NEW access token AND a NEW refresh token; the old refresh token is dead immediately, so always store the new one. Re-using an old refresh token revokes all of that user's refresh tokens (forces login).
- `role` is `USER` or `ADMIN`. Role is baked into the access token and re-read on refresh.
- Public endpoints: `/register`, `/login`, `/refresh`, `/logout`. Everything else needs a token.
- Admin account is created by promoting a registered user via `scripts/make-admin.sql` (no endpoint).

### AuthResponse (returned by /register, /login, /refresh)
```json
{ "accessToken": "eyJ...", "accessTokenExpiresInSeconds": 3600, "refreshToken": "abc...",
  "userId": 1, "email": "a@b.com", "role": "USER" }
```

## Endpoints

| Method | Path | Auth | Request | Success |
|---|---|---|---|---|
| POST | `/register` | public | `{email, password, confirmPassword}` | 201 AuthResponse |
| POST | `/login` | public | `{email, password}` | 200 AuthResponse |
| POST | `/refresh` | public | `{refreshToken}` | 200 AuthResponse |
| POST | `/logout` | public | `{refreshToken}` | 204 (revokes that refresh token) |
| GET | `/category` | user | - | 200 `Category[]` (sorted by name) |
| POST | `/category/create` | user | `{name, colour}` | 201 Category |
| PUT | `/category/edit` | user | `{id, name, colour}` | 200 Category |
| DELETE | `/category/delete/{id}` | user | - | 204 |
| POST | `/expenses/create` | user | `{amount, categoryId, note?, date?}` (date defaults to today) | 201 Expense |
| PUT | `/expenses/edit` | user | `{id, amount, categoryId, note?, date}` | 200 Expense |
| DELETE | `/expenses/delete/{id}` | user | - | 204 |
| GET | `/expenses` | user | query: `from`, `to` (required), `categoryIds` (optional, repeat: `&categoryIds=1&categoryIds=2`) | 200 ExpenseSearch |
| GET | `/admin/stats` | ADMIN | - | 200 Stats |

The user is always taken from the token; never send a user id. Users only ever see/modify their own data (others' ids -> 404). The admin sees their OWN expenses/categories through the normal endpoints; `/admin/stats` is the only cross-user endpoint (no user-list endpoint exists yet).

### Validation rules
- email: valid format, max 255. password: 8-72 chars. confirmPassword must equal password.
- category `name`: required, max 100, unique per user (case-insensitive). `colour`: hex `#RRGGBB`.
- expense `amount`: > 0, max 10 integer digits + 2 decimals. `note`: max 255, optional. `date`: `yyyy-MM-dd`.
- `from` must not be after `to`.

### Response shapes
```json
// Category
{ "id": 1, "name": "Food", "colour": "#FF8800", "createdAt": "2026-11-24T10:00:00Z" }

// Expense
{ "id": 5, "amount": 12.50, "note": "Lunch", "date": "2026-11-24",
  "categoryId": 1, "categoryName": "Food", "categoryColour": "#FF8800" }

// ExpenseSearch (GET /expenses) - expenses sorted newest first
{ "from": "2026-01-01", "to": "2026-12-31", "total": 62.50,
  "byCategory": [ { "categoryId": 1, "categoryName": "Food", "categoryColour": "#FF8800", "total": 62.50 } ],
  "expenses": [ /* Expense[] */ ] }

// Stats (GET /admin/stats)
{ "totalUsers": 12, "totalExpenses": 340, "totalAmount": 5123.75 }
```

## Errors
JSON errors look like `{ "message": "...", "fieldErrors": { "field": "problem" } | null }`.

| Status | Meaning |
|---|---|
| 400 | Validation failed (`fieldErrors` filled) or bad input (e.g. `from` after `to`) |
| 401 | Bad credentials on `/login` (message "Invalid email or password"), invalid/expired refresh token on `/refresh`, or missing/expired access token on protected endpoints (**empty body** in that last case) -> try `/refresh`, then fall back to login |
| 403 | Authenticated but not allowed (e.g. non-admin calling `/admin/*`), empty body |
| 404 | Category/expense not found (or belongs to someone else) |
| 409 | Email already registered; duplicate category name; deleting a category that still has expenses |
| 429 | Too many failed logins (5 per email / 20 per IP per hour). Has a `Retry-After` header (seconds) |

## CORS
Browsers may call the API only from origins in env var `CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`). Allowed methods: GET, POST, PUT, DELETE, OPTIONS; allowed headers: `Authorization`, `Content-Type`. Not needed for the Android app.

## Notes for the admin panel (Next.js)
- Log in with an ADMIN account; check `role === "ADMIN"` in the response. A normal user's token gets 403 on `/admin/stats`.
- Refresh the access token before it expires (`accessTokenExpiresInSeconds`) or on any 401, and always save the new refresh token from the response.
- Missing for the panel today: a list-all-users endpoint and any per-user breakdown. Ask the backend session to add them if needed.
