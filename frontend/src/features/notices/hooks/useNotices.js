import { useCallback, useState } from "react";
import {
    createNotice,
    deleteNotice,
    getManagerNotices,
    getStudentNotices,
    publishNotice,
    unpublishNotice,
    updateNotice,
} from "../services/notice.service.js";

/**
 * Provides notice listing and manager lifecycle operations.
 *
 * @returns {Object} Notice data, loading/error state, and lifecycle actions.
 * @name useNotices
 * @description Provides notice listing and manager lifecycle operations.
 */
export default function useNotices() {
    const [notices, setNotices] = useState([]);
    const [pagination, setPagination] = useState({ totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadNotices = useCallback(async (params = {}, role = "student") => {
        setLoading(true);
        setError("");
        try {
            const result = role === "manager"
                ? await getManagerNotices(params)
                : await getStudentNotices(params);
            setNotices(result.notices);
            setPagination(result.pagination);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const perform = useCallback(async (operation) => {
        setSaving(true);
        setError("");
        try {
            return await operation();
        } catch (requestError) {
            setError(requestError.message);
            return null;
        } finally {
            setSaving(false);
        }
    }, []);

    return {
        notices,
        pagination,
        loading,
        saving,
        error,
        loadNotices,
        createNotice: (data) => perform(() => createNotice(data)),
        updateNotice: (id, data) => perform(() => updateNotice(id, data)),
        publishNotice: (id) => perform(() => publishNotice(id)),
        unpublishNotice: (id) => perform(() => unpublishNotice(id)),
        deleteNotice: (id) => perform(() => deleteNotice(id)),
    };
}
