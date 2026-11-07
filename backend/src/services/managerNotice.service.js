import Notice, { NOTICE_PRIORITIES } from "../models/notice.model.js";
import { httpError } from "../utils/httpError.js";
import { escapeSearch, paginationMetadata, paginationSkip, parsePagination } from "../utils/listQuery.js";
import { requiredString, validateObjectId } from "../utils/validation.js";

/**
 * Validates and trims a notice title, content, and optional priority.
 *
 * @param {Object} input - Notice fields supplied by a manager.
 * @param {string[]} allowed - Allowed keys for this operation.
 * @param {boolean} requireAll - Whether title and content are mandatory.
 * @returns {Object} Normalized permitted notice fields.
 * @throws {Error} 400 for invalid or unexpected values.
 * @name validateNoticeFields
 * @description Validates and trims a notice title, content, and optional priority.
 */
function validateNoticeFields(input, allowed, requireAll = false) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON object is required");
    }
    const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `${unexpected} cannot be changed here`);

    const fields = {};
    for (const [field, maxLength] of [["title", 150], ["content", 5000]]) {
        if (requireAll || Object.hasOwn(input, field)) {
            fields[field] = requiredString(input[field], field === "title" ? "Title" : "Content", { maxLength });
        }
    }
    if (requireAll || Object.hasOwn(input, "priority")) {
        const priority = input.priority ?? "NORMAL";
        if (!NOTICE_PRIORITIES.includes(priority)) {
            throw httpError(400, "Priority must be NORMAL, IMPORTANT, or URGENT");
        }
        fields.priority = priority;
    }
    return fields;
}

/**
 * Validates notice list filters and pagination.
 *
 * @param {Object} query - Express query parameters.
 * @param {boolean} studentView - Whether publication filtering is enforced.
 * @returns {Object} Normalized list options.
 * @throws {Error} 400 for invalid filters.
 * @name parseNoticeFilters
 * @description Validates notice list filters and pagination.
 */
function parseNoticeFilters(query, studentView = false) {
    const pagination = parsePagination(query);
    if (query.priority && !NOTICE_PRIORITIES.includes(query.priority)) {
        throw httpError(400, "Invalid notice priority");
    }
    if (query.sort && !["newest", "oldest"].includes(query.sort)) {
        throw httpError(400, "Sort must be newest or oldest");
    }
    if (query.search !== undefined && typeof query.search !== "string") {
        throw httpError(400, "Search must be a string");
    }
    const search = (query.search || "").trim();
    if (search.length > 200) throw httpError(400, "Search must be 200 characters or fewer");

    let isPublished;
    if (studentView) {
        isPublished = true;
    } else if (query.isPublished !== undefined) {
        if (!["true", "false"].includes(query.isPublished)) {
            throw httpError(400, "isPublished must be true or false");
        }
        isPublished = query.isPublished === "true";
    }

    return {
        ...pagination,
        priority: query.priority,
        search,
        sort: query.sort === "oldest" ? 1 : -1,
        isPublished,
    };
}

/**
 * Creates a draft notice owned and attributed to the authenticated manager.
 *
 * @param {Object} input - Title, content, and optional priority.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Created draft notice.
 * @throws {Error} 400 for invalid input.
 * @name createNotice
 * @description Creates a draft notice owned and attributed to the authenticated manager.
 */
export async function createNotice(input, managerId) {
    const fields = validateNoticeFields(input, ["title", "content", "priority"], true);
    const owner = validateObjectId(managerId);
    return Notice.create({
        ...fields,
        isPublished: false,
        publishedAt: null,
        createdBy: owner,
        updatedBy: owner,
    });
}

/**
 * Lists manager notices including drafts, with search, filters, and pagination.
 *
 * @param {Object} query - Search, filter, sort, and pagination parameters.
 * @returns {Promise<Object>} Notices and pagination metadata.
 * @throws {Error} 400 for malformed filters.
 * @name getAllNotices
 * @description Lists manager notices including drafts, with search, filters, and pagination.
 */
export async function getAllNotices(query) {
    const filters = parseNoticeFilters(query);
    const criteria = {};
    if (filters.priority) criteria.priority = filters.priority;
    if (filters.isPublished !== undefined) criteria.isPublished = filters.isPublished;
    if (filters.search) {
        const expression = new RegExp(escapeSearch(filters.search), "i");
        criteria.$or = [{ title: expression }, { content: expression }];
    }

    const [notices, totalRecords] = await Promise.all([
        Notice.find(criteria)
            .sort({ createdAt: filters.sort, _id: filters.sort })
            .skip(paginationSkip(filters.page, filters.limit))
            .limit(filters.limit),
        Notice.countDocuments(criteria),
    ]);

    return {
        notices,
        pagination: paginationMetadata(totalRecords, filters.page, filters.limit),
    };
}

