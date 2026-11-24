# Test Design & Structural Analysis (Sections 3.3 & 3.4)

**Module:** EC4206 – Software Testing and Quality Assurance  
**Degree Programme:** BSc in Computer Engineering / Electrical & Information Engineering, University of Ruhuna  
**System Under Test (SUT):** Smart Lecturer Appointment Management System (MERN Stack)  
**Role:** Member 2 – Black-Box & White-Box Test Design (Learning Outcome 2)  
**Branch:** `member2-test-design`  
**Author:** Yasiru Nawodya (`Yasiru-Nawodya`)  

---

## 1. Executive Summary & Purpose

This directory (`qa/test-design/`) encapsulates the comprehensive test-design specifications, structural control flow analyses, and empirical execution evidence for **Learning Outcome 2 (LO-2)**.

The testing methodology rigorously bridges formal software engineering theory with practical full-stack verification:
1. **Black-Box Testing (Section 3.3):** Input partitioning, boundary limit verification, and multi-condition state decision tables applied to core business endpoints without inspecting internal code paths.
2. **White-Box Testing (Section 3.4):** Basic block decomposition, Control Flow Graph (CFG) construction, Cyclomatic Complexity calculation verified via three discrete mathematical methods, independent basis path derivation, and statement vs. branch coverage analysis.

---

## 2. Directory Structure & Document Map

```text
qa/test-design/
├── README.md                      # Directory overview, index, and defect traceability (this file)
├── ep-bva.md                      # Section 3.3.1 (EP) & Section 3.3.2 (BVA) specifications and bug analyses
├── decision-table.md              # Section 3.3.3 Decision Table testing for appointment booking
├── white-box.md                   # Section 3.4 CFG, Cyclomatic Complexity, Basis Paths & Coverage
├── reflection.md                  # Section 3.10 Member 2 QA self-reflection & final report integration
└── screenshots/                   # Authentic visual test execution evidence & CFG diagrams
    ├── M2-GIT-01-branch-verified.png
    ├── M2-DT-01-booking-rules.png
    ├── M2-WB-04-jest-coverage-table.png
    ├── M2-BVA-unit-tests.png
    ├── M2-WB-01-cfg-createAvailability.png
    ├── M2-WB-02-cfg-isValidTimeRange.png
    ├── M2-EP-01-registration.png
    ├── M2-EP-02-slot-duration.png
    ├── M2-EP-03-reason-validation.png
    ├── M2-BVA-01-duration-boundaries.png
    ├── M2-BVA-02-upper-duration-BUG-07.png
    ├── M2-BVA-03-BUG-01-month13.png
    └── M2-BVA-04-BUG-02-feb31.png
```

---

## 3. Summary of Black-Box Test Design (Section 3.3)

### 3.1 Equivalence Partitioning (EP) — [Read `ep-bva.md`](./ep-bva.md#331-equivalence-partitioning-ep)
- **Student Registration (`POST /api/auth/register`):** Evaluated across 9 partitions (Valid email, malformed email, duplicate email, valid password $\ge 6$, short password $< 6$, empty fields, and role escalation prevention).
- **Availability Slot Creation (`POST /api/availability`):** Evaluated across 10 partitions (Valid duration $5 \le d \le 480$, short duration $d < 5$, excessive duration $d > 480$, inverted times, zero duration, past slots, and disjoint vs. overlapping intervals).
- **Booking Reason & Meeting Method (`POST /api/appointments`):** Evaluated across 7 partitions (`in-person` vs `online` vs invalid enum, non-empty reason, empty reason, whitespace-only reason, and string $> 200$ chars).

