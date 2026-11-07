import mongoose from "mongoose";
import Student from "../models/student.model.js";
import StudentProfile from "../models/studentProfile.model.js";

/**
 * Determines whether MongoDB rejected transactions because this deployment
 * does not support them (for example, a standalone development server).
 *
 * @param {Error} error - Transaction failure.
 * @returns {boolean} True only for unsupported-transaction errors.
 * @name transactionsUnavailable
 * @description Determines whether MongoDB rejected transactions because this deployment
 */
function transactionsUnavailable(error) {
    return error.code === 20
        || /transaction numbers are only allowed|does not support transactions/i.test(error.message);
}

/**
 * Creates a student and its one-to-one profile without leaving an orphan.
 *
 * It prefers a MongoDB transaction. If the deployment does not support
 * transactions, it falls back to sequential writes and removes the Student
 * document if profile creation fails.
 *
 * @param {Object} studentData - Validated Student fields, including hashed password.
 * @param {Object} [profileData={}] - Validated StudentProfile fields.
 * @returns {Promise<{student: mongoose.Document, profile: mongoose.Document}>}
 * @throws {Error} Re-throws validation, duplicate-key, and database failures.
 * @name createStudentWithProfile
 * @description Creates a student and its one-to-one profile without leaving an orphan.
 */
export async function createStudentWithProfile(studentData, profileData = {}) {
    const session = await mongoose.startSession();
    try {
        let created;
        try {
            await session.withTransaction(async () => {
                const [student] = await Student.create([studentData], { session });
                const [profile] = await StudentProfile.create(
                    [{ studentId: student._id, ...profileData }],
                    { session },
                );
                created = { student, profile };
            });
            return created;
        } catch (error) {
            if (!transactionsUnavailable(error)) {
                throw error;
            }
        }
    } finally {
        await session.endSession();
    }

    const student = await Student.create(studentData);
    try {
        const profile = await StudentProfile.create({
            studentId: student._id,
            ...profileData,
        });
        return { student, profile };
    } catch (error) {
        try {
            await Student.deleteOne({ _id: student._id });
        } catch (cleanupError) {
            error.cleanupError = cleanupError;
        }
        throw error;
    }
}