/**
 * Retrieves a manager-visible notice, including drafts.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @returns {Promise<import("mongoose").Document>} Notice.
 * @throws {Error} 400 for malformed IDs; 404 if missing.
 * @name getNoticeById
 * @description Retrieves a manager-visible notice, including drafts.
 */
export async function getNoticeById(noticeId) {
    const id = validateObjectId(noticeId);
    const notice = await Notice.findById(id);
    if (!notice) throw httpError(404, "Notice not found");
    return notice;
}

/**
 * Edits only title, content, and priority, preserving publication metadata.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @param {Object} input - Partial title/content/priority update.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Updated notice.
 * @throws {Error} 400 for invalid fields; 404 when missing.
 * @name updateNotice
 * @description Edits only title, content, and priority, preserving publication metadata.
 */
export async function updateNotice(noticeId, input, managerId) {
    const id = validateObjectId(noticeId);
    const fields = validateNoticeFields(input, ["title", "content", "priority"]);
    if (Object.keys(fields).length === 0) throw httpError(400, "At least one field must be provided");
    const notice = await Notice.findById(id);
    if (!notice) throw httpError(404, "Notice not found");

    Object.assign(notice, fields);
    notice.updatedBy = validateObjectId(managerId);
    await notice.save();
    return notice;
}

/**
 * Publishes a notice, preserving its first publication timestamp.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Published notice.
 * @throws {Error} 400 for malformed IDs; 404 if missing.
 * @name publishNotice
 * @description Publishes a notice, preserving its first publication timestamp.
 */
export async function publishNotice(noticeId, managerId) {
    const id = validateObjectId(noticeId);
    const notice = await Notice.findById(id);
    if (!notice) throw httpError(404, "Notice not found");
    notice.isPublished = true;
    if (!notice.publishedAt) notice.publishedAt = new Date();
    notice.updatedBy = validateObjectId(managerId);
    await notice.save();
    return notice;
}

/**
 * Unpublishes a notice while retaining its publication history.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @param {string} managerId - Authenticated manager ObjectId.
 * @returns {Promise<import("mongoose").Document>} Unpublished notice.
 * @throws {Error} 400 for malformed IDs; 404 if missing.
 * @name unpublishNotice
 * @description Unpublishes a notice while retaining its publication history.
 */
export async function unpublishNotice(noticeId, managerId) {
    const id = validateObjectId(noticeId);
    const notice = await Notice.findById(id);
    if (!notice) throw httpError(404, "Notice not found");
    notice.isPublished = false;
    notice.updatedBy = validateObjectId(managerId);
    await notice.save();
    return notice;
}

/**
 * Deletes a manager-owned notice.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @returns {Promise<void>}
 * @throws {Error} 400 for malformed IDs; 404 if missing.
 * @name deleteNotice
 * @description Deletes a manager-owned notice.
 */
export async function deleteNotice(noticeId) {
    const id = validateObjectId(noticeId);
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) throw httpError(404, "Notice not found");
}

/**
 * Lists notices visible to students; drafts can never enter this query.
 *
 * @param {Object} query - Search, priority, sort, and pagination parameters.
 * @returns {Promise<Object>} Published notices and pagination metadata.
 * @throws {Error} 400 for malformed filters.
 * @name getPublishedNotices
 * @description Lists notices visible to students; drafts can never enter this query.
 */
export async function getPublishedNotices(query) {
    const filters = parseNoticeFilters(query, true);
    const criteria = { isPublished: true };
    if (filters.priority) criteria.priority = filters.priority;
    if (filters.search) {
        const expression = new RegExp(escapeSearch(filters.search), "i");
        criteria.$or = [{ title: expression }, { content: expression }];
    }

    const [notices, totalRecords] = await Promise.all([
        Notice.find(criteria)
            .sort({ publishedAt: filters.sort, _id: filters.sort })
            .skip(paginationSkip(filters.page, filters.limit))
            .limit(filters.limit)
            .select("-createdBy -updatedBy"),
        Notice.countDocuments(criteria),
    ]);

    return {
        notices,
        pagination: paginationMetadata(totalRecords, filters.page, filters.limit),
    };
}

/**
 * Retrieves only a published notice for an authenticated student.
 *
 * @param {string} noticeId - Notice ObjectId.
 * @returns {Promise<import("mongoose").Document>} Published notice without manager IDs.
 * @throws {Error} 400 for malformed ID; 404 when missing or unpublished.
 * @name getPublishedNoticeById
 * @description Retrieves only a published notice for an authenticated student.
 */
export async function getPublishedNoticeById(noticeId) {
    const id = validateObjectId(noticeId);
    const notice = await Notice.findOne({ _id: id, isPublished: true })
        .select("-createdBy -updatedBy");
    if (!notice) throw httpError(404, "Notice not found");
    return notice;
}
