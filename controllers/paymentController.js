import Payment from "../models/Payment.js";

export const submit = async (req, res) => {
  try {
    const { amount, reference } = req.body;

    if (!amount || !reference) {
      return res
        .status(400)
        .json({ message: "Amount and reference required" });
    }

    await Payment.create({
      userId: req.user.userId,
      amount,
      reference,
    });

    return res
      .status(201)
      .json({ message: "Payment proof submitted" });

  } catch (e) {
    console.error("Payment error:", e);
    return res
      .status(500)
      .json({ message: e.message || "Server error" });
  }
};