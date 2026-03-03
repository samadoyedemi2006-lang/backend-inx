import express from "express";
import { create } from "../controllers/investController.js"; // ✅ note the .js

const router = express.Router();

router.post("/create", create);

export default router;