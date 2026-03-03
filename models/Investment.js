import e from "express";
import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    dailyROI: { type: Number, default: 15 },
    status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
    paymentConfirmed: { type: Boolean, default: false },
    roiDaysCompleted: { type: Number, default: 0 },
    lastRoiAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Investment", investmentSchema);
