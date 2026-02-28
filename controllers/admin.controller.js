const { ObjectId } = require('mongodb');
const getDb = require('../config/db');

async function handleAdminOverview(req, res) {
  try {
    const db = await getDb();
    const users = db.collection('users');
    const investments = db.collection('investments');
    const totalUsers = await users.countDocuments({ isAdmin: { $ne: true } });
    const totalInvestments = await investments.countDocuments();
    const pendingInvestments = await investments.countDocuments({ status: 'pending' });
    const confirmedInvestments = await investments.countDocuments({ status: 'confirmed' });
    const allInvestments = await investments.find({ status: 'confirmed' }).toArray();
    const totalPlatformIncome = allInvestments.reduce((sum, i) => sum + (i.amount || 0), 0);
    res.json({
      totalUsers,
      totalInvestments,
      totalPlatformIncome,
      pendingInvestments,
      confirmedInvestments,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleAdminUsers(req, res) {
  try {
    const db = await getDb();
    const users = await db.collection('users')
      .find({ isAdmin: { $ne: true } })
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(
      users.map(u => ({
        id: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        walletBalance: u.walletBalance || 0,
        totalInvested: u.totalInvested || 0,
        isBlocked: u.isBlocked || false,
        createdAt: u.createdAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleToggleBlock(req, res) {
  const userId = req.params.userId;
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: !user.isBlocked } }
    );
    res.json({ message: user.isBlocked ? 'User unblocked' : 'User blocked' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleAdminInvestments(req, res) {
  try {
    const db = await getDb();
    const investments = await db.collection('investments').find().sort({ createdAt: -1 }).toArray();
    const userIds = [...new Set(investments.map(i => i.userId))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ fullName: 1 })
      .toArray();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.fullName]));
    res.json(
      investments.map(i => ({
        id: i._id.toString(),
        userId: i.userId,
        userName: userMap[i.userId] || 'Unknown',
        planName: i.planName,
        amount: i.amount,
        status: i.status,
        createdAt: i.createdAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleConfirmInvestment(req, res) {
  const { investmentId } = req.body;
  if (!investmentId) return res.status(400).json({ message: 'Investment ID required' });
  try {
    const db = await getDb();
    const result = await db.collection('investments').updateOne(
      { _id: new ObjectId(investmentId) },
      { $set: { status: 'confirmed', confirmedAt: new Date(), roiDaysCompleted: 0, paymentConfirmed: true } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Investment not found' });
    res.json({ message: 'Investment confirmed. Daily ROI will now begin for this user.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleAdminWithdrawals(req, res) {
  try {
    const db = await getDb();
    const withdrawals = await db.collection('withdrawals').find().sort({ createdAt: -1 }).toArray();
    res.json(
      withdrawals.map(w => ({
        id: w._id.toString(),
        userId: w.userId,
        userName: w.userName || 'Unknown',
        amount: w.amount,
        bankName: w.bankName,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        status: w.status,
        createdAt: w.createdAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleApproveWithdrawal(req, res) {
  const { withdrawalId } = req.body;
  if (!withdrawalId) return res.status(400).json({ message: 'Withdrawal ID required' });
  try {
    const db = await getDb();
    const result = await db.collection('withdrawals').updateOne(
      { _id: new ObjectId(withdrawalId) },
      { $set: { status: 'paid', paidAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Withdrawal not found' });
    res.json({ message: 'Withdrawal approved' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleAdminPayments(req, res) {
  try {
    const db = await getDb();
    const payments = await db.collection('payments').find().sort({ createdAt: -1 }).toArray();
    const userIds = [...new Set(payments.map(p => p.userId))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ fullName: 1 })
      .toArray();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.fullName]));
    res.json(
      payments.map(p => ({
        id: p._id.toString(),
        userId: p.userId,
        userName: userMap[p.userId] || 'Unknown',
        amount: p.amount,
        reference: p.reference,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function handleConfirmPayment(req, res) {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ message: 'Payment ID required' });
  try {
    const db = await getDb();
    const payment = await db.collection('payments').findOne({ _id: new ObjectId(paymentId) });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await db.collection('payments').updateOne(
      { _id: new ObjectId(paymentId) },
      { $set: { status: 'confirmed', confirmedAt: new Date() } }
    );
    await db.collection('users').updateOne(
      { _id: new ObjectId(payment.userId) },
      { $inc: { walletBalance: payment.amount } }
    );
    res.json({ message: 'Payment confirmed and wallet credited' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = {
  handleAdminOverview,
  handleAdminUsers,
  handleToggleBlock,
  handleAdminInvestments,
  handleConfirmInvestment,
  handleAdminWithdrawals,
  handleApproveWithdrawal,
  handleAdminPayments,
  handleConfirmPayment,
};