# Postman / Newman API Tests

| File | Purpose |
|---|---|
| `smart-lecturer.postman_collection.json` | Main regression suite: 15 requests, 40 assertions (auth, slot creation, booking, double booking 409, access control 401/403, cancellation). All should pass. |
| `known-bugs.postman_collection.json` | Checks for BUG-01 (#2), BUG-02 (#3) and BUG-03 (#4). The tests check for the correct behaviour, so they **fail while the bugs are open** and pass after the fixes. |
| `newman-report.html`, `known-bugs-report.html`, `known-bugs-report-after-fix.html` | HTML reports created by the run commands below. They are generated files, so they are not committed (see `.gitignore`). Screenshots API-05 and API-06 show them. |

## Run

1. Start the backend: `cd backend` → `npm run dev` (http://localhost:5000)
2. From the repo root:

```bash
npm install -g newman newman-reporter-htmlextra
newman run qa/postman/smart-lecturer.postman_collection.json -r cli,htmlextra --reporter-htmlextra-export qa/postman/newman-report.html
newman run qa/postman/known-bugs.postman_collection.json -r cli,htmlextra --reporter-htmlextra-export qa/postman/known-bugs-report.html
```

Notes:
- Run the requests in order. Login requests save tokens into collection variables, and later requests use them.
- The slot creation request picks a random future date and time, so the collection can be run many times without overlap errors.
- Login is rate-limited (100 requests / 15 min per IP). Running the collection many times in a row can return 429.

## Evidence

| Screenshot | Shows |
|---|---|
| [API-01](screenshots/API-01-newman-installed.png) | Newman 6.2.3 and newman-reporter-htmlextra installed |
| [API-02](screenshots/API-02-backend-running.png) | Backend running on port 5000 with local MongoDB |
| [API-03](screenshots/API-03-newman-run-requests.png) | Newman run: health check and login requests with their assertions |
| [API-04](screenshots/API-04-newman-run-summary.png) | Summary: 15 requests, 40 assertions, 0 failed |
| [API-05](screenshots/API-05-newman-html-report.png) | HTML report of the main collection |
| [API-06](screenshots/API-06-known-bugs-html-report.png) | HTML report of the known-bugs collection |
| [API-07](screenshots/API-07-known-bugs-failing.png) | Known-bugs run before the fix: BUG-01, BUG-02 and BUG-03 fail as expected |
