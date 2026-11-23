# 3.2 Software Testing Life Cycle (STLC) & Test Cases

## 3.2.1 STLC Phases Applied to This Project

| STLC Phase | What our team did | Output / Evidence |
|---|---|---|
| 1. Requirement analysis | Studied the system's features and business rules (slot duration 5–480 min, no past/overlapping slots, double-booking 409, 2-hour cancellation deadline, role permissions) and identified testable requirements | List of in-scope features and business rules |
| 2. Test planning | Defined objectives, scope, approach, tools, roles, schedule, entry/exit criteria and risks; selected ISO/IEC 25010 characteristics | Test Plan (Section 3.1, `qa/test-plan/test-plan.md`) |
| 3. Test case design | Wrote manual test cases; designed EP, BVA and decision-table cases; built the control flow graph for white-box tests; wrote Gherkin scenarios | Test case table (below), Sections 3.3–3.5 |
| 4. Test environment setup | Configured Node.js 26.5.0 (local), in-memory MongoDB with seeded demo accounts, local `.env`; set up GitHub Actions (`ubuntu-latest`) and SonarCloud | Environment table (3.2.2), CI workflow `.github/workflows/test.yml` |
| 5. Test execution | Executed the designed test cases through scripted API requests and scripted Chrome UI runs (AI-assisted, see `execution-log.md`); ran Jest, Supertest and Cucumber in CI; ran Postman/Newman, JMeter and OWASP checks; logged defects in GitHub Issues | Actual results and status, CI runs, GitHub Issues BUG-01 to BUG-07 |
| 6. Test closure | Collected metrics (pass/fail counts, SonarCloud coverage and debt), performed root cause analysis, wrote reflection and final report | Sections 3.8–3.10, final report |

## 3.2.2 Test Environment / Configuration

