const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signJWT } = require('../utils/jwt');
const { genReferralCode } = require('../utils/referral');

async function handleRegister(req, res) {
  const { fullName, email, phone, password, referralCode } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPw = await hashPassword(password);
    const newRefCode = genReferralCode();

    const userData = {
      fullName,
      email,
      phone,
      password: hashedPw,
      referralCode: newRefCode,
      walletBalance: 700,
      totalInvested: 0,
      referralEarnings: 0,
      withdrawableBalance: 0,
      activeInvestments: 0,
      isBlocked: false,
      isAdmin: false,
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        userData.referredBy = referrer._id;
        userData.referralBonusPaid = false;
      }
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(400).json({ message: 'Account is blocked' });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const isAdmin = user.isAdmin === true;
    const token = await signJWT({ userId: user._id.toString(), isAdmin });

    res.json({
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function handleAdminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, isAdmin: true });
    if (!admin) return res.status(400).json({ message: 'Invalid admin credentials' });

    const valid = await verifyPassword(password, admin.password);
    if (!valid) return res.status(400).json({ message: 'Invalid admin credentials' });

    const token = await signJWT({ userId: admin._id.toString(), isAdmin: true });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { handleRegister, handleLogin, handleAdminLogin };