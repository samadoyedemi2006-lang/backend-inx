// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return; // already connected
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'vaultgrow',
      // modern recommended options (2024–2025)
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    console.log('MongoDB connected →', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;