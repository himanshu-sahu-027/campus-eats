import mongoose from "mongoose";

/**
 * Embedded meal details kept within the single daily Menu document.
 *
 * @type {mongoose.Schema}
 */
const mealSchema = new mongoose.Schema(
    {
        items: {
            type: [{
                type: String,
                trim: true,
                minlength: 1,
                maxlength: 120,
            }],
            default: [],
            validate: {
                validator(items) {
                    return Array.isArray(items) && items.every((item) => item.trim().length > 0);
                },
                message: "Meal items cannot contain blank values",
            },
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        servingTime: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },
    },
    { _id: false },
);

/**
 * Stores one complete daily mess menu. All four meals are embedded in the same
 * document so a unique normalized date represents one menu per Indian day.
 *
 * @type {mongoose.Schema}
 */
const menuSchema = new mongoose.Schema(
    {
        /** Calendar date stored at UTC midnight after strict date validation. */
        date: {
            type: Date,
            required: true,
            validate: {
                validator(value) {
                    return value instanceof Date
                        && !Number.isNaN(value.getTime())
                        && value.getUTCHours() === 0
                        && value.getUTCMinutes() === 0
                        && value.getUTCSeconds() === 0
                        && value.getUTCMilliseconds() === 0;
                },
                message: "Menu date must be normalized to UTC midnight",
            },
        },
        /** Embedded breakfast, lunch, snacks, and dinner details. */
        meals: {
            breakfast: { type: mealSchema, required: true },
            lunch: { type: mealSchema, required: true },
            snacks: { type: mealSchema, required: true },
            dinner: { type: mealSchema, required: true },
        },
        /** Manager responsible for initially publishing the menu. */
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
        /** Manager responsible for the most recent menu update. */
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
    },
    { timestamps: true, collection: "menus" },
);

// The unique index is the final protection against simultaneous duplicate creates.
menuSchema.index({ date: 1 }, { unique: true });

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
