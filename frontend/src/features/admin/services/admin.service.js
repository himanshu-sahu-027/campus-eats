import api from "../../../services/api.js";
export async function adminLogin(credentials) { return (await api.post("/adminAuth/login", credentials)).data.data.admin; }
export async function adminLogout() { await api.post("/adminAuth/logout"); }
export async function adminMe() { return (await api.get("/adminAuth/me")).data.data.admin; }
export async function managers(search = "") { return (await api.get("/admin/managers", { params: { search } })).data.data.managers; }
export async function createManager(data) { return (await api.post("/admin/managers", data)).data.data.manager; }
export async function updateManager(id, data) { return (await api.patch(`/admin/managers/${id}`, data)).data.data.manager; }
/** Resets a Manager password through the Admin-only security endpoint. */
export async function resetManagerPassword(id, passwords) { return (await api.patch(`/admin/managers/${id}/password`, passwords)).data; }
export async function deactivateManager(id) { return (await api.patch(`/admin/managers/${id}/deactivate`)).data.data.manager; }
