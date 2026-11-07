import { httpError } from "./httpError.js";

export const MEAL_NAMES = ["breakfast", "lunch", "snacks", "dinner"];
const MEAL_FIELDS = new Set(["items", "description", "servingTime"]);

/**
 * Validates and normalizes meal fields, rejecting unknown keys and blank items.
 *
 * @param {Object} meals - Raw meal data.
 * @param {Object} [options] - Validation behavior.
 * @param {boolean} [options.requireAll=false] - Require all four meal categories.
 * @returns {Object} Normalized partial or complete meal structure.
 * @throws {Error} 400 for malformed categories, fields, or food items.
 * @name normalizeMeals
 * @description Validates and normalizes meal fields, rejecting unknown keys and blank items.
 */
export function normalizeMeals(meals, { requireAll = false } = {}) {
    if (!meals || typeof meals !== "object" || Array.isArray(meals)) {
        throw httpError(400, "Meals must be a JSON object");
    }

    const categories = Object.keys(meals);
    if (categories.length === 0 || categories.some((name) => !MEAL_NAMES.includes(name))) {
        throw httpError(400, "Meals must contain valid meal categories");
    }
    if (requireAll && MEAL_NAMES.some((name) => !Object.hasOwn(meals, name))) {
        throw httpError(400, "Breakfast, lunch, snacks, and dinner are required");
    }

    const normalized = {};
    for (const category of categories) {
        const meal = meals[category];
        if (!meal || typeof meal !== "object" || Array.isArray(meal)) {
            throw httpError(400, `${category} must be a JSON object`);
        }

        const fields = Object.keys(meal);
        const unsupported = fields.find((field) => !MEAL_FIELDS.has(field));
        if (unsupported) throw httpError(400, `Unsupported ${category} field: ${unsupported}`);
        if (fields.length === 0) throw httpError(400, `${category} must contain at least one field`);

        const value = {};
        if (Object.hasOwn(meal, "items")) {
            if (!Array.isArray(meal.items) || meal.items.length > 50) {
                throw httpError(400, `${category} items must be an array of at most 50 strings`);
            }
            value.items = meal.items.map((item) => {
                if (typeof item !== "string" || !item.trim()) {
                    throw httpError(400, `${category} items cannot be blank`);
                }
                if (item.trim().length > 120) {
                    throw httpError(400, `${category} items must be 120 characters or fewer`);
                }
                return item.trim();
            });
        }

        for (const field of ["description", "servingTime"]) {
            if (!Object.hasOwn(meal, field)) continue;
            if (typeof meal[field] !== "string") {
                throw httpError(400, `${category} ${field} must be a string`);
            }
            const maxLength = field === "description" ? 500 : 100;
            if (meal[field].trim().length > maxLength) {
                throw httpError(400, `${category} ${field} must be ${maxLength} characters or fewer`);
            }
            value[field] = meal[field].trim();
        }

        normalized[category] = value;
    }

    return normalized;
}

/**
 * Requires a plain request object and rejects fields outside an allow-list.
 *
 * @param {*} value - Request data.
 * @param {string[]} allowed - Allowed top-level property names.
 * @returns {void}
 * @throws {Error} 400 for non-object or unsupported properties.
 * @name validateAllowedKeys
 * @description Requires a plain request object and rejects fields outside an allow-list.
 */
export function validateAllowedKeys(value, allowed) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw httpError(400, "A JSON object is required");
    }
    const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `Unsupported field: ${unexpected}`);
}
