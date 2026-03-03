import User from "../models/User.js";

export const getReferral = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalReferrals = await User.countDocuments({
      referredBy: user._id,
    });

    return res.json({
      referralCode: user.referralCode,
      totalReferrals,
      referralEarnings: user.referralEarnings || 0,
    });

  } catch (e) {
    console.error("Referral error:", e);
    return res
      .status(500)
      .json({ message: e.message || "Server error" });
  }
};