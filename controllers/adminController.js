import User from "../models/User.js";
import Investment from "../models/Investment.js";
import Withdrawal from "../models/Withdrawal.js";
import Payment from "../models/Payment.js";
import CONSTANTS from "../config/constants.js";

const { ROI_INTERVAL_MS, ROI_TOTAL_DAYS } = CONSTANTS
export const getOverview = async (req, res) => {
  try {
    const [totalUsers, totalInvestments, pendingInvestments, confirmedInvestments] = await Promise.all([
      User.countDocuments({ isAdmin: { $ne: true } }),
      Investment.countDocuments(),
      Investment.countDocuments({ status: "pending" }),
      Investment.countDocuments({ status: "confirmed" }),
    ]);

    const confirmedInvs = await Investment.find({ status: "confirmed" });
    const totalPlatformIncome = confirmedInvs.reduce((sum, i) => sum + (i.amount || 0), 0);

    return res.json({ totalUsers, totalInvestments, totalPlatformIncome, pendingInvestments, confirmedInvestments });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(
      users.map((u) => ({
        id: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        walletBalance: u.walletBalance || 0,
        totalInvested: u.totalInvested || 0,
        isBlocked: u.isBlocked || false,
        status: u.isBlocked ? "blocked" : "active",
        createdAt: u.createdAt,
      }))
    );
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const toggleBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.json({ message: user.isBlocked ? "User blocked" : "User unblocked" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find().sort({ createdAt: -1 }).populate("userId", "fullName");

    return res.json(
      investments.map((i) => ({
        id: i._id.toString(),
        userId: i.userId?._id?.toString() || "",
        userName: i.userId?.fullName || "Unknown",
        planName: i.planName,
        amount: i.amount,
        status: i.status,
        createdAt: i.createdAt,
      }))
    );
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const confirmInvestment = async (req, res) => {
  try {
    const { investmentId } = req.body;
    if (!investmentId) return res.status(400).json({ message: "Investment ID required" });

    const inv = await Investment.findById(investmentId);
    if (!inv) return res.status(404).json({ message: "Investment not found" });

    inv.status = "confirmed";
    inv.confirmedAt = new Date();
    inv.roiDaysCompleted = 0;
    inv.paymentConfirmed = true;
    await inv.save();

    return res.json({ message: "Investment confirmed. Daily ROI will now begin for this user." });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });

    return res.json(
      withdrawals.map((w) => ({
        id: w._id.toString(),
        userId: w.userId.toString(),
        userName: w.userName || "Unknown",
        amount: w.amount,
        bankName: w.bankName,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        status: w.status,
        createdAt: w.createdAt,
      }))
    );
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.body;
    if (!withdrawalId) return res.status(400).json({ message: "Withdrawal ID required" });

    const w = await Withdrawal.findById(withdrawalId);
    if (!w) return res.status(404).json({ message: "Withdrawal not found" });

    w.status = "paid";
    w.paidAt = new Date();
    await w.save();

    return res.json({ message: "Withdrawal approved" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).populate("userId", "fullName");

    return res.json(
      payments.map((p) => ({
        id: p._id.toString(),
        userId: p.userId?._id?.toString() || "",
        userName: p.userId?.fullName || "Unknown",
        amount: p.amount,
        reference: p.reference,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ message: "Payment ID required" });

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "confirmed";
    payment.confirmedAt = new Date();
    await payment.save();

    await User.findByIdAndUpdate(payment.userId, { $inc: { walletBalance: payment.amount } });

    return res.json({ message: "Payment confirmed and wallet credited" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const triggerRoi = async (req, res) => {
  try {
    const now = new Date();

    const activeInvestments = await Investment.find({
      status: "confirmed",
      paymentConfirmed: true,
      roiDaysCompleted: { $lt: ROI_TOTAL_DAYS },
    });

    let processed = 0;

    for (const inv of activeInvestments) {
      const daysCompleted = inv.roiDaysCompleted || 0;
      const lastRoiAt = inv.lastRoiAt ? new Date(inv.lastRoiAt) : null;

      if (lastRoiAt && now.getTime() - lastRoiAt.getTime() < ROI_INTERVAL_MS) {
        continue;
      }

      const dailyReturn = inv.amount * 0.15;
      const newDays = daysCompleted + 1;
      const isComplete = newDays >= ROI_TOTAL_DAYS;

      inv.roiDaysCompleted = newDays;
      inv.lastRoiAt = now;
      if (isComplete) {
        inv.status = "completed";
        inv.completedAt = now;
      }
      await inv.save();

      await User.findByIdAndUpdate(inv.userId, {
        $inc: {
          walletBalance: dailyReturn,
          withdrawableBalance: dailyReturn,
          ...(isComplete ? { activeInvestments: -1 } : {}),
        },
      });

      processed++;
    }

    return res.json({ message: `Processed ${processed} investments`, timestamp: now.toISOString() });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
