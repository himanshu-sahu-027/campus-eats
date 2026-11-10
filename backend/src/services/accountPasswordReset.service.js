import bcrypt from "bcryptjs";
import { httpError } from "../utils/httpError.js";
import { validateObjectId, validatePassword } from "../utils/validation.js";

const PASSWORD_ROUNDS = 12;

/**
 * Replaces an account password and increments its JWT version atomically.
 * The model is supplied only by trusted role-specific service wrappers.
 *
 * @param {import("mongoose").Model} Account - Student or Manager model.
 * @param {string} accountId - Target account ID from the route.
 * @param {Object} input - New password and confirmation.
 * @param {string} label - Account type used in safe error messages.
 * @returns {Promise<void>} Resolves after the password hash and token version persist.
 * @throws {Error} 400 for malformed input, 404 when the account does not exist.
 */
export async function resetAccountPassword(Account, accountId, input, label) {
    const id = validateObjectId(accountId);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON object is required");
    }
    const keys = Object.keys(input);
    if (keys.length !== 2 || keys.some((key) => !["newPassword", "confirmPassword"].includes(key))) {
        throw httpError(400, "Only newPassword and confirmPassword are allowed");
    }
    const password = validatePassword(input.newPassword);
    if (typeof input.confirmPassword !== "string" || password !== input.confirmPassword) {
        throw httpError(400, "Password confirmation does not match");
    }
    if (!await Account.exists({ _id: id })) throw httpError(404, `${label} not found`);

    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    const result = await Account.updateOne(
        { _id: id },
        { $set: { password: passwordHash }, $inc: { tokenVersion: 1 } },
    );
    if (!result.matchedCount) throw httpError(404, `${label} not found`);
}
