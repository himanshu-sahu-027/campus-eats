/**
 * Maps an account document to its safe public representation.
 *
 * Password and other credential fields are intentionally never copied.
 *
 * @param {Object} account - Manager or Student Mongoose document.
 * @param {"MANAGER"|"STUDENT"} role - Account type.
 * @returns {Object} Safe account values for API responses.
 * @name safeAccount
 * @description Maps an account document to its safe public representation.
 */
export function safeAccount(account, role) {
    const result = {
        id: account._id.toString(),
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        status: account.status,
        role,
    };

    if (role === "STUDENT") {
        Object.assign(result, {
            rollNumber: account.rollNumber,
            registrationMethod: account.registrationMethod,
            createdBy: account.createdBy?.toString() ?? null,
            reviewedBy: account.reviewedBy?.toString() ?? null,
            reviewedAt: account.reviewedAt ?? null,
            rejectionReason: account.rejectionReason ?? null,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        });
    } else {
        Object.assign(result, {
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        });
    }

    return result;
}
