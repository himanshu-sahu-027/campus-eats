# Fee and payment management

## Money and date conventions

Public API requests and responses express money in INR with at most two decimal
places. Fee and payment model fields (`amount`, `paidAmount`, and
`balanceAmount`) store integer paise; one INR is exactly 100 paise. Razorpay
also expects its INR order amount in paise. The server converts at the API
boundary and is the only authority for balances and fee status.

Date-only due dates use the existing UTC-midnight / IST-calendar convention.
A balance is overdue after the due calendar day has passed in Asia/Kolkata.
Pending Razorpay orders reserve an outstanding amount to prevent overlapping
orders and offline payments from collecting more than the obligation. This
reservation is not a successful payment and is excluded from paid balances.
Provider payments that are only authorized remain pending and reserved; the
configured Razorpay account must capture them before verification can credit a
fee. A frontend callback never captures or marks the payment successful.

## Manager APIs

All routes require an active manager session:

- `POST /api/v1/manager/fees/assign` accepts `studentIds`, fee type, title,
  academic year, billing period, INR `amount`, and `dueDate`. Results list
  assignments, duplicate periods, ineligible students, and invalid IDs.
- `GET /api/v1/manager/fees` supports page/limit, studentId, status, feeType,
  academicYear, billingMonth, billingYear, semester, search, and sort. The
  response includes summary totals computed across the full filtered result.
- `GET /api/v1/manager/fees/:feeId` returns a fee and recent safe payment data.
- `PATCH /api/v1/manager/fees/:feeId` allows title, dueDate, and amount updates.
  Amount changes are rejected after any successful payment.
- `POST /api/v1/manager/fees/:feeId/payments/offline` records money already
  received, with an INR amount and optional transaction reference/remark.
- `GET /api/v1/manager/fees/:feeId/payments` returns safe paginated history.

## Student APIs

All routes require an approved student session and enforce fee ownership:

- `GET /api/v1/student/fees` lists only the authenticated student's fees.
- `GET /api/v1/student/fees/:feeId` retrieves one owned fee.
- `GET /api/v1/student/fees/:feeId/payments` returns safe paginated history.
- `POST /api/v1/student/payments/razorpay/order` accepts only `feeId`. The
  server calculates and reserves the amount; the response includes only the
  public Checkout key.
- `POST /api/v1/student/payments/razorpay/verify` accepts only Razorpay order,
  payment, and signature identifiers. The server verifies HMAC and fetches the
  provider payment before crediting a fee.

## Atomicity and deployment

Offline recording, payment reservations, and Razorpay verification use MongoDB
transactions. Configure MongoDB Atlas or another replica-set deployment that
supports transactions; standalone MongoDB deployments are not supported for
financial mutations. Conditional updates, unique period indexes, unique
Razorpay identifiers, and payment-level idempotency protect concurrent writes.
Successful payment history is never removed or silently rewritten.
This phase intentionally does not implement financial adjustments; corrections
to already-successful payments require a separately auditable adjustment
mechanism.

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment to
enable Razorpay test-mode operations. The credentials are read server-side,
and only the public key ID is returned to Checkout. Missing credentials return
a clear configuration error for Razorpay operations without disabling other
features. Keep `.env` out of source control; `.env.example` contains placeholders.

The official `razorpay` Node SDK is a backend dependency. A captured test
payment requires valid Razorpay test credentials and a reachable provider
account. Unit tests cover local validation/signature behavior and do not claim
that a live Checkout transaction was exercised.
