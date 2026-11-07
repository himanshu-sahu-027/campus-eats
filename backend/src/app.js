import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { envConfig } from "./config/env.js";
import studentAuthRoutes from "./routes/studentAuth.routes.js";
import managerAuthRoutes from "./routes/managerAuth.routes.js";
import managerStudentRoutes from "./routes/managerStudent.routes.js";
import managerMenuRoutes from "./routes/managerMenu.routes.js";
import studentMenuRoutes from "./routes/studentMenu.routes.js";
import studentComplaintRoutes from "./routes/studentComplaint.routes.js";
import managerComplaintRoutes from "./routes/managerComplaint.routes.js";
import studentNoticeRoutes from "./routes/studentNotice.routes.js";
import managerNoticeRoutes from "./routes/managerNotice.routes.js";
import managerFeeRoutes from "./routes/managerFee.routes.js";
import studentFeeRoutes from "./routes/studentFee.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
import studentDashboardRoutes from "./routes/studentDashboard.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import protectCrossSiteRequests from "./middlewares/protectCrossSiteRequests.js";
import { httpError } from "./utils/httpError.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors({
    origin: envConfig.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(protectCrossSiteRequests);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Mess Management API is running!",
    });
});

app.use("/api/v1/studentAuth", studentAuthRoutes);
app.use("/api/v1/managerAuth", managerAuthRoutes);
app.use("/api/v1/student/complaints", studentComplaintRoutes);
app.use("/api/v1/manager/complaints", managerComplaintRoutes);
app.use("/api/v1/student/notices", studentNoticeRoutes);
app.use("/api/v1/manager/notices", managerNoticeRoutes);
app.use("/api/v1/manager/fees", managerFeeRoutes);
app.use("/api/v1/student/fees", studentFeeRoutes);
app.use("/api/v1/student/payments", paymentRoutes);
app.use("/api/v1/manager/dashboard", managerDashboardRoutes);
app.use("/api/v1/student/dashboard", studentDashboardRoutes);
// Mount the narrower menu router before the manager-wide student router so
// manager menu requests do not pass through student-administration auth twice.
app.use("/api/v1/manager/menus", managerMenuRoutes);
app.use("/api/v1/manager", managerStudentRoutes);
app.use("/api/v1/student/menus", studentMenuRoutes);

app.use((req, res, next) => {
    next(httpError(404, "Route not found"));
});
app.use(errorHandler);

export default app;
