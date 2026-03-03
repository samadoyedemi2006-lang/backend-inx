import express from "express";
import cors from "cors";
import { authenticate } from "./middleware/auth.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import investRoutes from "./routes/invest.js";
import paymentRoutes from "./routes/payment.js";
import referralRoutes from "./routes/referral.js";
import withdrawRoutes from "./routes/withdraw.js";
import adminRoutes from "./routes/admin.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/user", authenticate, userRoutes);
app.use("/invest", authenticate, investRoutes);
app.use("/payment", authenticate, paymentRoutes);
app.use("/referral", authenticate, referralRoutes);
app.use("/withdraw", authenticate, withdrawRoutes);
app.use("/admin", authenticate, adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "VaultGrow API is running" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

export default app;