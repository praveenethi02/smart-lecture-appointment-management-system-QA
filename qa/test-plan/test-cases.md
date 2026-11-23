# 3.2 Software Testing Life Cycle (STLC) & Test Cases

## 3.2.1 STLC Phases Applied to This Project

| STLC Phase | What our team did | Output / Evidence |
|---|---|---|
| 1. Requirement analysis | Studied the system's features and business rules (slot duration 5–480 min, no past/overlapping slots, double-booking 409, 2-hour cancellation deadline, role permissions) and identified testable requirements | List of in-scope features and business rules |
| 2. Test planning | Defined objectives, scope, approach, tools, roles, schedule, entry/exit criteria and risks; selected ISO/IEC 25010 characteristics | Test Plan (Section 3.1, `qa/test-plan/test-plan.md`) |
| 3. Test case design | Wrote manual test cases; designed EP, BVA and decision-table cases; built the control flow graph for white-box tests; wrote Gherkin scenarios | Test case table (below), Sections 3.3–3.5 |
| 4. Test environment setup | Configured Node.js 22, in-memory MongoDB with seeded demo accounts, local `.env`; set up GitHub Actions (`ubuntu-latest`) and SonarCloud | Environment table (3.2.2), CI workflow `.github/workflows/test.yml` |
| 5. Test execution | Executed manual test cases in Chrome; ran Jest, Supertest and Cucumber in CI; ran Postman/Newman, JMeter and OWASP checks; logged defects in GitHub Issues | Actual results and status, CI runs, GitHub Issues BUG-01 to BUG-05 |
| 6. Test closure | Collected metrics (pass/fail counts, SonarCloud coverage and debt), performed root cause analysis, wrote reflection and final report | Sections 3.8–3.10, final report |

## 3.2.2 Test Environment / Configuration

| Item | Configuration |
|---|---|
| Operating system | Windows 10 / 11 (64-bit) |
| Browser | Google Chrome (latest stable) |
| Runtime | Node.js 22.x, npm |
| Backend | Express REST API on `http://localhost:5000` |
| Frontend | React 18 + Vite dev server on `http://localhost:5173` |
| Database | MongoDB in-memory server (automatic fallback), re-seeded on every backend start |
| Test data | Seed script demo accounts: `admin@apex.edu`, `dr.kamal@apex.edu`, `kasun@student.apex.edu`, `dinithi@student.apex.edu` + data created during tests |
| Environment variables | `PORT=5000`, `MONGODB_URI`, `JWT_SECRET` (local value), `CLIENT_URL=http://localhost:5173` |
| CI environment | GitHub Actions runner `ubuntu-latest`, Node.js 22 |
| Static analysis | SonarCloud (organization `praveenethi02`) |
| Defect tracking | GitHub Issues (labels: `bug`, `status: …`, `severity: …`) |

**Test data notes:** Future dates use **2026-12-15** (a date after the test execution date). The past-date case uses **2026-11-20**. Cancellation tests depend on the current time, so the slot for TC-CAN-02 is created for *today*, starting about 1 hour from the time of testing.

## 3.2.3 Test Cases

Status legend: **Pass** = actual result matches expected result; **Fail** = it does not (defect logged).

