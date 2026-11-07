import Razorpay from "razorpay";
import { envConfig } from "./env.js";
import { httpError } from "../utils/httpError.js";

let client;

/**
 * Returns a lazily configured Razorpay SDK client.
 *
 * Credentials are read only from RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET;
 * missing credentials fail the requested gateway operation without preventing
 * unrelated application features from starting. The secret is never returned.
 *
 * @returns {Razorpay} Configured server-side SDK client.
 * @throws {Error} 503 when either configured Razorpay credential is missing.
 * @name getRazorpayClient
 * @description Returns a lazily configured Razorpay SDK client.
 */
export function getRazorpayClient() {
    if (!envConfig.RAZORPAY_KEY_ID || !envConfig.RAZORPAY_KEY_SECRET) {
        throw httpError(503, "Razorpay payments are not configured");
    }
    if (!client) {
        client = new Razorpay({
            key_id: envConfig.RAZORPAY_KEY_ID,
            key_secret: envConfig.RAZORPAY_KEY_SECRET,
        });
    }
    return client;
}

/**
 * Returns the public Razorpay key ID for Checkout; never returns the secret.
 *
 * @returns {string} Configured public key ID.
 * @throws {Error} 503 when Razorpay is not configured.
 * @name getRazorpayPublicKey
 * @description Returns the public Razorpay key ID for Checkout; never returns the secret.
 */
export function getRazorpayPublicKey() {
    getRazorpayClient();
    return envConfig.RAZORPAY_KEY_ID;
}
