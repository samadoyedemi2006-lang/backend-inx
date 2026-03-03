import express from "express";
import { authenticate } from "../middleware/auth.js";
import { submit } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/submit", authenticate, submit);

export default router;