# 3.3.3 Decision Table Testing: Appointment Booking (`POST /api/appointments`)

**Module:** EC4206 – Software Testing and Quality Assurance  
**System Under Test:** Smart Lecturer Appointment Management System (MERN Stack)  
**Author:** Member 2 (Black-Box & White-Box Test Design)  
**Branch:** `member2-test-design`  

---

## 1. Methodology & Test Design Rationale
Decision Table testing is a rigorous black-box test design technique designed specifically to specify and verify complex business logic governed by combinations of multiple boolean conditions. Where procedural code executes cascading validation checks, conditional guards, and state transitions, decision tables ensure:
1. **Completeness:** Every possible permutation of system inputs and state conditions is formally evaluated.
2. **Defect Prevention:** Ambiguous, contradictory, or overlooked business requirements are identified during the test design phase before software deployment.
3. **Traceability:** High-level business rules map directly to unit, integration, and end-to-end automated test suites.

In the Smart Lecturer Appointment Management System, the consultation slot booking endpoint (`POST /api/appointments`) is one of the most critical and complex workflows in the application. It enforces authentication, role-based authorization, request payload validation, database entity existence, temporal validity, duplicate prevention, and atomic concurrency locking to eliminate double-booking vulnerabilities.

---

## 2. Formal Identification of Conditions and Actions

The appointment booking controller (`backend/controllers/appointmentController.js`, lines 7–110) in conjunction with the authentication middleware (`backend/middleware/auth.js`) evaluates **7 distinct system conditions** to determine which of **8 mutually exclusive actions** must be triggered.

### System Conditions (Inputs & Environmental State)
- **C1: Token Valid & Account Active?**  
  *Implementation:* `backend/middleware/auth.js` (`protect` middleware). Evaluates whether the incoming HTTP request contains a valid `Bearer <token>` header, verifies the JSON Web Token (JWT) cryptographic signature, verifies that the user record exists in MongoDB, and asserts that `user.isActive === true`.
- **C2: User Role = 'student'?**  
  *Implementation:* `backend/middleware/auth.js` (`authorize('student')`). Asserts that the authenticated user's role is strictly `'student'`. If a lecturer or administrator attempts to book a consultation slot, access is denied.
- **C3: Required Fields Present?**  
  *Implementation:* `backend/controllers/appointmentController.js` (line 11). Validates that the request payload contains non-empty values for both `availabilityId` (the ObjectId of the consultation slot) and `reason` (the academic justification for the consultation).
- **C4: Availability Slot Exists in Database?**  
  *Implementation:* `Availability.findById(availabilityId)`. Checks whether the requested consultation slot exists in MongoDB.
- **C5: Slot Start Time in Future?**  
  *Implementation:* `isSlotInPast(slot.date, slot.startTime)`. Evaluates the slot's scheduled start timestamp against the current wall-clock time in the `Asia/Colombo` (`UTC+05:30`) timezone.
- **C6: Student Already Has Active Booking for This Slot?**  
  *Implementation:* `Appointment.findOne({ studentId, availabilityId, status: { $in: ['pending', 'confirmed'] } })`. Prevents the same student from holding multiple active appointments for the identical consultation slot.
- **C7: Slot Status Is Currently 'available'?**  
  *Implementation:* Atomic conditional transition `Availability.findOneAndUpdate({ _id: availabilityId, status: 'available' }, { $set: { status: 'booked' } })`. Guarantees thread-safe / process-safe concurrency prevention against race conditions when two students attempt to book the same slot simultaneously.

### System Actions (HTTP Status Codes & Side Effects)
- **A1: Return HTTP 401 Unauthorized** (`"Authentication required. No token provided."` or `"Invalid session token."`)
- **A2: Return HTTP 403 Forbidden** (`"Forbidden: Access denied for role '...' Required: student"`)
- **A3: Return HTTP 400 Bad Request** (`"Availability slot ID and appointment reason are required"`)
- **A4: Return HTTP 404 Not Found** (`"Availability slot not found"`)
- **A5: Return HTTP 400 Bad Request** (`"Cannot book an appointment for a past date or time"`)
- **A6: Return HTTP 400 Bad Request** (`"You already have an active appointment for this time slot"`)
- **A7: Return HTTP 409 Conflict** (`"This slot is no longer available or was booked by another student just now."`)
- **A8: Return HTTP 201 Created** (`"Appointment booked and confirmed successfully!"`; creates `Appointment` record and sets slot status to `booked`)

