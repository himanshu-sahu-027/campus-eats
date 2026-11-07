# Complaints and notices API

All endpoints use the existing credentialed JWT-cookie authentication. Student
and manager endpoints require their corresponding authenticated role. List
endpoints accept `page` (default `1`) and `limit` (default `10`, maximum `100`).
Successful responses use the standard `{ success, message, data }` envelope.

## Student complaints

Base path: `/api/v1/student/complaints`

- `POST /` — Submit `{ "subject", "description", "category" }`. Categories:
  `FOOD_QUALITY`, `CLEANLINESS`, `WATER_SUPPLY`, `STAFF_BEHAVIOUR`,
  `INFRASTRUCTURE`, and `OTHER`. Ownership and initial `PENDING` status are
  assigned by the server.
- `GET /` — List the authenticated student's complaints. Optional filters:
  `status`, `category`, and `sort` (`newest` or `oldest`).
- `GET /:complaintId` — Read one of the authenticated student's complaints.

## Manager complaints

Base path: `/api/v1/manager/complaints`

- `GET /` — List/search complaints. Optional filters: `status`, `category`,
  `search` (subject, description, student name, or roll number), and `sort`
  (`newest` or `oldest`).
- `GET /:complaintId` — Read complaint details with safe student identity fields.
- `PATCH /:complaintId/status` — Update `{ "status", "adminRemark?" }`.
  Status is `PENDING`, `IN_PROGRESS`, or `RESOLVED`; `resolvedAt` is set or
  cleared to match the status.

## Manager notices

Base path: `/api/v1/manager/notices`

- `POST /` — Create a draft using `{ "title", "content", "priority?" }`.
- `GET /` — List drafts and published notices. Optional filters: `search`,
  `priority`, `isPublished` (`true` or `false`), and `sort`.
- `GET /:noticeId` — Read a draft or published notice.
- `PATCH /:noticeId` — Update `title`, `content`, and/or `priority`.
- `PATCH /:noticeId/publish` — Publish a draft.
- `PATCH /:noticeId/unpublish` — Hide a notice from students, retaining its
  original publication timestamp.
- `DELETE /:noticeId` — Delete a notice.

Priorities are `NORMAL`, `IMPORTANT`, and `URGENT`.

## Student notices

Base path: `/api/v1/student/notices`

- `GET /` — List published notices only. Optional filters: `search`, `priority`,
  and `sort`.
- `GET /:noticeId` — Read a published notice. Drafts and unpublished notices
  return `404`.
