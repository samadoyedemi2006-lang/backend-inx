import Investment from "../models/Investment.js";
import User from "../models/User.js";
import CONSTANTS from "../config/constants.js";

const { PLANS, REFERRAL_BONUS } = CONSTANTS;

export const create = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    if (!planId || !amount) return res.status(400).json({ message: "Plan and amount required" });

    const userId = req.user.userId;
    const plan = PLANS[planId];

    await Investment.create({
      userId,
      planId,
      planName: plan ? plan.name : planId,
      amount,
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { totalInvested: amount, activeInvestments: 1 },
    });

    // Pay referral bonus on first investment
    const investingUser = await User.findById(userId);
    if (investingUser && investingUser.referredBy && investingUser.referralBonusPaid === false) {
      await User.findByIdAndUpdate(investingUser.referredBy, {
        $inc: { referralEarnings: REFERRAL_BONUS, walletBalance: REFERRAL_BONUS },
      });
      await User.findByIdAndUpdate(userId, { $set: { referralBonusPaid: true } });
    }

    return res.status(201).json({
      message: "Investment created, pending confirmation. Admin will confirm your payment before returns begin.",
    });
  } catch (e) {
    console.error("Invest error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
