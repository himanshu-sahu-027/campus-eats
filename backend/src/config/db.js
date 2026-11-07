import mongoose from "mongoose";
import { envConfig } from "./env.js";

/**
 * Opens the configured MongoDB connection, optionally selecting a database.
 *
 * @name connectToDB
 * @description Connects Mongoose to the application's configured database.
 * @returns {Promise<void>} Resolves when the database connection is ready.
 * @throws {Error} When MongoDB cannot be reached with the configured settings.
 */
const connectToDB = async () => {
    await mongoose.connect(envConfig.MONGO_URI, {
        ...(envConfig.MONGO_DB_NAME ? { dbName: envConfig.MONGO_DB_NAME } : {}),
    });
    console.log("MongoDB Connected Successfully");
};

export default connectToDB;