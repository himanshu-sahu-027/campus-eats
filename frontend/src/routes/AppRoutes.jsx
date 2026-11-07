import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import ManagerDashboard from "../features/dashboard/pages/ManagerDashboard.jsx";
import StudentDashboard from "../features/dashboard/pages/StudentDashboard.jsx";
import AddStudent from "../features/students/pages/AddStudent.jsx";
import EditStudent from "../features/students/pages/EditStudent.jsx";
import PendingStudents from "../features/students/pages/PendingStudents.jsx";
import StudentDetails from "../features/students/pages/StudentDetails.jsx";
import StudentList from "../features/students/pages/StudentList.jsx";
import AddMenu from "../features/menus/pages/AddMenu.jsx";
import EditMenu from "../features/menus/pages/EditMenu.jsx";
import ManagerMenuManagement from "../features/menus/pages/ManagerMenuManagement.jsx";
import StudentMenuView from "../features/menus/pages/StudentMenuView.jsx";
import StudentComplaints from "../features/complaints/pages/StudentComplaints.jsx";
import ManagerComplaints from "../features/complaints/pages/ManagerComplaints.jsx";
import StudentNotices from "../features/notices/pages/StudentNotices.jsx";
import ManagerNotices from "../features/notices/pages/ManagerNotices.jsx";
import ManagerNoticeEditor from "../features/notices/pages/ManagerNoticeEditor.jsx";
import ManagerFeeManagement from "../features/fees/pages/ManagerFeeManagement.jsx";
import AssignFees from "../features/fees/pages/AssignFees.jsx";
import StudentFeeDetails from "../features/fees/pages/StudentFeeDetails.jsx";
import PaymentSuccess from "../features/fees/pages/PaymentSuccess.jsx";
import PaymentFailure from "../features/fees/pages/PaymentFailure.jsx";
import ManagerLayout from "../layouts/ManagerLayout.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuth } from "../features/auth/hooks/useAuth.js";

function HomeRedirect() {
    const { role, loading } = useAuth();
    if (loading) {
        return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Checking your session…</div>;
    }
    return <Navigate to={role === "MANAGER" ? "/manager/dashboard" : role === "STUDENT" ? "/student/dashboard" : "/login/student"} replace />;
}

/**
 * Declares public auth routes and role-protected manager/student page trees.
 *
 * @returns {JSX.Element} Application route configuration.
 */
export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Navigate to="/login/student" replace />} />
            <Route path="/login/:accountType" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute role="MANAGER" />}>
                <Route path="/manager" element={<ManagerLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<ManagerDashboard />} />
                    <Route path="students" element={<StudentList />} />
                    <Route path="students/add" element={<AddStudent />} />
                    <Route path="students/pending" element={<PendingStudents />} />
                    <Route path="students/:studentId/edit" element={<EditStudent />} />
                    <Route path="students/:studentId" element={<StudentDetails />} />
                    <Route path="menus" element={<ManagerMenuManagement />} />
                    <Route path="menus/add" element={<AddMenu />} />
                    <Route path="menus/:date/edit" element={<EditMenu />} />
                    <Route path="complaints" element={<ManagerComplaints />} />
                    <Route path="notices" element={<ManagerNotices />} />
                    <Route path="notices/new" element={<ManagerNoticeEditor />} />
                    <Route path="notices/:noticeId/edit" element={<ManagerNoticeEditor />} />
                    <Route path="fees" element={<ManagerFeeManagement />} />
                    <Route path="fees/assign" element={<AssignFees />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute role="STUDENT" />}>
                <Route path="/student" element={<StudentLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="menu" element={<StudentMenuView />} />
                    <Route path="complaints" element={<StudentComplaints />} />
                    <Route path="notices" element={<StudentNotices />} />
                    <Route path="fees" element={<StudentFeeDetails />} />
                    <Route path="payment/success" element={<PaymentSuccess />} />
                    <Route path="payment/failure" element={<PaymentFailure />} />
                </Route>
            </Route>

            <Route path="*" element={<HomeRedirect />} />
        </Routes>
    );
}
