# 3.3 Black-Box Test Design: Equivalence Partitioning & Boundary Value Analysis

**Module:** EC4206 – Software Testing and Quality Assurance  
**System Under Test:** Smart Lecturer Appointment Management System (MERN Stack)  
**Author:** Member 2 (Black-Box & White-Box Test Design)  
**Branch:** `member2-test-design`  

---

## 3.3.1 Equivalence Partitioning (EP)

### 1. Methodology & Test Design Rationale
Equivalence Partitioning (EP) is a fundamental specification-based (black-box) testing technique that partitions the input domain of a software component into finite classes of data (partitions) where all values within a given partition are expected to be processed equivalently by the system under test. 

By selecting a single representative test value from each partition, test cases can effectively uncover defects while eliminating redundant test execution.

The input domain is systematically divided into:
1. **Valid Equivalence Classes:** Inputs that fall within the specified business rules, database schema constraints, and expected operating parameters of the application. These must be processed successfully by the backend, resulting in affirmative responses (`HTTP 200 OK` or `HTTP 201 Created`).
2. **Invalid Equivalence Classes:** Inputs representing missing data, boundary violations, malformed data types, unauthorized values, or business rule contradictions. The application must intercept these inputs defensively and return appropriate client-side error responses (`HTTP 400 Bad Request`, `HTTP 401 Unauthorized`, `HTTP 403 Forbidden`, or `HTTP 409 Conflict`) without crashing or causing data corruption.

---

### 2. Equivalence Partitioning Specifications

#### Table 3.3.1: EP Specification for Student Registration (`POST /api/auth/register`)
*Underlying Implementation:* `backend/controllers/authController.js` (lines 4–60) & `backend/models/User.js`.  
*Business Rules:*
- Mandatory fields: `name`, `email`, `password`.
- Password must contain a minimum of 6 characters.
- Role escalation prevention: Public registration is restricted strictly to the `student` role.
- Email uniqueness: Duplicate email registrations must be rejected.

