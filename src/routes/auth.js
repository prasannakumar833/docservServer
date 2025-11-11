const express = require('express');
const router = express.Router();
const {
  loginOrRegister,
  verifyOTP,
  resendOTP,
  adminLogin
} = require('../controllers/authController');

router.post('/login', loginOrRegister);
router.get('/', (req,res) => res.send("Auth route working"));
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/admin/login', adminLogin);

module.exports = router;
