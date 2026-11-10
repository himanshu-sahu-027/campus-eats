import mongoose from "mongoose";

/**
 * Trusted manager account schema. Manager records are provisioned only by the
 * seed script; passwords are excluded from normal queries and API responses.
 *
 * @property {string} fullName - Manager's display name.
 * @property {string} email - Unique, lowercase manager email.
 * @property {string} phone - Contact number.
 * @property {string} password - Hashed password; excluded from normal queries.
 * @property {number} tokenVersion - Incremented to revoke previously signed JWTs.
 * @property {"ACTIVE"|"INACTIVE"} status - Manager access status.
 * @property {Date} createdAt - Timestamp added by Mongoose.
 * @property {Date} updatedAt - Timestamp added by Mongoose.
 * @type {mongoose.Schema}
 */
const managerSchema = new mongoose.Schema(
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
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
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
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
            required: true,
        },
    },
    { timestamps: true, collection: "managers" },
);

managerSchema.index({ status: 1 });

const Manager = mongoose.model("Manager", managerSchema);
export default Manager;
