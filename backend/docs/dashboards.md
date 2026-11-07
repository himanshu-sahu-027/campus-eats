# Role-based dashboards

The dashboards are read-only views over the existing Student, Fee, Payment,
Complaint, and Menu collections. They do not persist a separate dashboard
document or accept student identifiers from clients.

## Manager

`GET /api/v1/manager/dashboard` requires an active manager session and returns
the application-standard `{ success, message, data }` shape. `data.statistics`
contains the count of APPROVED students, total successful payment collection,
positive outstanding fee balances, and PENDING complaints. `recentPayments`
contains at most five records sorted newest-first, including safe student
name/roll number and transaction references. Collection totals are aggregated
from Payment records with `status: SUCCESS`; dues are aggregated from positive
Fee `balanceAmount` values. Persisted monetary values are integer paise and
dashboard API values are INR rupees.

## Student

`GET /api/v1/student/dashboard` requires an approved student session. Student
identity comes only from the authenticated request context, and all fee and
complaint queries are scoped to that identity. The response includes safe
student display information, today's menu or `null`, a Fee-backed financial
summary in INR, at most five recent owned complaints, and an ISO `generatedAt`
timestamp.

Today's menu uses `getCurrentISTDate()` and `normalizeMenuDate()` from the
existing date utilities, matching the menu endpoints' Asia/Kolkata calendar
convention. Student fee totals aggregate the Fee document summary fields; they
do not sum payment history and therefore cannot double-count payments.

## Performance and access control

Statistics use count queries and bounded MongoDB aggregations. The manager
recent-payment pipeline sorts and limits before joining only the necessary
student display fields. The student complaint query sorts and limits in MongoDB.
Each router reuses the established manager or student authentication middleware.
