import assert from "node:assert/strict";
import test from "node:test";
import Complaint from "../src/models/complaint.model.js";
import Notice from "../src/models/notice.model.js";
import {
    getAllComplaints,
    updateComplaintStatus,
} from "../src/services/managerComplaint.service.js";
import {
    getPublishedNotices,
    publishNotice,
    unpublishNotice,
} from "../src/services/managerNotice.service.js";
import {
    getStudentComplaintById,
    getStudentComplaints,
    submitComplaint,
} from "../src/services/studentComplaint.service.js";

const STUDENT_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = "507f1f77bcf86cd799439012";
const COMPLAINT_ID = "507f1f77bcf86cd799439013";
const MANAGER_ID = "507f1f77bcf86cd799439014";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/mess_management_test";
process.env.JWT_SECRET ||= "unit-test-secret";
process.env.FRONTEND_URL ||= "http://localhost:5173";
const { default: app } = await import("../src/app.js");

function replaceMethod(target, key, replacement) {
    const original = target[key];
    target[key] = replacement;
    return () => { target[key] = original; };
}

test("complaint and notice schemas validate required fields and defaults", async () => {
    const invalidComplaint = new Complaint({});
    await assert.rejects(invalidComplaint.validate());

    const complaint = new Complaint({
        studentId: STUDENT_ID,
        subject: "Meal issue",
        description: "The meal was cold.",
        category: "FOOD_QUALITY",
    });
    await assert.doesNotReject(complaint.validate());
    assert.equal(complaint.status, "PENDING");
    assert.equal(complaint.resolvedAt, null);

    const invalidNotice = new Notice({});
    await assert.rejects(invalidNotice.validate());
    const notice = new Notice({
        title: "Dining hall update",
        content: "Hours are changing.",
        createdBy: MANAGER_ID,
        updatedBy: MANAGER_ID,
    });
    await assert.doesNotReject(notice.validate());
    assert.equal(notice.priority, "NORMAL");
    assert.equal(notice.isPublished, false);
    assert.equal(notice.publishedAt, null);
});

test("student complaint creation enforces authenticated ownership and blocks manager fields", async (t) => {
    let captured;
    const restoreCreate = replaceMethod(Complaint, "create", async (document) => {
        captured = document;
        return document;
    });
    t.after(restoreCreate);

    const result = await submitComplaint({
        subject: "Water supply",
        description: "Water was unavailable at dinner.",
        category: "WATER_SUPPLY",
    }, STUDENT_ID);
    assert.equal(result.studentId, STUDENT_ID);
    assert.equal(captured.status, "PENDING");
    assert.equal(captured.adminRemark, "");
    assert.equal(captured.resolvedAt, null);

    await assert.rejects(
        submitComplaint({
            subject: "Injected owner",
            description: "Attempt to assign another student.",
            category: "OTHER",
            studentId: OTHER_ID,
        }, STUDENT_ID),
        { statusCode: 400 },
    );
    await assert.rejects(
        submitComplaint({
            subject: "Injected status",
            description: "Attempt to resolve my own complaint.",
            category: "OTHER",
            status: "RESOLVED",
        }, STUDENT_ID),
        { statusCode: 400 },
    );
});

test("student complaint listing and detail queries always scope records to the session student", async (t) => {
    let listCriteria;
    let detailCriteria;
    const query = {
        sort() { return this; },
        skip() { return this; },
        limit() { return Promise.resolve([]); },
    };
    const restoreFind = replaceMethod(Complaint, "find", (criteria) => {
        listCriteria = criteria;
        return query;
    });
    const restoreCount = replaceMethod(Complaint, "countDocuments", async () => 0);
    const restoreFindOne = replaceMethod(Complaint, "findOne", async (criteria) => {
        detailCriteria = criteria;
        return null;
    });
    t.after(restoreFind);
    t.after(restoreCount);
    t.after(restoreFindOne);

    await getStudentComplaints(STUDENT_ID, { studentId: OTHER_ID, status: "PENDING" });
    assert.equal(listCriteria.studentId.toString(), STUDENT_ID);
    assert.equal(listCriteria.status, "PENDING");
    await assert.rejects(getStudentComplaintById(COMPLAINT_ID, STUDENT_ID), { statusCode: 404 });
    assert.equal(detailCriteria._id.toString(), COMPLAINT_ID);
    assert.equal(detailCriteria.studentId.toString(), STUDENT_ID);
});

