import { useEffect, useState } from "react";
import { CalendarCog, LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AuthNotice from "../../auth/components/AuthNotice.jsx";
import MenuForm from "../components/MenuForm.jsx";
import useMenus from "../hooks/useMenus.js";

/**
 * Loads a menu by date and updates its embedded meals.
 *
 * @returns {JSX.Element} Menu editing page.
 */
export default function EditMenu() {
    const { date } = useParams();
    const navigate = useNavigate();
    const { loadMenuByDate, updateMenu } = useMenus();
    const [menu, setMenu] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let active = true;
        loadMenuByDate(date).then((record) => {
            if (active) setMenu(record);
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [date, loadMenuByDate]);

    async function handleSubmit(payload) {
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const updated = await updateMenu(menu._id, payload);
            setMenu(updated);
            setSuccess("Menu updated successfully.");
            const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
            const todayValues = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
            const today = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;
            if (date === today) navigate("/manager/menus", { replace: true, state: { menuUpdated: true } });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading menu…</span></div>;
    }
    if (error && !menu) return <AuthNotice>{error}</AuthNotice>;

    return (
        <section>
            <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarCog size={20} /></span>
                <div><p className="text-sm font-semibold text-indigo-600">MENU MANAGEMENT</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Edit daily menu</h1></div>
            </div>
            <MenuForm key={menu._id} mode="edit" initialMenu={menu} onSubmit={handleSubmit} submitting={submitting} error={error} success={success} />
        </section>
    );
}
