const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const CHECKOUT_SCRIPT_ID = "razorpay-checkout-script";
let scriptPromise;

/**
 * Loads Razorpay Checkout exactly once, reusing an existing script/global.
 *
 * @returns {Promise<void>} Resolves when window.Razorpay is available.
 * @throws {Error} When the Checkout script cannot be loaded.
 */
export function loadRazorpayCheckout() {
    if (window.Razorpay) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
        let script = document.getElementById(CHECKOUT_SCRIPT_ID);
        if (!script) {
            script = document.createElement("script");
            script.id = CHECKOUT_SCRIPT_ID;
            script.src = CHECKOUT_SCRIPT_URL;
            script.async = true;
            document.body.appendChild(script);
        }
        script.addEventListener("load", () => {
            if (window.Razorpay) resolve();
            else {
                scriptPromise = null;
                reject(new Error("Razorpay Checkout loaded without its payment interface."));
            }
        }, { once: true });
        script.addEventListener("error", () => {
            scriptPromise = null;
            reject(new Error("Unable to load Razorpay Checkout. Check your connection and retry."));
        }, { once: true });
        if (window.Razorpay) resolve();
    });
    return scriptPromise;
}
