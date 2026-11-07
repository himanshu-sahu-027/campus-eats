import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from "../models/complaint.model.js";
import { httpError } from "../utils/httpError.js";
import { paginationMetadata, paginationSkip, parsePagination } from "../utils/listQuery.js";
import { requiredString, validateObjectId } from "../utils/validation.js";

/**
 * Validates optional student complaint list filters.
 *
 * @param {Object} query - Request query parameters.
 * @returns {{page:number, limit:number, status?:string, category?:string, sort:1|-1}}
 * @name parseStudentFilters
 * @description Validates optional student complaint list filters.
 */
function parseStudentFilters(query) {
    const { page, limit } = parsePagination(query);
    if (query.status && !COMPLAINT_STATUSES.includes(query.status)) {
        throw httpError(400, "Invalid complaint status");
    }
    if (query.category && !COMPLAINT_CATEGORIES.includes(query.category)) {
        throw httpError(400, "Invalid complaint category");
    }
    if (query.sort && !["newest", "oldest"].includes(query.sort)) {
        throw httpError(400, "Sort must be newest or oldest");
    }

    return {
        page,
        limit,
        status: query.status,
        category: query.category,
        sort: query.sort === "oldest" ? 1 : -1,
    };
}

/**
 * Creates a complaint for the authenticated student only.
 *
 * Student ownership and initial status are assigned by the service; callers
 * cannot submit studentId, status, remarks, or resolution metadata.
 *
 * @param {Object} input - Subject, description, and category.
 * @param {string} studentId - Authenticated student ObjectId.
 * @returns {Promise<import("mongoose").Document>} New pending complaint.
 * @throws {Error} 400 for invalid/unsupported fields.
 * @name submitComplaint
 * @description Creates a complaint for the authenticated student only.
 */
export async function submitComplaint(input, studentId) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw httpError(400, "A JSON object is required");
    }
    const allowed = ["subject", "description", "category"];
    const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
    if (unexpected) throw httpError(400, `${unexpected} cannot be specified by students`);

    const subject = requiredString(input.subject, "Subject", { maxLength: 150 });
    const description = requiredString(input.description, "Description", { maxLength: 3000 });
    if (!COMPLAINT_CATEGORIES.includes(input.category)) {
        throw httpError(400, "A valid complaint category is required");
    }

    return Complaint.create({
        studentId: validateObjectId(studentId),
        subject,
        description,
        category: input.category,
        status: "PENDING",
        adminRemark: "",
        resolvedAt: null,
    });
}

/**
 * Lists complaints owned by the authenticated student with filters and paging.
 *
 * The owner filter is mandatory and derived from the verified session, never
 * from client-supplied query parameters.
 *
 * @param {string} studentId - Authenticated student ObjectId.
 * @param {Object} query - Pagination and optional status/category/sort.
 * @returns {Promise<Object>} Complaint records and pagination metadata.
 * @throws {Error} 400 for invalid filters, sort, or pagination.
 * @name getStudentComplaints
 * @description Lists complaints owned by the authenticated student with filters and paging.
 */
export async function getStudentComplaints(studentId, query) {
    const id = validateObjectId(studentId);
    const filters = parseStudentFilters(query);
    const criteria = { studentId: id };
    if (filters.status) criteria.status = filters.status;
    if (filters.category) criteria.category = filters.category;

    const [complaints, totalRecords] = await Promise.all([
        Complaint.find(criteria)
            .sort({ createdAt: filters.sort, _id: filters.sort })
            .skip(paginationSkip(filters.page, filters.limit))
            .limit(filters.limit),
        Complaint.countDocuments(criteria),
    ]);

    return {
        complaints,
        pagination: paginationMetadata(totalRecords, filters.page, filters.limit),
    };
}

/**
 * Retrieves a complaint only when it belongs to the authenticated student.
 *
 * @param {string} complaintId - Complaint ObjectId.
 * @param {string} studentId - Authenticated student ObjectId.
 * @returns {Promise<import("mongoose").Document>} Owned complaint.
 * @throws {Error} 400 for malformed IDs; 404 if missing or not owned.
 * @name getStudentComplaintById
 * @description Retrieves a complaint only when it belongs to the authenticated student.
 */
export async function getStudentComplaintById(complaintId, studentId) {
    const id = validateObjectId(complaintId);
    const ownerId = validateObjectId(studentId);
    const complaint = await Complaint.findOne({ _id: id, studentId: ownerId });
    if (!complaint) throw httpError(404, "Complaint not found");
    return complaint;
}
