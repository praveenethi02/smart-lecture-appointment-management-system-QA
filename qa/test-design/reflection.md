# 3.10 Individual QA Reflection: Member 2 (Test Design)

**Module:** EC4206 – Software Testing and Quality Assurance  
**Degree Programme:** BSc in Computer Engineering / Electrical & Information Engineering, University of Ruhuna  
**System Under Test (SUT):** Smart Lecturer Appointment Management System (MERN Stack)  
**Assigned Role:** Member 2 – Black-Box & White-Box Test Design (Learning Outcome 2)  
**Author:** Yasiru Nawodya (`Yasiru-Nawodya`)  
**Branch:** `member2-test-design`  

---

## 1. Introduction & Scope of Responsibility

As Member 2 of the QA testing team, my primary responsibility under **Learning Outcome 2 (LO-2)** was to design, specify, and analytically verify test suites using both specification-based (black-box) and structure-based (white-box) testing techniques.

My core deliverables encompassed:
1. **Section 3.3.1:** Equivalence Partitioning (EP) specifications across user authentication, slot creation, and appointment booking modules.
2. **Section 3.3.2:** Boundary Value Analysis (BVA) on numeric, temporal, and calendar variables, uncovering critical off-by-one and date-parsing flaws.
3. **Section 3.3.3:** Multi-condition Decision Table modeling for the appointment booking workflow, collapsing $2^7=128$ truth combinations down to 8 executable rules.
4. **Section 3.4:** Structural white-box testing of `createAvailability` in `backend/controllers/availabilityController.js`, constructing the Control Flow Graph (CFG), proving Cyclomatic Complexity $V(G)=6$ using three mathematical derivations, defining all 6 independent basis paths, and contrasting statement vs. branch coverage.
5. **Section 3.4 Supplementary:** Structural analysis and MC/DC branch coverage for `isValidTimeRange` in `backend/utils/dateUtils.js`.
6. **Empirical Verification:** Executing automated Jest test suites and generating real code coverage metrics.

---

## 2. Technical Reflection on Black-Box Testing Techniques

