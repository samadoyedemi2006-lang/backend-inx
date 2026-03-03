import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import CONSTANTS from "../config/constants.js";


const { MIN_WITHDRAWAL } = CONSTANTS

export const request = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await Withdrawal.create({
      userId: user._id,
      userName: user.fullName,
      amount,
      bankName,
      accountNumber,
      accountName,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: -amount } });

    return res.status(201).json({ message: "Withdrawal request submitted" });
  } catch (e) {
    console.error("Withdraw error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
