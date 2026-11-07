# Testing and Integration Verification

This document describes the automated checks available for the backend and
frontend. It distinguishes mocked tests from live database, provider, and
browser testing; passing the automated suite does not imply those external
systems were exercised.

## Run the checks

Install dependencies in each application directory, then run:

```powershell
cd backend
npm test

cd ..\frontend
npm test
npm run lint
npm run build
```

The backend test command supplies test-only MongoDB, JWT, frontend-origin, and
Razorpay settings through `backend/testSetup.js`. The backend tests do not
connect to the MongoDB URI or contact Razorpay. No application `.env` file or
live credentials are needed to run them.

## Backend coverage

`npm test` runs Node's built-in test runner. The suite covers service and
schema behavior for menus, fees/payments, complaints/notices, dashboards, and
student authentication/management. It also exercises the Express app over
loopback HTTP for representative authenticated workflows and verifies that a
valid token for the wrong role is rejected by each of the 47 protected API
endpoints.

Database operations are stubbed at the Mongoose model boundary. Payment
transactions, account creation, and aggregation behavior are tested through
these controlled mocks; this is not a MongoDB integration suite. Razorpay
signature and payment logic are tested without a provider request. There is no
live database, real payment, or Postman run.

## Frontend coverage

`npm test` runs Vitest and React Testing Library:

- The API service contract suite exercises all 52 frontend calls against the
  corresponding versioned API method/path, checks credentialed requests and
  representative request bodies, and guards Razorpay verification payloads.
- Login component tests cover both roles, successful navigation, empty input,
  and server-error feedback.
- Dashboard hook tests cover initial role-specific loading, visible failures,
  and recovery through refresh.

The tests use an in-memory Axios adapter and mocked authentication/dashboard
services. They do not mount every page or run a browser against a live backend.
`npm run lint` and `npm run build` validate the full frontend source.
A local browser smoke check also confirmed that `/login/student` renders and
displays the backend-unavailable message when no API server is running; it did
not exercise a live authenticated browser workflow.

## Readiness limits

The automated checks do not replace testing against a disposable MongoDB
deployment, actual cross-origin browser sessions, live Razorpay test
credentials, or a full browser end-to-end suite. Those checks require explicit
test infrastructure and credentials. Postman testing and live Razorpay
transactions were intentionally skipped.

New functionality includes strict phone validation, recurring weekly menu APIs and views, and isolated Admin authentication and manager management. Mocked tests do not replace MongoDB and browser integration checks.
