import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import StudentForm from "../components/StudentForm.jsx";
import useStudents from "../hooks/useStudents.js";

/**
 * Creates a student account from the manager workspace.
 *
 * @returns {JSX.Element} Student creation page.
 */
export default function AddStudent() {
    const { addStudent } = useStudents({ autoFetch: false });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formKey, setFormKey] = useState(0);

    async function handleSubmit(payload) {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const student = await addStudent(payload);
            setSuccess(`${student.fullName} was added successfully.`);
            setFormKey((key) => key + 1);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UserPlus size={20} /></span>
                <div><p className="text-sm font-semibold text-indigo-600">STUDENT DIRECTORY</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Add student</h1></div>
            </div>
            <StudentForm key={formKey} mode="create" onSubmit={handleSubmit} submitting={submitting} error={error} success={success} />
            {success && <Link to="/manager/students" className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">Back to student list</Link>}
        </section>
    );
}
