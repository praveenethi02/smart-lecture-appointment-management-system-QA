# Security Testing – OWASP Top 10 Checks

All checks were run against the real backend (`http://localhost:5000/api`, Express + MongoDB, seeded demo data), using `curl` and `npm audit` from a Git Bash terminal in VS Code. Screenshots are in [`screenshots/`](screenshots/).

## Summary

| OWASP 2021 category | Result | Finding |
|---|---|---|
| A01 Broken Access Control | ✅ Pass | Role checks and ownership checks work (403 / 401). |
| A02 Cryptographic Failures | ❌ Fail | Hardcoded fallback JWT secret (BUG-05, #6). Passwords are hashed correctly with bcrypt. |
| A03 Injection | ❌ Fail | NoSQL operator payload on login causes 500 and leaks an internal error (BUG-03, #4). |
| A05 Security Misconfiguration | ⚠️ Weak | `X-Powered-By: Express` exposed, no security headers, CORS reflects any origin with credentials. |
| A06 Vulnerable and Outdated Components | ❌ Fail | `npm audit`: 21 vulnerabilities (18 moderate, 3 high). |
| A07 Identification and Authentication Failures | ⚠️ Partly | Login rate limiter works (429 after 100 attempts). Weak point: BUG-05 fallback secret. |

---

## A01 – Broken Access Control ✅

| # | Test | Expected | Actual |
|---|---|---|---|
| 1 | Student calls `GET /api/admin/dashboard` | 403 | **403** "Access denied for role 'student'. Required: admin" |
| 2 | Lecturer calls `POST /api/appointments` (booking is for students only) | 403 | **403** "Access denied for role 'lecturer'. Required: student" |
| 3 | Student 2 reads Student 1's appointment by ID (IDOR) | 403 | **403** "You do not have permission to view this appointment" |
| 4 | `GET /api/appointments/my` with no token | 401 | **401** "Authentication required. No token provided." |

The same checks are automated in the Postman collection (TC-API-10 to TC-API-13).
Evidence: [SEC-01](screenshots/SEC-01-A01-access-control.png)

## A02 – Cryptographic Failures ❌

- **Finding (BUG-05, #6, high):** `backend/utils/jwt.js` uses `process.env.JWT_SECRET || 'fallback_secret_for_development_mode'`. If `JWT_SECRET` is missing, the server starts with no warning and signs tokens with a secret that is public in the repository, so anyone could forge an admin token.
- **Good:** passwords are hashed with bcrypt (salt rounds 10), and the hash field uses `select: false`, so it is never returned by the API. Newman checks this on every login ("Password hash is not returned").
- **Note:** the local setup runs over plain HTTP. Production must use HTTPS.
- **Recommendation:** remove the fallback and stop the server at startup if `JWT_SECRET` is missing or too short. Full 5 Whys in [`qa/defects/rca-and-defect-lifecycle.md`](../defects/rca-and-defect-lifecycle.md).

## A03 – Injection ❌

| Test | Expected | Actual |
|---|---|---|
| `POST /api/auth/login` with `{"email":{"$ne":null},"password":"x"}` | 400 "email must be a string" | **500** `{"success":false,"message":"email.toLowerCase is not a function"}` |

- The operator payload did **not** log anyone in, so authentication was not bypassed.
- **But** the API does not validate input types. The object reaches the controller, crashes it, and the internal JavaScript error message is sent back to the client. This is reported as **BUG-03 (#4)**.
- **Recommendation:** validate that `email` and `password` are strings (for example with `express-validator` or `zod`), sanitise Mongo operators (`express-mongo-sanitize`), and return a generic error message in production.
- Automated check: `qa/postman/known-bugs.postman_collection.json` (BUG-03 request).

Evidence: [SEC-02](screenshots/SEC-02-A03-nosql-injection.png)

## A05 – Security Misconfiguration ⚠️

| Check | Result |
|---|---|
| `X-Powered-By` header | **Present:** `X-Powered-By: Express` (tells attackers the framework) |
| Security headers (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`) | **Missing** (Helmet is not used) |
| CORS with `Origin: https://evil.example` | `Access-Control-Allow-Origin: https://evil.example` **and** `Access-Control-Allow-Credentials: true`, so any website is trusted |

**Recommendation:** add `helmet()`, call `app.disable('x-powered-by')`, and allow only the real frontend origin (`CLIENT_URL`) in the CORS config.

Evidence: [SEC-03](screenshots/SEC-03-A05-headers-cors.png)

## A06 – Vulnerable and Outdated Components ❌

`npm audit` in `backend/` reports **21 vulnerabilities (18 moderate, 3 high)**. The high ones include:

- `body-parser` – denial of service with trailing bytes after a compressed request body
- `mongoose` – several issues (sanitizeFilter not applied in some cases, discriminator key schema bypass, prototype pollution through `Schema.prototype.virtual()`)

Most have a fix available through `npm audit fix`. **Recommendation:** run `npm audit fix`, retest, and add `npm audit --audit-level=high` to the CI pipeline so new high-risk packages fail the build.

Evidence: [SEC-04](screenshots/SEC-04-A06-npm-audit.png)

## A07 – Identification and Authentication Failures ⚠️

| Test | Result |
|---|---|
| 1 wrong-password login | 401, headers `RateLimit-Limit: 100`, `RateLimit-Remaining: 99`, `RateLimit-Reset: 900` |
| 110 wrong-password logins in a row | Requests 1–99 → **401**, requests 100–110 → **429 Too Many Requests** |
| Correct password after the limit | **429** "Too many authentication attempts from this IP. Please try again after 15 minutes." |

- **Good:** `express-rate-limit` protects `/api/auth/login` and `/api/auth/register` (100 requests per 15 minutes per IP), which slows down brute-force and credential-stuffing attacks.
- **Weak:** BUG-05 (fallback JWT secret) lets an attacker skip login completely by forging a token. Tokens are valid for 7 days, and there is no logout or token revocation on the server.

Evidence: [SEC-05](screenshots/SEC-05-rate-limit-429.png)

---

## Defects linked to this report

| Bug | Issue | OWASP | Severity |
|---|---|---|---|
| BUG-03 NoSQL payload returns 500 and leaks the error | [#4](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/4) | A03 | Medium |
| BUG-05 Hardcoded fallback JWT secret | [#6](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/6) | A02 / A07 | High |
