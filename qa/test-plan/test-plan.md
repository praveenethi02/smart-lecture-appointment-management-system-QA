# 3.1 Introduction & Test Planning

## 3.1.1 System Under Test

The **Smart Lecturer Appointment Management System** is a MERN web application in which lecturers publish consultation slots and students book them.

| Item | Detail |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS (`http://localhost:5173`) |
| Backend | Node.js + Express REST API, ES Modules (`http://localhost:5000`) |
| Database | MongoDB via Mongoose (automatic fallback to in-memory MongoDB) |
| Authentication | JWT (7-day expiry) + bcrypt password hashing |
| Roles | Student, Lecturer, Admin |
| Repository | https://github.com/praveenethi02/smart-lecture-appointment-management-system-QA |

The system was selected under **Option A (reuse an existing project)** because it has several testable user flows, clear business rules and full access to the source code for coverage analysis and SonarCloud scanning.

## 3.1.2 Test Objectives

1. Verify that every in-scope feature behaves according to its business rules (slot duration, overlap, past-date, double-booking and cancellation-deadline rules).
2. Confirm that role-based access control prevents users from performing actions outside their role.
3. Detect and log defects, and perform root cause analysis on the most significant ones.
4. Automate regression tests and run them on every pull request and push to `main` through a CI pipeline.
5. Measure code quality (coverage, bugs, vulnerabilities, code smells, technical debt) with SonarCloud and propose improvements.
6. Assess basic performance under concurrent load and check selected OWASP Top 10 risks.

## 3.1.3 Scope

### In scope

| Module | Features tested |
|---|---|
| Authentication | Register (student only), login, JWT validation, deactivated accounts, login rate limit |
| Availability slots | Lecturer creates, edits and deletes slots; duration 5–480 min; no past date/time; no overlap; booked slot cannot be edited or deleted |
| Booking | Student books a slot with a reason; 404 / 400 / 409 rules; atomic double-booking prevention |
| Cancellation | Cancel appointment; blocked within 2 hours of slot start |
| Role-based access | Student / Lecturer / Admin route restrictions (401 / 403) |
| Admin (API level) | Dashboard KPIs, activate/deactivate users |

### Out of scope

- Notifications UI (in-app notification display)
- Admin settings UI and department management UI
- Email delivery
- Mobile apps and responsive layout on mobile devices
- Production deployment, hosting and infrastructure
- Cross-browser testing beyond Google Chrome

## 3.1.4 Test Approach and Levels

| Level / Type | What is tested | Tool | Owner |
|---|---|---|---|
| Unit testing (TDD) | Date/time utilities: duration BVA, overlap, past slot, cancellation deadline | Jest | Member 3 |
| Integration / API testing | Booking decision table, slot creation rules | Jest + Supertest | Member 3 |
| BDD | Booking and slot scenarios written in Gherkin | Cucumber.js | Member 3 |
| Black-box design | Equivalence Partitioning, BVA, decision tables | Manual design | Member 2 |
| White-box design | Cyclomatic complexity, statement and branch coverage | Jest coverage | Member 2 |
| API automation | End-to-end API flows with assertions | Postman + Newman | Member 4 |
| System / manual testing | Test cases executed in the browser against requirements | Chrome | Member 1 |
| Performance testing | Concurrent users on a public endpoint | Apache JMeter | Member 4 |
| Security testing | Selected OWASP Top 10 checks, `npm audit` | Postman, npm | Member 4 |
| Static analysis | Bugs, vulnerabilities, code smells, coverage, debt | SonarCloud | Member 3 |
| Continuous integration | All automated tests on every PR and push to `main` | GitHub Actions | Member 3 |

## 3.1.5 Resources

**People**

| Member | Responsibility |
|---|---|
| Member 1 | Test planning, STLC, test cases and manual execution, case study, final report |
| Member 2 | Black-box and white-box testing |
| Member 3 | TDD/BDD, CI/CD pipeline, SonarCloud quality metrics |
| Member 4 | API automation, performance, security, defect tracking |

**Tools:** Jest, Supertest, Cucumber.js, Postman/Newman, Apache JMeter, GitHub Actions, SonarCloud, GitHub Issues, Google Chrome, VS Code, Git.

## 3.1.6 Schedule

| Phase | Activity | Owner |
|---|---|---|
| 1 | Requirement analysis and test planning | Member 1 |
| 2 | Test design (test cases, EP/BVA, decision table, CFG) | Members 1, 2 |
| 3 | Environment setup and automated tests, CI, SonarCloud | Member 3 |
| 4 | Execution: manual tests, Postman/Newman, JMeter, OWASP checks | Members 1, 4 |
| 5 | Defect logging, bug lifecycle, root cause analysis | Members 2, 4 |
| 6 | Test closure: metrics, reflection, final report | Member 1 (all contribute) |

## 3.1.7 Entry and Exit Criteria

**Entry criteria**
- Source code available in the GitHub repository and the application runs locally.
- Test environment set up (Node.js 22 or later, MongoDB/in-memory DB, seeded demo accounts).
- Requirements and business rules documented; test plan reviewed by the team.

**Exit criteria**
- All planned test cases executed and their status recorded.
- All automated tests (unit, API, BDD) passing in the GitHub Actions pipeline.
- SonarCloud Quality Gate passed.
- Every defect found is logged in GitHub Issues with severity; high-severity defects are fixed or documented with a root cause.
- Test summary (final report) completed.

## 3.1.8 Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Very short timeline (one day) | Incomplete testing | Work split by section; automation runs in CI |
| Tests depend on current date/time (slot past/deadline rules) | Flaky results | Use future dates in test data; BVA tests use controlled times |
| In-memory DB resets on backend restart | Lost test data | Use seed script and demo accounts; re-create data per test |
| Login rate limit (100 req / 15 min) | 429 errors during load tests | Do not load-test `/auth/login`; use `/api/lecturers` |
| Team members on different environments | "Works on my machine" issues | CI on `ubuntu-latest` is the reference environment |
| Frontend has no automated tests | Low overall coverage (16.2%) | Manual UI test cases; recorded as an improvement |

## 3.1.9 Quality Model – ISO/IEC 25010

| Characteristic | Sub-characteristic focus | How it is tested |
|---|---|---|
| Functional suitability | Functional correctness, completeness | Manual test cases, Jest/Supertest, Cucumber BDD, Postman |
| Security | Confidentiality, integrity, authenticity | RBAC tests (401/403), OWASP checks, NoSQL injection, SonarCloud vulnerabilities, `npm audit` |
| Reliability | Fault tolerance, maturity | Double-booking (409) atomic update, error handling, SonarCloud reliability rating |
| Performance efficiency | Time behaviour, capacity | JMeter load test (50 users) – response time, throughput, error % |
| Maintainability | Analysability, modifiability, testability | SonarCloud code smells, technical debt, duplications, cyclomatic complexity |
| Usability | Operability, user error protection | Manual browser testing of forms, validation messages, demo login flow |

## 3.1.10 Verification vs. Validation

**Verification** – "Are we building the product right?" (checking work products without executing the system against user needs)
- Code review through GitHub pull requests before merging to `main`
- SonarCloud static analysis and Quality Gate on every PR
- Reviewing the test plan, test cases and business rules against the requirements
- Calculating cyclomatic complexity from the control flow graph

**Validation** – "Are we building the right product?" (executing the system to confirm it meets requirements)
- Executing manual test cases in the browser against business rules
- Running Jest, Supertest and Cucumber tests in CI
- Postman/Newman end-to-end API flows
- UAT-style flows: a lecturer creates a slot → a student books it → the student cancels it
- JMeter load test and OWASP security checks