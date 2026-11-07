import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectToDB from "../src/config/db.js";
import { envConfig } from "../src/config/env.js";
import Admin from "../src/models/admin.model.js";
import Manager from "../src/models/manager.model.js";
import Student from "../src/models/student.model.js";
import { normalizeEmail, requiredString, validatePassword } from "../src/utils/validation.js";

try {
    if (!envConfig.MONGO_URI) throw new Error("MONGO_URI is required");
    const fullName = requiredString(process.env.ADMIN_NAME, "ADMIN_NAME", { maxLength: 120 });
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const password = validatePassword(process.env.ADMIN_PASSWORD);
    await connectToDB();
    if (await Admin.exists({ email })) console.log("Admin already exists; no account was created.");
    else {
        const [manager, student] = await Promise.all([Manager.exists({ email }), Student.exists({ email })]);
        if (manager || student) throw new Error("Configured admin email is already used by another account");
        await Admin.create({ fullName, email, password: await bcrypt.hash(password, 12), status: "ACTIVE" });
        console.log("Admin account created successfully.");
    }
} catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
} finally { await mongoose.disconnect(); }