| Input Field | Partition ID | Equivalence Class Description | Class Type | Representative Test Value | Expected System Behavior & HTTP Status | Actual Result | Status | Evidence Reference |
|---|---|---|---|---|---|---|---|---|
| **Email** | `EP-REG-E1` | Valid, unregistered institutional email | Valid | `newstudent@student.apex.edu` | System accepts registration, hashes password, creates student record, and returns JWT token (`HTTP 201 Created`). | Account created successfully; token returned (`HTTP 201`) | **Pass** | `TC-AUTH-03`, `execution-log.md` |
| **Email** | `EP-REG-E2` | Malformed email format (missing domain/TLD) | Invalid | `student@` | Request rejected with validation error message (`HTTP 400 Bad Request`). | Rejected (`HTTP 400`) | **Pass** | Schema validation |
| **Email** | `EP-REG-E3` | Duplicate email address already registered | Invalid | `kasun@student.apex.edu` | Controller intercepts existing email query and rejects with message *"An account with this email already exists"* (`HTTP 409 Conflict`). | 409 Conflict returned; duplicate rejected | **Pass** | `TC-AUTH-05`, `M2-EP-01-registration.png` |
| **Email** | `EP-REG-E4` | Empty / null / omitted email field | Invalid | `""` (Empty string) | Controller fails mandatory fields check and returns *"Name, email, and password are required"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `authController.js` L10 |
| **Password** | `EP-REG-P1` | Valid password length ($\ge 6$ characters) | Valid | `Student@123` (11 chars) | Password accepted, salted and hashed via bcrypt; user registered (`HTTP 201 Created`). | 201 Created | **Pass** | `TC-AUTH-03` |
| **Password** | `EP-REG-P2` | Password shorter than minimum ($< 6$ characters) | Invalid | `Ab@12` (5 chars) | Request rejected with message *"Password must be at least 6 characters long"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-AUTH-04`, `M2-EP-01-registration.png` |
| **Password** | `EP-REG-P3` | Empty / omitted password field | Invalid | `""` (Empty string) | Request rejected with message *"Name, email, and password are required"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `authController.js` L10 |
| **Role** | `EP-REG-R1` | Role `student` or omitted (default assignment) | Valid | `"student"` (or omitted) | User assigned role `student` in MongoDB (`HTTP 201 Created`). | 201 Created with role student | **Pass** | `TC-AUTH-03` |
| **Role** | `EP-REG-R2` | Role escalation attempt (`lecturer` or `admin`) | Invalid | `"lecturer"` | Intercepted by role escalation prevention guard; returns *"Public registration is restricted to students only"* (`HTTP 403 Forbidden`). | 403 Forbidden returned | **Pass** | `authController.js` L24 |

---

#### Table 3.3.2: EP Specification for Availability Slot Creation (`POST /api/availability`)
*Underlying Implementation:* `backend/controllers/availabilityController.js` (lines 48–110) & `backend/utils/dateUtils.js`.  
*Business Rules:*
- Required fields: `date`, `startTime`, `endTime`, `location`.
- Slot duration must satisfy $5 \le \text{duration} \le 480$ minutes.
- `endTime` must be strictly after `startTime`.
- Slot date and start time must be in the future relative to Asia/Colombo (`UTC+05:30`).
- No temporal overlap is permitted among slots published by the same lecturer on the same calendar day.

| Input / Parameter | Partition ID | Equivalence Class Description | Class Type | Representative Test Value | Expected System Behavior & HTTP Status | Actual Result | Status | Evidence Reference |
|---|---|---|---|---|---|---|---|---|
| **Slot Duration** | `EP-SLOT-D1` | Valid slot duration ($5 \le d \le 480$ min) | Valid | Start: `10:00`, End: `11:00` ($d = 60$ min) | Validation passes; slot created with status `available` (`HTTP 201 Created`). | 201 Created | **Pass** | `TC-SLOT-01`, `M2-EP-02-slot-duration.png` |
| **Slot Duration** | `EP-SLOT-D2` | Duration strictly below minimum ($d < 5$ min) | Invalid | Start: `12:00`, End: `12:04` ($d = 4$ min) | Intercepted by `isValidTimeRange`; returns *"End time must be after start time, and slot duration must be at least 5 minutes"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-SLOT-02`, `dateUtils.test.js` |
| **Slot Duration** | `EP-SLOT-D3` | Duration strictly above maximum ($d > 480$ min) | Invalid | Start: `08:00`, End: `16:01` ($d = 481$ min) | Intercepted by `isValidTimeRange`; returns error message (`HTTP 400 Bad Request`). | 400 Bad Request returned (Note BUG-07) | **Pass\*** | `TC-SLOT-04`, `BUG-07 #9` |
| **Time Ordering** | `EP-SLOT-T1` | Zero duration (`endTime == startTime`) | Invalid | Start: `10:00`, End: `10:00` ($d = 0$ min) | Intercepted by `isValidTimeRange`; rejected (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `dateUtils.test.js` |
| **Time Ordering** | `EP-SLOT-T2` | Inverted time order (`endTime < startTime`) | Invalid | Start: `10:00`, End: `09:00` ($d = -60$ min) | Intercepted by `isValidTimeRange`; rejected (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `dateUtils.test.js` |
| **Slot Timing** | `EP-SLOT-P1` | Slot date and time in the future | Valid | Date: `2026-12-15`, Start: `10:00` | Accepted; `isSlotInPast` returns `false` (`HTTP 201 Created`). | 201 Created | **Pass** | `TC-SLOT-01` |
| **Slot Timing** | `EP-SLOT-P2` | Slot date and time in the past | Invalid | Date: `2020-01-01`, Start: `10:00` | Intercepted by `isSlotInPast`; returns *"Cannot create availability slots for past dates or times"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-SLOT-05`, `api.test.js` |
| **Slot Overlap** | `EP-SLOT-O1` | Non-overlapping disjoint slot intervals | Valid | Existing: `10:00–11:00`, New: `13:00–14:00` | `doTimesOverlap` returns `false`; slot created (`HTTP 201 Created`). | 201 Created | **Pass** | `dateUtils.test.js` |
| **Slot Overlap** | `EP-SLOT-O2` | Partial or fully overlapping interval | Invalid | Existing: `10:00–11:00`, New: `10:30–11:30` | `doTimesOverlap` returns `true`; returns *"This slot overlaps with an existing slot..."* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-SLOT-06`, `api.test.js` |
| **Slot Overlap** | `EP-SLOT-O3` | Touching boundary slots (`endA == startB`) | Valid | Existing: `09:00–10:00`, New: `10:00–11:00` | `max(start) < min(end)` condition is false ($10 < 10$ is false); no overlap detected; slot created (`HTTP 201 Created`). | 201 Created | **Pass** | `dateUtils.test.js` |

---

#### Table 3.3.3: EP Specification for Meeting Method and Appointment Booking Reason (`POST /api/appointments`)
*Underlying Implementation:* `backend/controllers/appointmentController.js` & `backend/models/Appointment.js`.  
*Business Rules:*
- `meetingMethod` must match the enum `['in-person', 'online']`.
- `reason` is required, trimmed of leading/trailing whitespace, and restricted to a maximum length of 200 characters.

| Input Field | Partition ID | Equivalence Class Description | Class Type | Representative Test Value | Expected System Behavior & HTTP Status | Actual Result | Status | Evidence Reference |
|---|---|---|---|---|---|---|---|---|
| **meetingMethod** | `EP-MM-01` | Valid enum: In-person consultation | Valid | `"in-person"` | Accepted; slot saved with `meetingMethod: 'in-person'` (`HTTP 201 Created`). | 201 Created | **Pass** | `TC-SLOT-01` |
| **meetingMethod** | `EP-MM-02` | Valid enum: Online consultation | Valid | `"online"` | Accepted; slot saved with `meetingMethod: 'online'` (`HTTP 201 Created`). | 201 Created | **Pass** | `Availability.js` |
| **meetingMethod** | `EP-MM-03` | Invalid enum value | Invalid | `"hybrid"` | Mongoose validation error intercepted; rejected (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | Model validation |
| **Booking Reason** | `EP-REA-01` | Valid non-empty string ($1 \le \text{length} \le 200$) | Valid | `"Project guidance"` (16 chars) | Booking confirmed; appointment created with status `confirmed` (`HTTP 201 Created`). | 201 Created; confirmed | **Pass** | `TC-BOOK-01`, `api.test.js` |
| **Booking Reason** | `EP-REA-02` | Empty string / omitted reason parameter | Invalid | `""` | Intercepted by controller check; returns *"Availability slot ID and appointment reason are required"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `appointmentController.js` L12 |
| **Booking Reason** | `EP-REA-03` | Whitespace-only string | Invalid | `"   "` (3 spaces) | Model whitespace trim leaves empty string; rejected (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-BOOK-02`, `BUG-06 #8` |
| **Booking Reason** | `EP-REA-04` | String exceeding length limit ($> 200$ chars) | Invalid | String of 201 `'A'` characters | Mongoose schema validator rejects with *"Reason cannot exceed 200 characters"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `Appointment.js` L24 |

---

## 3.3.2 Boundary Value Analysis (BVA)

### 1. Methodology & Test Design Rationale
Boundary Value Analysis (BVA) is a testing technique that focuses testing effort on the edges of equivalence partitions. Empirical software engineering data demonstrates that faults in software occur with highest density at the boundary values of input variables due to off-by-one programming errors, incorrect relational operators ($>$ vs. $\ge$, $<$ vs. $\le$), date rollover arithmetic, and format boundary limitations.

For each continuous or ordinal input domain bounded by a minimum ($\min$) and a maximum ($\max$), BVA evaluates the following 6 test points:
1. Just below minimum: $\min - 1$
2. Exact minimum: $\min$
3. Just above minimum: $\min + 1$
4. Just below maximum: $\max - 1$
5. Exact maximum: $\max$
6. Just above maximum: $\max + 1$

---

### 2. Comprehensive Boundary Value Analysis Table

#### Table 3.3.4: BVA on Numeric, Temporal, and Date Variables

| Boundary Variable | Nominal Domain & Rule | Test Value | Boundary Classification | Expected System Response / Status | Actual System Response / Status | Status | Evidence & Defect Link |
|---|---|---|---|---|---|---|---|
| **Slot Duration** | Lower limit: $\min = 5$ min | 4 min (`09:00–09:04`) | $\min - 1$ | Reject (`HTTP 400`); duration must be $\ge 5$ min | Rejected (`HTTP 400`); "duration must be at least 5 minutes" | **Pass** | `TC-SLOT-02`, `dateUtils.test.js` |
| **Slot Duration** | Lower limit: $\min = 5$ min | 5 min (`09:00–09:05`) | $\min$ | Accept (`HTTP 201`); valid minimum boundary | Accepted (`HTTP 201`); slot created | **Pass** | `TC-SLOT-03`, `dateUtils.test.js` |
| **Slot Duration** | Lower limit: $\min = 5$ min | 6 min (`09:00–09:06`) | $\min + 1$ | Accept (`HTTP 201`); valid slot | Accepted (`HTTP 201`); slot created | **Pass** | `dateUtils.test.js` |
| **Slot Duration** | Upper limit: $\max = 480$ min | 479 min (`08:00–15:59`) | $\max - 1$ | Accept (`HTTP 201`); valid slot | Accepted (`HTTP 201`); slot created | **Pass** | `dateUtils.test.js` |
| **Slot Duration** | Upper limit: $\max = 480$ min | 480 min (`08:00–16:00`) | $\max$ | Accept (`HTTP 201`); valid maximum boundary | Accepted (`HTTP 201`); slot created | **Pass** | `dateUtils.test.js` |
| **Slot Duration** | Upper limit: $\max = 480$ min | 481 min (`08:00–16:01`) | $\max + 1$ | Reject (`HTTP 400`); duration exceeds 480 min | Rejected (`HTTP 400`); duration error returned | **Pass\*** | `TC-SLOT-04`, `BUG-07 #9` |
| **Password Length** | Min length: $\min = 6$ chars | 5 chars (`"Ab@12"`) | $\min - 1$ | Reject (`HTTP 400`); length $< 6$ | Rejected (`HTTP 400`); "Password must be at least 6 characters long" | **Pass** | `TC-AUTH-04`, `M2-EP-01-registration.png` |
| **Password Length** | Min length: $\min = 6$ chars | 6 chars (`"Abc@12"`) | $\min$ | Accept (`HTTP 201`); boundary valid | Accepted (`HTTP 201`); registration succeeds | **Pass** | `authController.js` |
| **Password Length** | Min length: $\min = 6$ chars | 7 chars (`"Abcd@12"`) | $\min + 1$ | Accept (`HTTP 201`); valid password | Accepted (`HTTP 201`); registration succeeds | **Pass** | `authController.js` |
| **24-Hour Time Format** | Min boundary: `00:00` | `00:00` | $\min$ time | Accept; converts to 0 minutes from midnight | Converted to `0` minutes; valid | **Pass** | `dateUtils.test.js` |
| **24-Hour Time Format** | Max boundary: `23:59` | `23:59` | $\max$ time | Accept; converts to 1439 minutes from midnight | Converted to `1439` minutes; valid | **Pass** | `dateUtils.test.js` |
| **24-Hour Time Format** | Exceeds day: `24:00` | `24:00` | $\max + 1$ time | Reject (`HTTP 400`); schema requires `00:00` to `23:59` | Schema regex match fails; rejected (`HTTP 400`) | **Pass** | `Availability.js` regex |
| **Slot Time vs "Now"** | Future slots only | Now $- 1$ min | $\text{Current} - 1$ min | Reject (`HTTP 400`); start time is in the past | Rejected (`isSlotInPast = true`); `HTTP 400` | **Pass** | `dateUtils.test.js` |
| **Slot Time vs "Now"** | Future slots only | Now $+ 1$ min | $\text{Current} + 1$ min | Accept (`HTTP 201`); start time is in future | Accepted (`isSlotInPast = false`); `HTTP 201` | **Pass** | `dateUtils.test.js` |
| **Slot Time vs "Now"** | Future slots only | Yesterday (Now $- 1440$ min) | Historical past | Reject (`HTTP 400`); slot is in the past | Rejected (`HTTP 400`); "Cannot create availability slots for past dates" | **Pass** | `TC-SLOT-05` |
| **Cancellation Deadline** | Deadline: 2 hours (120 min) | 119 min before start | $\text{Deadline} - 1$ min | Reject cancellation (`HTTP 400`); within 2-hour window | Rejected (`isPastCancellationDeadline = true`); `HTTP 400` | **Pass** | `TC-CAN-02`, `dateUtils.test.js` |
| **Cancellation Deadline** | Deadline: 2 hours (120 min) | 121 min before start | $\text{Deadline} + 1$ min | Permit cancellation (`HTTP 200`); outside 2-hour window | Allowed (`isPastCancellationDeadline = false`); `HTTP 200` | **Pass** | `TC-CAN-01`, `dateUtils.test.js` |
| **Month Boundary** | Valid months: $01 \le M \le 12$ | Month 12 (`2027-12-01`) | $\max$ month | Accept (`HTTP 201`); valid calendar month | Accepted (`HTTP 201`); slot created | **Pass** | `TC-SLOT-01` |
| **Month Boundary** | Valid months: $01 \le M \le 12$ | Month 13 (`2027-13-01`) | $\max + 1$ month | Reject (`HTTP 400`); invalid calendar month | **Accepted (`HTTP 201`)**; record saved with invalid date | **FAIL** | **BUG-01 (Issue #2)**, `M2-BVA-03-BUG-01-month13.png` |
| **Day Boundary (Feb)** | Max days in non-leap Feb: 28 | Feb 28 (`2027-02-28`) | $\max$ day in Feb | Accept (`HTTP 201`); valid calendar day | Accepted (`HTTP 201`); slot created | **Pass** | `dateUtils.js` |
| **Day Boundary (Feb)** | Max days in non-leap Feb: 28 | Feb 31 (`2027-02-31`) | Calendar overflow | Reject (`HTTP 400`); non-existent day | **Accepted (`HTTP 201`)**; date rolled over to March 3 | **FAIL** | **BUG-02 (Issue #3)**, `M2-BVA-04-BUG-02-feb31.png` |

---

### 3. Detailed Defect Investigation: Boundary Value Failures

#### 1. BUG-01 (GitHub Issue #2): Acceptance of Impossible Calendar Month `2027-13-01`
- **Defect Description:** When a lecturer submits an availability slot with an impossible month `2027-13-01`, the system accepts the request and returns `HTTP 201 Created` instead of rejecting it with `HTTP 400 Bad Request`.
- **Root Cause Analysis:**
  1. In `backend/models/Availability.js` (line 13), date validation relies strictly on a syntactic regular expression:
     ```javascript
     match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
     ```
     This expression validates character shapes (4 digits, hyphen, 2 digits, hyphen, 2 digits), but performs zero semantic range validation on month ($01 \le MM \le 12$).
  2. In `backend/utils/dateUtils.js` (lines 10–22), `isSlotInPast` invokes:
     ```javascript
     const slotStart = new Date("2027-13-01T10:00:00+05:30");
     return slotStart.getTime() <= Date.now();
     ```
     In the V8 JavaScript runtime, passing month `13` produces an `Invalid Date` object. Evaluating `.getTime()` on an `Invalid Date` yields `NaN`.
  3. In JavaScript IEEE-754 floating point arithmetic:
     $$\text{NaN} \le \text{Date.now()} \implies \text{false}$$
     Because the inequality evaluates to `false`, `isSlotInPast` concludes that the slot is *not* in the past. Consequently, the controller proceeds to create and persist the impossible slot in MongoDB.
- **Recommended Remediation:** Implement strict calendar date validation before invoking date comparison utilities:
  ```javascript
  const isValidISODate = (str) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(str)) return false;
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  };
  ```

---

#### 2. BUG-02 (GitHub Issue #3): Calendar Rollover on Non-Existent Date `2027-02-31`
- **Defect Description:** Submitting a slot on February 31 (`2027-02-31`) succeeds with `HTTP 201 Created`.
- **Root Cause Analysis:**
  1. The regex `/^\d{4}-\d{2}-\d{2}$/` passes because `"2027-02-31"` has valid syntactic formatting.
  2. The V8 JavaScript `Date` constructor parses `2027-02-31` by rolling the 3 excess days over beyond February 28 into March 3, 2027:
     $$\text{new Date('2027-02-31')} \longrightarrow \text{2027-03-03T...}$$
  3. However, the database record stores the raw user-supplied string: `date: "2027-02-31"`.
  4. As a result, when students query for consultation slots on real calendar days (e.g., `GET /api/availability?date=2027-03-03`), the database query performs string comparison and fails to return the slot. The slot becomes an orphaned database record that can never be viewed or booked.

---

#### 3. Defect Note: BUG-07 (GitHub Issue #9): Missing Upper Boundary Information in Error Message
- When testing the upper boundary of slot duration ($d = 481$ minutes at `08:00–16:01`), the backend correctly rejects the creation with `HTTP 400 Bad Request`.
- However, the error message returned to the user states:
  > *"End time must be after start time, and slot duration must be at least 5 minutes"*
- The message only specifies the minimum boundary constraint and fails to communicate that the maximum 480-minute limit was violated, violating usability and error feedback standards.