### Authentication

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-AUTH-01 | Login with valid student credentials | Backend and frontend running; seeded accounts exist | 1. Open `http://localhost:5173`<br>2. Enter email and password<br>3. Click Login | kasun@student.apex.edu / Student@123 | Login succeeds; student dashboard is shown | | |
| TC-AUTH-02 | Login with wrong password | Same as above | 1. Open login page<br>2. Enter valid email, wrong password<br>3. Click Login | kasun@student.apex.edu / Wrong@123 | Login rejected (HTTP 401); "invalid credentials" message shown; user stays on login page | | |
| TC-AUTH-03 | Register a new student with valid data | Email not registered | 1. Open Register page<br>2. Fill name, email, password<br>3. Submit | Name: Test Student, Email: test1@student.apex.edu, Password: Test@123 | Account created (HTTP 201) with role Student; user can log in | | |
| TC-AUTH-04 | Register with a password shorter than 6 characters (BVA: min−1) | Email not registered | 1. Open Register page<br>2. Enter a 5-character password<br>3. Submit | Email: test2@student.apex.edu, Password: Ab@12 | Registration rejected (HTTP 400); message that password must be at least 6 characters | | |
| TC-AUTH-05 | Register with an email that already exists | kasun@student.apex.edu exists | 1. Open Register page<br>2. Enter existing email<br>3. Submit | Email: kasun@student.apex.edu, Password: Test@123 | Registration rejected (HTTP 409); "email already exists" message | | |
| TC-AUTH-06 | Login with a NoSQL injection payload (exposes **BUG-03**) | Backend running | Send login request through browser DevTools console (see Appendix A, script 2) | `{ "email": { "$ne": null }, "password": "x" }` | Request rejected with HTTP 400 or 401 and a generic error message; no internal details leaked | | *(expected Fail – BUG-03 #4)* |
| TC-AUTH-07 | Login with a deactivated account | Admin has deactivated dinithi@student.apex.edu (Admin → Users → Deactivate) | 1. Log out<br>2. Log in as the deactivated user | dinithi@student.apex.edu / Student@123 | Login rejected (HTTP 403); "account deactivated" message | | |

### Availability Slots (Lecturer)

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-SLOT-01 | Create a valid 60-minute slot | Logged in as lecturer | 1. Go to Availability / Manage slots<br>2. Click Add slot<br>3. Enter data and save | Date 2026-12-15, 10:00–11:00, Location "Room 101" | Slot created (HTTP 201) and shown in the slot list as available | | |
| TC-SLOT-02 | Create a slot with 4-minute duration (BVA: min−1) | Logged in as lecturer | Add slot with the given times | Date 2026-12-15, 12:00–12:04, Room 101 | Rejected (HTTP 400); duration must be 5–480 minutes | | |
| TC-SLOT-03 | Create a slot with 5-minute duration (BVA: min) | Logged in as lecturer | Add slot with the given times | Date 2026-12-15, 12:30–12:35, Room 101 | Slot created successfully | | |
| TC-SLOT-04 | Create a slot with 481-minute duration (BVA: max+1) | Logged in as lecturer | Add slot with the given times | Date 2026-12-16, 08:00–16:01, Room 101 | Rejected (HTTP 400); duration must be 5–480 minutes | | |
| TC-SLOT-05 | Create a slot on a past date | Logged in as lecturer | Add slot with a past date | Date 2026-11-20, 10:00–11:00, Room 101 | Rejected (HTTP 400); cannot create a slot in the past | | |
| TC-SLOT-06 | Create a slot that overlaps an existing slot | TC-SLOT-01 slot exists (2026-12-15 10:00–11:00) | Add slot overlapping the existing one | Date 2026-12-15, 10:30–11:30, Room 102 | Rejected (HTTP 400); overlap message | | |
| TC-SLOT-07 | Create a slot with an impossible month (exposes **BUG-01**) | Logged in as lecturer (token) | Send request through DevTools console (Appendix A, script 1) | Date 2027-13-01, 10:00–11:00 | Rejected (HTTP 400); invalid date | | *(expected Fail – BUG-01 #2)* |
| TC-SLOT-08 | Create a slot on 31 February (exposes **BUG-02**) | Logged in as lecturer (token) | Same script with the given date | Date 2027-02-31, 10:00–11:00 | Rejected (HTTP 400); invalid date | | *(expected Fail – BUG-02 #3)* |
| TC-SLOT-09 | Edit or delete a slot that is already booked | A slot has been booked by a student (TC-BOOK-01) | 1. Log in as lecturer<br>2. Try to edit, then delete the booked slot | Slot booked in TC-BOOK-01 | Both actions blocked (HTTP 400); message that a booked slot cannot be changed | | |

### Booking (Student)

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-BOOK-01 | Book an available slot with a reason | Logged in as kasun; TC-SLOT-01 slot is available | 1. Open Lecturers / Book appointment<br>2. Select Dr. Kamal's 2026-12-15 10:00 slot<br>3. Enter reason and confirm | Reason: "Project guidance" | Booking created (HTTP 201); appointment appears in "My appointments"; slot no longer available | | |
| TC-BOOK-02 | Book without entering a reason | Logged in as kasun; an available slot exists (TC-SLOT-03) | Select slot, leave reason empty, confirm | Reason: (empty) | Rejected (HTTP 400); reason is required | | |
| TC-BOOK-03 | Same student tries to book the same slot again | TC-BOOK-01 done | Try to book the same slot again (or resend the request) | Same slot as TC-BOOK-01 | Rejected (HTTP 400); already booked | | |
| TC-BOOK-04 | Second student tries to book a slot already taken (double booking) | TC-BOOK-01 done; log in as test1@student.apex.edu (TC-AUTH-03) | Try to book the same slot | Same slot as TC-BOOK-01 | Rejected (HTTP 409) or slot not offered; no double booking | | |

### Cancellation

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-CAN-01 | Cancel an appointment more than 2 hours before start | TC-BOOK-01 appointment exists (2026-12-15) | 1. Log in as kasun<br>2. My appointments → Cancel | Appointment from TC-BOOK-01 | Cancellation succeeds; status becomes Cancelled; slot becomes available again | | |
| TC-CAN-02 | Cancel an appointment less than 2 hours before start | Lecturer creates a slot today starting ~1 hour from now; kasun books it | 1. Log in as kasun<br>2. My appointments → Cancel that appointment | Slot: today, (now + 1 h) to (now + 1 h 30 min) | Cancellation blocked; message about the 2-hour deadline | | |

### Role-Based Access Control

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-RBAC-01 | Student tries to open the admin dashboard | Logged in as kasun | Type `http://localhost:5173/admin` in the address bar | — | Access denied: redirected or "not authorized"; API returns 403 | | |
| TC-RBAC-02 | Lecturer tries to book an appointment | Logged in as dr.kamal | Try to open the booking page / book a slot | — | Booking option not available; API returns 403 | | |
| TC-RBAC-03 | Access a protected page without logging in | Logged out (or new incognito window) | Open `http://localhost:5173/dashboard` directly | — | Redirected to login page; API returns 401 | | |

## 3.2.4 Test Execution Summary

| Module | Total | Passed | Failed |
|---|---|---|---|
| Authentication | 7 | | |
| Availability slots | 9 | | |
| Booking | 4 | | |
| Cancellation | 2 | | |
| Role-based access | 3 | | |
| **Total** | **25** | | |

Failed test cases are linked to the defects logged in GitHub Issues (BUG-01 #2, BUG-02 #3, BUG-03 #4).

## Appendix A – DevTools console scripts (for TC-AUTH-06, TC-SLOT-07, TC-SLOT-08)

The UI date picker does not let a user type an impossible date, so these cases are sent directly to the API from Chrome DevTools (F12 → Console). If Chrome blocks pasting, type `allow pasting` first and press Enter.

**Script 1 – Invalid date slot (TC-SLOT-07; change the date to `2027-02-31` for TC-SLOT-08)**
```js
const API = 'http://localhost:5000/api';
const lr = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'dr.kamal@apex.edu', password: 'Lecturer@123' }) });
const lj = await lr.json(); const token = lj.token || lj.data?.token;
const r = await fetch(API + '/availability', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ date: '2027-13-01', startTime: '10:00', endTime: '11:00', location: 'Room 101' }) });
console.log(r.status, await r.json());
```

**Script 2 – NoSQL injection login (TC-AUTH-06)**
```js
const r2 = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: { $ne: null }, password: 'x' }) });
console.log(r2.status, await r2.json());
```
