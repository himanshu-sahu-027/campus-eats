import { useCallback, useEffect, useState } from "react";
import {
    addStudent as requestAddStudent,
    deactivateStudent as requestDeactivateStudent,
    getStudentById,
    getStudents,
    updateStudent as requestUpdateStudent,
} from "../services/student.service.js";

const INITIAL_PAGINATION = {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
};

/**
 * Owns list query state and the student-management request operations.
 *
 * Search input is debounced before the server-side list request is issued.
 *
 * @returns {Object} Student records, query setters, operation methods, and state.
 * @name useStudents
 * @description Owns list query state and the student-management request operations.
 */
export default function useStudents({ autoFetch = true } = {}) {
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState(INITIAL_PAGINATION);
    const [search, setSearchValue] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [registrationMethod, setRegistrationMethod] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalizedSearch = search.trim();
            if (normalizedSearch === debouncedSearch) {
                setLoading(false);
            } else {
                setDebouncedSearch(normalizedSearch);
            }
        }, 350);
        return () => window.clearTimeout(timer);
    }, [search, debouncedSearch]);

    useEffect(() => {
        if (!autoFetch) return undefined;
        let active = true;
        getStudents({
            search: debouncedSearch || undefined,
            status: status || undefined,
            registrationMethod: registrationMethod || undefined,
            page,
            limit,
        }).then((result) => {
            if (!active) return;
            setStudents(result.students);
            setPagination(result.pagination);
            setError("");
        }).catch((requestError) => {
            if (!active) return;
            setError(requestError.message);
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [autoFetch, debouncedSearch, status, registrationMethod, page, limit, revision]);

    const updateSearch = useCallback((value) => {
        setSearchValue(value);
        setPage(1);
        setLoading(true);
    }, []);

    const updateStatus = useCallback((value) => {
        setStatus(value);
        setPage(1);
        setLoading(true);
    }, []);

    const updateRegistrationMethod = useCallback((value) => {
        setRegistrationMethod(value);
        setPage(1);
        setLoading(true);
    }, []);

    const changePage = useCallback((value) => {
        setPage(value);
        setLoading(true);
    }, []);

    const changeLimit = useCallback((value) => {
        setLimit(value);
        setPage(1);
        setLoading(true);
    }, []);

    const refresh = useCallback(() => {
        setLoading(true);
        setRevision((current) => current + 1);
    }, []);

    const deactivate = useCallback(async (studentId) => {
        const updated = await requestDeactivateStudent(studentId);
        refresh();
        return updated;
    }, [refresh]);

    return {
        students,
        pagination,
        search,
        status,
        registrationMethod,
        page,
        limit,
        loading,
        error,
        setSearch: updateSearch,
        setStatus: updateStatus,
        setRegistrationMethod: updateRegistrationMethod,
        setPage: changePage,
        setLimit: changeLimit,
        refresh,
        getStudent: getStudentById,
        addStudent: requestAddStudent,
        updateStudent: requestUpdateStudent,
        deactivateStudent: deactivate,
    };
}
