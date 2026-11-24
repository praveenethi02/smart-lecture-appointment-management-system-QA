# Defect Management – Root Cause Analysis and Defect Lifecycle

This document covers:

1. Root Cause Analysis (5 Whys) for **BUG-01** and **BUG-05**
2. The full lifecycle of **BUG-01 (#2)**, from New to Closed, with evidence

Screenshots are in [`screenshots/`](screenshots/).

---

## 1. Root Cause Analysis – BUG-01

| Item | Detail |
|---|---|
| Issue | [#2 BUG-01: Slot can be created with an impossible month (e.g. 2027-13-01)](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/2) |
| Severity | Medium |
| Module | `backend/controllers/availabilityController.js`, `backend/utils/dateUtils.js` |
| Symptom | `POST /api/availability` with `"date": "2027-13-01"` returns **201 Created** and stores the slot |

### 5 Whys

| # | Question | Answer |
|---|---|---|
| 1 | Why was a slot with month 13 saved? | `createAvailability` accepted the request and passed every check before saving. |
| 2 | Why did it pass every check? | The only date-related check was `isSlotInPast(date, startTime)`. The Mongoose schema only checks the **format** with the regex `^\d{4}-\d{2}-\d{2}$`, and `2027-13-01` matches it. |
| 3 | Why did `isSlotInPast` not reject it? | It builds `new Date("2027-13-01T10:00:00+05:30")`, which is an **Invalid Date**. `getTime()` returns `NaN`, and `NaN <= Date.now()` is `false`, so the slot is treated as "not in the past". |
| 4 | Why was there no check that the date really exists? | The code assumed that a correct format means a correct date. No requirement or rule said "the date must exist on the calendar", so no function was written for it. |
| 5 | Why was this not caught before release? | There were no boundary value tests on the month and day fields. The existing tests only covered valid dates and past dates, so invalid calendar dates were never exercised. |

**Root cause:** date input was validated for **format only**, not for **calendar validity**. The date helper also failed **open** (an invalid date was treated as valid) instead of failing closed.

**Related:** BUG-02 (#3) has the same root cause. `2027-02-31` matches the regex, and JavaScript silently rolls it over to **3 March 2027**.

### Corrective and preventive actions

| Type | Action | Status |
|---|---|---|
| Corrective | Added `isValidCalendarDate()` to `dateUtils.js`. It rebuilds the date with `Date.UTC` and checks that year, month and day are unchanged. | Done – PR #13 |
| Corrective | `createAvailability` and `updateAvailability` now return **400 "Invalid date: the date does not exist"** for impossible dates. | Done – PR #13 |
| Preventive | Added 11 BVA unit tests for month and day boundaries (month 00/13, Feb 28/29 in leap and non-leap years, Feb 31, Apr 31, day 00, wrong format). | Done – PR #13 |
| Preventive | Changed the BUG-01 test from `test.failing` to `test`, and added a BUG-02 API test, so CI fails if the bug comes back. | Done – PR #13 |
| Preventive | Team rule: date helpers must fail closed (an unparseable date is rejected, never treated as valid). | Recommended |

---

## 2. Root Cause Analysis – BUG-05

| Item | Detail |
|---|---|
| Issue | [#6 BUG-05: Hardcoded fallback JWT secret used when JWT_SECRET is missing](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/6) |
| Severity | High (security) |
| OWASP | A02 Cryptographic Failures, A07 Identification and Authentication Failures |
| Module | `backend/utils/jwt.js` |
| Symptom | When `JWT_SECRET` is not set, the server starts with no warning and signs tokens with `'fallback_secret_for_development_mode'` |

### 5 Whys

| # | Question | Answer |
|---|---|---|
| 1 | Why can an attacker forge a valid admin token? | Tokens are signed with a secret that is written in the source code, which anyone with repository access can read. |
| 2 | Why is the secret in the source code? | `generateToken()` and `verifyToken()` use `process.env.JWT_SECRET \|\| 'fallback_secret_for_development_mode'`. |
| 3 | Why was a fallback added? | To make local development easier: the app runs even if a developer forgets to create `.env`. |
| 4 | Why does the fallback also work in production? | The fallback does not check `NODE_ENV`, and there is no startup check that required environment variables are set. The server never fails fast. |
| 5 | Why was this not noticed earlier? | There is no security checklist or secret scanning in the CI pipeline, and no test starts the app without `JWT_SECRET`. The convenience default was never reviewed as a security risk. |

**Root cause:** a **convenience default for a security secret**, with no fail-fast validation of required configuration at startup.

### Corrective and preventive actions

| Type | Action | Status |
|---|---|---|
| Corrective | Remove the fallback. If `JWT_SECRET` is missing (or too short), stop the server at startup with a clear error. | Recommended |
| Corrective | Rotate the JWT secret on any environment that may have used the fallback, so old forged tokens stop working. | Recommended |
| Preventive | Validate all required environment variables in one place at startup (for example `config/env.js`). | Recommended |
| Preventive | Add secret scanning (for example GitHub secret scanning or gitleaks) and a SonarCloud security hotspot review to CI. | Recommended |
| Preventive | Add a test that starts the app without `JWT_SECRET` and expects it to refuse to start. | Recommended |

---

## 3. Defect Lifecycle – BUG-01 (#2)

The project uses GitHub Issues with `status:` labels to track the lifecycle.

| Stage | What happened | Evidence |
|---|---|---|
| **New** | BUG-01 reported as issue #2 with labels `bug`, `status: new`, `severity: medium`, steps to reproduce, expected and actual result. | [DEF-01](screenshots/DEF-01-bug01-status-new.png) |
| **Assigned** | Assigned to Supasan17. Label changed to `status: assigned`, with a comment describing the fix plan. | [DEF-02](screenshots/DEF-02-bug01-status-assigned.png), [DEF-03](screenshots/DEF-03-bug01-assigned-comment.png) |
| **Fixed** | Fix made on branch `fix/bug-01-invalid-date` (commit `8006dd3`). All 44 unit and API tests pass locally. PR [#13](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/pull/13) opened with "Fixes #2". Label changed to `status: fixed`. | [DEF-04](screenshots/DEF-04-bug01-fix-tests-pass.png), [DEF-05](screenshots/DEF-05-bug01-pr13-opened.png) |
| **CI** | GitHub Actions *Backend Tests* passed. SonarCloud Quality Gate passed (0 new issues, 80% coverage on new code). | [DEF-06](screenshots/DEF-06-bug01-pr13-ci-passed.png) |
| **Verified** | Retest on the fixed backend: `2027-13-01` → **400**, `2027-02-31` → **400**, a valid date → **201**. Newman known-bugs collection: BUG-01 and BUG-02 now pass. Label changed to `status: verified`, with an evidence comment. | [DEF-07](screenshots/DEF-07-bug01-verified-retest.png), [DEF-08](screenshots/DEF-08-bug01-verified-newman.png), [DEF-09](screenshots/DEF-09-bug01-verified-newman-summary.png), [DEF-10](screenshots/DEF-10-bug01-status-verified.png), [DEF-11](screenshots/DEF-11-bug01-verified-comment.png) |
| **Closed** | PR #13 was approved and merged into `main`. GitHub closed issue #2 automatically as completed, because the PR description contains "Fixes #2". | [DEF-12](screenshots/DEF-12-bug01-closed.png), [DEF-13](screenshots/DEF-13-bug01-closed-timeline.png) |

### Retest result summary

| Test | Before fix | After fix |
|---|---|---|
| `2027-13-01` (BUG-01) | 201 Created ❌ | 400 Bad Request ✅ |
| `2027-02-31` (BUG-02) | 201 Created ❌ | 400 Bad Request ✅ |
| Valid future date (regression) | 201 Created ✅ | 201 Created ✅ |
| Jest unit + API tests | 32 passed (BUG-01 marked `test.failing`) | 44 passed |
