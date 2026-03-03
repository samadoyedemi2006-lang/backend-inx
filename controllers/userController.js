import User from "../models/User.js";
import Investment from "../models/Investment.js";
import Withdrawal from "../models/Withdrawal.js";
import Payment from "../models/Payment.js";

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const investments = await Investment.find({
      userId: user._id,
      status: { $in: ["confirmed", "completed"] },
    });

    const totalRoiEarned = investments.reduce((sum, inv) => {
      const daysCompleted = inv.roiDaysCompleted || 0;
      return sum + (inv.amount * 0.15 * daysCompleted);
    }, 0);

    return res.json({
      walletBalance: user.walletBalance || 0,
      totalInvested: user.totalInvested || 0,
      activeInvestments: user.activeInvestments || 0,
      referralEarnings: user.referralEarnings || 0,
      referralCode: user.referralCode,
      totalRoiEarned,
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [investments, payments, withdrawals] = await Promise.all([
      Investment.find({ userId }).sort({ createdAt: -1 }),
      Payment.find({ userId }).sort({ createdAt: -1 }),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }),
    ]);
    return res.json({ investments, payments, withdrawals });
  } catch (e) {
    console.error("Transactions error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
