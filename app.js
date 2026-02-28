const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*',
  allowedHeaders: 'authorization, x-client-info, apikey, content-type',
  methods: 'GET, POST, PATCH, DELETE, OPTIONS',
}));
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const roiRoutes = require('./routes/roi.routes');

app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use(roiRoutes);

app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;