| Item | Configuration |
|---|---|
| Operating system | Windows 10 / 11 (64-bit) |
| Browser | Google Chrome (headless, for UI runs and screenshots) |
| Runtime | Node.js 26.5.0 (local execution), npm |
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
| TC-AUTH-01 | Login with valid student credentials | Backend and frontend running; seeded accounts exist | 1. Open `http://localhost:5173/login`<br>2. Enter email and password<br>3. Click Login | kasun@student.apex.edu / Student@123 | Login succeeds; redirected to `/student/dashboard` | 200 OK "Login successful", role student; redirected to /student/dashboard (verified via API and browser UI) | Pass |
| TC-AUTH-02 | Login with wrong password | Same as above | 1. Open `/login`<br>2. Enter valid email, wrong password<br>3. Click Login | kasun@student.apex.edu / Wrong@123 | Login rejected (HTTP 401); message "Invalid email or password"; user stays on login page | 401 "Invalid email or password"; no token returned (verified via API) | Pass |
| TC-AUTH-03 | Register a new student with valid data | Email not registered | 1. Open `/register`<br>2. Fill name, email, password<br>3. Submit | Name: Test Student, Email: test1@student.apex.edu, Password: Test@123 | Account created (HTTP 201) with role Student; user can log in | 201 "Student account registered successfully", role student; login with the new account returned 200 (verified via API) | Pass |
| TC-AUTH-04 | Register with a password shorter than 6 characters (BVA: min−1) | Email not registered | 1. Open `/register`<br>2. Enter a 5-character password<br>3. Submit | Email: test2@student.apex.edu, Password: Ab@12 | Registration rejected (HTTP 400); message "Password must be at least 6 characters long" | 400 "Password must be at least 6 characters long" (verified via API) | Pass |
| TC-AUTH-05 | Register with an email that already exists | kasun@student.apex.edu exists | 1. Open `/register`<br>2. Enter existing email<br>3. Submit | Email: kasun@student.apex.edu, Password: Test@123 | Registration rejected (HTTP 409); message "An account with this email already exists" | 409 "An account with this email already exists" (verified via API) | Pass |
| TC-AUTH-06 | Login with a NoSQL injection payload (exposes **BUG-03**) | Backend running | Send login request through browser DevTools console (see Appendix A, script 2) | `{ "email": { "$ne": null }, "password": "x" }` | Request rejected with HTTP 400 or 401 and a generic error message; no internal details leaked | 500 "email.toLowerCase is not a function"; internal error detail leaked to the client | Fail (BUG-03 #4) |
| TC-AUTH-07 | Login with a deactivated account | Admin has deactivated dinithi@student.apex.edu (log in as admin → `/admin/students` → deactivate Dinithi) | 1. Log out<br>2. Log in as the deactivated user | dinithi@student.apex.edu / Student@123 | Login rejected (HTTP 403); message "Account is deactivated. Please contact the administrator." | 403 "Account is deactivated. Please contact the administrator." (verified via API) | Pass |

### Availability Slots (Lecturer)

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-SLOT-01 | Create a valid 60-minute slot | Logged in as lecturer (dr.kamal) | 1. Open `/lecturer/availability`<br>2. Click **Create Availability Slot**<br>3. Fill the form, choose In-Person<br>4. Click **Publish Slot** | Date 2026-12-15, 10:00–11:00, Location "Room 101" | Slot created (HTTP 201); modal closes and the slot appears in the list | 201 "Availability slot created successfully"; slot returned in the lecturer slot list (verified via API) | Pass |
| TC-SLOT-02 | Create a slot with 4-minute duration (BVA: min−1) | Logged in as lecturer | Same steps as TC-SLOT-01 with the given times | Date 2026-12-15, 12:00–12:04, Room 101 | Rejected (HTTP 400); red error box in the modal about invalid duration (5–480 minutes) | 400 "End time must be after start time, and slot duration must be at least 5 minutes" (verified via API) | Pass |
| TC-SLOT-03 | Create a slot with 5-minute duration (BVA: min) | Logged in as lecturer | Same steps as TC-SLOT-01 with the given times | Date 2026-12-15, 12:30–12:35, Room 101 | Slot created and shown in the list | 201 "Availability slot created successfully"; slot returned in the lecturer slot list (verified via API) | Pass |
| TC-SLOT-04 | Create a slot with 481-minute duration (BVA: max+1) | Logged in as lecturer | Same steps as TC-SLOT-01 with the given times | Date 2026-12-16, 08:00–16:01, Room 101 | Rejected (HTTP 400); red error box about invalid duration | 400 "End time must be after start time, and slot duration must be at least 5 minutes"; rejected as expected, but the message does not mention the 480-minute maximum (BUG-07 #9) (verified via API) | Pass |
| TC-SLOT-05 | Create a slot on a past date | Logged in as lecturer | Same steps as TC-SLOT-01 with a past date | Date 2026-11-20, 10:00–11:00, Room 101 | Rejected (HTTP 400); red error box saying the slot cannot be in the past | 400 "Cannot create availability slots for past dates or times" (verified via API) | Pass |
| TC-SLOT-06 | Create a slot that overlaps an existing slot | TC-SLOT-01 slot exists (2026-12-15 10:00–11:00) | Same steps as TC-SLOT-01 with overlapping times | Date 2026-12-15, 10:30–11:30, Room 102 | Rejected (HTTP 400); red error box about overlapping slot | 400 "This slot overlaps with an existing slot from 10:00 to 11:00 on 2026-12-15" (verified via API) | Pass |
| TC-SLOT-07 | Create a slot with an impossible month (exposes **BUG-01**) | Logged in as lecturer (token) | Send request through DevTools console (Appendix A, script 1) | Date 2027-13-01, 10:00–11:00 | Rejected (HTTP 400); invalid date | 201 "Availability slot created successfully"; slot saved with invalid date 2027-13-01 | Fail (BUG-01 #2) |
| TC-SLOT-08 | Create a slot on 31 February (exposes **BUG-02**) | Logged in as lecturer (token) | Same script with the given date | Date 2027-02-31, 10:00–11:00 | Rejected (HTTP 400); invalid date | 201 "Availability slot created successfully"; slot saved with invalid date 2027-02-31 | Fail (BUG-02 #3) |
| TC-SLOT-09 | Edit or delete a slot that is already booked | A slot has been booked by a student (TC-BOOK-01) | 1. Log in as lecturer<br>2. Open `/lecturer/availability`<br>3. Find the booked slot and look for the edit / delete icons | Slot booked in TC-BOOK-01 | Edit and delete icons are not shown; the row shows "Active Booking Locked" and "Booked by Kasun…" | API: edit 400 "Cannot edit an availability slot that is already booked by a student", delete 400 "Cannot delete an availability slot that has an active booking. Cancel the appointment first."; UI (checked on the booked TC-CAN-02 slot): no edit/delete icons, "Active Booking Locked" and "Booked by: Kasun Mendis" shown | Pass |

### Booking (Student)

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-BOOK-01 | Book an available slot with a reason | Logged in as kasun; TC-SLOT-01 slot is available | 1. Open `/lecturers` and open Dr. Kamal's profile<br>2. On the 2026-12-15 10:00 slot click **Book This Appointment**<br>3. Enter Appointment Reason<br>4. Click **Confirm Appointment** | Reason: "Project guidance" | "Appointment Confirmed!" shown; appointment appears in `/student/appointments`; slot no longer offered | 201 "Appointment booked and confirmed successfully!"; listed in my appointments; slot no longer offered (verified via API) | Pass |
| TC-BOOK-02 | Book with a blank (whitespace-only) reason | Logged in as kasun; an available slot exists (TC-SLOT-03) | 1. Click **Book This Appointment** on the 12:30 slot<br>2. Type only spaces in Appointment Reason<br>3. Click **Confirm Appointment** | Reason: "   " (3 spaces) | Booking blocked; message "Please enter a reason for the appointment." | UI (checked on the 10:00 slot after TC-CAN-01): blocked, message "Please enter a reason for the appointment". Direct API call on the 12:30 slot: 400 "Appointment reason is required", but the slot was left booked with no appointment (new defect found, BUG-06 #8) | Pass |
| TC-BOOK-03 | Same student tries to book the same slot again | TC-BOOK-01 done | 1. Log in as kasun<br>2. Open Dr. Kamal's profile again and look for the 2026-12-15 10:00 slot | Same slot as TC-BOOK-01 | Booked slot is no longer offered for booking (server rejects a repeat booking with HTTP 400) | Slot not offered; repeat booking rejected with 400 "You already have an active appointment for this time slot" (verified via API) | Pass |
| TC-BOOK-04 | Second student tries to book a slot already taken (double booking) | TC-BOOK-01 done; log in as test1@student.apex.edu (TC-AUTH-03) | Open Dr. Kamal's profile and look for / try to book the same slot | Same slot as TC-BOOK-01 | Slot not offered, or booking rejected (HTTP 409) with a red error box; no double booking | Slot not offered; 409 "This slot is no longer available or was booked by another student just now." (verified via API) | Pass |

### Cancellation

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-CAN-01 | Cancel an appointment more than 2 hours before start | TC-BOOK-01 appointment exists (2026-12-15) | 1. Log in as kasun<br>2. Open `/student/appointments`<br>3. Click **Cancel** → **Confirm Cancellation** | Appointment from TC-BOOK-01 | Modal closes; appointment status becomes Cancelled | 200 "Appointment cancelled successfully"; status is cancelled and the slot is available again (verified via API) | Pass |
| TC-CAN-02 | Cancel an appointment less than 2 hours before start | Lecturer creates a slot today starting ~1 hour from now; kasun books it | 1. Log in as kasun<br>2. Open `/student/appointments`<br>3. Click **Cancel** → **Confirm Cancellation** on that appointment | Slot: today, (now + 1 h) to (now + 1 h 30 min) | Cancellation blocked; red error box in the modal about the 2-hour cancellation deadline | 400 "Appointments cannot be cancelled less than 2 hour(s) before the scheduled start time."; status stays confirmed (verified via API) | Pass |

### Role-Based Access Control

| ID | Description | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-RBAC-01 | Student tries to open the admin dashboard | Logged in as kasun | Type `http://localhost:5173/admin/dashboard` in the address bar | — | Access denied: admin page not shown (redirect to unauthorized/student page); API returns 403 | API: 403 "Forbidden: Access denied for role 'student'. Required: admin"; UI: redirected to /unauthorized, "403 - Access Denied" shown | Pass |
| TC-RBAC-02 | Lecturer tries to book an appointment | Logged in as dr.kamal | 1. Open `/lecturers` → any lecturer profile<br>2. Click **Book This Appointment** | — | Booking blocked; alert says only student accounts can book (API returns 403) | API: 403 "Forbidden: Access denied for role 'lecturer'. Required: student"; UI: alert "Only students can book appointment slots. Please sign in with a student account." | Pass |
| TC-RBAC-03 | Access a protected page without logging in | Logged out (or new incognito window) | Open `http://localhost:5173/student/dashboard` directly | — | Redirected to the login page; dashboard not shown | API without token: 401 "Authentication required. No token provided."; UI: redirected to /login | Pass |

## 3.2.4 Test Execution Summary

| Module | Total | Passed | Failed |
|---|---|---|---|
| Authentication | 7 | 6 | 1 |
| Availability slots | 9 | 7 | 2 |
| Booking | 4 | 4 | 0 |
| Cancellation | 2 | 2 | 0 |
| Role-based access | 3 | 3 | 0 |
| **Total** | **25** | **22** | **3** |

Failed test cases are linked to the defects logged in GitHub Issues (BUG-01 #2, BUG-02 #3, BUG-03 #4). Two further defects were found during execution of passing test cases: BUG-06 #8 (TC-BOOK-02) and BUG-07 #9 (TC-SLOT-04).

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
