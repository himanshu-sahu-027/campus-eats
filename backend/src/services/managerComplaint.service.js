import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from "../models/complaint.model.js";
import { httpError } from "../utils/httpError.js";
import { escapeSearch, paginationMetadata, paginationSkip, parsePagination } from "../utils/listQuery.js";
import { requiredString, validateObjectId } from "../utils/validation.js";

/**
 * Validates manager complaint filters and sort direction.
 *
 * @param {Object} query - Express query parameters.
 * @returns {Object} Validated pagination, filter, search and sort values.
 * @name parseManagerFilters
 * @description Validates manager complaint filters and sort direction.
 */
function parseManagerFilters(query) {
    const pagination = parsePagination(query);
    if (query.status && !COMPLAINT_STATUSES.includes(query.status)) {
        throw httpError(400, "Invalid complaint status");
    }
    if (query.category && !COMPLAINT_CATEGORIES.includes(query.category)) {
        throw httpError(400, "Invalid complaint category");
    }
    if (query.sort && !["newest", "oldest"].includes(query.sort)) {
        throw httpError(400, "Sort must be newest or oldest");
    }
    if (query.search !== undefined && typeof query.search !== "string") {
        throw httpError(400, "Search must be a string");
    }
    const search = (query.search || "").trim();
    if (search.length > 150) throw httpError(400, "Search must be 150 characters or fewer");

    return {
        ...pagination,
        status: query.status,
        category: query.category,
        search,
        sort: query.sort === "oldest" ? 1 : -1,
    };
}

/**
 * Retrieves manager complaint pages, including safe student identity fields.
 *
 * Aggregation joins only Student name, roll number, email, and phone. Search
 * runs in MongoDB across complaint text and those student identity fields.
 *
 * @param {Object} query - Filters, search, sort, and pagination.
 * @returns {Promise<Object>} Complaint list and pagination metadata.
 * @throws {Error} 400 for invalid filters, sort, or pagination.
 * @name getAllComplaints
 * @description Retrieves manager complaint pages, including safe student identity fields.
 */
export async function getAllComplaints(query) {
    const filters = parseManagerFilters(query);
    const match = {};
    if (filters.status) match.status = filters.status;
    if (filters.category) match.category = filters.category;
    const pipeline = [{ $match: match }];

    pipeline.push(
        {
            $lookup: {
                from: "students",
                let: { studentId: "$studentId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$studentId"] } } },
                    { $project: { _id: 1, fullName: 1, rollNumber: 1, email: 1, phone: 1 } },
                ],
                as: "student",
            },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    );

    if (filters.search) {
        const pattern = new RegExp(escapeSearch(filters.search), "i");
        pipeline.push({
            $match: {
                $or: [
                    { subject: pattern },
                    { description: pattern },
                    { "student.fullName": pattern },
                    { "student.rollNumber": pattern },
                ],
            },
        });
    }

    const skip = paginationSkip(filters.page, filters.limit);
    pipeline.push({
        $facet: {
            records: [
                { $sort: { createdAt: filters.sort, _id: filters.sort } },
                { $skip: skip },
                { $limit: filters.limit },
                {
                    $project: {
                        studentId: 1,
                        subject: 1,
                        description: 1,
                        category: 1,
                        status: 1,
                        adminRemark: 1,
                        resolvedAt: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        student: 1,
                    },
                },
            ],
            metadata: [{ $count: "totalRecords" }],
        },
    });

    const [result = { records: [], metadata: [] }] = await Complaint.aggregate(pipeline);
    const totalRecords = result.metadata[0]?.totalRecords || 0;
    return {
        complaints: result.records,
        pagination: paginationMetadata(totalRecords, filters.page, filters.limit),
    };
}

/**
 * Retrieves a complaint and minimal student identity information.
 *
 * @param {string} complaintId - Complaint ObjectId.
 * @returns {Promise<import("mongoose").Document>} Complaint with safe student fields.
 * @throws {Error} 400 for malformed ID; 404 if missing.
 * @name getComplaintById
 * @description Retrieves a complaint and minimal student identity information.
 */
export async function getComplaintById(complaintId) {
    const id = validateObjectId(complaintId);
    const complaint = await Complaint.findById(id).populate(
        "studentId",
        "fullName rollNumber email phone",
    );
    if (!complaint) throw httpError(404, "Complaint not found");
    return complaint;
}

/**
 * Updates complaint workflow status and optional manager remark.
 *
 * resolvedAt is set on resolution and cleared whenever a complaint is reopened.
 *
 * @param {string} complaintId - Complaint ObjectId.
 * @param {Object} input - Status and optional adminRemark only.
 * @returns {Promise<Object>} Updated complaint with safe student details.
 * @throws {Error} 400 for invalid fields/values; 404 when missing.
 * @name updateComplaintStatus
 * @description Updates complaint workflow status and optional manager remark.
 */
export async function updateComplaintStatus(complaintId, input) {
    const id = validateObjectId(complaintId);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON object is required");
    }
    const keys = Object.keys(input);
    const unexpected = keys.find((key) => !["status", "adminRemark"].includes(key));
    if (unexpected) throw httpError(400, `${unexpected} cannot be updated here`);
    if (!COMPLAINT_STATUSES.includes(input.status)) {
        throw httpError(400, "A valid complaint status is required");
    }

    // Keep the original resolution time when an already-resolved complaint is
    // edited again. Read first so a remark-only edit also preserves it.
    const current = await Complaint.findById(id);
    if (!current) throw httpError(404, "Complaint not found");
    const update = { status: input.status };
    if (input.status === "RESOLVED") {
        update.resolvedAt = current.status === "RESOLVED" && current.resolvedAt
            ? current.resolvedAt
            : new Date();
    } else if (current.status === "RESOLVED") {
        update.resolvedAt = null;
    }
    if (Object.hasOwn(input, "adminRemark")) {
        if (typeof input.adminRemark !== "string" || input.adminRemark.trim().length > 2000) {
            throw httpError(400, "Admin remark must be a string of 2000 characters or fewer");
        }
        update.adminRemark = input.adminRemark.trim();
    }

    const updated = await Complaint.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true },
    );
    if (!updated) throw httpError(404, "Complaint not found");
    return getComplaintById(updated._id.toString());
}
