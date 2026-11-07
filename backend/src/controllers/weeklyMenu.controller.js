import { getWeeklyMenu, updateWeeklyMenu } from "../services/weeklyMenu.service.js";

export async function read(req, res) {
    const weeklyMenu = await getWeeklyMenu();
    return res.status(200).json({ success: true, message: "Weekly menu retrieved successfully", data: { weeklyMenu } });
}

export async function write(req, res) {
    const weeklyMenu = await updateWeeklyMenu(req.body, req.user.id);
    return res.status(200).json({ success: true, message: "Weekly menu saved successfully", data: { weeklyMenu } });
}
