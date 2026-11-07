import { Link } from "react-router-dom";
import NoticePriorityBadge from "./NoticePriorityBadge.jsx";

/** @param {{notice: Object, detailsPath?: string, manager?: boolean, onPublish?: Function, onUnpublish?: Function, onDelete?: Function, saving?: boolean}} props */
export default function NoticeCard({ notice, detailsPath, manager = false, onPublish, onUnpublish, onDelete, saving = false }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{notice.title}</h2><NoticePriorityBadge priority={notice.priority} /></div>
                    <p className="mt-2 text-xs text-slate-400">{notice.isPublished ? "Published" : "Draft"}{notice.publishedAt ? ` · ${new Date(notice.publishedAt).toLocaleString()}` : ""}</p>
                </div>
                {manager && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/manager/notices/${notice._id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit</Link>
                        {notice.isPublished
                            ? <button type="button" disabled={saving} onClick={() => onUnpublish(notice._id)} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50">Unpublish</button>
                            : <button type="button" disabled={saving} onClick={() => onPublish(notice._id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Publish</button>}
                        <button type="button" disabled={saving} onClick={() => onDelete(notice._id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                    </div>
                )}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{notice.content}</p>
            {!manager && notice.createdBy?.fullName && <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">Posted by {notice.createdBy.fullName}</p>}
            {detailsPath && <Link to={detailsPath} className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">Read full notice</Link>}
        </article>
    );
}
