import { useCallback, useState } from "react";
import {
    createMenu as requestCreateMenu,
    deleteMenu as requestDeleteMenu,
    getMenuByDate as requestGetMenuByDate,
    getMenus as requestGetMenus,
    getStudentUpcomingMenus,
    getTodayMenu,
    getUpcomingMenus as requestGetUpcomingMenus,
    updateMenu as requestUpdateMenu,
} from "../services/menu.service.js";

/**
 * Shares menu loading, mutation, and feedback state across menu pages.
 *
 * @returns {Object} Menu state and API-backed operations.
 * @name useMenus
 * @description Shares menu loading, mutation, and feedback state across menu pages.
 */
export default function useMenus() {
    const [menus, setMenus] = useState([]);
    const [todayMenu, setTodayMenu] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [upcomingMenus, setUpcomingMenus] = useState([]);
    const [pagination, setPagination] = useState({ totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadMenus = useCallback(async (params = {}) => {
        setLoading(true);
        setError("");
        try {
            const result = await requestGetMenus(params);
            setMenus(result.menus);
            setPagination(result.pagination);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMenuByDate = useCallback(async (date, role = "manager") => {
        setLoading(true);
        setError("");
        try {
            const menu = await requestGetMenuByDate(date, role);
            setSelectedMenu(menu);
            return menu;
        } catch (requestError) {
            setSelectedMenu(null);
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadTodayMenu = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const menu = await getTodayMenu();
            setTodayMenu(menu);
            return menu;
        } catch (requestError) {
            if (requestError.response?.status === 404) {
                setTodayMenu(null);
                return null;
            }
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadUpcomingMenus = useCallback(async ({ role = "manager", params = {} } = {}) => {
        setLoading(true);
        setError("");
        try {
            const result = role === "student"
                ? await getStudentUpcomingMenus(params)
                : await requestGetUpcomingMenus(params);
            setUpcomingMenus(result.menus);
            setPagination(result.pagination);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const create = useCallback(async (menuData) => {
        setError("");
        setSuccess("");
        try {
            const menu = await requestCreateMenu(menuData);
            setSuccess("Menu created successfully.");
            return menu;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        }
    }, []);

    const update = useCallback(async (menuId, menuData) => {
        setError("");
        setSuccess("");
        try {
            const menu = await requestUpdateMenu(menuId, menuData);
            setSuccess("Menu updated successfully.");
            return menu;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        }
    }, []);

    const remove = useCallback(async (menuId) => {
        setError("");
        setSuccess("");
        try {
            await requestDeleteMenu(menuId);
            setSuccess("Menu deleted successfully.");
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        }
    }, []);

    const clearFeedback = useCallback(() => {
        setError("");
        setSuccess("");
    }, []);

    return {
        menus,
        todayMenu,
        selectedMenu,
        upcomingMenus,
        pagination,
        loading,
        error,
        success,
        loadMenus,
        loadMenuByDate,
        loadTodayMenu,
        loadUpcomingMenus,
        createMenu: create,
        updateMenu: update,
        deleteMenu: remove,
        clearFeedback,
    };
}
