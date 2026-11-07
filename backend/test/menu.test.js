import assert from "node:assert/strict";
import test from "node:test";
import Menu from "../src/models/menu.model.js";
import {
    compareMenuDates,
    getCurrentISTDate,
    getISTDateRange,
    normalizeMenuDate,
    validateDateString,
} from "../src/utils/dateUtils.js";
import { normalizeMeals } from "../src/utils/menuValidation.js";
import {
    createMenu,
    deleteMenu,
    getAllMenus,
    getMenuByDate,
    getUpcomingMenus,
    updateMenu,
} from "../src/services/managerMenu.service.js";
import {
    getMenuByDate as getStudentMenuByDate,
    getTodayMenu,
    getUpcomingMenus as getStudentUpcomingMenus,
} from "../src/services/studentMenu.service.js";

const MANAGER_ID = "507f1f77bcf86cd799439011";
const BASE_MEALS = {
    breakfast: { items: [" Idli "] },
    lunch: { items: ["Rice"] },
    snacks: { items: [] },
    dinner: { items: ["Roti"] },
};

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => {
        target[key] = original;
    };
}

test("validates calendar dates and normalizes to UTC midnight", () => {
    assert.equal(validateDateString("2024-02-29"), true);
    assert.equal(validateDateString("0004-02-29"), true);
    assert.equal(validateDateString("2026-02-30"), false);
    assert.equal(validateDateString("2026-2-03"), false);
    assert.equal(normalizeMenuDate("2026-11-01").toISOString(), "2026-11-01T00:00:00.000Z");
    assert.equal(normalizeMenuDate("0004-02-29").toISOString(), "0004-02-29T00:00:00.000Z");
    assert.equal(compareMenuDates("2026-12-31", "2027-01-01"), -1);
    assert.deepEqual(getISTDateRange("2026-01-31"), {
        start: new Date("2026-01-31T00:00:00.000Z"),
        end: new Date("2026-02-01T00:00:00.000Z"),
    });
});

test("calculates today's date at the exact IST midnight boundary", () => {
    assert.equal(getCurrentISTDate(new Date("2026-10-31T18:29:59.999Z")), "2026-10-31");
    assert.equal(getCurrentISTDate(new Date("2026-10-31T18:30:00.000Z")), "2026-11-01");
});

test("normalizes meals and rejects blank food items", () => {
    assert.deepEqual(normalizeMeals(BASE_MEALS, { requireAll: true }).breakfast.items, ["Idli"]);
    assert.throws(() => normalizeMeals({
        breakfast: { items: ["", "Sambar"] },
    }), { statusCode: 400 });
    assert.throws(() => normalizeMeals({
        breakfast: { items: ["Idli"], price: 20 },
    }), { statusCode: 400 });
});

test("menu schema requires normalized date, all meals, and manager references", async () => {
    const invalid = new Menu({ date: "2026-11-01" });
    await assert.rejects(invalid.validate());

    const valid = new Menu({
        date: normalizeMenuDate("2026-11-01"),
        meals: {
            breakfast: { items: [] },
            lunch: { items: ["Rice"] },
            snacks: { items: [] },
            dinner: { items: [] },
        },
        createdBy: MANAGER_ID,
        updatedBy: MANAGER_ID,
    });
    await assert.doesNotReject(valid.validate());
});

test("createMenu uses authenticated manager ownership and returns 409 on duplicate date", async (t) => {
    const restoreExists = replaceMethod(Menu, "exists", async () => null);
    let captured;
    const restoreCreate = replaceMethod(Menu, "create", async (document) => {
        captured = document;
        return document;
    });
    t.after(restoreExists);
    t.after(restoreCreate);

    const menu = await createMenu({ date: "2026-11-01", meals: BASE_MEALS }, MANAGER_ID);
    assert.equal(menu.createdBy, MANAGER_ID);
    assert.equal(menu.updatedBy, MANAGER_ID);
    assert.equal(menu.date.toISOString(), "2026-11-01T00:00:00.000Z");
    assert.deepEqual(captured.meals.breakfast.items, ["Idli"]);

    const restoreDuplicate = replaceMethod(Menu, "exists", async () => ({ _id: "duplicate" }));
    t.after(restoreDuplicate);
    await assert.rejects(
        createMenu({ date: "2026-11-01", meals: BASE_MEALS }, MANAGER_ID),
        { statusCode: 409 },
    );
});

