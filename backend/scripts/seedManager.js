import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectToDB from "../src/config/db.js";
import { envConfig } from "../src/config/env.js";
import Manager from "../src/models/manager.model.js";
import Student from "../src/models/student.model.js";
import {
    normalizeEmail,
    normalizePhone,
    requiredString,
    validatePassword,
} from "../src/utils/validation.js";

const PASSWORD_ROUNDS = 12;

async function seedManager() {
    const fullName = requiredString(process.env.MANAGER_NAME, "MANAGER_NAME", { maxLength: 120 });
    const email = normalizeEmail(process.env.MANAGER_EMAIL);
    const phone = normalizePhone(process.env.MANAGER_PHONE);
    const password = validatePassword(process.env.MANAGER_PASSWORD);

    await connectToDB();

    const existingManager = await Manager.exists({ email });
    if (existingManager) {
        console.log("Manager already exists; no account was created.");
        return;
    }

    if (await Student.exists({ email })) {
        throw new Error("The configured manager email is already used by a student account");
    }

    await Manager.create({
        fullName,
        email,
        phone,
        password: await bcrypt.hash(password, PASSWORD_ROUNDS),
        status: "ACTIVE",
    });
    console.log("Manager account created successfully.");
}

try {
    if (!envConfig.MONGO_URI) {
        throw new Error("MONGO_URI is required");
    }
    await seedManager();
} catch (error) {
    console.error("Manager seed failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
