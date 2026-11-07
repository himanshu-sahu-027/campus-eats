import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import StudentDetailsCard from "../components/StudentDetailsCard.jsx";
import { getStudentById } from "../services/student.service.js";

/**
 * Displays complete student account and associated profile information.
 *
 * @returns {JSX.Element} Student detail page.
 */
export default function StudentDetails() {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getStudentById(studentId).then((record) => {
            if (active) setStudent(record);
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [studentId]);

    if (loading) {
        return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading student details…</span></div>;
    }

    return (
        <section>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <Link to="/manager/students" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} /> Student list</Link>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">Student details</h1>
                </div>
                {student && (
                    <div className="flex gap-2">
                        <Link to={`/manager/students/${student.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Pencil size={16} /> Edit student</Link>
                    </div>
                )}
            </div>
            {error ? <AuthNotice>{error}</AuthNotice> : student ? <StudentDetailsCard student={student} /> : null}
        </section>
    );
}
