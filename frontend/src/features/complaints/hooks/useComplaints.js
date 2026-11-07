import { useCallback, useState } from "react";
import {
    getAllComplaints,
    getMyComplaints,
    submitComplaint as submitComplaintRequest,
    updateComplaintStatus as updateStatusRequest,
} from "../services/complaint.service.js";

/**
 * Provides focused list and mutation state for student and manager complaint pages.
 *
 * @returns {Object} Complaint data, pagination, status, and operations.
 * @name useComplaints
 * @description Provides focused list and mutation state for student and manager complaint pages.
 */
export default function useComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [pagination, setPagination] = useState({ totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadComplaints = useCallback(async (params = {}, role = "student") => {
        setLoading(true);
        setError("");
        try {
            const result = role === "manager"
                ? await getAllComplaints(params)
                : await getMyComplaints(params);
            setComplaints(result.complaints);
            setPagination(result.pagination);
            return result;
        } catch (requestError) {
            setError(requestError.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const submit = useCallback(async (data) => {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const complaint = await submitComplaintRequest(data);
            setSuccess("Your complaint was submitted successfully.");
            return complaint;
        } catch (requestError) {
            setError(requestError.message);
            return null;
        } finally {
            setSubmitting(false);
        }
    }, []);

    const updateStatus = useCallback(async (complaintId, data) => {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const complaint = await updateStatusRequest(complaintId, data);
            setComplaints((current) => current.map((item) => item._id === complaintId ? complaint : item));
            setSuccess("Complaint updated successfully.");
            return complaint;
        } catch (requestError) {
            setError(requestError.message);
            return null;
        } finally {
            setSubmitting(false);
        }
    }, []);

    return {
        complaints,
        pagination,
        loading,
        submitting,
        error,
        success,
        loadComplaints,
        submitComplaint: submit,
        updateComplaintStatus: updateStatus,
        clearFeedback: () => { setError(""); setSuccess(""); },
    };
}
