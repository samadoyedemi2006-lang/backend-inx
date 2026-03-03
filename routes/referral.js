import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getReferral } from "../controllers/referralController.js";

const router = express.Router();

// GET /referral
router.get("/", authenticate, getReferral);

export default router;