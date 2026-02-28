const express = require('express');
const { handleRegister, handleLogin, handleAdminLogin } = require('../controllers/auth.controller');
const router = express.Router();
router.post('/auth/register', handleRegister);
router.post('/auth/login', handleLogin);
router.post('/auth/admin/login', handleAdminLogin);
module.exports = router;