const express = require('express');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { handleTriggerRoi } = require('../controllers/roi.controller');
const router = express.Router();
router.post('/admin/trigger-roi', authenticate, isAdmin, handleTriggerRoi);
module.exports = router;