test("listMenus validates filters and paginates at the query layer", async (t) => {
    let observedCriteria;
    let observedSkip;
    let observedLimit;
    const fakeQuery = {
        sort() { return this; },
        skip(value) { observedSkip = value; return this; },
        limit(value) { observedLimit = value; return Promise.resolve([]); },
    };
    const restoreFind = replaceMethod(Menu, "find", (criteria) => {
        observedCriteria = criteria;
        return fakeQuery;
    });
    const restoreCount = replaceMethod(Menu, "countDocuments", async () => 0);
    t.after(restoreFind);
    t.after(restoreCount);

    const result = await getAllMenus({
        page: "2",
        limit: "5",
        startDate: "2026-02-28",
        endDate: "2026-03-01",
    });
    assert.equal(observedSkip, 5);
    assert.equal(observedLimit, 5);
    assert.deepEqual(observedCriteria.date, {
        $gte: new Date("2026-02-28T00:00:00.000Z"),
        $lt: new Date("2026-03-02T00:00:00.000Z"),
    });
    assert.deepEqual(result.pagination, {
        totalRecords: 0,
        currentPage: 2,
        totalPages: 0,
        limit: 5,
    });
    await assert.rejects(getAllMenus({ page: "0" }), { statusCode: 400 });
    await assert.rejects(getAllMenus({ startDate: "2026-03-02", endDate: "2026-03-01" }), { statusCode: 400 });
});

test("updateMenu changes meal fields and manager attribution without changing date or creator", async (t) => {
    const updates = [];
    const menu = {
        _id: MANAGER_ID,
        set(path, value) { updates.push([path, value]); },
        async save() {},
    };
    const restoreFind = replaceMethod(Menu, "findById", async () => menu);
    t.after(restoreFind);

    await updateMenu(MANAGER_ID, {
        meals: { breakfast: { items: ["Poha"], description: "Morning meal" } },
    }, "507f1f77bcf86cd799439012");
    assert.deepEqual(updates, [
        ["meals.breakfast.items", ["Poha"]],
        ["meals.breakfast.description", "Morning meal"],
    ]);
    assert.equal(menu.updatedBy, "507f1f77bcf86cd799439012");
    await assert.rejects(updateMenu(MANAGER_ID, { date: "2026-11-02" }, MANAGER_ID), { statusCode: 400 });
});

test("date lookup validates dates and returns 404 when no menu is published", async (t) => {
    const observed = [];
    const restoreFindOne = replaceMethod(Menu, "findOne", async (criteria) => {
        observed.push(criteria);
        return null;
    });
    t.after(restoreFindOne);

    await assert.rejects(getMenuByDate("2026-02-30"), { statusCode: 400 });
    await assert.rejects(getMenuByDate("2026-11-01"), { statusCode: 404 });
    await assert.rejects(getStudentMenuByDate("2026-11-01"), { statusCode: 404 });
    assert.equal(observed[0].date.toISOString(), "2026-11-01T00:00:00.000Z");
});

test("today's student lookup uses the IST calendar date", async (t) => {
    let observed;
    const restoreFindOne = replaceMethod(Menu, "findOne", async (criteria) => {
        observed = criteria;
        return { date: criteria.date };
    });
    t.after(restoreFindOne);

    const menu = await getTodayMenu();
    assert.equal(menu.date.toISOString(), observed.date.toISOString());
    assert.equal(observed.date.getUTCHours(), 0);
});

test("upcoming queries include today, sort/paginate, and are shared for reads only", async (t) => {
    let criteria;
    let sortCriteria;
    const fakeQuery = {
        sort(value) { sortCriteria = value; return this; },
        skip() { return this; },
        limit() { return Promise.resolve([]); },
    };
    const restoreFind = replaceMethod(Menu, "find", (value) => {
        criteria = value;
        return fakeQuery;
    });
    const restoreCount = replaceMethod(Menu, "countDocuments", async () => 0);
    t.after(restoreFind);
    t.after(restoreCount);

    const managerResult = await getUpcomingMenus({ page: "1", limit: "10" });
    const studentResult = await getStudentUpcomingMenus({ page: "1", limit: "10" });
    assert.equal(criteria.date.$gte.getUTCHours(), 0);
    assert.deepEqual(sortCriteria, { date: 1 });
    assert.equal(managerResult.pagination.totalPages, 0);
    assert.equal(studentResult.pagination.totalRecords, 0);
});

test("deleteMenu validates IDs and returns 404 for missing menus", async (t) => {
    const restoreDelete = replaceMethod(Menu, "findByIdAndDelete", async () => null);
    t.after(restoreDelete);
    await assert.rejects(deleteMenu("not-an-id"), { statusCode: 400 });
    await assert.rejects(deleteMenu(MANAGER_ID), { statusCode: 404 });
});
