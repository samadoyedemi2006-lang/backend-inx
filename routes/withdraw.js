// routes/withdraw.js
import express from "express";
import { request } from "../controllers/withdrawController.js"; // ✅ add .js

const router = express.Router();

router.post("/request", request);

export default router;