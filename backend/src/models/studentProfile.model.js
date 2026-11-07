import mongoose from "mongoose";

/**
 * Stores optional hostel profile data separately from student credentials.
 *
 * A profile belongs to exactly one Student through `studentId`; the unique
 * constraint enforces the one-to-one relationship at the database level.
 *
 * @type {mongoose.Schema}
 */
const studentProfileSchema = new mongoose.Schema(
    {
        /** The Student document this profile extends. */
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            unique: true,
        },
        /** Optional hostel room assignment. */
        roomNumber: {
            type: String,
            trim: true,
            maxlength: 50,
            default: null,
        },
    },
    { timestamps: true, collection: "studentProfiles" },
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