### 3.2 Boundary Value Analysis (BVA) — [Read `ep-bva.md`](./ep-bva.md#332-boundary-value-analysis-bva)
Systematic 6-point boundary testing was executed across continuous and ordinal parameters:
- **Slot Duration Boundaries:** Tested 4 min ($\min - 1$), 5 min ($\min$), 6 min ($\min + 1$), 479 min ($\max - 1$), 480 min ($\max$), and 481 min ($\max + 1$).
- **Password Length Boundaries:** Tested 5 chars ($\min - 1$), 6 chars ($\min$), and 7 chars ($\min + 1$).
- **24-Hour Time Format:** Tested `00:00` ($\min$), `23:59` ($\max$), and `24:00` ($\max + 1$).
- **Cancellation Deadline (2 Hours / 120 min):** Tested 119 min before start ($\text{Deadline} - 1$ min $\to$ blocked) and 121 min before start ($\text{Deadline} + 1$ min $\to$ permitted).
- **Calendar Boundaries:** Discovered critical flaws in date arithmetic exposing **BUG-01 (Issue #2)** and **BUG-02 (Issue #3)**.

### 3.3 Decision Table Testing — [Read `decision-table.md`](./decision-table.md)
- Modeled 7 boolean conditions and 8 system actions governing the consultation booking endpoint.
- Demonstrated formal condition collapse reducing $2^7 = 128$ combinations into **8 mutually exclusive decision rules (R1 to R8)**.
- Mapped rules directly to automated integration tests in `backend/tests/api.test.js` (`R1: no token -> 401`, `R2: lecturer tries to book -> 403`, `R3: slot not found -> 404`, `R4: free slot -> 201`, `R5: double booking race -> 409`).

---

## 4. Summary of White-Box Testing (Section 3.4) — [Read `white-box.md`](./white-box.md)

### 4.1 Control Flow Analysis for `createAvailability`
- Decomposed the controller into 13 basic blocks plus 1 terminal Exit node ($N = 14$) and 18 directed control edges ($E = 18$: 13 internal transitions + 5 exit connections).
- Identified 5 decision points (Mandatory fields guard, duration check, past date check, loop condition, and overlap check).

### 4.2 Cyclomatic Complexity Proven Three Ways
McCabe's Cyclomatic Complexity was verified through three independent mathematical derivations:
1. **Edge-Node Formula:** $V(G) = E - N + 2P = 18 - 14 + 2(1) = \mathbf{6}$
2. **Predicate Node Formula:** $V(G) = P_{\text{decision}} + 1 = 5 + 1 = \mathbf{6}$
3. **Planar Regions Formula:** $V(G) = R = 5 \text{ enclosed regions} + 1 \text{ exterior region} = \mathbf{6}$
*(Note: Compound condition expansion at binary short-circuit level yields $V(G) = 9$.)*

### 4.3 Basis Path Testing & Coverage Criteria
- Derived all **6 Linearly Independent Basis Paths** with concrete test inputs and expected HTTP outcomes.
- Proved that **100% Statement Coverage** requires a minimum of **5 test cases** (Paths 1–5), whereas **100% Branch Coverage** strictly requires **all 6 Basis Paths** to exercise the loop bypass branch (Path 6).

---

## 5. Test Evidence & Screenshot Catalog

All visual evidence files reside in [`screenshots/`](./screenshots/):

| Screenshot File | Category | Source / Tool | Description & Evidence Verified |
|---|---|---|---|
| [`M2-GIT-01-branch-verified.png`](./screenshots/M2-GIT-01-branch-verified.png) | Git Workflow | VS Code Terminal | Proves active branch `member2-test-design`, clean working tree, and commit history. |
| [`M2-DT-01-booking-rules.png`](./screenshots/M2-DT-01-booking-rules.png) | Black-Box DT | Jest / Supertest | Terminal run of `api.test.js` showing Decision Table rules R1 through R5 passing. |
| [`M2-WB-04-jest-coverage-table.png`](./screenshots/M2-WB-04-jest-coverage-table.png) | White-Box | Jest `--coverage` | Real coverage report: 100% on `dateUtils.js`, 71.62% overall branch coverage. |
| [`M2-BVA-unit-tests.png`](./screenshots/M2-BVA-unit-tests.png) | Black-Box BVA | Jest Unit Test | Terminal run of `dateUtils.test.js` verifying duration boundaries and cancellation deadline. |
| [`M2-WB-01-cfg-createAvailability.png`](./screenshots/M2-WB-01-cfg-createAvailability.png) | White-Box CFG | System Drawing | Control Flow Graph flowchart for `createAvailability` ($V(G)=6$). |
| [`M2-WB-02-cfg-isValidTimeRange.png`](./screenshots/M2-WB-02-cfg-isValidTimeRange.png) | White-Box CFG | System Drawing | Supplementary CFG flowchart for `isValidTimeRange` ($V(G)=4$). |
| [`M2-EP-01-registration.png`](./screenshots/M2-EP-01-registration.png) | Black-Box EP | Chrome / API Run | Registration validation: short password 400 and duplicate email 409 rejection. |
| [`M2-EP-02-slot-duration.png`](./screenshots/M2-EP-02-slot-duration.png) | Black-Box EP | Chrome / API Run | Successful creation of a valid 60-minute consultation slot (HTTP 201). |
| [`M2-EP-03-reason-validation.png`](./screenshots/M2-EP-03-reason-validation.png) | Black-Box EP | Chrome / API Run | Rejection of whitespace-only / empty appointment reason (HTTP 400). |
| [`M2-BVA-01-duration-boundaries.png`](./screenshots/M2-BVA-01-duration-boundaries.png) | Black-Box BVA | Chrome / API Run | Duration lower limit: 4 min rejected (HTTP 400), 5 min accepted (HTTP 201). |
| [`M2-BVA-02-upper-duration-BUG-07.png`](./screenshots/M2-BVA-02-upper-duration-BUG-07.png) | Black-Box BVA | Chrome / API Run | Duration upper limit: 481 min rejected, revealing incomplete error message (BUG-07). |
| [`M2-BVA-03-BUG-01-month13.png`](./screenshots/M2-BVA-03-BUG-01-month13.png) | Defect Evidence | Chrome DevTools | **BUG-01:** Impossible calendar month `2027-13-01` accepted with HTTP 201. |
| [`M2-BVA-04-BUG-02-feb31.png`](./screenshots/M2-BVA-04-BUG-02-feb31.png) | Defect Evidence | Chrome DevTools | **BUG-02:** Non-existent calendar date `2027-02-31` accepted and rolled to March 3. |

---

## 6. Defect Traceability Matrix

Defects identified, analyzed, or verified through Member 2's black-box and boundary testing techniques:

| Defect ID | GitHub Issue | Severity | Target Module | Test Technique | Defect Summary & Root Cause |
|---|:---:|:---:|---|---|---|
| **BUG-01** | [#2](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/2) | Medium | Slot Availability | Boundary Value Analysis | Impossible month `2027-13-01` accepted with HTTP 201; regex only checks digit pattern, `new Date()` yields `NaN`, and `NaN <= Date.now()` evaluates to `false`. |
| **BUG-02** | [#3](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/3) | Medium | Slot Availability | Boundary Value Analysis | Non-existent calendar day `2027-02-31` accepted with HTTP 201; JavaScript engine silently rolls 3 excess days over to March 3, creating orphaned database slots. |
| **BUG-06** | [#8](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/8) | Medium | Appointment Booking | Equivalence Partitioning | Whitespace-only booking reason returns HTTP 400 but erroneously locks availability slot status to `'booked'` without generating an appointment record. |
| **BUG-07** | [#9](https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA/issues/9) | Low | Slot Availability | Boundary Value Analysis | Slot duration exceeding 480 minutes (481 min) returns HTTP 400, but the error message states only that duration must be $\ge 5$ minutes, omitting maximum limit feedback. |

---

## 7. How to Reproduce and Execute Tests Locally

To execute the unit and integration test suites referenced in this test design:

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Run Boundary Value Analysis unit tests
npm run test:unit -- tests/dateUtils.test.js --verbose

# 3. Run Decision Table API integration tests
npm run test:unit -- tests/api.test.js --verbose

# 4. Generate full code coverage report
npm run test:unit -- --coverage
```
