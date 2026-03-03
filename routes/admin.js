import express from "express";
import { authenticate, adminOnly } from "../middleware/auth.js";

import {
  getOverview,
  getUsers,
  toggleBlock,
  getInvestments,
  confirmInvestment,
  getWithdrawals,
  approveWithdrawal,
  getPayments,
  confirmPayment,
  triggerRoi
} from "../controllers/adminController.js";

const router = express.Router();

// Must be authenticated first
router.use(authenticate);

// Then must be admin
router.use(adminOnly);

router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:userId/toggle-block", toggleBlock);
router.get("/investments", getInvestments);
router.patch("/invest/confirm", confirmInvestment);
router.get("/withdrawals", getWithdrawals);
router.patch("/withdraw/approve", approveWithdrawal);
router.get("/payments", getPayments);
router.patch("/payment/confirm", confirmPayment);
router.post("/trigger-roi", triggerRoi);

export default router;