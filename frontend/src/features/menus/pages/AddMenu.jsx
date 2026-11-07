import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MenuForm from "../components/MenuForm.jsx";
import useMenus from "../hooks/useMenus.js";

/**
 * Manager page for publishing a new daily menu.
 *
 * @returns {JSX.Element} Menu creation page.
 */
export default function AddMenu() {
    const { createMenu } = useMenus();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(menuData) {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            await createMenu(menuData);
            setSuccess("Menu published successfully.");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarPlus size={20} /></span>
                <div><p className="text-sm font-semibold text-indigo-600">MENU MANAGEMENT</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Create daily menu</h1></div>
            </div>
            <MenuForm onSubmit={handleSubmit} submitting={submitting} error={error} success={success} />
            {success && <div className="mt-4 flex flex-wrap gap-4"><Link to="/manager/menus" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Back to menus</Link><button onClick={() => navigate("/manager/menus")} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Finish</button></div>}
        </section>
    );
}
