import Menu from "../models/menu.model.js";
import WeeklyMenu from "../models/weeklyMenu.model.js";
import { getCurrentISTDate, normalizeMenuDate } from "../utils/dateUtils.js";
import { httpError } from "../utils/httpError.js";

const WEEK_DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

/**
 * Resolves a calendar day's menu using the shared override-then-weekly rule.
 * Weekday lookup uses the explicit day name so stored array order cannot cause
 * today's meals to drift from the recurring template.
 *
 * @param {string} dateString - YYYY-MM-DD calendar date.
 * @returns {Promise<Object>} Resolved menu with date, weekday, meals, and source.
 */
export async function getMenuForDate(dateString) {
    const date = normalizeMenuDate(dateString);
    const dayOfWeek = WEEK_DAYS[date.getUTCDay()];
    const dateSpecific = await Menu.findOne({ date });
    if (dateSpecific) {
        const data = typeof dateSpecific.toObject === "function" ? dateSpecific.toObject() : dateSpecific;
        return { ...data, date, dayOfWeek, recurring: false, source: "DATE_SPECIFIC" };
    }

    const weeklyMenu = await WeeklyMenu.findOne({ key: "default" });
    const day = weeklyMenu?.days?.find((entry) => entry.dayOfWeek === dayOfWeek);
    if (!day) throw httpError(404, "No menu has been configured for this date.");
    return { date, dayOfWeek, meals: day.meals, recurring: true, source: "WEEKLY" };
}

/** Resolves today's menu using the Asia/Kolkata calendar date. */
export async function getResolvedTodayMenu(now = new Date()) {
    return getMenuForDate(getCurrentISTDate(now));
}
