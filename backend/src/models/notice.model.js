import mongoose from "mongoose";

const NOTICE_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"];

/**
 * Stores manager-authored notices as drafts or published student announcements.
 *
 * Publication timestamp is retained when a notice is unpublished or republished.
 * The compound index supports student queries ordered by publication date.
 *
 * @type {mongoose.Schema}
 */
const noticeSchema = new mongoose.Schema(
    {
        /** Notice heading. */
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        /** Full notice content. */
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        /** Visual and operational urgency. */
        priority: {
            type: String,
            enum: NOTICE_PRIORITIES,
            required: true,
            default: "NORMAL",
        },
        /** Draft notices are never included in student queries. */
        isPublished: {
            type: Boolean,
            required: true,
            default: false,
        },
        /** First publication time; preserved when unpublishing/republishing. */
        publishedAt: {
            type: Date,
            default: null,
        },
        /** Manager who originally created the notice. */
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
        /** Manager who last changed the notice. */
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
    },
    { timestamps: true, collection: "notices" },
);

noticeSchema.index({ isPublished: 1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ publishedAt: -1 });
noticeSchema.index({ isPublished: 1, publishedAt: -1 });
noticeSchema.index({ createdAt: -1 });

const Notice = mongoose.model("Notice", noticeSchema);
export { NOTICE_PRIORITIES };
export default Notice;
