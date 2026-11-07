import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhone } from "../src/utils/validation.js";

test("phone validation accepts only exactly ten numeric digits", () => {
    for (const value of ["9876543210", "1234567890"]) assert.equal(normalizePhone(value), value);
    for (const value of ["987654321", "98765432101", "98765abc10", "+919876543210", "", 9876543210, "987 654 3210"]) {
        assert.throws(() => normalizePhone(value), { statusCode: 400 });
    }
});