### 2.1 Equivalence Partitioning (EP)
- **What Worked Well:** Partitioning the input domains for user registration (`POST /api/auth/register`), slot creation (`POST /api/availability`), and booking reason (`POST /api/appointments`) allowed our team to eliminate redundant test cases while ensuring 100% boundary coverage of functional requirements. Identifying valid vs. invalid equivalence classes proved especially effective for security constraints, such as role escalation prevention (`role !== 'student' $\to$ 403 Forbidden`).
- **Defects Exposed:** EP testing on the appointment booking reason parameter uncovered **BUG-06 (Issue #8)**. When a student submitted whitespace characters as the booking reason (`"   "`), the Mongoose model validation rejected the appointment creation, but the controller had already executed an atomic update setting the slot status to `'booked'`. This left an orphaned slot permanently locked with no associated appointment record.
- **Key Insight:** Equivalence classes must be validated not only at the controller layer but also synchronized with Mongoose schema sanitizers (such as `trim: true`) to avoid inconsistent transactional state.

---

### 2.2 Boundary Value Analysis (BVA)
- **What Worked Well:** Testing input limits at $\min - 1$, $\min$, $\min + 1$, $\max - 1$, $\max$, and $\max + 1$ proved to be the single most defect-dense technique in our entire testing lifecycle.
- **Critical Defects Discovered:**
  1. **BUG-01 (Issue #2) – Impossible Calendar Month (`2027-13-01`):** Submitting month `13` succeeded with `HTTP 201 Created`. Our root cause analysis revealed that the model only enforced a structural regex (`/^\d{4}-\d{2}-\d{2}$/`), while `Date.parse()` evaluated to `Invalid Date`. In JavaScript V8, `slotStart.getTime() <= Date.now()` evaluated `NaN <= Date.now()`, which returned `false`. Consequently, `isSlotInPast` mistakenly concluded the slot was in the future!
  2. **BUG-02 (Issue #3) – Calendar Rollover (`2027-02-31`):** Submitting February 31 was accepted with `HTTP 201 Created` because the V8 Date constructor silently rolled the 3 excess days into March 3, 2027. However, the database stored the literal string `"2027-02-31"`, creating an unqueryable orphaned record.
  3. **BUG-07 (Issue #9) – Upper Boundary Error Messaging:** Testing duration boundary $\max + 1$ (481 minutes) revealed that the backend returned *"End time must be after start time, and slot duration must be at least 5 minutes"*, failing to inform the user that the 480-minute upper limit was exceeded.
- **Academic Lesson:** Syntactic regular expression matching must never be used as a substitute for semantic calendar date validation.

---

### 2.3 Decision Table Testing
- **What Worked Well:** Modeling the complex appointment booking controller (`bookAppointment`) with 7 conditions and 8 actions prevented untested edge cases in multi-user workflows.
- **Condition Collapse:** Applying condition collapse mathematically reduced $2^7 = 128$ combinations to **8 mutually exclusive, executable decision rules (R1 to R8)** by identifying defensive early-exit guard clauses.
- **Concurrency & Double-Booking Protection (Rule R7):** Decision Table testing formally verified Rule R7, where two students attempt to book the same slot simultaneously. The test verified that MongoDB's atomic `findOneAndUpdate({ _id, status: 'available' })` guarantees race-condition safety, returning `HTTP 409 Conflict` to the second student without data corruption.

---

## 3. Technical Reflection on White-Box Testing & Structural Analysis

### 3.1 Control Flow Graph & Cyclomatic Complexity
- **Graph Construction:** Decomposing `createAvailability` into basic blocks (Nodes 1 to 13 plus the terminal Exit node, $N = 14$) and directed control edges ($E = 18$: 13 internal transitions + 5 exit connections) provided clear visualization of all decision branches and the inner loop iteration ($9 \to 10 \to 9$).
- **Triple Verification of $V(G)$:**
  - Method 1 (Edges & Nodes): $V(G) = E - N + 2P = 18 - 14 + 2(1) = \mathbf{6}$
  - Method 2 (Predicate Nodes): $V(G) = P_{\text{decision}} + 1 = 5 + 1 = \mathbf{6}$
  - Method 3 (Planar Regions): $V(G) = R = 5 \text{ enclosed} + 1 \text{ exterior} = \mathbf{6}$
  All three formulas converged on $V(G) = 6$, confirming structural integrity.
- **Compound Condition Insights:** Analyzing short-circuit evaluation in Node 2 (`!date || !startTime || !endTime || !location`) demonstrated that decomposing compound predicates into atomic boolean conditions increases modified cyclomatic complexity to $V(G) = 9$.

### 3.2 Basis Path Testing & Coverage Differences
- **Statement vs. Branch Coverage:**
  - Statement coverage was achievable with **5 test cases** (Paths 1 to 5).
  - Branch coverage required **all 6 Basis Paths**, because exercising the False branch of Decision Node 9 (the `for` loop executing zero times when no existing slots exist) requires **Path 6**.
- **Real Jest Coverage Analysis:**
  Running `npm run test:unit -- --coverage` verified:
  - `dateUtils.js`: **100% Statement, 100% Branch, 100% Function, 100% Line coverage**.
  - `availabilityController.js`: **72.72% Branch coverage** (the remaining uncovered branches correspond to exception handlers and secondary route parameters).
  - All Files: **71.62% Branch coverage**, exceeding typical industry standards (70%).

---

## 4. Collaboration, Git Workflow & Team Synergy

- **Branch Isolation:** All Member 2 work was executed strictly within the feature branch `member2-test-design`. No commits were pushed directly to `main`, preventing merge conflicts with Member 1 (`member1-test-plan`) and Member 3 (`testing`).
- **Granular Commit Strategy:** Rather than dumping all files in a single unreadable commit, I structured my contributions into **9 modular, authentic commits** tracking design documents, CFG diagrams, authentic terminal test runs, directory indexes, and reflection.
- **Traceability with Member 3:** The decision table rules (R1 to R8) and basis paths were mapped directly to the automated test suites in `backend/tests/api.test.js` and `backend/tests/dateUtils.test.js` created by Member 3, demonstrating tight cross-member collaboration.
- **Defect Tracking Alignment:** Instead of opening duplicate tickets, I integrated existing team defect numbers (**BUG-01 #2, BUG-02 #3, BUG-06 #8, BUG-07 #9**) into our traceability matrices, maintaining a clean GitHub Issues tracker.

---

## 5. Key Personal Learnings & Conclusion

1. **Test Design is Preventative, Not Just Detective:** Designing decision tables and boundary matrices before writing tests exposed requirement ambiguities that would have remained hidden during ad-hoc manual testing.
2. **White-Box Complements Black-Box:** Black-box testing validated that the system met external user expectations, while white-box basis path testing ensured that defensive code branches and exception exits were actually reached.
3. **Automated Traceability:** Linking manual test IDs (`TC-SLOT-02`), automated test descriptions (`R1: no token -> 401`), and defect tickets (`BUG-01`) creates an unbroken audit trail essential for enterprise software quality assurance.

Through this assignment, I achieved a comprehensive, practical understanding of ISO/IEC 25010 quality characteristics, structural test metrics, and collaborative Git-based QA workflows.
