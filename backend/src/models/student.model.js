import mongoose from "mongoose";

/**
 * Authentication and account schema for students. Hostel-specific profile
 * fields live in StudentProfile and are exposed through the `profile` virtual.
 * Email is unique within this collection; services additionally check manager
 * emails because MongoDB cannot enforce uniqueness across collections.
 *
 * @property {string} fullName - Student's display name.
 * @property {string} email - Unique normalized student email.
 * @property {string} rollNumber - Unique uppercase student roll number.
 * @property {string} phone - Contact number.
 * @property {string} password - Hashed password, excluded by default.
 * @property {number} tokenVersion - Incremented to revoke previously signed JWTs.
 * @property {"PENDING"|"APPROVED"|"REJECTED"|"INACTIVE"} status - Account status.
 * @property {"SELF_REGISTERED"|"CREATED_BY_MANAGER"} registrationMethod - Account source.
 * @property {mongoose.Types.ObjectId|null} createdBy - Creating Manager reference.
 * @property {mongoose.Types.ObjectId|null} reviewedBy - Reviewing Manager reference.
 * @property {Date|null} reviewedAt - Review timestamp.
 * @property {string|null} rejectionReason - Manager rejection reason.
 * @property {Object|null} profile - Populated StudentProfile virtual.
 * @type {mongoose.Schema}
 */
const studentSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        rollNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: 50,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            match: /^\d{10}$/,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        /** Incremented by administrative password resets to revoke old JWTs. */
        tokenVersion: { type: Number, required: true, default: 0, min: 0 },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "INACTIVE"],
            default: "PENDING",
            required: true,
        },
        registrationMethod: {
            type: String,
            enum: ["SELF_REGISTERED", "CREATED_BY_MANAGER"],
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            default: null,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
    },
    { timestamps: true, collection: "students" },
);

studentSchema.index({ status: 1, createdAt: 1 });
studentSchema.index({ fullName: 1 });
studentSchema.index({ phone: 1 });
studentSchema.index({ registrationMethod: 1, createdAt: -1 });
studentSchema.virtual("profile", {
    ref: "StudentProfile",
    localField: "_id",
    foreignField: "studentId",
    justOne: true,
});
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

const Student = mongoose.model("Student", studentSchema);
export default Student;
