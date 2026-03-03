import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

const WELCOME_BONUS = 1000;

function genReferralCode() {
  return "VG" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, referralCode } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPw = await bcrypt.hash(password, 10);
    const newRefCode = genReferralCode();

    const userData = {
      fullName,
      email,
      phone,
      password: hashedPw,
      referralCode: newRefCode,
      walletBalance: WELCOME_BONUS,
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        userData.referredBy = referrer._id;
        userData.referralBonusPaid = false;
      }
    }

    await User.create(userData);
    return res.status(201).json({ message: "Registration successful" });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.isBlocked) return res.status(400).json({ message: "Account is blocked" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const isAdmin = user.isAdmin === true;
    const token = signToken({ userId: user._id.toString(), isAdmin });

    return res.json({
      token,
      isAdmin,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
