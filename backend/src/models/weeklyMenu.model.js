import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    items: { type: [String], default: [] },
    description: { type: String, default: "" },
    servingTime: { type: String, default: "" },
}, { _id: false });
const daySchema = new mongoose.Schema({
    dayOfWeek: { type: String, enum: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], required: true },
    meals: { breakfast: { type: mealSchema, default: () => ({}) }, lunch: { type: mealSchema, default: () => ({}) }, snacks: { type: mealSchema, default: () => ({}) }, dinner: { type: mealSchema, default: () => ({}) } },
}, { _id: false });
const weeklyMenuSchema = new mongoose.Schema({
    key: { type: String, default: "default", unique: true, immutable: true },
    days: { type: [daySchema], required: true, validate: { validator: (days) => days.length === 7 && new Set(days.map((day) => day.dayOfWeek)).size === 7, message: "Weekly menu must include all seven days exactly once" } },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", default: null },
}, { timestamps: true, collection: "weeklymenus" });
export default mongoose.model("WeeklyMenu", weeklyMenuSchema);
