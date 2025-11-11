const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/create-order', authorize('patient'), createOrder);
router.post('/verify', authorize('patient'), verifyPayment);
router.get('/:paymentId', getPaymentDetails);

module.exports = router;
