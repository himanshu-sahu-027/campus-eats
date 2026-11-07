import mongoose from "mongoose";

const COMPLAINT_CATEGORIES = [
    "FOOD_QUALITY",
    "CLEANLINESS",
    "WATER_SUPPLY",
    "STAFF_BEHAVIOUR",
    "INFRASTRUCTURE",
    "OTHER",
];
const COMPLAINT_STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED"];

/**
 * Stores a complaint submitted by one Student, without embedding account data.
 *
 * The studentId reference supports secure student ownership queries; indexes
 * cover student history, manager status/category filters, and newest-first sort.
 *
 * @type {mongoose.Schema}
 */
const complaintSchema = new mongoose.Schema(
    {
        /** Student who filed the complaint; derived from authenticated request. */
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        /** Short complaint title. */
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        /** Full complaint description. */
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        /** Complaint category selected from the supported list. */
        category: {
            type: String,
            required: true,
            enum: COMPLAINT_CATEGORIES,
        },
        /** Manager-controlled workflow status. */
        status: {
            type: String,
            required: true,
            enum: COMPLAINT_STATUSES,
            default: "PENDING",
        },
        /** Optional response entered by a manager. */
        adminRemark: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        /** Set while status is RESOLVED and cleared when reopened. */
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, collection: "complaints" },
);

complaintSchema.index({ studentId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);
export { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES };
export default Complaint;
