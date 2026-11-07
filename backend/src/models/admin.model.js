import mongoose from "mongoose";
const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", required: true },
}, { timestamps: true, collection: "admins" });
export default mongoose.model("Admin", adminSchema);
