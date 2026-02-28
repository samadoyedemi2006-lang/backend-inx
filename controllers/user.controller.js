const { ObjectId } = require('mongodb');
const getDb = require('../config/db');

async function handleDashboard(req, res) {
  const userId = req.user.userId;
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const investments = await db.collection('investments').find({
      userId,
      status: { $in: ['confirmed', 'completed'] },
    }).toArray();
    const totalRoiEarned = investments.reduce((sum, inv) => {
      const daysCompleted = inv.roiDaysCompleted || 0;
      return sum + (inv.amount * 0.15 * daysCompleted);
    }, 0);
    res.json({
      walletBalance: user.walletBalance || 0,
      totalInvested: user.totalInvested || 0,
      activeInvestments: user.activeInvestments || 0,
      referralEarnings: user.referralEarnings || 0,
      referralCode: user.referralCode,
      totalRoiEarned,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleTransactions(req, res) {
  const userId = req.user.userId;
  try {
    const db = await getDb();
    let investments = await db.collection('investments').find({ userId }).sort({ createdAt: -1 }).toArray();
    investments = investments.map(inv => ({ ...inv, _id: inv._id.toString() }));
    let payments = await db.collection('payments').find({ userId }).sort({ createdAt: -1 }).toArray();
    payments = payments.map(pay => ({ ...pay, _id: pay._id.toString() }));
    let withdrawals = await db.collection('withdrawals').find({ userId }).sort({ createdAt: -1 }).toArray();
    withdrawals = withdrawals.map(w => ({ ...w, _id: w._id.toString() }));
    res.json({ investments, payments, withdrawals });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleCreateInvestment(req, res) {
  const userId = req.user.userId;
  const { planId, amount } = req.body;
  if (!planId || !amount) return res.status(400).json({ message: 'Plan and amount required' });
  const plans = {
    starter: 'Starter Growth',
    silver: 'Silver Growth',
    gold: 'Gold Growth',
    platinum: 'Platinum Growth',
  };
  try {
    const db = await getDb();
    await db.collection('investments').insertOne({
      userId,
      planId,
      planName: plans[planId] || planId,
      amount,
      dailyROI: 15,
      status: 'pending',
      createdAt: new Date(),
    });
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { totalInvested: amount, activeInvestments: 1 } }
    );
    const investingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (investingUser?.referredBy && investingUser?.referralBonusPaid === false) {
      await db.collection('users').updateOne(
        { _id: investingUser.referredBy },
        { $inc: { referralEarnings: 500, walletBalance: 500 } }
      );
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { referralBonusPaid: true } }
      );
    }
    res.status(201).json({ message: 'Investment created, pending confirmation. Admin will confirm your payment before returns begin.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleSubmitPayment(req, res) {
  const userId = req.user.userId;
  const { amount, reference } = req.body;
  if (!amount || !reference) return res.status(400).json({ message: 'Amount and reference required' });
  try {
    const db = await getDb();
    await db.collection('payments').insertOne({
      userId,
      amount,
      reference,
      status: 'pending',
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Payment submitted, pending confirmation' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleReferral(req, res) {
  const userId = req.user.userId;
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const totalReferrals = await db.collection('users').countDocuments({ referredBy: new ObjectId(userId) });
    res.json({
      totalReferrals,
      referralEarnings: user.referralEarnings || 0,
      referralCode: user.referralCode,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleWithdraw(req, res) {
  const userId = req.user.userId;
  const { amount, bankName, accountNumber, accountName } = req.body;
  if (!amount || !bankName || !accountNumber || !accountName) return res.status(400).json({ message: 'All fields are required' });
  if (amount < 3700) return res.status(400).json({ message: 'Minimum withdrawal is ₦3,700' });
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if ((user.walletBalance || 0) < amount) return res.status(400).json({ message: 'Insufficient balance' });
    await db.collection('withdrawals').insertOne({
      userId,
      userName: user.fullName,
      amount,
      bankName,
      accountNumber,
      accountName,
      status: 'pending',
      createdAt: new Date(),
    });
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { walletBalance: -amount } }
    );
    res.status(201).json({ message: 'Withdrawal request submitted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = { handleDashboard, handleTransactions, handleCreateInvestment, handleSubmitPayment, handleReferral, handleWithdraw };