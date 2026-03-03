import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralBonusPaid: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    withdrawableBalance: { type: Number, default: 0 },
    activeInvestments: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);  
