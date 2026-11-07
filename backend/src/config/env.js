import "dotenv/config";

/**
 * Normalized application settings sourced from environment variables.
 *
 * @type {{
 *   PORT: string|number,
 *   MONGO_URI: string,
 *   MONGO_DB_NAME: string|undefined,
 *   JWT_SECRET: string,
 *   FRONTEND_URL: string,
 *   RAZORPAY_KEY_ID: string|undefined,
 *   RAZORPAY_KEY_SECRET: string|undefined,
 *   NODE_ENV: string,
 *   COOKIE_SAME_SITE: string
 * }}
 */
export const envConfig = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    MONGO_DB_NAME: process.env.MONGO_DB_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development",
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "lax",
};

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
    }
}

if (!["lax", "strict", "none"].includes(envConfig.COOKIE_SAME_SITE.toLowerCase())) {
    throw new Error("COOKIE_SAME_SITE must be lax, strict, or none");
}
envConfig.COOKIE_SAME_SITE = envConfig.COOKIE_SAME_SITE.toLowerCase();

if (envConfig.COOKIE_SAME_SITE === "none" && envConfig.NODE_ENV !== "production") {
    throw new Error("COOKIE_SAME_SITE=none requires NODE_ENV=production");
}
