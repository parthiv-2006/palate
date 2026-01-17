const express = require('express');
const router = express.Router();
const {
  register,
  login,
  registerPasskeyOptions,
  registerPasskeyVerify,
  loginPasskeyOptions,
  loginPasskeyVerify,
} = require('../controllers/auth.controller');

// Password-based authentication endpoints
router.post('/register', register);
router.post('/login', login);

// Passkey / WebAuthn endpoints
router.post('/register-passkey-options', registerPasskeyOptions);
router.post('/register-passkey-verify', registerPasskeyVerify);
router.post('/login-passkey-options', loginPasskeyOptions);
router.post('/login-passkey-verify', loginPasskeyVerify);

module.exports = router;
