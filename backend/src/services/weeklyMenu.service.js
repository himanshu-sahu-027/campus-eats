import WeeklyMenu from "../models/weeklyMenu.model.js";
import { httpError } from "../utils/httpError.js";
import { MEAL_NAMES, normalizeMeals, validateAllowedKeys } from "../utils/menuValidation.js";
import { validateObjectId } from "../utils/validation.js";

export const WEEK_DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function normalizeDays(days) {
    if (!Array.isArray(days) || days.length !== 7) throw httpError(400, "Weekly menu must include seven days");
    const mapped = new Map();
    for (const entry of days) {
        validateAllowedKeys(entry, ["dayOfWeek", "meals"]);
        if (!WEEK_DAYS.includes(entry.dayOfWeek) || mapped.has(entry.dayOfWeek)) throw httpError(400, "Each weekday must appear exactly once");
        const normalized = normalizeMeals(entry.meals, { requireAll: true });
        mapped.set(entry.dayOfWeek, Object.fromEntries(MEAL_NAMES.map((name) => [name, { items: [], ...normalized[name] }])));
    }
    return WEEK_DAYS.map((dayOfWeek) => ({ dayOfWeek, meals: mapped.get(dayOfWeek) }));
}

export async function getWeeklyMenu() {
    return WeeklyMenu.findOne({ key: "default" });
}

export async function updateWeeklyMenu(input, managerId) {
    validateAllowedKeys(input, ["days"]);
    const days = normalizeDays(input.days);
    const updatedBy = validateObjectId(managerId);
    let menu = await WeeklyMenu.findOne({ key: "default" });
    if (!menu) menu = new WeeklyMenu({ key: "default", days, createdBy: updatedBy, updatedBy });
    else { menu.days = days; menu.updatedBy = updatedBy; }
    await menu.save();
    return menu;
}
