import mongoose from "mongoose";
import connectToDB from "../src/config/db.js";
import { envConfig } from "../src/config/env.js";
import WeeklyMenu from "../src/models/weeklyMenu.model.js";

const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const recipes = [
    [["Idli", "Sambar", "Coconut chutney"], ["Rice", "Dal fry", "Mixed vegetables", "Salad"], ["Biscuits", "Tea"], ["Roti", "Chicken curry", "Rice"]],
    [["Poha", "Boiled eggs", "Banana"], ["Rice", "Rajma", "Salad"], ["Fruit", "Tea"], ["Roti", "Paneer curry", "Rice"]],
    [["Upma", "Coconut chutney"], ["Rice", "Chole", "Seasonal vegetables"], ["Samosa", "Tea"], ["Roti", "Mixed vegetables", "Dal"]],
    [["Aloo paratha", "Curd"], ["Rice", "Dal tadka", "Bhindi"], ["Sprouts chaat", "Tea"], ["Roti", "Egg curry", "Rice"]],
    [["Dosa", "Sambar", "Chutney"], ["Rice", "Kadhi", "Potato fry"], ["Puffed rice mix", "Tea"], ["Roti", "Chicken curry", "Rice"]],
    [["Vegetable sandwich", "Milk"], ["Rice", "Dal makhani", "Cabbage"], ["Pakora", "Tea"], ["Roti", "Paneer bhurji", "Rice"]],
    [["Puri", "Aloo sabzi"], ["Rice", "Sambar", "Beans poriyal"], ["Biscuits", "Tea"], ["Roti", "Dal", "Seasonal vegetables"]],
];
const keys = ["breakfast", "lunch", "snacks", "dinner"];
const days = labels.map((day, i) => ({ dayOfWeek: day.toUpperCase(), meals: Object.fromEntries(keys.map((meal, j) => [meal, { items: recipes[i][j], servingTime: ["07:30–09:00", "12:30–14:00", "16:30–17:30", "19:30–21:00"][j] }])) }));
try {
    if (!envConfig.MONGO_URI) throw new Error("MONGO_URI is required");
    await connectToDB();
    const result = await WeeklyMenu.updateOne({ key: "default" }, { $setOnInsert: { key: "default", days } }, { upsert: true });
    console.log(result.upsertedCount ? "Default weekly menu created." : "Weekly menu already exists; preserved existing data.");
} catch (error) { console.error("Weekly menu seed failed:", error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
