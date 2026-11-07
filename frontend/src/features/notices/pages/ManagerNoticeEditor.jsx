import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NoticeForm from "../components/NoticeForm.jsx";
import { getManagerNoticeById } from "../services/notice.service.js";
import useNotices from "../hooks/useNotices.js";

/**
 * Loads an optional notice draft and submits create/update changes.
 *
 * @returns {JSX.Element} Manager notice editor.
 */
export default function ManagerNoticeEditor() {
    const { noticeId } = useParams();
    const navigate = useNavigate();
    const [loadedNotice, setLoadedNotice] = useState({ id: null, notice: null, error: "" });
    const { saving, error, createNotice, updateNotice } = useNotices();

    useEffect(() => {
        if (!noticeId) return undefined;
        let active = true;
        getManagerNoticeById(noticeId)
            .then((result) => { if (active) setLoadedNotice({ id: noticeId, notice: result, error: "" }); })
            .catch((requestError) => { if (active) setLoadedNotice({ id: noticeId, notice: null, error: requestError.message }); });
        return () => { active = false; };
    }, [noticeId]);

    const isLoading = Boolean(noticeId && loadedNotice.id !== noticeId);
    const notice = loadedNotice.id === noticeId ? loadedNotice.notice : null;
    const loadError = loadedNotice.id === noticeId ? loadedNotice.error : "";

    async function handleSubmit(data) {
        const result = noticeId ? await updateNotice(noticeId, data) : await createNotice(data);
        if (result) navigate("/manager/notices", { replace: true });
        return result;
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div><Link to="/manager/notices" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">← Back to notices</Link><p className="mt-5 text-sm font-semibold text-indigo-600">Campus updates</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{noticeId ? "Edit notice" : "Create notice"}</h1><p className="mt-2 text-sm text-slate-500">{noticeId ? "Update the content or priority of this notice." : "New notices are saved as drafts and can be published from the notice board."}</p></div>
            {isLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading notice…</p>
                : loadError ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p>
                    : <NoticeForm key={noticeId || "new"} initialValue={notice} onSubmit={handleSubmit} saving={saving} error={error} />}
        </div>
    );
}