test("manager complaint search matches complaint text and safe joined student fields", async (t) => {
    let pipeline;
    const restoreAggregate = replaceMethod(Complaint, "aggregate", async (value) => {
        pipeline = value;
        return [{ records: [], metadata: [{ totalRecords: 0 }] }];
    });
    t.after(restoreAggregate);

    const result = await getAllComplaints({ search: "roll.*", status: "PENDING" });
    assert.equal(result.pagination.totalRecords, 0);
    assert.equal(pipeline[0].$match.status, "PENDING");
    const lookup = pipeline.find((stage) => stage.$lookup);
    assert.deepEqual(lookup.$lookup.pipeline[1].$project, {
        _id: 1, fullName: 1, rollNumber: 1, email: 1, phone: 1,
    });
    const search = pipeline.find((stage) => stage.$match?.$or);
    assert.equal(search.$match.$or.length, 4);
    assert.equal(search.$match.$or[3]["student.rollNumber"].source, "roll\\.\\*");
});

test("manager status updates set resolution timestamp and reject unsupported fields", async (t) => {
    const updates = [];
    const restoreFindAndUpdate = replaceMethod(Complaint, "findByIdAndUpdate", async (_id, update) => {
        updates.push(update.$set);
        return { _id: COMPLAINT_ID };
    });
    const restoreFindById = replaceMethod(Complaint, "findById", () => ({
        populate: async () => ({ _id: COMPLAINT_ID, status: updates.at(-1).status }),
    }));
    t.after(restoreFindAndUpdate);
    t.after(restoreFindById);

    await updateComplaintStatus(COMPLAINT_ID, { status: "RESOLVED", adminRemark: "Fixed." });
    assert.ok(updates[0].resolvedAt instanceof Date);
    assert.equal(updates[0].adminRemark, "Fixed.");
    await updateComplaintStatus(COMPLAINT_ID, { status: "IN_PROGRESS" });
    assert.equal(updates[1].resolvedAt, null);
    await assert.rejects(
        updateComplaintStatus(COMPLAINT_ID, { status: "RESOLVED", studentId: OTHER_ID }),
        { statusCode: 400 },
    );
});

test("student published-notice queries exclude drafts and escape search terms", async (t) => {
    let criteria;
    let projectedFields;
    const query = {
        sort() { return this; },
        skip() { return this; },
        limit() { return this; },
        select(value) { projectedFields = value; return Promise.resolve([]); },
    };
    const restoreFind = replaceMethod(Notice, "find", (value) => { criteria = value; return query; });
    const restoreCount = replaceMethod(Notice, "countDocuments", async (value) => {
        assert.deepEqual(value, criteria);
        return 0;
    });
    t.after(restoreFind);
    t.after(restoreCount);

    await getPublishedNotices({ search: "alert.*" });
    assert.equal(criteria.isPublished, true);
    assert.equal(criteria.$or[0].title.source, "alert\\.\\*");
    assert.equal(projectedFields, "-createdBy -updatedBy");
});

test("publishing preserves first publication date and unpublishing keeps history", async (t) => {
    const publishedAt = new Date("2026-03-12T10:00:00.000Z");
    const notice = {
        isPublished: false,
        publishedAt,
        async save() {},
    };
    const restoreFindById = replaceMethod(Notice, "findById", async () => notice);
    t.after(restoreFindById);

    const published = await publishNotice(COMPLAINT_ID, MANAGER_ID);
    assert.equal(published.isPublished, true);
    assert.equal(published.publishedAt, publishedAt);
    const unpublished = await unpublishNotice(COMPLAINT_ID, MANAGER_ID);
    assert.equal(unpublished.isPublished, false);
    assert.equal(unpublished.publishedAt, publishedAt);
});

test("complaint and notice API namespaces require their corresponding login", async (t) => {
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    t.after(async () => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    for (const path of [
        "/api/v1/student/complaints",
        "/api/v1/manager/complaints",
        "/api/v1/student/notices",
        "/api/v1/manager/notices",
    ]) {
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        assert.equal(response.status, 401, `${path} must require authentication`);
    }
});
