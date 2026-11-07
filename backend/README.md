# Backend API Documentation

Reference for the implemented Mess Management System backend. Endpoint
documentation below reflects the routes mounted by `src/app.js` and their
current controllers, services, validators, and Mongoose models.

## Table of contents

- [1. Project Overview](#1-project-overview)
- [2. Technology Stack](#2-technology-stack)
- [3. Backend Setup and Installation](#3-backend-setup-and-installation)
- [4. Base URL](#4-base-url)
- [5. Authentication and Authorization](#5-authentication-and-authorization)
- [6. API Endpoints](#6-api-endpoints)
  - [Health](#health)
  - [Student Authentication](#student-authentication-apis)
  - [Manager Authentication](#manager-authentication-apis)
  - [Student Management](#student-management-apis-manager-only)
  - [Menus](#menu-apis)
  - [Complaints](#complaint-apis)
  - [Notices](#notice-board-apis)
  - [Fees and Payments](#fee-management-apis)
  - [Razorpay](#razorpay-payment-apis)
  - [Dashboards](#dashboard-apis)
- [7. Common Response and Error Format](#7-common-response-and-error-format)
- [8. Pagination, Filtering, and Sorting](#8-pagination-filtering-and-sorting)
- [9. Data Models Overview](#9-data-models-overview)
- [10. Important Business Rules](#10-important-business-rules)
- [11. API Quick Reference](#11-api-quick-reference)
- [12. Implementation Notes and Limitations](#12-implementation-notes-and-limitations)
- [Testing and integration verification](./TESTING.md)

## 1. Project Overview

This Node.js backend provides the REST API for the Mess Management System
frontend. It handles separate student and manager sessions, student account
approval and administration, daily menus, fees and payment records, complaints,
notices, and role-specific dashboard summaries.

The API persists data in MongoDB through Mongoose. It returns JSON, uses
HTTP-only cookies to maintain JWT sessions, and integrates with Razorpay for
student fee payments.

## 2. Technology Stack

| Technology/package | Use |
|---|---|
| Node.js (ES modules) | Runtime |
| Express 5 | HTTP server, middleware, and routing |
| MongoDB and Mongoose | Persistence, schemas, indexes, and database transactions |
| `jsonwebtoken` | Signed one-day HS256 session tokens |
| `bcryptjs` | Password hashing and verification |
| `cookie-parser` | Reading session cookies |
| `cors` | Credentialed requests from the configured frontend origin |
| `dotenv` | Loading environment variables |
| `razorpay` | Server-side Razorpay order and payment lookups |
| `mongodb` | MongoDB driver dependency |
| `nodemon` | Development server restart |

## 3. Backend Setup and Installation

### Prerequisites

- A Node.js installation with npm.
- A MongoDB deployment accessible to the backend. Transactions used for
  payment operations require a MongoDB deployment that supports transactions
  (for example, a replica set).
- Optional Razorpay test/live credentials to use the online payment endpoints.

### Install and configure

From the project directory:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set the values in `backend/.env` for your own environment. The following
template contains names only; never commit real secrets:

```dotenv
PORT=5000
MONGO_URI=
MONGO_DB_NAME=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

NODE_ENV=development
COOKIE_SAME_SITE=lax

MANAGER_NAME=
MANAGER_EMAIL=
MANAGER_PHONE=
MANAGER_PASSWORD=
```

`MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` are required at application
startup. `MONGO_DB_NAME` is optional. `PORT` defaults to `5000`,
`NODE_ENV` to `development`, and `COOKIE_SAME_SITE` to `lax`.
`COOKIE_SAME_SITE` accepts `lax`, `strict`, or `none`; `none` is allowed only
when `NODE_ENV=production`.

Razorpay credentials are optional for application startup, but both
`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be configured to use Razorpay
operations. The key ID is public and is returned for Checkout; the secret,
MongoDB URI, and JWT secret are server-only. Manager seed variables are used
only by the optional seed script and are not API credentials.

### Start the server

```powershell
npm run dev
```

The `dev` script runs `nodemon server.js`. The production-style start command
is:

```powershell
npm start
```

There is no separate build script. The server connects to MongoDB before it
starts listening.

Create the initial manager account using the configured `MANAGER_*` environment
variables, when needed:

```powershell
npm run seed:manager
```

This script creates a manager only when the email is not already registered.
It refuses to create a manager whose email is already used by a student.

See [TESTING.md](./TESTING.md) for backend and frontend test commands,
automated coverage, and integration-test limitations.

Verify the server with:

```powershell
curl.exe http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Mess Management API is running!"
}
```

The server port is configurable; replace `5000` if `PORT` is set differently.

## 4. Base URL

The default versioned API base URL is:

```text
http://localhost:5000/api/v1
```

The host and port are deployment-specific; the port defaults to `5000` and may
be set with `PORT`. All paths in the API sections are relative to `/api/v1`,
except `GET /health`, which is mounted outside the versioned prefix.

## 5. Authentication and Authorization

### Session mechanism

- Student and Manager sessions use different JWT cookies:
  `studentToken` and `managerToken`.
- Login signs an HS256 JWT with issuer `mess-management-api`, the account ID
  in `sub`, and the account role. Tokens expire after one day.
- The token is sent to the browser as an HTTP-only cookie with `path=/`,
  configured `SameSite`, and `Secure` enabled when `NODE_ENV=production`.
- The server checks the JWT and re-reads the account on every protected
  request. A student must currently be `APPROVED`; a manager must currently be
  `ACTIVE`.
- The API does not use a bearer `Authorization` header. The browser must send
  cookies on authenticated calls.
- Logout clears the corresponding cookie. Since these are stateless JWTs,
  logout does not revoke a token copied elsewhere; it removes the browser's
  session cookie.

Student self-registration creates a `PENDING` account that cannot log in until
a manager approves it. A manager-created student is created as `APPROVED`.
Manager accounts are provisioned with `npm run seed:manager`; there is no
manager registration endpoint.

### Access classes

| Access | Meaning |
|---|---|
| Public | No authenticated role is required by that route. Login, registration, and logout routes are public. |
| Student | Requires a valid `studentToken` for an existing `APPROVED` student. Student data reads are scoped to the current account where applicable. |
| Manager | Requires a valid `managerToken` for an existing `ACTIVE` manager. |

A missing, invalid, or expired cookie returns `401 Authentication required`.
A valid cookie for the wrong role returns `403` with a role-specific access
message. An account whose current status no longer permits access is rejected.

### Frontend request requirements

The frontend is configured to use credentialed Axios requests. A browser
integration should enable credentials (for example, Axios
`withCredentials: true` or Fetch `credentials: "include"`). JSON write requests
use `Content-Type: application/json`.

CORS allows the exact origin configured by `FRONTEND_URL` and credentials.
When `COOKIE_SAME_SITE=none`, state-changing requests must include an `Origin`
matching `FRONTEND_URL`; otherwise the cross-site request middleware returns
`403 Request origin is not allowed`. Safe methods (`GET`, `HEAD`, `OPTIONS`)
are not rejected by that middleware.

Example:

```js
const response = await fetch("http://localhost:5000/api/v1/student/fees", {
  credentials: "include",
});
```

## 6. API Endpoints

### Common request conventions

- JSON request bodies are parsed up to 10 KB. Send `Content-Type:
  application/json` for JSON writes.
- Successful application responses use `{ "success": true, "message": "...",
  "data": ... }`. Each endpoint below gives its actual message and `data`
  shape.
- Protected routes use the role-specific cookie described above; do not send a
  token in an Authorization header.
- Unless stated otherwise, an endpoint takes no query parameters.
- Error responses are JSON `{ "success": false, "message": "..." }`; see
  [Common Response and Error Format](#7-common-response-and-error-format).

### Health

#### `GET /health`

**Description:** Checks that the HTTP server is responding. This route does
not check MongoDB health.

**HTTP Method:** `GET`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** None required.  
**Request Parameters:** None.  
**Request Body:** None.

**Example Request**

```bash
curl http://localhost:5000/health
```

**Success Response — `200 OK`**

```json
{
  "success": true,
  "message": "Mess Management API is running!"
}
```

### Student Authentication APIs

#### `POST /studentAuth/register`

**Description:** Self-registers a Student. The account is created with
`PENDING` status and must be approved by a Manager before login.

**HTTP Method:** `POST`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** `Content-Type: application/json`.
**Request Parameters:** None.

**Request Body:** All fields below are required.

| Field | Type | Constraints |
|---|---|---|
| `fullName` | string | Non-blank; at most 120 characters. |
| `email` | string | Valid email; normalized to lowercase; at most 254 characters. |
| `rollNumber` | string | Non-blank; at most 50 characters; normalized to uppercase. |
| `phone` | string | 7–15 digits, optionally prefixed with `+`; spaces, parentheses, and hyphens are accepted; at most 20 characters. |
| `password` | string | 8–72 characters and at most 72 UTF-8 bytes. |

**Example Request**

```bash
curl -X POST http://localhost:5000/api/v1/studentAuth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Aarav Patel","email":"aarav@example.edu","rollNumber":"ME-2041","phone":"+91 9876543210","password":"ExamplePass123"}'
```

**Success Response — `201 Created`**, message:
`Registration successful. Your account is awaiting manager approval.`

```json
{
  "success": true,
  "message": "Registration successful. Your account is awaiting manager approval.",
  "data": {
    "student": {
      "id": "64b000000000000000000001",
      "fullName": "Aarav Patel",
      "email": "aarav@example.edu",
      "phone": "+91 9876543210",
      "status": "PENDING",
      "role": "STUDENT",
      "rollNumber": "ME-2041",
      "registrationMethod": "SELF_REGISTERED",
      "createdBy": null,
      "reviewedBy": null,
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  }
}
```

The password is hashed and is not included in the response. Duplicate email
returns `409`; duplicate student roll number returns `409`.

#### `POST /studentAuth/login`

**Description:** Authenticates an approved Student and sets `studentToken`.

**HTTP Method:** `POST`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** `Content-Type: application/json`.
**Request Parameters:** None.

**Request Body:** Both fields are required.

| Field | Type | Constraints |
|---|---|---|
| `email` | string | Valid email; case-insensitive normalization. |
| `password` | string | Non-empty; maximum 72 characters and bytes. |

**Example Request**

```bash
curl -i -X POST http://localhost:5000/api/v1/studentAuth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aarav@example.edu","password":"ExamplePass123"}'
```

**Success Response — `200 OK`**, message `Login successful`. A
`Set-Cookie: studentToken=...; HttpOnly; Path=/; SameSite=...` header is
returned; `Secure` is added in production. The JWT value is intentionally not
included in JSON.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "student": {
      "id": "64b000000000000000000001",
      "fullName": "Aarav Patel",
      "email": "aarav@example.edu",
      "phone": "+91 9876543210",
      "status": "APPROVED",
      "role": "STUDENT",
      "rollNumber": "ME-2041",
      "registrationMethod": "SELF_REGISTERED",
      "createdBy": null,
      "reviewedBy": "64b000000000000000000010",
      "reviewedAt": "2026-01-02T10:00:00.000Z",
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-02T10:00:00.000Z"
    }
  }
}
```

Invalid credentials return `401 Invalid email or password`. A pending student
gets `403 Your account is awaiting manager approval`; rejected or inactive
accounts get `403 This account cannot log in`.

#### `POST /studentAuth/logout`

**Description:** Clears the browser's `studentToken` cookie. It is safe to call
without a current session.

**HTTP Method:** `POST`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** No body or content type is required.
**Request Parameters:** None.  
**Request Body:** None.

**Example Request**

```bash
curl -i -X POST http://localhost:5000/api/v1/studentAuth/logout \
  -b cookies.txt -c cookies.txt
```

**Success Response — `200 OK`**, message `Logout successful`:

```json
{"success":true,"message":"Logout successful","data":{}}
```

#### `GET /studentAuth/me`

**Description:** Returns the authenticated Student account.

**HTTP Method:** `GET`  
**Access:** Student  
**Authentication:** Required; `studentToken` cookie.  
**Request Headers:** Browser credentials/cookies must be included.
**Request Parameters:** None.  
**Request Body:** None.

**Success Response — `200 OK`**, message `Authenticated student`:

```json
{
  "success": true,
  "message": "Authenticated student",
  "data": {
    "student": {
      "id": "64b000000000000000000001",
      "fullName": "Aarav Patel",
      "email": "aarav@example.edu",
      "phone": "+91 9876543210",
      "status": "APPROVED",
      "role": "STUDENT",
      "rollNumber": "ME-2041",
      "registrationMethod": "SELF_REGISTERED",
      "createdBy": null,
      "reviewedBy": "64b000000000000000000010",
      "reviewedAt": "2026-01-02T10:00:00.000Z",
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-02T10:00:00.000Z"
    }
  }
}
```

### Manager Authentication APIs

There is no public Manager registration endpoint. A Manager is provisioned by
the `seed:manager` script.

#### `POST /managerAuth/login`

**Description:** Authenticates an active Manager and sets `managerToken`.

**HTTP Method:** `POST`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** `Content-Type: application/json`.
**Request Parameters:** None.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `email` | string | Yes | Valid email. |
| `password` | string | Yes | Non-empty; maximum 72 characters and bytes. |

**Example Request**

```bash
curl -i -X POST http://localhost:5000/api/v1/managerAuth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.edu","password":"ExamplePass123"}'
```

**Success Response — `200 OK`**, message `Login successful`. The response
sets an HTTP-only `managerToken` cookie with the same one-day session behavior
as the student cookie.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "manager": {
      "id": "64b000000000000000000010",
      "fullName": "Mess Manager",
      "email": "manager@example.edu",
      "phone": "+91 9876543211",
      "status": "ACTIVE",
      "role": "MANAGER",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  }
}
```

Invalid credentials return `401 Invalid email or password`; inactive managers
return `403 This account cannot log in`.

#### `POST /managerAuth/logout`

**Description:** Clears the browser's `managerToken` cookie. It is safe to
call without a current session.

**HTTP Method:** `POST`  
**Access:** Public  
**Authentication:** None  
**Request Headers:** No body or content type is required.
**Request Parameters:** None.  
**Request Body:** None.

**Success Response — `200 OK`**, message `Logout successful`:

```json
{"success":true,"message":"Logout successful","data":{}}
```

#### `GET /managerAuth/me`

**Description:** Returns the active authenticated Manager account.

**HTTP Method:** `GET`  
**Access:** Manager  
**Authentication:** Required; `managerToken` cookie.
**Request Headers:** Browser credentials/cookies must be included.
**Request Parameters:** None.  
**Request Body:** None.

**Success Response — `200 OK`**, message `Authenticated manager`:

```json
{
  "success": true,
  "message": "Authenticated manager",
  "data": {
    "manager": {
      "id": "64b000000000000000000010",
      "fullName": "Mess Manager",
      "email": "manager@example.edu",
      "phone": "+91 9876543211",
      "status": "ACTIVE",
      "role": "MANAGER",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  }
}
```

### Student Management APIs (Manager only)

The manager namespace is mounted at `/api/v1/manager`. All endpoints in this
subsection require an active Manager session. A Student returned by these
endpoints has safe account fields and `profile` (`roomNumber`, profile
timestamps) or `null`; password hashes are never returned.

#### `POST /manager/students`

**Description:** Creates an approved student account and optional room profile.
The registration method is `CREATED_BY_MANAGER`.

**HTTP Method:** `POST` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Headers:** `Content-Type: application/json` and browser credentials.
**Request Parameters:** None.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `fullName` | string | Yes | Non-blank; max 120 characters. |
| `email` | string | Yes | Valid email; normalized lowercase. |
| `rollNumber` | string | Yes | Non-blank; max 50; normalized uppercase. |
| `phone` | string | Yes | 7–15 digits; supported separators `+`, spaces, `()`, `-`; max 20 characters. |
| `password` | string | Yes | 8–72 characters and bytes. |
| `roomNumber` | string | No | Non-blank if supplied; max 50 characters. |

**Example Request**

```bash
curl -X POST http://localhost:5000/api/v1/manager/students \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"fullName":"Mira Shah","email":"mira@example.edu","rollNumber":"ME-2042","phone":"+91 9876543212","password":"ExamplePass123","roomNumber":"A-12"}'
```

**Success Response — `201 Created`**, message `Student account created successfully`:

```json
{
  "success": true,
  "message": "Student account created successfully",
  "data": {
    "student": {
      "id": "64b000000000000000000002",
      "fullName": "Mira Shah",
      "email": "mira@example.edu",
      "phone": "+91 9876543212",
      "status": "APPROVED",
      "role": "STUDENT",
      "rollNumber": "ME-2042",
      "registrationMethod": "CREATED_BY_MANAGER",
      "createdBy": "64b000000000000000000010",
      "reviewedBy": null,
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z",
      "profile": {
        "roomNumber": "A-12",
        "createdAt": "2026-01-01T10:00:00.000Z",
        "updatedAt": "2026-01-01T10:00:00.000Z"
      }
    }
  }
}
```

Duplicate email or roll number returns `409`.

#### `GET /manager/students`

**Description:** Lists student accounts, searchable by name, email, roll
number, or phone.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Headers:** Browser credentials/cookies. **Request Body:** None.

**Query Parameters**

| Name | Type | Default | Constraints |
|---|---|---|---|
| `search` | string | Empty | Max 100 characters. |
| `status` | string | All | `PENDING`, `APPROVED`, `REJECTED`, or `INACTIVE`. |
| `registrationMethod` | string | All | `SELF_REGISTERED` or `CREATED_BY_MANAGER`. |
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |

**Example Request**

```bash
curl "http://localhost:5000/api/v1/manager/students?status=APPROVED&search=ME-20&page=1&limit=10" \
  -b cookies.txt
```

**Success Response — `200 OK`**, message `Students retrieved successfully`:

```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "students": [
      {
        "id": "64b000000000000000000002",
        "fullName": "Mira Shah",
        "email": "mira@example.edu",
        "phone": "+91 9876543212",
        "status": "APPROVED",
        "role": "STUDENT",
        "rollNumber": "ME-2042",
        "registrationMethod": "CREATED_BY_MANAGER",
        "createdBy": "64b000000000000000000010",
        "reviewedBy": null,
        "reviewedAt": null,
        "rejectionReason": null,
        "createdAt": "2026-01-01T10:00:00.000Z",
        "updatedAt": "2026-01-01T10:00:00.000Z",
        "profile": null
      }
    ],
    "pagination": {
      "totalRecords": 1,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10
    }
  }
}
```

#### `GET /manager/students/pending`

**Description:** Lists pending self-registrations, oldest first. This route has
no paging query.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Headers:** Browser credentials/cookies. **Request Parameters/Body:**
None.

**Success Response — `200 OK`**, message `Pending students retrieved successfully`:

```json
{
  "success": true,
  "message": "Pending students retrieved successfully",
  "data": {
    "students": [
      {
        "id": "64b000000000000000000003",
        "fullName": "Dev Rao",
        "email": "dev@example.edu",
        "phone": "+91 9876543213",
        "status": "PENDING",
        "role": "STUDENT",
        "rollNumber": "ME-2043",
        "registrationMethod": "SELF_REGISTERED",
        "createdBy": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "rejectionReason": null,
        "createdAt": "2026-01-03T10:00:00.000Z",
        "updatedAt": "2026-01-03T10:00:00.000Z",
        "profile": {
          "roomNumber": null,
          "createdAt": "2026-01-03T10:00:00.000Z",
          "updatedAt": "2026-01-03T10:00:00.000Z"
        }
      }
    ]
  }
}
```

#### `GET /manager/students/:studentId`

**Description:** Retrieves a Student and populated profile.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Parameters:** `studentId` — required 24-character hexadecimal
MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Student retrieved successfully`:

```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "student": {
      "id": "64b000000000000000000002",
      "fullName": "Mira Shah",
      "email": "mira@example.edu",
      "phone": "+91 9876543212",
      "status": "APPROVED",
      "role": "STUDENT",
      "rollNumber": "ME-2042",
      "registrationMethod": "CREATED_BY_MANAGER",
      "createdBy": "64b000000000000000000010",
      "reviewedBy": null,
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z",
      "profile": null
    }
  }
}
```

Malformed IDs return `400`; missing students return `404`.

#### `PATCH /manager/students/:studentId`

**Description:** Updates permitted account fields and/or the optional room
number. This endpoint cannot update password, status, registration metadata,
or review metadata.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Parameters:** `studentId` — MongoDB ObjectId. **Request Headers:**
JSON and browser credentials.

**Request Body:** At least one field is required. All fields are optional.

| Field | Type | Constraints |
|---|---|---|
| `fullName` | string | Non-blank; max 120 characters. |
| `email` | string | Valid email; normalized lowercase and unique across manager/student emails. |
| `rollNumber` | string | Non-blank; max 50; normalized uppercase and unique. |
| `phone` | string | Validated phone format described for student creation. |
| `roomNumber` | string or `null` | Non-blank string max 50, or `null`/empty string to clear it. |

**Success Response — `200 OK`**, message `Student updated successfully`;
`data.student` has the same safe shape as `GET /manager/students/:studentId`.
Invalid/unsupported fields return `400`, conflicts `409`, missing students
`404`.

#### `PATCH /manager/students/:studentId/approve`

**Description:** Approves a `PENDING` Student and records the reviewing manager
and timestamp.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Parameters:** `studentId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Student approved successfully`:

```json
{
  "success": true,
  "message": "Student approved successfully",
  "data": {"student": {"id":"64b000000000000000000003","fullName":"Dev Rao","email":"dev@example.edu","phone":"+91 9876543213","status":"APPROVED","role":"STUDENT","rollNumber":"ME-2043","registrationMethod":"SELF_REGISTERED","createdBy":null,"reviewedBy":"64b000000000000000000010","reviewedAt":"2026-01-04T10:00:00.000Z","rejectionReason":null,"createdAt":"2026-01-03T10:00:00.000Z","updatedAt":"2026-01-04T10:00:00.000Z","profile":null}}
}
```

Only pending students can be reviewed (`400` otherwise); missing students
return `404`.

#### `PATCH /manager/students/:studentId/reject`

**Description:** Rejects a `PENDING` Student and stores the reason and review
metadata.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Parameters:** `studentId` — MongoDB ObjectId.
**Request Headers:** `Content-Type: application/json` and browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `rejectionReason` | string | Yes | Non-blank; max 500 characters. |

**Example Request:** `{"rejectionReason":"Registration details could not be verified."}`

**Success Response — `200 OK`**, message `Student rejected successfully`;
`data.student` has the same safe shape as the approval response with
`status: "REJECTED"` and the supplied `rejectionReason`. Missing reason or a
non-pending account returns `400`; a missing student returns `404`.

#### `PATCH /manager/students/:studentId/deactivate`

**Description:** Sets the Student's status to `INACTIVE`; it does not delete
the Student or profile document.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Parameters:** `studentId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Student deactivated successfully`;
`data.student` has the standard safe student shape with `status: "INACTIVE"`.
An already inactive account returns `400`; a missing student returns `404`.

### Menu APIs

All menu dates are exact `YYYY-MM-DD` calendar dates. They are normalized to
UTC midnight as a date label; "today" and upcoming menu queries use the
Asia/Kolkata calendar day. Students have read-only access.

Each meal object may contain:

| Field | Type | Constraints |
|---|---|---|
| `items` | string array | Up to 50 non-blank strings, each max 120 characters. |
| `description` | string | Optional; max 500 characters. |
| `servingTime` | string | Optional; max 100 characters. |

The four meal keys are `breakfast`, `lunch`, `snacks`, and `dinner`.

#### `POST /manager/menus`

**Description:** Creates one full daily menu. All four meal categories are
required.

**HTTP Method:** `POST` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Request Headers:** JSON and browser credentials. **Request Parameters:** None.

**Request Body**

```json
{
  "date": "2026-11-01",
  "meals": {
    "breakfast": {"items":["Poha","Tea"],"description":"Vegetarian breakfast","servingTime":"07:30-09:00"},
    "lunch": {"items":["Rice","Dal"],"servingTime":"12:30-14:00"},
    "snacks": {"items":["Fruit"],"description":""},
    "dinner": {"items":["Roti","Paneer"],"servingTime":"19:30-21:00"}
  }
}
```

Only `date` and `meals` are accepted at the top level. The create request
requires every meal category; an individual meal must contain at least one of
`items`, `description`, or `servingTime`.

**Success Response — `201 Created`**, message `Menu created successfully`:

```json
{
  "success": true,
  "message": "Menu created successfully",
  "data": {
    "menu": {
      "_id": "64b000000000000000000020",
      "date": "2026-11-01T00:00:00.000Z",
      "meals": {
        "breakfast":{"items":["Poha","Tea"],"description":"Vegetarian breakfast","servingTime":"07:30-09:00"},
        "lunch":{"items":["Rice","Dal"],"description":"","servingTime":"12:30-14:00"},
        "snacks":{"items":["Fruit"],"description":"","servingTime":""},
        "dinner":{"items":["Roti","Paneer"],"description":"","servingTime":"19:30-21:00"}
      },
      "createdBy": "64b000000000000000000010",
      "updatedBy": "64b000000000000000000010",
      "createdAt": "2026-10-31T10:00:00.000Z",
      "updatedAt": "2026-10-31T10:00:00.000Z"
    }
  }
}
```

Invalid date or meal data returns `400`; a second menu for the same date
returns `409 A menu already exists for this date`.

#### `GET /manager/menus`

**Description:** Lists menus in ascending date order, with optional inclusive
calendar-date bounds.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Body:** None.

| Query | Type | Default | Constraints |
|---|---|---|---|
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |
| `startDate` | string | None | Valid `YYYY-MM-DD`; inclusive. |
| `endDate` | string | None | Valid `YYYY-MM-DD`; inclusive. Must be on/after `startDate`. |

**Success Response — `200 OK`**, message `Menus retrieved successfully`;
`data` is `{ "menus": [<menu>], "pagination": <pagination> }`. Menu object shape
is shown in the create response.

#### `GET /manager/menus/upcoming`

**Description:** Lists menus from today's IST date onward in ascending date
order.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Body:** None.

**Query:** Optional `page` (default 1, max 1000000) and `limit` (default 10,
max 100), both positive integers.

**Success Response — `200 OK`**, message `Upcoming menus retrieved successfully`;
`data` is `{ "menus": [<menu>], "pagination": <pagination> }`.

#### `GET /manager/menus/:date`

**Description:** Retrieves the menu for the specified date.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `date` — required valid `YYYY-MM-DD`. **Request Body:** None.

**Success Response — `200 OK`**, message `Menu retrieved successfully`:

```json
{"success":true,"message":"Menu retrieved successfully","data":{"menu":{"_id":"64b000000000000000000020","date":"2026-11-01T00:00:00.000Z","meals":{"breakfast":{"items":["Poha"],"description":"","servingTime":""},"lunch":{"items":["Rice"],"description":"","servingTime":""},"snacks":{"items":[],"description":"","servingTime":""},"dinner":{"items":["Roti"],"description":"","servingTime":""}},"createdBy":"64b000000000000000000010","updatedBy":"64b000000000000000000010","createdAt":"2026-10-31T10:00:00.000Z","updatedAt":"2026-10-31T10:00:00.000Z"}}}
```

Invalid date returns `400`; absent menu returns `404 No menu has been published
for this date`.

#### `PATCH /manager/menus/:menuId`

**Description:** Partially updates one or more meal categories. Date and
creator cannot be changed; `updatedBy` is set from the Manager session.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `menuId` — MongoDB ObjectId. **Request Headers:** JSON and
browser credentials.

**Request Body:** Only `meals` is accepted; at least one valid meal category
is required. Each supplied category can update only `items`, `description`,
and `servingTime`. Example:

```json
{"meals":{"lunch":{"items":["Rice","Chickpea curry"],"servingTime":"12:30-14:00"}}}
```

**Success Response — `200 OK`**, message `Menu updated successfully`;
`data.menu` is the updated menu shape shown above. Invalid ID/input returns
`400`; missing menu returns `404`.

#### `DELETE /manager/menus/:menuId`

**Description:** Permanently deletes the menu document.

**HTTP Method:** `DELETE` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `menuId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Menu deleted successfully`:

```json
{"success":true,"message":"Menu deleted successfully","data":{}}
```

Malformed ID returns `400`; missing menu returns `404`.

#### `GET /student/menus/today`

**Description:** Retrieves the menu for the current Asia/Kolkata calendar day.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Parameters/Body:** None.

**Success Response — `200 OK`**, message `Today's menu retrieved successfully`;
`data.menu` has the menu shape shown above. If no menu exists, the endpoint
returns `404 No menu has been published for today yet`.

#### `GET /student/menus/upcoming`

**Description:** Lists today and future menus in ascending date order.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Body:** None.

**Query:** `page` (default 1, max 1000000) and `limit` (default 10, max 100),
both positive integers.

**Success Response — `200 OK`**, message `Upcoming menus retrieved successfully`;
`data` is `{ "menus": [<menu>], "pagination": <pagination> }`.

#### `GET /student/menus/:date`

**Description:** Retrieves a menu for a specified date; student access is
read-only.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`.  
**Path parameter:** `date` — required valid `YYYY-MM-DD`. **Request Body:** None.

**Success Response — `200 OK`**, message `Menu retrieved successfully`;
`data.menu` has the documented menu shape. Invalid date returns `400`; missing
menu returns `404`.

### Complaint APIs

Complaint categories are `FOOD_QUALITY`, `CLEANLINESS`, `WATER_SUPPLY`,
`STAFF_BEHAVIOUR`, `INFRASTRUCTURE`, and `OTHER`. Statuses are `PENDING`,
`IN_PROGRESS`, and `RESOLVED`. Students can only view or submit their own
complaints; only Managers can update status and `adminRemark`.

#### `POST /student/complaints`

**Description:** Submits a complaint for the authenticated Student. The
backend supplies ownership, initial `PENDING` status, empty `adminRemark`, and
null `resolvedAt`.

**HTTP Method:** `POST` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Headers:** JSON and browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `subject` | string | Yes | Non-blank; max 150 characters. |
| `description` | string | Yes | Non-blank; max 3000 characters. |
| `category` | string | Yes | One of the six complaint categories above. |

No additional fields are accepted.

**Success Response — `201 Created`**, message `Complaint submitted successfully`:

```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaint": {
      "studentId": "64b000000000000000000001",
      "subject": "Dining hall water supply",
      "description": "Water was unavailable during dinner.",
      "category": "WATER_SUPPLY",
      "status": "PENDING",
      "adminRemark": "",
      "resolvedAt": null,
      "_id": "64b000000000000000000030",
      "createdAt": "2026-01-05T19:00:00.000Z",
      "updatedAt": "2026-01-05T19:00:00.000Z",
      "__v": 0
    }
  }
}
```

#### `GET /student/complaints`

**Description:** Lists only complaints owned by the authenticated Student.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Body:** None.

| Query | Type | Default | Constraints |
|---|---|---|---|
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |
| `status` | string | All | `PENDING`, `IN_PROGRESS`, or `RESOLVED`. |
| `category` | string | All | Supported complaint category. |
| `sort` | string | `newest` | `newest` or `oldest`. |

**Success Response — `200 OK`**, message `Complaints retrieved successfully`;
`data` contains `complaints` and `pagination`:

```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": {
    "complaints": [
      {
        "_id": "64b000000000000000000030",
        "studentId": "64b000000000000000000001",
        "subject": "Dining hall water supply",
        "description": "Water was unavailable during dinner.",
        "category": "WATER_SUPPLY",
        "status": "PENDING",
        "adminRemark": "",
        "resolvedAt": null,
        "createdAt": "2026-01-05T19:00:00.000Z",
        "updatedAt": "2026-01-05T19:00:00.000Z",
        "__v": 0
      }
    ],
    "pagination": {"totalRecords":1,"currentPage":1,"totalPages":1,"limit":10}
  }
}
```

#### `GET /student/complaints/:complaintId`

**Description:** Retrieves a complaint only if it belongs to the current Student.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`.  
**Path parameter:** `complaintId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Complaint retrieved successfully`;
`data.complaint` has the same shape as a complaint list item. Invalid ID returns
`400`; nonexistent or non-owned complaint returns `404 Complaint not found`.

#### `GET /manager/complaints`

**Description:** Lists complaints with optional status/category filters and
search across subject, description, student name, and student roll number.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Body:** None.

| Query | Type | Default | Constraints |
|---|---|---|---|
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |
| `status` | string | All | `PENDING`, `IN_PROGRESS`, or `RESOLVED`. |
| `category` | string | All | Supported complaint category. |
| `search` | string | Empty | Max 150 characters. |
| `sort` | string | `newest` | `newest` or `oldest`. |

**Success Response — `200 OK`**, message `Complaints retrieved successfully`;
each `data.complaints[]` entry includes complaint fields and a nested
`student` object with `_id`, `fullName`, `rollNumber`, `email`, and `phone`.
`data.pagination` uses the common metadata shape. Invalid filters return `400`.

```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": {
    "complaints": [
      {
        "_id": "64b000000000000000000030",
        "studentId": "64b000000000000000000001",
        "subject": "Dining hall water supply",
        "description": "Water was unavailable during dinner.",
        "category": "WATER_SUPPLY",
        "status": "PENDING",
        "adminRemark": "",
        "resolvedAt": null,
        "createdAt": "2026-01-05T19:00:00.000Z",
        "updatedAt": "2026-01-05T19:00:00.000Z",
        "student": {
          "_id": "64b000000000000000000001",
          "fullName": "Aarav Patel",
          "rollNumber": "ME-2041",
          "email": "aarav@example.edu",
          "phone": "+91 9876543210"
        }
      }
    ],
    "pagination": {"totalRecords":1,"currentPage":1,"totalPages":1,"limit":10}
  }
}
```

#### `GET /manager/complaints/:complaintId`

**Description:** Retrieves a complaint and populated safe Student identity.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `complaintId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Complaint retrieved successfully`;
`data.complaint` has the complaint fields and `studentId` is populated with the
safe fields `fullName`, `rollNumber`, `email`, and `phone`. Invalid ID returns
`400`; missing complaint returns `404`.

#### `PATCH /manager/complaints/:complaintId/status`

**Description:** Updates complaint status and optionally a Manager remark. A
transition to `RESOLVED` sets `resolvedAt`; any non-resolved status clears it.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `complaintId` — MongoDB ObjectId. **Request Headers:**
JSON and browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `status` | string | Yes | `PENDING`, `IN_PROGRESS`, or `RESOLVED`. |
| `adminRemark` | string | No | Max 2000 characters; empty string is allowed. |

No other fields are accepted.

**Success Response — `200 OK`**, message `Complaint status updated successfully`;
`data.complaint` is the updated complaint with populated safe student identity.
Invalid input returns `400`; missing complaint returns `404`.

### Notice Board APIs

Notice priorities are `NORMAL`, `IMPORTANT`, and `URGENT`. Creation defaults
priority to `NORMAL`; new notices are drafts (`isPublished: false`) and
`publishedAt` is initially `null`. Students can only list or retrieve
published notices. Unpublishing preserves the first `publishedAt` value.

#### `POST /manager/notices`

**Description:** Creates a draft notice.

**HTTP Method:** `POST` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Headers:** JSON and browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `title` | string | Yes | Non-blank; max 150 characters. |
| `content` | string | Yes | Non-blank; max 5000 characters. |
| `priority` | string | No | `NORMAL`, `IMPORTANT`, or `URGENT`; defaults to `NORMAL`. |

**Success Response — `201 Created`**, message `Notice created successfully`:

```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "notice": {
      "_id": "64b000000000000000000040",
      "title": "Dining hall schedule",
      "content": "The dining hall opens at 7:30 AM.",
      "priority": "NORMAL",
      "isPublished": false,
      "publishedAt": null,
      "createdBy": "64b000000000000000000010",
      "updatedBy": "64b000000000000000000010",
      "createdAt": "2026-01-05T10:00:00.000Z",
      "updatedAt": "2026-01-05T10:00:00.000Z",
      "__v": 0
    }
  }
}
```

#### `GET /manager/notices`

**Description:** Lists notices, including drafts.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Body:** None.

| Query | Type | Default | Constraints |
|---|---|---|---|
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |
| `search` | string | Empty | Max 200 characters; searches title and content. |
| `priority` | string | All | `NORMAL`, `IMPORTANT`, or `URGENT`. |
| `isPublished` | string | All | Literal `true` or `false`. |
| `sort` | string | `newest` | `newest` or `oldest`. |

**Success Response — `200 OK`**, message `Notices retrieved successfully`;
`data` contains `notices` and `pagination`. Notice items have the shape shown
in the create response.

#### `GET /manager/notices/:noticeId`

**Description:** Retrieves a notice, whether draft or published.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Notice retrieved successfully`;
`data.notice` has the standard notice shape. Invalid ID returns `400`; missing
notice returns `404 Notice not found`.

#### `PATCH /manager/notices/:noticeId`

**Description:** Updates one or more of `title`, `content`, and `priority`.
Publication fields cannot be changed through this endpoint.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Headers:** JSON
and browser credentials.

**Request Body:** One or more fields from the following table.

| Field | Type | Constraints |
|---|---|---|
| `title` | string | Non-blank; max 150 characters. |
| `content` | string | Non-blank; max 5000 characters. |
| `priority` | string | `NORMAL`, `IMPORTANT`, or `URGENT`. |

**Success Response — `200 OK`**, message `Notice updated successfully`;
`data.notice` is the updated notice. Empty body or invalid fields return `400`;
missing notice returns `404`.

#### `PATCH /manager/notices/:noticeId/publish`

**Description:** Publishes a notice. On first publication, the backend records
`publishedAt`; later publish/unpublish operations preserve that first timestamp.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Notice published successfully`;
`data.notice` has `isPublished: true` and a populated `publishedAt`.
Invalid ID returns `400`; missing notice returns `404`.

#### `PATCH /manager/notices/:noticeId/unpublish`

**Description:** Removes a notice from student-visible results while retaining
publication history.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Notice unpublished successfully`;
`data.notice` has `isPublished: false`. Invalid ID returns `400`; missing notice
returns `404`.

#### `DELETE /manager/notices/:noticeId`

**Description:** Permanently deletes a notice.

**HTTP Method:** `DELETE` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Notice deleted successfully`:

```json
{"success":true,"message":"Notice deleted successfully","data":{}}
```

Invalid ID returns `400`; missing notice returns `404`.

#### `GET /student/notices`

**Description:** Lists published notices only. Drafts are excluded by the
server regardless of query parameters.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Body:** None.

Supported query parameters are `page` (default 1, max 1000000), `limit`
(default 10, max 100), `search` (max 200 characters, title/content), `priority`
(`NORMAL`, `IMPORTANT`, `URGENT`), and `sort` (`newest` or `oldest`, default
`newest`). `isPublished` is not a student filter.

**Success Response — `200 OK`**, message `Notices retrieved successfully`;
`data` contains `notices` and `pagination`. Student notice objects omit
`createdBy` and `updatedBy`.

#### `GET /student/notices/:noticeId`

**Description:** Retrieves one published notice. An unpublished draft is
indistinguishable from a missing notice and returns `404`.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`.  
**Path parameter:** `noticeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Notice retrieved successfully`;
`data.notice` has the notice fields except `createdBy` and `updatedBy`.
Malformed ID returns `400`; missing/draft notice returns `404 Notice not found`.

### Fee Management APIs

All API money values are INR JSON numbers with no more than two decimal
places. MongoDB stores integer paise. Fee status is calculated by the backend:
`PAID` when the balance is zero; otherwise `OVERDUE` when the due date is
earlier than today's IST date; otherwise `PARTIALLY_PAID` when some amount is
paid, or `PENDING`.

#### `POST /manager/fees/assign`

**Description:** Assigns the same monthly or semester fee to one or more
approved students. Duplicate periods and ineligible IDs are reported per
student instead of aborting the whole assignment.

**HTTP Method:** `POST` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Headers:** JSON and browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `studentIds` | string array | Yes | 1–200 MongoDB ObjectId strings. Repeated IDs are reported as invalid entries. |
| `feeType` | string | Yes | `MONTHLY` or `SEMESTER`. |
| `title` | string | Yes | Non-blank; max 120 characters. |
| `academicYear` | string | Yes | Consecutive `YYYY-YYYY`, e.g. `2026-2027`. |
| `amount` | number | Yes | Positive INR amount with at most two decimals. |
| `dueDate` | string | Yes | Valid `YYYY-MM-DD` calendar date. |
| `billingMonth` | number/string numeric | Monthly only | Integer 1–12. |
| `billingYear` | number/string numeric | Monthly only | Integer 1–9999. |
| `semester` | string | Semester only | `SEMESTER_1` or `SEMESTER_2`. |

Monthly fees cannot include `semester`; semester fees cannot include
`billingMonth`/`billingYear`.

**Example Request**

```json
{
  "studentIds": ["64b000000000000000000001"],
  "feeType": "MONTHLY",
  "title": "November Mess Fee",
  "academicYear": "2026-2027",
  "billingMonth": 11,
  "billingYear": 2026,
  "amount": 2500.00,
  "dueDate": "2026-11-10"
}
```

**Success Response — `201 Created`**, message `Fee assignment completed`:

```json
{
  "success": true,
  "message": "Fee assignment completed",
  "data": {
    "assigned": [
      {"studentId":"64b000000000000000000001","fullName":"Aarav Patel","rollNumber":"ME-2041","feeId":"64b000000000000000000050"}
    ],
    "duplicates": [],
    "ineligible": [],
    "invalid": [],
    "summary": {"requested":1,"assigned":1,"duplicates":0,"ineligible":0,"invalid":0}
  }
}
```

#### `GET /manager/fees`

**Description:** Lists fee records with filters, paging, student name/roll
search, and a summary calculated over all matching records (not just the page).
Reads also refresh overdue statuses.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Body:** None.

| Query | Type | Default | Constraints |
|---|---|---|---|
| `page` | positive integer | `1` | Maximum `1000000`. |
| `limit` | positive integer | `10` | Maximum `100`. |
| `studentId` | ObjectId | None | Exact Student. |
| `status` | string | All | `PENDING`, `PARTIALLY_PAID`, `PAID`, or `OVERDUE`. |
| `feeType` | string | All | `MONTHLY` or `SEMESTER`. |
| `academicYear` | string | None | Consecutive `YYYY-YYYY`. |
| `billingMonth` | integer | None | 1–12. |
| `billingYear` | integer | None | 1–9999. |
| `semester` | string | None | `SEMESTER_1` or `SEMESTER_2`. |
| `search` | string | Empty | Max 100 characters; searches student full name and roll number. |
| `sort` | string | `newest` | `newest`, `oldest`, `dueDate_asc`, or `dueDate_desc`. |

**Success Response — `200 OK`**, message `Fees retrieved successfully`.
`data.fees` contains serialized fee records (INR) with populated safe student
details; `data.pagination` uses common metadata. `data.summary` contains
`totalFees`, `totalAmount`, `totalCollected`, `totalOutstanding`,
`paidCount`, `pendingCount`, and `overdueCount`.

#### `GET /manager/fees/:feeId`

**Description:** Retrieves a fee with safe Student details and up to five most
recent payments.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Fee retrieved successfully`:

```json
{
  "success": true,
  "message": "Fee retrieved successfully",
  "data": {
    "fee": {
      "id": "64b000000000000000000050",
      "feeType": "MONTHLY",
      "title": "November Mess Fee",
      "academicYear": "2026-2027",
      "billingMonth": 11,
      "billingYear": 2026,
      "amount": 2500,
      "paidAmount": 0,
      "balanceAmount": 2500,
      "status": "PENDING",
      "dueDate": "2026-11-10T00:00:00.000Z",
      "createdAt": "2026-10-31T10:00:00.000Z",
      "updatedAt": "2026-10-31T10:00:00.000Z",
      "student": {"id":"64b000000000000000000001","fullName":"Aarav Patel","rollNumber":"ME-2041","status":"APPROVED"}
    },
    "recentPayments": []
  }
}
```

Malformed ID returns `400`; absent fee returns `404`.

#### `PATCH /manager/fees/:feeId`

**Description:** Updates title and/or due date; amount can be changed only
before a successful payment. Paid amount, balance, and status are not
client-writable.

**HTTP Method:** `PATCH` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Headers:** JSON and
browser credentials.

**Request Body:** At least one permitted field is required.

| Field | Type | Constraints |
|---|---|---|
| `title` | string | Non-blank; max 120 characters. |
| `dueDate` | string | Valid `YYYY-MM-DD`. |
| `amount` | number | Positive INR with max two decimal places; cannot be below paid amount. Cannot change after any successful payment or below pending order reservations. |

**Success Response — `200 OK`**, message `Fee updated successfully`;
`data.fee` is the serialized fee in INR. Invalid fields/date/amount return
`400`; missing fee `404`; amount edits after successful payment or below
reservations return `409`.

#### `POST /manager/fees/:feeId/payments/offline`

**Description:** Records money already received by a Manager. The payment
record and fee balance update occur within a MongoDB transaction.

**HTTP Method:** `POST` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Headers:** JSON and
browser credentials.

**Request Body**

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `amount` | number | Yes | Positive INR amount with at most two decimals; cannot exceed available balance after pending reservations. |
| `transactionReference` | string | No | If supplied, non-blank; max 120 characters. |
| `remark` | string | No | If supplied, non-blank; max 500 characters. |

**Success Response — `201 Created`**, message `Offline payment recorded successfully`:

```json
{
  "success": true,
  "message": "Offline payment recorded successfully",
  "data": {
    "fee": {
      "id":"64b000000000000000000050","feeType":"MONTHLY","title":"November Mess Fee",
      "academicYear":"2026-2027","billingMonth":11,"billingYear":2026,
      "amount":2500,"paidAmount":1000,"balanceAmount":1500,"status":"PARTIALLY_PAID",
      "dueDate":"2026-11-10T00:00:00.000Z","createdAt":"2026-10-31T10:00:00.000Z",
      "updatedAt":"2026-10-31T11:00:00.000Z"
    },
    "payment": {
      "id":"64b000000000000000000051","feeId":"64b000000000000000000050",
      "amount":1000,"paymentMethod":"OFFLINE","status":"SUCCESS",
      "transactionReference":"CASH-2026-001",
      "paidAt":"2026-10-31T11:00:00.000Z","createdAt":"2026-10-31T11:00:00.000Z"
    }
  }
}
```

An offline record is immediately `SUCCESS` because this endpoint records
already-received money. Invalid amounts/fields return `400`; missing fee
returns `404`; no available balance, overpayment, or concurrent balance change
returns `409`.

#### `GET /manager/fees/:feeId/payments`

**Description:** Lists paginated payment history for a fee.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Body:** None.

**Query:** `page` (default 1, max 1000000) and `limit` (default 10, max 100),
both positive integers.

**Success Response — `200 OK`**, message `Payment history retrieved successfully`;
`data` is `{ "payments": [<serialized payment>], "pagination": <metadata> }`.
Payment shape is shown in the offline payment response. A missing fee returns
`404`.

#### `GET /student/fees`

**Description:** Lists only the authenticated Student's fees and summary.
The status filter affects the returned page/count; financial summary is
calculated over all that Student's fees.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Body:** None.

**Query:** `page` (default 1, max 1000000), `limit` (default 10, max 100), and
optional `status` (`PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).

**Success Response — `200 OK`**, message `Your fees were retrieved successfully`;
`data` contains `fees`, `pagination`, and `summary` with `totalAmount`,
`totalPaid`, and `totalOutstanding`, all INR amounts.

#### `GET /student/fees/:feeId`

**Description:** Retrieves an owned fee and up to ten latest safe payments.
Fee ownership is derived from the session, not a request field.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Body:** None.

**Success Response — `200 OK`**, message `Fee retrieved successfully`;
`data` contains `fee` and `payments`. A fee not owned by the Student returns
`404 Fee not found`.

#### `GET /student/fees/:feeId/payments`

**Description:** Lists payment history only after verifying that the fee
belongs to the authenticated Student.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`.  
**Path parameter:** `feeId` — MongoDB ObjectId. **Request Body:** None.

**Query:** `page` (default 1, max 1000000) and `limit` (default 10, max 100),
both positive integers.

**Success Response — `200 OK`**, message `Payment history retrieved successfully`;
`data` is `{ "payments": [<serialized payment>], "pagination": <metadata> }`.
Unowned or missing fees return `404 Fee not found`.

### Razorpay Payment APIs

Razorpay operations are Student-only and require both server-side Razorpay
credentials. The backend determines the amount from the fee's available
balance, creates a pending local payment record, and reserves that balance.
The public `keyId` may be passed to Checkout; never expose or return
`RAZORPAY_KEY_SECRET`.

#### `POST /student/payments/razorpay/order`

**Description:** Creates or reuses a Razorpay order for an owned fee.

**HTTP Method:** `POST` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Headers:** JSON and browser credentials.

**Request Body:** Only `feeId` is accepted.

| Field | Type | Required | Constraints |
|---|---|---:|---|
| `feeId` | string | Yes | 24-character hexadecimal fee ObjectId belonging to the current Student. |

**Example Request**

```bash
curl -X POST http://localhost:5000/api/v1/student/payments/razorpay/order \
  -H "Content-Type: application/json" -b student-cookies.txt \
  -d '{"feeId":"64b000000000000000000050"}'
```

**Success Response — `201 Created`**, message `Razorpay order created successfully`:

```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "order": {"id":"order_example123","amount":250000,"currency":"INR"},
    "keyId": "rzp_test_public_key_id",
    "paymentId": "64b000000000000000000052"
  }
}
```

The order `amount` is integer paise, as required by Razorpay. The API fee
amounts elsewhere are INR. `paymentId` is the local pending Payment document
ID. The endpoint reuses the latest pending local Razorpay order for the same
fee/student when present. A missing or unowned fee returns `404`; no
unreserved balance returns `409`; missing credentials returns `503`; Razorpay
order creation/retrieval errors return `502`.

#### `POST /student/payments/razorpay/verify`

**Description:** Verifies the Checkout signature and retrieves the provider
payment. Only a provider-confirmed captured payment updates the fee and marks
the local Payment successful. Repeating verification for the same captured
payment is idempotent.

**HTTP Method:** `POST` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Headers:** JSON and browser credentials.

**Request Body:** All fields are required; no additional fields are accepted.

| Field | Type | Description |
|---|---|---|
| `razorpay_order_id` | string | Razorpay order ID returned by Checkout. |
| `razorpay_payment_id` | string | Razorpay payment ID returned by Checkout. |
| `razorpay_signature` | string | Checkout signature; validated server-side. |

**Example Request**

```json
{
  "razorpay_order_id": "order_example123",
  "razorpay_payment_id": "pay_example123",
  "razorpay_signature": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

**Success Response — `200 OK`**, message is `Payment verified successfully`
or `Payment was already verified`:

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "alreadyProcessed": false,
    "payment": {
      "id":"64b000000000000000000052","feeId":"64b000000000000000000050",
      "amount":2500,"paymentMethod":"RAZORPAY","status":"SUCCESS",
      "transactionReference":"pay_example123",
      "paidAt":"2026-10-31T11:00:00.000Z","createdAt":"2026-10-31T10:00:00.000Z"
    },
    "fee": {
      "id":"64b000000000000000000050","feeType":"MONTHLY","title":"November Mess Fee",
      "academicYear":"2026-2027","billingMonth":11,"billingYear":2026,
      "amount":2500,"paidAmount":2500,"balanceAmount":0,"status":"PAID",
      "dueDate":"2026-11-10T00:00:00.000Z","createdAt":"2026-10-31T10:00:00.000Z",
      "updatedAt":"2026-10-31T11:00:00.000Z"
    }
  }
}
```

The example signature and provider identifiers are illustrative only; actual
values must come from Razorpay Checkout. Invalid identifiers/signature or
amount/currency mismatch return `400`; unknown/non-owned order returns `404`;
uncaptured, failed, already-processed-with-different-payment, or conflicting
payment states return `409`; provider lookup errors return `502`; missing
Razorpay configuration returns `503`. A provider-confirmed failure marks the
attempt `FAILED` and releases its fee reservation. A frontend Checkout failure
callback by itself does not mark a payment or fee as failed/paid.

### Dashboard APIs

#### `GET /manager/dashboard`

**Description:** Returns aggregate operating and financial information for an
active Manager.

**HTTP Method:** `GET` · **Access:** Manager · **Authentication:** Required,
`managerToken`. **Request Parameters/Body:** None.

**Success Response — `200 OK`**, message `Manager dashboard data fetched successfully`:

```json
{
  "success": true,
  "message": "Manager dashboard data fetched successfully",
  "data": {
    "statistics": {
      "totalStudents": 42,
      "totalFeesCollected": 105000,
      "outstandingDues": 12000,
      "pendingComplaints": 3
    },
    "recentPayments": [
      {
        "id":"64b000000000000000000060",
        "amount":2500,
        "paymentMethod":"RAZORPAY",
        "status":"SUCCESS",
        "transactionReference":null,
        "razorpayOrderId":"order_example123",
        "razorpayPaymentId":"pay_example123",
        "paymentDate":"2026-10-31T11:00:00.000Z",
        "student":{"fullName":"Aarav Patel","rollNumber":"ME-2041"}
      }
    ],
    "generatedAt":"2026-10-31T11:01:00.000Z"
  }
}
```

`totalStudents` counts `APPROVED` accounts only. `totalFeesCollected` sums
successful Payment amounts. `outstandingDues` sums positive Fee balances.
`pendingComplaints` counts only `PENDING` complaints. `recentPayments` is the
latest five attempts (not just successes); amounts are INR.

#### `GET /student/dashboard`

**Description:** Returns personalized summary data derived from the
authenticated Student ID.

**HTTP Method:** `GET` · **Access:** Student · **Authentication:** Required,
`studentToken`. **Request Parameters/Body:** None.

**Success Response — `200 OK`**, message `Student dashboard data fetched successfully`:

```json
{
  "success": true,
  "message": "Student dashboard data fetched successfully",
  "data": {
    "student": {"fullName":"Aarav Patel","rollNumber":"ME-2041"},
    "todayMenu": {
      "date":"2026-10-31T00:00:00.000Z",
      "meals": {
        "breakfast":{"items":["Poha"],"description":"","servingTime":""},
        "lunch":{"items":["Rice","Dal"],"description":"","servingTime":""},
        "snacks":{"items":["Fruit"],"description":"","servingTime":""},
        "dinner":{"items":["Roti"],"description":"","servingTime":""}
      }
    },
    "feeSummary": {
      "totalFee":2500,
      "paidAmount":1000,
      "outstandingAmount":1500,
      "totalFeeRecords":1,
      "paidFeeRecords":0,
      "pendingFeeRecords":1
    },
    "recentComplaints": [
      {
        "id":"64b000000000000000000030",
        "subject":"Dining hall water supply",
        "category":"WATER_SUPPLY",
        "status":"PENDING",
        "createdAt":"2026-10-30T19:00:00.000Z",
        "adminRemark":""
      }
    ],
    "generatedAt":"2026-10-31T11:01:00.000Z"
  }
}
```

`todayMenu` is `null` when no menu exists today. Fee totals use Fee documents
to avoid double-counting Payment records. The response includes at most five
most recent complaints. Empty activity returns zero fee totals and an empty
complaint array.

## 7. Common Response and Error Format

Most successful controller responses have this shape:

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {}
}
```

Errors handled by the central error middleware use:

```json
{
  "success": false,
  "message": "A safe client-facing description"
}
```

Authentication middleware also returns this same `success`/`message` shape.
The main statuses present in the implementation are:

| Status | Meaning in this API |
|---:|---|
| `200` | Successful reads, updates, deletes, login/logout, and verification. |
| `201` | Successful registration, creation, fee assignment, offline payment, and Razorpay order creation. |
| `400` | Invalid JSON/domain validation, ObjectId, date, pagination, or unsupported fields. |
| `401` | Missing/invalid/expired session or invalid login credentials. |
| `403` | Wrong role, blocked login status, or disallowed cross-site request origin. |
| `404` | Unknown route or resource not found/not owned. |
| `409` | Duplicate record, invalid concurrent state, or payment/fee conflict. |
| `413` | Request body exceeds the 10 KB parser limit. |
| `502` | Razorpay provider order/verification operation failed. |
| `503` | Razorpay credentials are not configured. |
| `500` | Unexpected server/database error; details are logged server-side and the client receives `Internal server error`. |

Malformed JSON returns `400 Request body must contain valid JSON`. An unknown
path returns `404 Route not found`. Mongo duplicate-key errors are mapped to
`409`; Mongoose validation and cast errors are mapped to `400 The request
contains invalid data`.

## 8. Pagination, Filtering, and Sorting

Where pagination is supported, defaults are generally `page=1` and `limit=10`,
with positive integers and maximum `limit=100`. Responses use:

```json
{
  "totalRecords": 25,
  "currentPage": 1,
  "totalPages": 3,
  "limit": 10
}
```

When there are no records, `totalPages` is `0`. Lists that accept `sort` use
the endpoint-specific values documented above. Student, complaint, notice,
fee, and menu endpoints have distinct filter support; query parameters are not
interchangeable across modules.

Examples:

```text
GET /api/v1/manager/students?status=APPROVED&registrationMethod=SELF_REGISTERED&page=2&limit=20
GET /api/v1/manager/complaints?status=PENDING&category=FOOD_QUALITY&sort=oldest
GET /api/v1/manager/fees?feeType=MONTHLY&billingMonth=11&billingYear=2026&sort=dueDate_asc
GET /api/v1/manager/menus?startDate=2026-11-01&endDate=2026-11-30
```

## 9. Data Models Overview

| Collection/model | Purpose and relationships |
|---|---|
| `Manager` (`managers`) | Provisioned manager accounts; stores hashed password and active status. Referenced by student creation/review, menus, fees, and notices. |
| `Student` (`students`) | Student identity, hashed password, status, registration and review metadata. Referenced by fees, payments, and complaints. |
| `StudentProfile` (`studentProfiles`) | Optional student profile data, currently room number. One-to-one with `Student` through unique `studentId`. |
| `Menu` (`menus`) | One daily menu per normalized calendar date. Stores all four meal categories in one document and references creator/updater Managers. |
| `Fee` (`fees`) | A Student's monthly or semester obligation, INR values at API boundary and integer paise internally. Unique index prevents duplicate student/period assignments. |
| `Payment` (`payments`) | Offline payment or Razorpay attempt linked to a Fee and Student, with status and audit timestamps. Provider order/payment IDs have unique partial indexes. |
| `Complaint` (`complaints`) | Student-submitted complaint and manager-controlled status/remark/resolution timestamp. |
| `Notice` (`notices`) | Manager-authored draft or published announcement with priority and publication history. |

## 10. Important Business Rules

- Student and Manager authentication are separate cookie/JWT sessions.
- Student self-registration remains `PENDING` until manager approval. Manager
  created accounts start `APPROVED`.
- Every protected request rechecks account status against MongoDB.
- Student fee and complaint queries are scoped to the authenticated Student;
  client-supplied ownership identifiers are not used to select the owner.
- Students have read-only menu access and can see only published notices.
- Fee totals, balances, due status, and payment confirmation are server-owned.
  Successful payments alone increase `paidAmount` and decrease balances.
- Offline payments represent funds already received and update fee/payment
  documents atomically.
- Razorpay Checkout success in the browser is not authoritative. The backend
  verifies the HMAC and fetches the provider payment; only captured,
  matching payments are credited.
- Menu and due dates are date-only `YYYY-MM-DD` labels based on the
  Asia/Kolkata calendar and stored at UTC midnight.
- Menu and notice deletion is permanent. Student deactivation is a status
  change, not deletion.
- Complaint `resolvedAt` is set when status becomes `RESOLVED` and cleared when
  moved to another status.

## 11. API Quick Reference

The API contains 52 versioned endpoints plus the health endpoint.

| Module | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| Health | GET | `/health` | Public | Server liveness response. |
| Student auth | POST | `/studentAuth/register` | Public | Self-register pending student. |
| Student auth | POST | `/studentAuth/login` | Public | Login approved student. |
| Student auth | POST | `/studentAuth/logout` | Public | Clear student cookie. |
| Student auth | GET | `/studentAuth/me` | Student | Current student profile. |
| Manager auth | POST | `/managerAuth/login` | Public | Login active manager. |
| Manager auth | POST | `/managerAuth/logout` | Public | Clear manager cookie. |
| Manager auth | GET | `/managerAuth/me` | Manager | Current manager profile. |
| Students | POST | `/manager/students` | Manager | Create approved student. |
| Students | GET | `/manager/students` | Manager | Search/filter/paginate students. |
| Students | GET | `/manager/students/pending` | Manager | List pending registrations. |
| Students | GET | `/manager/students/:studentId` | Manager | Student detail and profile. |
| Students | PATCH | `/manager/students/:studentId` | Manager | Update permitted student/profile fields. |
| Students | PATCH | `/manager/students/:studentId/approve` | Manager | Approve pending registration. |
| Students | PATCH | `/manager/students/:studentId/reject` | Manager | Reject pending registration. |
| Students | PATCH | `/manager/students/:studentId/deactivate` | Manager | Mark a student inactive. |
| Manager menus | POST | `/manager/menus` | Manager | Create a daily menu. |
| Manager menus | GET | `/manager/menus` | Manager | List menus by date range. |
| Manager menus | GET | `/manager/menus/upcoming` | Manager | List today and future menus. |
| Manager menus | GET | `/manager/menus/:date` | Manager | Retrieve menu by date. |
| Manager menus | PATCH | `/manager/menus/:menuId` | Manager | Partially update meals. |
| Manager menus | DELETE | `/manager/menus/:menuId` | Manager | Permanently delete menu. |
| Student menus | GET | `/student/menus/today` | Student | Retrieve today's IST menu. |
| Student menus | GET | `/student/menus/upcoming` | Student | List today and future menus. |
| Student menus | GET | `/student/menus/:date` | Student | Retrieve menu by date. |
| Student complaints | POST | `/student/complaints` | Student | Submit own complaint. |
| Student complaints | GET | `/student/complaints` | Student | List own complaints. |
| Student complaints | GET | `/student/complaints/:complaintId` | Student | Retrieve own complaint. |
| Manager complaints | GET | `/manager/complaints` | Manager | Search/filter complaint records. |
| Manager complaints | GET | `/manager/complaints/:complaintId` | Manager | Complaint and student identity. |
| Manager complaints | PATCH | `/manager/complaints/:complaintId/status` | Manager | Update status/remark. |
| Manager notices | POST | `/manager/notices` | Manager | Create draft notice. |
| Manager notices | GET | `/manager/notices` | Manager | List notices including drafts. |
| Manager notices | GET | `/manager/notices/:noticeId` | Manager | Retrieve any notice. |
| Manager notices | PATCH | `/manager/notices/:noticeId` | Manager | Edit notice content/priority. |
| Manager notices | PATCH | `/manager/notices/:noticeId/publish` | Manager | Publish notice. |
| Manager notices | PATCH | `/manager/notices/:noticeId/unpublish` | Manager | Unpublish notice. |
| Manager notices | DELETE | `/manager/notices/:noticeId` | Manager | Permanently delete notice. |
| Student notices | GET | `/student/notices` | Student | List published notices only. |
| Student notices | GET | `/student/notices/:noticeId` | Student | Retrieve published notice. |
| Manager fees | POST | `/manager/fees/assign` | Manager | Assign period fees to students. |
| Manager fees | GET | `/manager/fees` | Manager | Filter and summarize fee records. |
| Manager fees | GET | `/manager/fees/:feeId` | Manager | Fee and recent payment summary. |
| Manager fees | PATCH | `/manager/fees/:feeId` | Manager | Update allowed fee fields. |
| Manager fees | POST | `/manager/fees/:feeId/payments/offline` | Manager | Record received offline payment. |
| Manager fees | GET | `/manager/fees/:feeId/payments` | Manager | List payment history. |
| Student fees | GET | `/student/fees` | Student | List own fees and summary. |
| Student fees | GET | `/student/fees/:feeId` | Student | Retrieve own fee and recent payments. |
| Student fees | GET | `/student/fees/:feeId/payments` | Student | List own fee payment history. |
| Student payments | POST | `/student/payments/razorpay/order` | Student | Create/reuse Razorpay order. |
| Student payments | POST | `/student/payments/razorpay/verify` | Student | Verify provider payment and credit fee. |
| Manager dashboard | GET | `/manager/dashboard` | Manager | Aggregate operational/financial data. |
| Student dashboard | GET | `/student/dashboard` | Student | Personalized menu/fee/complaint summary. |

## 12. Implementation Notes and Limitations

- Manager account creation is a seed-script operation; there is no manager
  signup API.
- There is no separate webhook endpoint in the registered routes. The
  implemented Razorpay confirmation flow is the authenticated Checkout
  verification endpoint documented above.
- There is no payment endpoint for students to choose an arbitrary amount;
  Razorpay order amounts are calculated from available fee balance.
- `/health` reports that the HTTP application is running; it does not perform
  a database readiness check.
- A pending Razorpay order reserves the currently available balance. The
  implementation reuses an existing pending order when the student requests
  another order for that fee; it does not document a separate order-expiry
  cleanup route.

## Admin accounts and recurring weekly menu

Admins use a separate `adminToken` cookie and are provisioned with `npm run seed:admin` using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. There is no public Admin registration. Admins manage Managers from `/admin/login` and the dedicated admin interface.

Admin APIs: `POST /api/v1/adminAuth/login`, `POST /api/v1/adminAuth/logout`, `GET /api/v1/adminAuth/me`; `POST /api/v1/admin/managers`, `GET /api/v1/admin/managers?search=`, `GET /api/v1/admin/managers/:managerId`, `PATCH /api/v1/admin/managers/:managerId`, and `PATCH /api/v1/admin/managers/:managerId/deactivate`. Manager creation accepts `fullName`, `email`, `phone`, and `password`; email is checked across Admin, Manager, and Student accounts. Passwords are hashed and responses omit credentials.

Weekly menu APIs: `GET` and `PUT /api/v1/manager/menus/weekly` (manager), and `GET /api/v1/student/menus/weekly` (read-only). The single template contains seven Sunday-through-Saturday `days`; each day has `dayOfWeek` and four meals, each with `items`, `description`, and `servingTime`. A date-specific menu overrides the recurring day for that date; it does not change the template. Phone numbers must be exactly ten digits.

Seed the Admin and default weekly template idempotently:

```powershell
$env:ADMIN_NAME = "System Admin"
$env:ADMIN_EMAIL = "admin@example.test"
$env:ADMIN_PASSWORD = "<private password>"
npm run seed:admin
npm run seed:weekly-menu
npm start
```

Sign in at `/admin/login` and use Managers to create Manager accounts. The weekly-menu seed leaves an existing template unchanged.

The Manager and Student `GET /api/v1/{role}/menus/today` endpoints resolve the current Asia/Kolkata date using the same selection rule: a date-specific menu overrides the recurring weekday entry. The response includes `dayOfWeek` and the source marker.
