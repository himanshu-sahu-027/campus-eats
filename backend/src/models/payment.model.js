import mongoose from "mongoose";

const PAYMENT_METHODS = ["OFFLINE", "RAZORPAY"];
const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED"];

/**
 * Auditable record of one offline payment or Razorpay attempt. Amounts are
 * integer paise, matching Fee storage and Razorpay's INR amount unit. Sensitive
 * card data is never stored; Mongoose timestamps preserve attempt history.
 *
 * @property {mongoose.Types.ObjectId} feeId - Referenced Fee obligation.
 * @property {mongoose.Types.ObjectId} studentId - Referenced Student.
 * @property {number} amount - Payment amount in integer paise.
 * @property {"OFFLINE"|"RAZORPAY"} paymentMethod - Collection channel.
 * @property {"PENDING"|"SUCCESS"|"FAILED"} status - Payment lifecycle state.
 * @property {string} [transactionReference] - Offline reference only.
 * @property {string} [razorpayOrderId] - Unique Razorpay order identifier.
 * @property {string} [razorpayPaymentId] - Unique verified provider payment ID.
 * @property {string} [razorpaySignature] - Signature retained for audit only.
 * @property {mongoose.Types.ObjectId} [recordedBy] - Manager for offline records.
 * @property {string} [failureReason] - Safe provider failure/reconciliation note.
 * @property {Date} [paidAt] - Timestamp when payment was verified/recorded.
 * @type {mongoose.Schema}
 */
const paymentSchema = new mongoose.Schema(
    {
        feeId: { type: mongoose.Schema.Types.ObjectId, ref: "Fee", required: true, index: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
        amount: { type: Number, required: true, min: 1 },
        paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
        status: { type: String, enum: PAYMENT_STATUSES, required: true, index: true },
        transactionReference: { type: String, trim: true, maxlength: 120 },
        remark: { type: String, trim: true, maxlength: 500, select: false },
        razorpayOrderId: { type: String, trim: true },
        razorpayPaymentId: { type: String, trim: true },
        razorpaySignature: { type: String, select: false },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
        failureReason: { type: String, trim: true, maxlength: 500 },
        paidAt: { type: Date },
    },
    { timestamps: true, collection: "payments" },
);

paymentSchema.index({ feeId: 1, createdAt: -1 });
paymentSchema.index({ studentId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index(
    { razorpayOrderId: 1 },
    { unique: true, partialFilterExpression: { razorpayOrderId: { $type: "string" } } },
);
paymentSchema.index(
    { razorpayPaymentId: 1 },
    { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: "string" } } },
);

/**
 * Enforces channel-specific payment data and successful-payment requirements.
 *
 * @name validatePaymentChannel
 * @description Validates payment amount, identifiers, and lifecycle fields.
 */
paymentSchema.pre("validate", function validatePaymentChannel() {
    if (!Number.isSafeInteger(this.amount) || this.amount <= 0) {
        this.invalidate("amount", "Payment amount must be a positive integer number of paise");
    }
    if (this.paymentMethod === "OFFLINE") {
        if (!this.recordedBy) this.invalidate("recordedBy", "Offline payments require a recording manager");
        if (this.razorpayOrderId || this.razorpayPaymentId || this.razorpaySignature) {
            this.invalidate("razorpayOrderId", "Offline payments cannot contain Razorpay identifiers");
        }
    }
    if (this.paymentMethod === "RAZORPAY") {
        if (this.recordedBy) this.invalidate("recordedBy", "Razorpay payments cannot be recorded by a manager");
        if (typeof this.razorpayOrderId !== "string" || !this.razorpayOrderId.trim()) {
            this.invalidate("razorpayOrderId", "Razorpay payments require an order ID");
        }
        if (this.transactionReference !== undefined) {
            this.invalidate("transactionReference", "Gateway identifiers must not use offline transaction references");
        }
        if (this.status === "SUCCESS" &&
            (!this.razorpayPaymentId || !this.razorpaySignature)) {
            this.invalidate("razorpayPaymentId", "Successful Razorpay payments require verified provider identifiers");
        }
    }
    if (this.status === "SUCCESS" && !this.paidAt) {
        this.invalidate("paidAt", "Successful payments require a paidAt timestamp");
    }
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