---

## 3. Condition Collapse & Table Reduction Analysis

A complete, unconstrained truth table for 7 binary conditions contains:
$$2^N = 2^7 = 128 \text{ possible combinations}$$

In software engineering, testing all 128 combinations is inefficient and redundant because modern procedural and web controllers implement **early-exit guard clauses** (short-circuit defensive validation). 

Specifically:
1. If **C1 is False** (unauthenticated or invalid token), execution halts immediately in the middleware; conditions C2 through C7 are unreached ("Don't Care" / Masked: `—`).
2. If **C2 is False** (user is not a student), the request is rejected with `HTTP 403` prior to invoking the controller; conditions C3 through C7 are masked.
3. If **C3 is False** (payload missing required parameters), controller line 11 terminates the request with `HTTP 400` before querying the database; conditions C4 through C7 are masked.
4. If **C4 is False** (slot ID not found in database), line 24 terminates with `HTTP 404`; conditions C5 through C7 are masked.
5. If **C5 is False** (slot start time has already passed), line 32 terminates with `HTTP 400`; conditions C6 and C7 are masked.
6. If **C6 is True** (the student already has an active reservation for this slot), line 46 terminates with `HTTP 400`; condition C7 is masked.
7. If **C6 is False**, condition C7 is evaluated:
   - If **C7 is False** (slot already booked or locked by another concurrent process), the atomic update fails to match any document, returning `HTTP 409 Conflict`.
   - If **C7 is True** (slot is free), the atomic update succeeds, returning `HTTP 201 Created`.

By applying condition collapse, the 128 mathematical combinations collapse into **8 logically independent, fully executable decision rules (R1 to R8)**.

---

## 4. Collapsed Decision Table

### Table 3.3.5: Collapsed Decision Table for `bookAppointment`

| Item | Condition / Action | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **C1** | Token valid & user account active? | **F** | **T** | **T** | **T** | **T** | **T** | **T** | **T** |
| **C2** | Authenticated role is 'student'? | — | **F** | **T** | **T** | **T** | **T** | **T** | **T** |
| **C3** | Required fields (`availabilityId`, `reason`) present? | — | — | **F** | **T** | **T** | **T** | **T** | **T** |
| **C4** | Availability slot exists in database? | — | — | — | **F** | **T** | **T** | **T** | **T** |
| **C5** | Slot start date/time is in the future? | — | — | — | — | **F** | **T** | **T** | **T** |
| **C6** | Student already holds an active booking for this slot? | — | — | — | — | — | **T** | **F** | **F** |
| **C7** | Slot status is currently 'available' in DB? | — | — | — | — | — | — | **F** | **T** |
| **A1** | Return HTTP 401 Unauthorized | **X** | | | | | | | |
| **A2** | Return HTTP 403 Forbidden | | **X** | | | | | | |
| **A3** | Return HTTP 400 Bad Request (Missing parameters) | | | **X** | | | | | |
| **A4** | Return HTTP 404 Not Found (Non-existent slot) | | | | **X** | | | | |
| **A5** | Return HTTP 400 Bad Request (Past slot error) | | | | | **X** | | | |
| **A6** | Return HTTP 400 Bad Request (Duplicate booking) | | | | | | **X** | | |
| **A7** | Return HTTP 409 Conflict (Double-booking race) | | | | | | | **X** | |
| **A8** | Return HTTP 201 Created (Appointment confirmed) | | | | | | | | **X** |

*Legend:*  
- **T:** Condition evaluates to True  
- **F:** Condition evaluates to False  
- **—:** Condition is masked / Don't Care (evaluation short-circuited by earlier condition)  
- **X:** Action triggered by the rule  

---

## 5. Test Traceability Matrix: Mapping Decision Rules to Tests

Every rule in the collapsed decision table is validated by automated integration test suites (`backend/tests/api.test.js`) and manual test procedures (`qa/test-plan/test-cases.md`).

