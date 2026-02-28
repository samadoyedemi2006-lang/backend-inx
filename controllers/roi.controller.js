const Investment = require('../models/Investment');
const User = require('../models/User');

const ROI_INTERVAL_MS = 10 * 60 * 1000;

async function handleTriggerRoi(req, res) {
  try {
    const now = new Date();

    const activeInvestments = await Investment.find({
      status: 'confirmed',
      paymentConfirmed: true,
      roiDaysCompleted: { $lt: 5 },
    });

    let processed = 0;

    for (const inv of activeInvestments) {
      const lastRoiAt = inv.lastRoiAt ? new Date(inv.lastRoiAt) : null;

      if (lastRoiAt && now.getTime() - lastRoiAt.getTime() < ROI_INTERVAL_MS) {
        continue;
      }

      const dailyReturn = inv.amount * 0.15;
      const newDays = inv.roiDaysCompleted + 1;
      const isComplete = newDays >= 5;

      inv.roiDaysCompleted = newDays;
      inv.lastRoiAt = now;
      if (isComplete) {
        inv.status = 'completed';
        inv.completedAt = now;
      }

      await inv.save();

      await User.updateOne(
        { _id: inv.userId },
        {
          $inc: {
            walletBalance: dailyReturn,
            withdrawableBalance: dailyReturn,
            ...(isComplete ? { activeInvestments: -1 } : {}),
          },
        }
      );

      processed++;
    }

    res.json({
      message: `Processed ${processed} investments`,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleTriggerRoi };