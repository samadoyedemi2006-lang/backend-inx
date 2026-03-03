import express from "express";
import { getDashboard, getTransactions } from "../controllers/userController.js";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/transactions", getTransactions);

export default router;