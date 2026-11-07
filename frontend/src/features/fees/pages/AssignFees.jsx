import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import FeeAssignmentForm from "../components/FeeAssignmentForm.jsx";
import useFees from "../hooks/useFees.js";

/**
 * Manager page for assigning monthly and semester fee obligations.
 *
 * @returns {import("react").JSX.Element} Fee assignment workflow.
 */
export default function AssignFees() {
    const { assignFees } = useFees();
    return (
        <section>
            <Link to="/manager/fees" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} /> Back to fees</Link>
            <div className="mb-6 mt-4">
                <p className="text-sm font-semibold text-indigo-600">FEE MANAGEMENT</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Assign fees</h1>
                <p className="mt-2 text-sm text-slate-500">Create a monthly or semester fee for approved students.</p>
            </div>
            <FeeAssignmentForm onAssign={assignFees} />
        </section>
    );
}
