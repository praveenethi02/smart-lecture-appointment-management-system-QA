# 3.10 Case Study & Best Practices – Agile/DevOps in Our Testing

Our team treated testing as a continuous activity built into the development workflow rather than a separate phase at the end. This section reflects on the Agile and DevOps practices we applied and what we learned from them.

**Feature branches and pull requests.** Our testing work was done on separate branches (for example `testing`, `sonarcloud`, `member1-test-plan`) and proposed through pull requests. The automated checks passed before each of the merged pull requests (PR #1 and PR #7) went into `main`. This kept `main` stable and gave us a clear history of who changed what and why. There were gaps: one small configuration commit went directly to `main`, branch protection was not enabled, and those two pull requests were merged without a formal review. Enabling branch protection with a required review is an improvement for the next iteration.

**Continuous Integration on every pull request.** A GitHub Actions workflow (`.github/workflows/test.yml`) runs the Jest unit tests, Supertest API tests and Cucumber BDD scenarios on every pull request and every push to `main`, on a clean `ubuntu-latest` runner. This removed the "it works on my machine" problem, because the CI runner became the single reference environment for the whole team.

**Real example 1 – environment defect caught by CI.** The very first pipeline run failed. Cucumber 13 requires Node.js 22, but the workflow was configured with Node.js 20, so the BDD step could not start. Locally the tests had passed, because the developer's machine already had Node.js 22. CI exposed an environment/configuration defect within minutes of the first push. We updated the workflow to Node.js 22, re-ran the pipeline and it passed. Without CI, this mismatch would only have been discovered later by another member or during submission.

**Quality Gates before merging.** SonarCloud analysed every pull request and applied a Quality Gate requiring an *A* security rating on new code.

**Real example 2 – supply-chain vulnerability caught by the Quality Gate.** When the SonarCloud scan step was first added, the Quality Gate failed with a *C* security rating. SonarCloud flagged rule S7637: the GitHub Action `sonarqube-scan-action` was referenced by a mutable version tag instead of a full commit SHA. A tag can be moved to different code by the action's maintainer or an attacker, which is a supply-chain risk. We did not merge the pull request until the action was pinned to its full commit SHA; after the fix the Quality Gate passed with zero new issues. The Quality Gate therefore stopped risky code from reaching `main`, although we had to respect the result ourselves because it was not enforced by branch protection.

**Shift-left testing.** We moved testing as early as possible. Unit tests on the date/time utilities (boundary values for slot duration and the 2-hour cancellation deadline) and API tests on the booking rules were written before UI-level testing. Static analysis ran on every change instead of once at the end. Boundary testing at the unit/API level found BUG-01 (impossible date `2027-13-01` accepted) and BUG-02 (`2027-02-31` rolling over to March) – defects that are hard to find through the UI because the date picker hides them.

**Automated regression tests.** Because all automated tests run on every change, any fix (for example, the fix for BUG-01) is automatically checked against all existing behaviour. The known bug was first captured as a `test.failing` test, so the suite documents the defect and will alert the team once it is fixed.

**Issue tracking.** All defects were logged in GitHub Issues with labels for type (`bug`, `security`), status (`new → assigned → fixed → verified`) and severity. Linking pull requests to issues (for example "Fixes #2") connects each code change to the defect it resolves and closes the issue automatically on merge, giving full traceability.

**Lessons learned.**
- Automation pays off immediately: both CI failures were caught within minutes and fixed the same day.
- Quality Gates should be enforced through branch protection so that they block merges; otherwise warnings can be ignored.
- Coverage is uneven – the backend has 69.7% branch coverage but the frontend has no automated tests, giving 16.2% overall. Adding frontend component tests is our main improvement for the next iteration.
- Manual exploratory and black-box testing are still needed alongside automation, especially for usability and for business rules the automated suite does not yet cover.
