import { useEffect, useState } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import { useParams } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import StudentForm from "../components/StudentForm.jsx";
import useStudents from "../hooks/useStudents.js";

/**
 * Loads and edits permitted student and hostel-profile fields.
 *
 * @returns {JSX.Element} Student edit page.
 */
export default function EditStudent() {
    const { studentId } = useParams();
    const { getStudent, updateStudent } = useStudents({ autoFetch: false });
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let active = true;
        getStudent(studentId).then((record) => {
            if (active) setStudent(record);
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [getStudent, studentId]);

    async function handleSubmit(updates) {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const updated = await updateStudent(studentId, updates);
            setStudent(updated);
            setSuccess("Student details were updated successfully.");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading student details…</span></div>;
    }
    if (error && !student) return <AuthNotice>{error}</AuthNotice>;

    return (
        <section>
            <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Pencil size={19} /></span>
                <div><p className="text-sm font-semibold text-indigo-600">STUDENT DIRECTORY</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Edit student</h1></div>
            </div>
            <StudentForm
                key={student.id}
                mode="edit"
                initialValues={{
                    fullName: student.fullName,
                    email: student.email,
                    rollNumber: student.rollNumber,
                    phone: student.phone,
                    roomNumber: student.profile?.roomNumber || "",
                }}
                onSubmit={handleSubmit}
                submitting={submitting}
                error={error}
                success={success}
            />
        </section>
    );
}
