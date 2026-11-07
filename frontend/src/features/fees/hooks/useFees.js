import { useCallback, useState } from "react";
import {
    assignFees as requestAssignFees,
    getAllFees,
    getFeeById,
    getManagerPaymentHistory,
    getMyFees,
    getMyFeeById,
    getMyPaymentHistory,
    recordOfflinePayment as requestOfflinePayment,
    updateFee as requestUpdateFee,
} from "../services/fee.service.js";

/**
 * Provides local fee list/detail/history state and explicit API-backed updates.
 *
 * @returns {Object} Fee data, loading/error state, paging and mutation callbacks.
 * @name useFees
 * @description Provides local fee list/detail/history state and explicit API-backed updates.
 */
export default function useFees() {
    const [fees, setFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState({
        totalRecords: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 10,
    });
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadFees = useCallback(async (params = {}, role = "manager") => {
        setLoading(true);
        setError("");
        try {
            const result = role === "student"
                ? await getMyFees(params)
                : await getAllFees(params);
            setFees(result.fees);
            setPagination(result.pagination);
            setSummary(result.summary || null);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFee = useCallback(async (feeId, role = "manager") => {
        setLoading(true);
        setError("");
        try {
            const result = role === "student"
                ? await getMyFeeById(feeId)
                : await getFeeById(feeId);
            setSelectedFee(result.fee);
            if (result.payments) setPayments(result.payments);
            else if (result.recentPayments) setPayments(result.recentPayments);
            return result;
        } catch (requestError) {
            setSelectedFee(null);
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPayments = useCallback(async (feeId, params = {}, role = "manager") => {
        setError("");
        try {
            const result = role === "student"
                ? await getMyPaymentHistory(feeId, params)
                : await getManagerPaymentHistory(feeId, params);
            setPayments(result.payments);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            throw requestError;
        }
    }, []);

    const assign = useCallback(async (data) => requestAssignFees(data), []);
    const update = useCallback(async (feeId, data) => requestUpdateFee(feeId, data), []);
    const recordPayment = useCallback(async (feeId, data) => requestOfflinePayment(feeId, data), []);

    return {
        fees,
        selectedFee,
        payments,
        pagination,
        summary,
        loading,
        error,
        setSelectedFee,
        loadFees,
        loadFee,
        loadPayments,
        assignFees: assign,
        updateFee: update,
        recordOfflinePayment: recordPayment,
    };
}