### Table 3.3.6: Decision Table Traceability Matrix

| Rule | Rule Description & Scenario | Test Implementation / Code Reference | Test Data Used | Expected Status | Actual Status | Evidence Reference |
|:---:|---|---|---|:---:|:---:|:---:|
| **R1** | Unauthenticated request missing JWT authorization header | Automated test in `backend/tests/api.test.js`: `test('R1: no token -> 401')` & manual `TC-RBAC-03` | `POST /api/appointments` without `Bearer` header | `401 Unauthorized` | `401 Unauthorized` | **Pass** (`M2-DT-01-booking-rules.png`) |
| **R2** | Lecturer account attempts to book appointment slot | Automated test in `backend/tests/api.test.js`: `test('R2: lecturer tries to book -> 403')` & manual `TC-RBAC-02` | Bearer token for `dr.kamal@apex.edu` (role: `lecturer`) | `403 Forbidden` | `403 Forbidden` | **Pass** (`M2-DT-01-booking-rules.png`) |
| **R3** | Student request missing appointment reason | Manual test `TC-BOOK-02` & controller validation in `appointmentController.js` | `availabilityId: "<validId>"`, `reason: ""` | `400 Bad Request` | `400 Bad Request` | **Pass** (`TC-BOOK-02`, `execution-log.md`) |
| **R4** | Booking request targeting a non-existent slot ObjectId | Automated test in `backend/tests/api.test.js`: `test('R3: slot does not exist -> 404')` | `availabilityId: "64b000000000000000000000"` | `404 Not Found` | `404 Not Found` | **Pass** (`M2-DT-01-booking-rules.png`) |
| **R5** | Attempting to book a consultation slot scheduled in the past | Manual test `TC-SLOT-05` & controller check (`isSlotInPast`) | Slot date: `2020-01-01`, start: `10:00` | `400 Bad Request` | `400 Bad Request` | **Pass** (`execution-log.md`) |
| **R6** | Same student attempts to book the identical slot a second time | Manual test `TC-BOOK-03` & controller check (`existingStudentBooking`) | Kasun books `2026-12-15 10:00` twice consecutively | `400 Bad Request` | `400 Bad Request` | **Pass** (`TC-BOOK-03`, `execution-log.md`) |
| **R7** | Concurrency race: Second student attempts to book slot already taken | Automated test in `backend/tests/api.test.js`: `test('R5: second student books the same slot -> 409')` & manual `TC-BOOK-04` | Dinithi attempts to book slot taken by Kasun; atomic update fails | `409 Conflict` | `409 Conflict` | **Pass** (`M2-DT-01-booking-rules.png`) |
| **R8** | Student books an available, future slot with valid justification | Automated test in `backend/tests/api.test.js`: `test('R4: free slot is booked -> 201')` & manual `TC-BOOK-01` | Kasun books available slot with reason `"Project guidance"` | `201 Created` | `201 Created` | **Pass** (`M2-DT-01-booking-rules.png`) |

---

## 6. Concurrency & Double-Booking Analysis (Academic Note for Report)

A critical strength demonstrated by Rule **R7** is the handling of race conditions:
- **Vulnerability Scenario:** If two students view the same available consultation slot simultaneously and click "Confirm Appointment" at the exact same millisecond, naive systems that perform a separate `findById` followed by `save()` are vulnerable to a Time-of-Check to Time-of-Use (**TOCTOU**) bug, resulting in double-booking.
- **Architectural Solution:** The Smart Lecturer Appointment Management System implements an atomic find-and-modify operation:
  ```javascript
  const updatedSlot = await Availability.findOneAndUpdate(
    { _id: availabilityId, status: 'available' },
    { $set: { status: 'booked' } },
    { new: true }
  );
  if (!updatedSlot) {
    return res.status(409).json({ message: 'This slot is no longer available...' });
  }
  ```
  Because MongoDB executes single-document operations atomically, the first request transitions the slot status from `'available'` to `'booked'`. The second concurrent request fails the query filter `{ status: 'available' }`, returning `null` and gracefully triggering Rule **R7** (`HTTP 409 Conflict`).
