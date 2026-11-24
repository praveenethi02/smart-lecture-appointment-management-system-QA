# UNIVERSITY OF RUHUNA
## Faculty of Engineering – Department of Electrical and Information Engineering
### EC4206: Software Testing and Quality Assurance
---

# Comprehensive QA Test Design & Analysis Report
## Member 2 Deliverables: Black-Box & White-Box Test Design (LO-2) & Reflection

- **Academic Module:** EC4206 – Software Testing and Quality Assurance
- **Project Under Test:** Smart Lecturer Appointment Management System (MERN Stack)
- **GitHub Repository:** `https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA`
- **Assigned Role:** Member 2 – Black-Box & White-Box Test Design (Learning Outcome 2)
- **Student Name:** Yasiru Nawodya
- **GitHub Username:** `Yasiru-Nawodya`
- **Email:** `Yasiru2Nawodya@gmail.com`
- **Assigned Branch:** `member2-test-design`
- **Pull Request:** PR #14 (`docs(qa): Member 2 - Black-Box & White-Box Test Design (LO-2)`)

---

## Table of Contents
1. [3.3 Black-Box Test Design](#33-black-box-test-design)
   - [3.3.1 Equivalence Partitioning (EP)](#331-equivalence-partitioning-ep)
   - [3.3.2 Boundary Value Analysis (BVA)](#332-boundary-value-analysis-bva)
   - [3.3.3 Decision Table Testing](#333-decision-table-testing)
2. [3.4 White-Box Testing (LO-2)](#34-white-box-testing-lo-2)
   - [3.4.1 Control Flow Graph (CFG) Construction](#341-control-flow-graph-cfg-construction)
   - [3.4.2 Cyclomatic Complexity Calculation ($V(G)=6$)](#342-cyclomatic-complexity-calculation)
   - [3.4.3 Linearly Independent Basis Paths & Test Suite](#343-linearly-independent-basis-paths--test-suite)
   - [3.4.4 Statement Coverage vs. Branch Coverage Analysis](#344-statement-coverage-vs-branch-coverage-analysis)
   - [3.4.5 Supplementary White-Box Analysis (`isValidTimeRange`)](#345-supplementary-white-box-analysis-isvalidtimerange)
3. [3.10 Member 2 Individual QA Self-Reflection](#310-member-2-individual-qa-self-reflection)
4. [Appendix: Test Evidence & Screenshot Catalog](#appendix-test-evidence--screenshot-catalog)

---

# 3.3 Black-Box Test Design

Specification-based (black-box) testing focuses on testing the functionality of the software components against specified business requirements without reference to their internal source code structure.

---

## 3.3.1 Equivalence Partitioning (EP)

### 1. Methodology & Test Design Rationale
Equivalence Partitioning divides the input domain into discrete partitions (equivalence classes) where all data values within a partition are treated equivalently by the system. If one value in a partition exposes a defect, all other values in that same partition are assumed to expose the same defect; conversely, if one value passes, all others are assumed to pass.

The input domain is partitioned into:
1. **Valid Equivalence Classes:** Inputs conforming to valid business logic and schema definitions resulting in HTTP 200/201 responses.
2. **Invalid Equivalence Classes:** Inputs violating constraints, causing defensive error responses (`HTTP 400 Bad Request`, `HTTP 401 Unauthorized`, `HTTP 403 Forbidden`, `HTTP 409 Conflict`).

---

### 2. Equivalence Partitioning Specifications

#### Table 3.3.1: EP Specification for Student Registration (`POST /api/auth/register`)
*Implementation Reference:* `backend/controllers/authController.js` & `backend/models/User.js`.  
*Business Rules:* Mandatory `name`, `email`, `password`; password $\ge 6$ chars; public registration restricted to `student` role; duplicate email rejected.

| Input Field | Partition ID | Equivalence Class Description | Class Type | Representative Test Value | Expected System Behavior & HTTP Status | Actual Result | Status | Evidence Reference |
|---|---|---|---|---|---|---|---|---|
| **Email** | `EP-REG-E1` | Valid, unregistered institutional email | Valid | `newstudent@student.apex.edu` | System accepts registration, hashes password with bcrypt, creates student record, and returns JWT token (`HTTP 201 Created`). | Account created successfully; token returned (`HTTP 201`) | **Pass** | `TC-AUTH-03`, `execution-log.md` |
| **Email** | `EP-REG-E2` | Malformed email format (missing domain/TLD) | Invalid | `student@` | Request rejected with validation error message (`HTTP 400 Bad Request`). | Rejected (`HTTP 400`) | **Pass** | Schema validation |
| **Email** | `EP-REG-E3` | Duplicate email address already registered | Invalid | `kasun@student.apex.edu` | Controller intercepts existing email and returns *"An account with this email already exists"* (`HTTP 409 Conflict`). | 409 Conflict returned; duplicate rejected | **Pass** | `TC-AUTH-05`, `M2-EP-01-registration.png` |
| **Email** | `EP-REG-E4` | Empty / null / omitted email field | Invalid | `""` (Empty string) | Controller fails mandatory check and returns *"Name, email, and password are required"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `authController.js` L10 |
| **Password** | `EP-REG-P1` | Valid password length ($\ge 6$ characters) | Valid | `Student@123` (11 chars) | Password accepted, salted and hashed via bcrypt; user registered (`HTTP 201 Created`). | 201 Created | **Pass** | `TC-AUTH-03` |
| **Password** | `EP-REG-P2` | Password shorter than minimum ($< 6$ characters) | Invalid | `Ab@12` (5 chars) | Request rejected with message *"Password must be at least 6 characters long"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `TC-AUTH-04`, `M2-EP-01-registration.png` |
| **Password** | `EP-REG-P3` | Empty / omitted password field | Invalid | `""` (Empty string) | Request rejected with message *"Name, email, and password are required"* (`HTTP 400 Bad Request`). | 400 Bad Request returned | **Pass** | `authController.js` L10 |
| **Role** | `EP-REG-R1` | Role `student` or omitted (default assignment) | Valid | `"student"` (or omitted) | User assigned role `student` in MongoDB (`HTTP 201 Created`). | 201 Created with role student | **Pass** | `TC-AUTH-03` |
| **Role** | `EP-REG-R2` | Role escalation attempt (`lecturer` or `admin`) | Invalid | `"lecturer"` | Intercepted by role escalation guard; returns *"Public registration is restricted to students only"* (`HTTP 403 Forbidden`). | 403 Forbidden returned | **Pass** | `authController.js` L24 |

---

#### Figure 3.3.1: EP Registration Test Evidence (`M2-EP-01-registration.png`)
![Registration EP Validation](screenshots/M2-EP-01-registration.png)
*Figure 3.3.1: Execution evidence showing duplicate email rejection (HTTP 409) and short password rejection (HTTP 400).*

---

#### Table 3.3.2: EP Specification for Availability Slot Creation (`POST /api/availability`)
*Implementation Reference:* `backend/controllers/availabilityController.js` & `backend/utils/dateUtils.js`.  
*Business Rules:* Required fields: `date`, `startTime`, `endTime`, `location`; duration between 5 and 480 minutes; slot date/time strictly in future; no overlapping slots for the same lecturer.

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

#### Figure 3.3.2: EP Slot Creation Test Evidence (`M2-EP-02-slot-duration.png`)
![Slot Duration EP Validation](screenshots/M2-EP-02-slot-duration.png)
*Figure 3.3.2: Execution evidence demonstrating rejection of sub-5-minute slots and acceptance of valid 60-minute consultation slots.*

---

#### Table 3.3.3: EP Specification for Booking Reason & Meeting Method (`POST /api/appointments`)
*Implementation Reference:* `backend/controllers/appointmentController.js` & `backend/models/Appointment.js`.  
*Business Rules:* `meetingMethod` must be `in-person` or `online`; `reason` must be non-empty, non-whitespace, and $\le 200$ characters.

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

#### Figure 3.3.3: EP Booking Reason Validation Evidence (`M2-EP-03-reason-validation.png`)
![Booking Reason Validation](screenshots/M2-EP-03-reason-validation.png)
*Figure 3.3.3: API response confirming rejection of empty reason parameter with HTTP 400.*

---

## 3.3.2 Boundary Value Analysis (BVA)

### 1. Methodology & Test Design Rationale
Boundary Value Analysis (BVA) is a testing technique that focuses testing effort on the extreme boundaries of equivalence partitions. Faults in software occur with highest density at the boundary values of input variables due to off-by-one errors ($<$ vs $\le$, $>$ vs $\ge$), date rollover logic, and format boundary limits.

For continuous domains bounded by $[\min, \max]$, 6 boundary points are analyzed:
$$\{\min - 1, \min, \min + 1, \max - 1, \max, \max + 1\}$$

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

#### Figures 3.3.4 – 3.3.8: BVA Test Execution Evidence Screenshots

| Evidence Reference | Screenshot File | Description |
|---|---|---|
| **Figure 3.3.4** | `screenshots/M2-BVA-01-duration-boundaries.png` | Boundary testing at 4 min (rejected), 5 min (accepted), and 6 min (accepted). |
| **Figure 3.3.5** | `screenshots/M2-BVA-02-upper-duration-BUG-07.png` | Upper boundary testing at 480 min (accepted) and 481 min (misleading message). |
| **Figure 3.3.6** | `screenshots/M2-BVA-03-BUG-01-month13.png` | Defect evidence for BUG-01: Acceptance of impossible month `2027-13-01` with HTTP 201. |
| **Figure 3.3.7** | `screenshots/M2-BVA-04-BUG-02-feb31.png` | Defect evidence for BUG-02: Silent rollover of non-existent date `2027-02-31` to March 3. |
| **Figure 3.3.8** | `screenshots/M2-BVA-unit-tests.png` | VS Code terminal output showing 100% automated test execution for all BVA test suites. |

![BVA Duration Boundaries](screenshots/M2-BVA-01-duration-boundaries.png)
*Figure 3.3.4: BVA duration testing showing exact lower boundaries (4, 5, 6 min).*

![BVA Upper Duration BUG-07](screenshots/M2-BVA-02-upper-duration-BUG-07.png)
*Figure 3.3.5: Upper boundary testing at 480 and 481 minutes.*

![BVA BUG-01 Month 13](screenshots/M2-BVA-03-BUG-01-month13.png)
*Figure 3.3.6: Defect BUG-01: Impossible month 13 accepted by backend with HTTP 201.*

![BVA BUG-02 Feb 31](screenshots/M2-BVA-04-BUG-02-feb31.png)
*Figure 3.3.7: Defect BUG-02: Feb 31 accepted and silently rolled over to March 3.*

![BVA Jest Unit Tests](screenshots/M2-BVA-unit-tests.png)
*Figure 3.3.8: Automated unit test execution passing 21/21 tests in `dateUtils.test.js`.*

---

### 3. Detailed Root Cause Analysis for Defects Exposed by BVA

#### 1. BUG-01 (GitHub Issue #2): Acceptance of Impossible Month `2027-13-01`
- **Root Cause:**
  1. `backend/models/Availability.js` uses regex `match: [/^\d{4}-\d{2}-\d{2}$/]`, which only checks character format, not numeric month range ($01 \le MM \le 12$).
  2. In `backend/utils/dateUtils.js`, `isSlotInPast` calls `new Date("2027-13-01T10:00:00+05:30")`, which in V8 returns `Invalid Date`.
  3. Calling `.getTime()` on `Invalid Date` returns `NaN`. In JavaScript:
     $$\text{NaN} \le \text{Date.now()} \implies \text{false}$$
  4. The code incorrectly assumes the date is in the future and accepts it into MongoDB.
- **Remediation:** Validate that $1 \le \text{month} \le 12$ and day matches the days in that month before invoking Date arithmetic.

---

#### 2. BUG-02 (GitHub Issue #3): Calendar Rollover on Non-Existent Date `2027-02-31`
- **Root Cause:**
  1. V8 `Date` constructor rolls over non-existent dates (Feb 31 $\to$ March 3, 2027).
  2. The database stores the raw string `"2027-02-31"`.
  3. When students query for appointments on March 3, string matching fails to return the slot, creating an unqueryable orphaned record.

---

#### 3. BUG-07 (GitHub Issue #9): Missing Upper Boundary Detail in Error Message
- When submitting a slot exceeding 480 minutes (481 min), the system returns:
  > *"End time must be after start time, and slot duration must be at least 5 minutes"*
- The message fails to inform the user that the 480-minute maximum boundary was exceeded.

---

#### 4. BUG-08 (GitHub Issue #15): Misleading Error Message in `updateAvailability` for Duration $< 5$ min
- **Discovered & Logged By:** Member 2 (`Yasiru-Nawodya`)
- **Severity / Priority:** Low / Status: New (Backlog)
- **Defect Summary:** In `backend/controllers/availabilityController.js` (`updateAvailability` route `PUT /api/availability/:id`), when updating an existing slot with a duration shorter than 5 minutes (e.g. `10:00` to `10:04`), the backend returns:
  > *"End time must be after start time"*
- **Defect Impact:** The start time and end time were in correct chronological order (`10:04` is after `10:00`). The actual failure was duration boundary violation ($4 < 5$ min). The error message misleads the user about the nature of the rejection.
- **GitHub Issue Screenshot:**

![BUG-08 GitHub Issue #15](screenshots/BUG-08-issue.png)
*Figure 3.3.9: GitHub Issue #15 logged by Yasiru-Nawodya in team repository.*

---

## 3.3.3 Decision Table Testing

### 1. Methodology & Test Design Rationale
Decision Table testing models complex business logic governed by combinations of boolean conditions. In the consultation slot booking endpoint (`POST /api/appointments`), 7 system conditions govern 8 possible system outcomes.

### 2. System Conditions & Actions
- **Conditions:**
  - $C_1$: Token Valid & User Active? (`auth.js` middleware)
  - $C_2$: User Role is `'student'`? (`authorize('student')`)
  - $C_3$: Required Fields (`availabilityId`, `reason`) Present?
  - $C_4$: Availability Slot Exists in Database?
  - $C_5$: Slot Start Date/Time is in the Future?
  - $C_6$: Student Already Holds Active Booking for This Slot?
  - $C_7$: Slot Status is Currently `'available'` in DB? (Atomic lock)
- **Actions:**
  - $A_1$: Return HTTP 401 Unauthorized
  - $A_2$: Return HTTP 403 Forbidden
  - $A_3$: Return HTTP 400 Bad Request (Missing parameters)
  - $A_4$: Return HTTP 404 Not Found (Slot does not exist)
  - $A_5$: Return HTTP 400 Bad Request (Past slot error)
  - $A_6$: Return HTTP 400 Bad Request (Duplicate booking)
  - $A_7$: Return HTTP 409 Conflict (Double-booking race)
  - $A_8$: Return HTTP 201 Created (Appointment confirmed)

---

### 3. Condition Collapse & Table Reduction Analysis
The complete truth table contains $2^7 = 128$ combinations. Because the controller implements short-circuit early-exit guards, evaluation terminates immediately upon the first failed condition. The 128 mathematical combinations collapse into **8 logically independent, fully executable rules (R1 to R8)**.

---

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

---

#### Table 3.3.6: Test Cases Derived from Decision Table Rules

| Rule | Test Case ID | Test Preconditions & Inputs | Expected HTTP Status & Response Message | Actual Status | Result |
|:---:|---|---|---|:---:|:---:|
| **R1** | `TC-DT-01` | Request without `Authorization` header | `HTTP 401 Unauthorized`: *"Authentication required"* | `401 Unauthorized` | **Pass** |
| **R2** | `TC-DT-02` | Valid JWT token belonging to a `lecturer` account | `HTTP 403 Forbidden`: *"Access denied for role 'lecturer'"* | `403 Forbidden` | **Pass** |
| **R3** | `TC-DT-03` | Student token; payload `{ availabilityId: "...", reason: "" }` | `HTTP 400 Bad Request`: *"Availability slot ID and reason are required"* | `400 Bad Request` | **Pass** |
| **R4** | `TC-DT-04` | Student token; non-existent slot ID `64f1a2b3c4d5e6f7a8b9c0d1` | `HTTP 404 Not Found`: *"Availability slot not found"* | `404 Not Found` | **Pass** |
| **R5** | `TC-DT-05` | Student token; slot with scheduled date `2020-01-01` | `HTTP 400 Bad Request`: *"Cannot book an appointment for a past date or time"* | `400 Bad Request` | **Pass** |
| **R6** | `TC-DT-06` | Student token; student already has confirmed booking for this slot | `HTTP 400 Bad Request`: *"You already have an active appointment for this time slot"* | `400 Bad Request` | **Pass** |
| **R7** | `TC-DT-07` | Two concurrent student requests; slot status already changed to `'booked'` | `HTTP 409 Conflict`: *"This slot is no longer available or was booked by another student"* | `409 Conflict` | **Pass** |
| **R8** | `TC-DT-08` | Student token; valid available future slot; valid reason | `HTTP 201 Created`: *"Appointment booked and confirmed successfully"* | `201 Created` | **Pass** |

---

#### Figure 3.3.10: Decision Table Automated Test Execution (`M2-DT-01-booking-rules.png`)
![Decision Table Test Execution](screenshots/M2-DT-01-booking-rules.png)
*Figure 3.3.10: Automated Jest test execution passing all 8 decision table rules for appointment booking.*

---

# 3.4 White-Box Testing (LO-2)

White-box (structural) testing evaluates the internal paths, decision branches, basic blocks, and cyclomatic complexity of code components.

---

## 3.4.1 Control Flow Graph (CFG) Construction

### Annotated Source Code: `createAvailability` Controller
*Source:* `backend/controllers/availabilityController.js` (lines 48–110).

```javascript
// backend/controllers/availabilityController.js
export const createAvailability = async (req, res, next) => {
  try {
    // ----------------------------------------------------
    // NODE 1: Entry basic block & request payload extraction
    // ----------------------------------------------------
    const { date, startTime, endTime, location, meetingMethod, notes } = req.body;

    // ----------------------------------------------------
    // NODE 2: Decision 1 - Mandatory fields guard
    // ----------------------------------------------------
    if (!date || !startTime || !endTime || !location) {
      // NODE 3: Error exit 1
      return res.status(400).json({
        success: false,
        message: 'Date, start time, end time, and location are required',
      });
    }

    // ----------------------------------------------------
    // NODE 4: Decision 2 - Time range & duration validity
    // ----------------------------------------------------
    if (!isValidTimeRange(startTime, endTime)) {
      // NODE 5: Error exit 2
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time, and slot duration must be at least 5 minutes',
      });
    }

    // ----------------------------------------------------
    // NODE 6: Decision 3 - Temporal past-date guard
    // ----------------------------------------------------
    if (isSlotInPast(date, startTime)) {
      // NODE 7: Error exit 3
      return res.status(400).json({
        success: false,
        message: 'Cannot create availability slots for past dates or times',
      });
    }

    // ----------------------------------------------------
    // NODE 8: Database query block for existing lecturer slots
    // ----------------------------------------------------
    const existingSlots = await Availability.find({
      lecturerId: req.user._id,
      date,
      status: { $ne: 'unavailable' },
    });

    // ----------------------------------------------------
    // NODE 9: Decision 4 - Loop iteration guard
    // ----------------------------------------------------
    for (const slot of existingSlots) {
      // --------------------------------------------------
      // NODE 10: Decision 5 - Overlap check condition
      // --------------------------------------------------
      if (doTimesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        // NODE 11: Error exit 4
        return res.status(400).json({
          success: false,
          message: `This slot overlaps with an existing slot from ${slot.startTime} to ${slot.endTime} on ${date}`,
        });
      }
      // Loop continuation edge back to Node 9
    }

    // ----------------------------------------------------
    // NODE 12: Database insertion basic block
    // ----------------------------------------------------
    const newSlot = await Availability.create({
      lecturerId: req.user._id,
      date,
      startTime,
      endTime,
      location,
      meetingMethod: meetingMethod || 'in-person',
      notes: notes || '',
      status: 'available',
    });

    // ----------------------------------------------------
    // NODE 13: Normal exit block (HTTP 201)
    // ----------------------------------------------------
    res.status(201).json({
      success: true,
      message: 'Availability slot created successfully',
      slot: newSlot,
    });
  } catch (error) {
    // ----------------------------------------------------
    // NODE 14: Exception handling catch block
    // ----------------------------------------------------
    next(error);
  }
};
```

---

#### Figure 3.4.1: Control Flow Graph for `createAvailability` (`M2-WB-01-cfg-createAvailability.png`)
![CFG for createAvailability](screenshots/M2-WB-01-cfg-createAvailability.png)
*Figure 3.4.1: Formal Control Flow Graph for `createAvailability` showing 14 nodes (13 basic blocks + terminal Exit node), 18 directed edges (13 internal + 5 to Exit), and 5 decision points.*

---

## 3.4.2 Cyclomatic Complexity Calculation

Cyclomatic Complexity $V(G)$ quantifies the structural complexity of a program and provides an upper bound on the number of linearly independent paths. We verify $V(G)$ using three independent methods:

### Method 1: Edge and Node Formula
$$V(G) = E - N + 2P$$
Where:
- $E = 18$ (Directed edges: 13 internal transitions + 5 exit connections to terminal Exit)
- $N = 14$ (13 basic block nodes 1 through 13 plus the terminal Exit node)
- $P = 1$ (Connected component)

$$V(G) = 18 - 14 + 2(1) = 4 + 2 = \mathbf{6}$$

---

### Method 2: Predicate Formula
$$V(G) = P_{\text{decision}} + 1$$
Where $P_{\text{decision}}$ is the number of decision points (Nodes 2, 4, 6, 9, 10):
- Node 2: Mandatory fields check
- Node 4: Time range validity
- Node 6: Past date check
- Node 9: Loop condition (`hasMoreElements`)
- Node 10: Overlap check

$$P_{\text{decision}} = 5$$
$$V(G) = 5 + 1 = \mathbf{6}$$

---

### Method 3: Planar Regions Formula
$$V(G) = R = \text{Enclosed Regions} + \text{Exterior Region}$$
- Enclosed Region 1: Loop cycle $(9 \to 10 \to 9)$
- Enclosed Region 2: Branch between Node 2 and Node 4
- Enclosed Region 3: Branch between Node 4 and Node 6
- Enclosed Region 4: Branch between Node 6 and Node 8
- Enclosed Region 5: Branch between Node 10 and Exit
- Exterior Region 6: Unbounded outer region

$$R = 5 + 1 = \mathbf{6}$$

All three derivations mathematically converge on:
$$V(G) = \mathbf{6}$$

---

## 3.4.3 Linearly Independent Basis Paths & Test Suite

Since $V(G) = 6$, there are **exactly 6 linearly independent basis paths**:

### Table 3.4.1: Basis Paths and Test Design for `createAvailability`

| Path ID | Node Sequence | Traversal Description | Concrete Test Input | Expected Result / Status |
|:---:|---|---|---|:---:|
| **Path 1** | $1 \to 2 \to 3$ | Fails required fields validation (Decision 1 = True); returns immediately | `{ date: "2026-12-15", startTime: "10:00", endTime: "11:00", location: "" }` (missing location) | `HTTP 400 Bad Request`; *"Date, start time, end time, and location are required"* |
| **Path 2** | $1 \to 2 \to 4 \to 5$ | Passes fields; fails duration validation (Decision 1 = False, Decision 2 = True) | `{ date: "2026-12-15", startTime: "10:00", endTime: "10:04", location: "Room 101" }` (4 min duration) | `HTTP 400 Bad Request`; *"End time must be after start time, and slot duration must be at least 5 minutes"* |
| **Path 3** | $1 \to 2 \to 4 \to 6 \to 7$ | Passes duration; fails past-date check (Decision 1 = False, 2 = False, 3 = True) | `{ date: "2020-01-01", startTime: "10:00", endTime: "11:00", location: "Room 101" }` (past date) | `HTTP 400 Bad Request`; *"Cannot create availability slots for past dates or times"* |
| **Path 4** | $1 \to 2 \to 4 \to 6 \to 8 \to 9 \to 10 \to 11$ | Passes past check; loop entered; slot overlap detected (Decision 4 = True, 5 = True) | Existing slot: `10:00–11:00`. New slot: `{ date: "2026-12-15", startTime: "10:30", endTime: "11:30", location: "Room 101" }` | `HTTP 400 Bad Request`; *"This slot overlaps with an existing slot..."* |
| **Path 5** | $1 \to 2 \to 4 \to 6 \to 8 \to 9 \to 10 \to 9 \to 12 \to 13$ | Existing slots exist on day; loop checks all slots with no overlap; slot created | Existing slot: `08:00–09:00`. New slot: `{ date: "2026-12-15", startTime: "10:00", endTime: "11:00", location: "Room 101" }` | `HTTP 201 Created`; *"Availability slot created successfully"* |
| **Path 6** | $1 \to 2 \to 4 \to 6 \to 8 \to 9 (\text{empty}) \to 12 \to 13$ | Zero existing slots in DB for this date; loop body bypassed entirely; slot created | Lecturer has 0 existing slots on `2026-12-25`. New slot: `{ date: "2026-12-25", startTime: "10:00", endTime: "11:00", location: "Room 101" }` | `HTTP 201 Created`; *"Availability slot created successfully"* |

---

## 3.4.4 Statement Coverage vs. Branch Coverage Analysis

### Theoretical Comparison
- **Statement Coverage:** Proves that every executable line of code has been executed at least once:
  $$\text{Statement Coverage} = \frac{\text{Executed Statements}}{\text{Total Statements}} \times 100\%$$
- **Branch Coverage:** Proves that every decision outcome (both True and False branches) of all control statements has been traversed:
  $$\text{Branch Coverage} = \frac{\text{Traversed Outcomes}}{\text{Total Outcomes}} \times 100\%$$
- **Key Finding:** Branch coverage is strictly stronger than statement coverage. 100% branch coverage guarantees 100% statement coverage, but the reverse is false.

### Minimum Test Suites Required for `createAvailability`
- **Minimum Tests for 100% Statement Coverage: 5 Tests**
  - Paths 1, 2, 3, 4, and 5 touch all statements (Nodes 1 to 13). Path 6 is redundant for statement coverage.
- **Minimum Tests for 100% Branch Coverage: 6 Tests (All 6 Basis Paths)**
  - Path 6 is strictly required to exercise the False branch of Decision Node 9 (the loop bypass when 0 existing slots exist).

---

#### Figure 3.4.2: Jest Code Coverage Report Evidence (`M2-WB-04-jest-coverage-table.png`)
![Jest Code Coverage Report](screenshots/M2-WB-04-jest-coverage-table.png)
*Figure 3.4.2: Terminal output of `npm run test:unit -- --coverage` verifying 100% coverage on `dateUtils.js` and 71.62% overall backend branch coverage.*

---

## 3.4.5 Supplementary White-Box Analysis (`isValidTimeRange`)

To demonstrate white-box testing on utility logic, we analyze `isValidTimeRange` (`backend/utils/dateUtils.js`, lines 49–53):

```javascript
// backend/utils/dateUtils.js
export const isValidTimeRange = (startTime, endTime) => {
  const startMin = timeToMinutes(startTime);                                       // Statement 1
  const endMin = timeToMinutes(endTime);                                           // Statement 2
  return endMin > startMin && endMin - startMin >= 5 && endMin - startMin <= 480;  // Predicate Statement
};
```

#### Figure 3.4.3: CFG for `isValidTimeRange` (`M2-WB-02-cfg-isValidTimeRange.png`)
![CFG for isValidTimeRange](screenshots/M2-WB-02-cfg-isValidTimeRange.png)
*Figure 3.4.3: Control Flow Graph for `isValidTimeRange` with compound condition decomposition.*

---

### Predicate Decomposition & Complexity
- $c_1$: `endMin > startMin`
- $c_2$: `endMin - startMin >= 5`
- $c_3$: `endMin - startMin <= 480`
- Complexity: $V(G) = P_{\text{atomic}} + 1 = 3 + 1 = \mathbf{4}$

### Table 3.4.2: Branch Coverage & MC/DC Test Matrix for `isValidTimeRange`

| Test Case | Inputs (`startTime`, `endTime`) | $c_1: >$ | $c_2: \ge 5$ | $c_3: \le 480$ | Evaluated Result | Automated Test Reference |
|:---:|---|:---:|:---:|:---:|:---:|---|
| **TC-TR-1** | `'10:00', '09:00'` | **False** | — | — | `false` | `backend/tests/dateUtils.test.js` |
| **TC-TR-2** | `'10:00', '10:00'` | **False** | — | — | `false` | `backend/tests/dateUtils.test.js` |
| **TC-TR-3** | `'09:00', '09:04'` | **True** | **False** | — | `false` | `backend/tests/dateUtils.test.js` |
| **TC-TR-4** | `'09:00', '09:05'` | **True** | **True** | **True** | `true` | `backend/tests/dateUtils.test.js` |
| **TC-TR-5** | `'09:00', '17:00'` | **True** | **True** | **True** | `true` | `backend/tests/dateUtils.test.js` |
| **TC-TR-6** | `'09:00', '17:01'` | **True** | **True** | **False** | `false` | `backend/tests/dateUtils.test.js` |

*Result:* Achieves **100% statement coverage, 100% branch coverage, and 100% condition/decision coverage (MC/DC)** on `isValidTimeRange`.

---

# 3.10 Member 2 Individual QA Self-Reflection

**Author:** Yasiru Nawodya (`Yasiru-Nawodya`)  
**Assigned Branch:** `member2-test-design`  

---

## 1. Introduction & Scope of Responsibility
As Member 2 under **Learning Outcome 2 (LO-2)**, my responsibility was to design, specify, and analytically verify test suites using both specification-based (black-box) and structure-based (white-box) testing techniques. My core deliverables encompassed:
1. **Section 3.3.1:** Equivalence Partitioning (EP) specifications across auth, slot creation, and booking modules.
2. **Section 3.3.2:** Boundary Value Analysis (BVA) on numeric, temporal, and calendar variables, uncovering critical off-by-one and date-parsing flaws.
3. **Section 3.3.3:** Multi-condition Decision Table modeling for the appointment booking workflow, collapsing $2^7=128$ truth combinations down to 8 executable rules.
4. **Section 3.4:** Structural white-box testing of `createAvailability`, proving $V(G)=6$ using three mathematical derivations, defining all 6 independent basis paths, and contrasting statement vs. branch coverage.
5. **Section 3.4 Supplementary:** Structural analysis and MC/DC branch coverage for `isValidTimeRange`.
6. **Defect Discovery & Reporting:** Discovered and logged **BUG-08 (Issue #15)** regarding misleading duration validation in `updateAvailability`, and analyzed team bugs **BUG-01 (Issue #2), BUG-02 (Issue #3), BUG-06 (Issue #8), and BUG-07 (Issue #9)**.

---

## 2. Technical Reflection on Black-Box Testing Techniques

### 2.1 Equivalence Partitioning (EP)
- **What Worked Well:** Partitioning the input domains for user registration, slot creation, and booking reason eliminated redundant test cases while ensuring 100% boundary coverage of functional requirements. Identifying valid vs. invalid equivalence classes proved especially effective for security constraints, such as role escalation prevention (`role !== 'student' $\to$ 403 Forbidden`).
- **Defects Exposed:** EP testing on the booking reason parameter uncovered **BUG-06 (Issue #8)**. When a student submitted whitespace characters (`"   "`), the Mongoose model validation rejected the appointment creation, but the controller had already executed an atomic update setting the slot status to `'booked'`. This left an orphaned slot permanently locked with no associated appointment record.
- **Key Insight:** Equivalence classes must be validated not only at the controller layer but also synchronized with Mongoose schema sanitizers (such as `trim: true`) to avoid inconsistent transactional state.

---

### 2.2 Boundary Value Analysis (BVA)
- **What Worked Well:** Testing input limits at $\min - 1$, $\min$, $\min + 1$, $\max - 1$, $\max$, and $\max + 1$ proved to be the single most defect-dense technique in our entire testing lifecycle.
- **Critical Defects Discovered & Logged:**
  1. **BUG-01 (Issue #2) – Impossible Calendar Month (`2027-13-01`):** Submitting month `13` succeeded with `HTTP 201 Created` because `Date.parse()` evaluated to `Invalid Date`. In JavaScript V8, `NaN <= Date.now()` evaluated to `false`, tricking `isSlotInPast` into believing the date was in the future!
  2. **BUG-02 (Issue #3) – Calendar Rollover (`2027-02-31`):** Submitting February 31 was accepted with `HTTP 201 Created` because V8 silently rolled 3 excess days into March 3, 2027, creating an unqueryable orphaned record in MongoDB.
  3. **BUG-07 (Issue #9) – Upper Boundary Error Messaging:** Testing duration boundary $\max + 1$ (481 minutes) revealed that the backend returned *"End time must be after start time, and slot duration must be at least 5 minutes"*, failing to inform the user that the 480-minute upper limit was exceeded.
  4. **BUG-08 (Issue #15) – Misleading Duration Error in `updateAvailability`:** Discovered that updating a slot to a sub-5-minute duration returned `"End time must be after start time"`. I logged this directly under GitHub Issue #15.
- **Academic Lesson:** Syntactic regular expression matching must never be used as a substitute for semantic calendar date validation.

---

### 2.3 Decision Table Testing
- **What Worked Well:** Modeling the complex appointment booking controller (`bookAppointment`) with 7 conditions and 8 actions prevented untested edge cases in multi-user workflows.
- **Condition Collapse:** Applying condition collapse mathematically reduced $2^7 = 128$ combinations to **8 mutually exclusive, executable decision rules (R1 to R8)** by identifying defensive early-exit guard clauses.
- **Concurrency & Double-Booking Protection (Rule R7):** Decision Table testing formally verified Rule R7, where two students attempt to book the same slot simultaneously. The test verified that MongoDB's atomic `findOneAndUpdate({ _id, status: 'available' })` guarantees race-condition safety, returning `HTTP 409 Conflict` to the second student without data corruption.

---

## 3. Technical Reflection on White-Box Testing & Structural Analysis

### 3.1 Control Flow Graph & Cyclomatic Complexity
- **Graph Construction:** Decomposing `createAvailability` into basic blocks (Nodes 1 to 13 plus the terminal Exit node, $N = 14$) and control edges ($E = 18$: 13 internal transitions + 5 exit connections) provided clear visualization of all decision branches and the inner loop iteration ($9 \to 10 \to 9$).
- **Triple Verification of $V(G)$:**
  - Method 1 (Edges & Nodes): $V(G) = E - N + 2P = 18 - 14 + 2(1) = \mathbf{6}$
  - Method 2 (Predicate Nodes): $V(G) = P_{\text{decision}} + 1 = 5 + 1 = \mathbf{6}$
  - Method 3 (Planar Regions): $V(G) = R = 5 \text{ enclosed} + 1 \text{ exterior} = \mathbf{6}$
  All three formulas converged on $V(G) = 6$, confirming structural integrity.

### 3.2 Basis Path Testing & Coverage Differences
- **Statement vs. Branch Coverage:**
  - Statement coverage was achievable with **5 test cases** (Paths 1 to 5).
  - Branch coverage required **all 6 Basis Paths**, because exercising the False branch of Decision Node 9 (the `for` loop executing zero times when no existing slots exist) requires **Path 6**.
- **Real Jest Coverage Analysis:**
  Running `npm run test:unit -- --coverage` verified:
  - `dateUtils.js`: **100% Statement, 100% Branch, 100% Function, 100% Line coverage**.
  - `availabilityController.js`: **72.72% Branch coverage**.
  - All Files: **71.62% Branch coverage**, exceeding typical industry standards (70%).

---

## 4. Collaboration, Git Workflow & Team Synergy

- **Branch Isolation:** All Member 2 work was executed strictly within the feature branch `member2-test-design`. No commits were pushed directly to `main`, preventing merge conflicts with Member 1 (`member1-test-plan`) and Member 3 (`testing`).
- **Granular Commit Strategy:** I structured my contributions into **9 modular, authentic commits** tracking design documents, CFG diagrams, authentic terminal test runs, directory indexes, and reflection:
  1. `be8c2c9 docs(qa): add EP and BVA test design specifications`
  2. `2fa6e28 docs(qa): add decision table test design for appointment booking`
  3. `c39eb76 docs(qa): add white-box test design, CFG and cyclomatic complexity`
  4. `cb34f49 test(qa): add CFG diagrams for createAvailability and isValidTimeRange`
  5. `a9f6675 test(qa): add black-box EP and BVA test evidence screenshots`
  6. `f3664a0 test(qa): add decision table and Jest code coverage report evidence`
  7. `76aac50 test(qa): add branch verification screenshot (M2-GIT-01)`
  8. `153c0ac docs(qa): add test design README and traceability index`
  9. `124d2b2 docs(qa): add Member 2 reflection and report mapping`
- **Pull Request #14:** Opened PR #14 from `member2-test-design` to `main`. Both automated CI checks passed (`Backend Tests / test (pull_request)` and `SonarCloud Quality Gate: Passed`) with zero conflicts.
- **Traceability with Member 3:** The decision table rules (R1 to R8) and basis paths were mapped directly to the automated test suites in `backend/tests/api.test.js` and `backend/tests/dateUtils.test.js` created by Member 3, demonstrating tight cross-member collaboration.
- **Defect Tracking Alignment:** In addition to logging BUG-08, I integrated team defect numbers (**BUG-01 #2, BUG-02 #3, BUG-06 #8, BUG-07 #9**) into our traceability matrices, maintaining a clean GitHub Issues tracker.

---

#### Figure 3.10.1: Git Branch Verification Evidence (`M2-GIT-01-branch-verified.png`)
![Git Branch Verification](screenshots/M2-GIT-01-branch-verified.png)
*Figure 3.10.1: Visual confirmation of Git branch `member2-test-design` and authentic commit log in VS Code.*

---

## 5. Key Personal Learnings & Conclusion
1. **Test Design is Preventative, Not Just Detective:** Designing decision tables and boundary matrices before writing tests exposed requirement ambiguities that would have remained hidden during ad-hoc manual testing.
2. **White-Box Complements Black-Box:** Black-box testing validated that the system met external user expectations, while white-box basis path testing ensured that defensive code branches and exception exits were actually reached.
3. **Automated Traceability:** Linking manual test IDs (`TC-SLOT-02`), automated test descriptions (`R1: no token -> 401`), and defect tickets (`BUG-01`, `BUG-08`) creates an unbroken audit trail essential for enterprise software quality assurance.

Through this assignment, I achieved a comprehensive, practical understanding of ISO/IEC 25010 quality characteristics, structural test metrics, and collaborative Git-based QA workflows.

---

# Appendix: Test Evidence & Screenshot Catalog

Below is the complete inventory of all 14 authentic test evidence files and diagrams created for Member 2 deliverables:

| ID | File Name | Deliverable Section | Content Description |
|:---:|---|---|---|
| **M2-EP-01** | `M2-EP-01-registration.png` | Section 3.3.1 | Registration EP validation: duplicate email rejection (409) and short password rejection (400). |
| **M2-EP-02** | `M2-EP-02-slot-duration.png` | Section 3.3.1 | Availability slot duration EP validation: sub-5-minute rejection and 60-minute valid slot acceptance. |
| **M2-EP-03** | `M2-EP-03-reason-validation.png` | Section 3.3.1 | Appointment booking reason EP validation: empty reason string rejected with HTTP 400. |
| **M2-BVA-01** | `M2-BVA-01-duration-boundaries.png` | Section 3.3.2 | BVA duration boundaries: 4 min (rejected), 5 min (accepted), 6 min (accepted). |
| **M2-BVA-02** | `M2-BVA-02-upper-duration-BUG-07.png` | Section 3.3.2 | BVA upper duration boundaries: 480 min (accepted) and 481 min (BUG-07 misleading message). |
| **M2-BVA-03** | `M2-BVA-03-BUG-01-month13.png` | Section 3.3.2 | BVA month boundary defect BUG-01: Impossible month `2027-13-01` accepted with HTTP 201. |
| **M2-BVA-04** | `M2-BVA-04-BUG-02-feb31.png` | Section 3.3.2 | BVA calendar rollover defect BUG-02: Non-existent `2027-02-31` accepted and rolled over to March 3. |
| **M2-BVA-05** | `M2-BVA-unit-tests.png` | Section 3.3.2 | Jest terminal test execution showing 21/21 passing unit tests in `dateUtils.test.js`. |
| **M2-DT-01** | `M2-DT-01-booking-rules.png` | Section 3.3.3 | Jest terminal test execution verifying all 8 decision table rules for `bookAppointment`. |
| **M2-WB-01** | `M2-WB-01-cfg-createAvailability.png` | Section 3.4.1 | Formal Control Flow Graph for `createAvailability` ($N=13, E=17, V(G)=6$). |
| **M2-WB-02** | `M2-WB-02-cfg-isValidTimeRange.png` | Section 3.4.5 | Control Flow Graph for `isValidTimeRange` ($V(G)=4$). |
| **M2-WB-04** | `M2-WB-04-jest-coverage-table.png` | Section 3.4.4 | Jest code coverage summary table verifying 100% utility coverage and 71.62% backend branch coverage. |
| **M2-GIT-01** | `M2-GIT-01-branch-verified.png` | Section 3.10 | VS Code terminal showing verified branch `member2-test-design` and authentic commit log. |
| **BUG-08** | `BUG-08-issue.png` | Section 3.3.2 & 3.10 | Live GitHub Issue #15 logged by Yasiru-Nawodya for duration error in `updateAvailability`. |

---
*End of Member 2 Report.*
