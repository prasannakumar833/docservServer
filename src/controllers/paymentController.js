const razorpayInstance = require('../config/razorpay');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');

exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const amount = appointment.doctorId.consultationFee * 100;

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${appointmentId}`,
      notes: {
        appointmentId: appointmentId,
        patientId: req.user._id.toString(),
        doctorId: appointment.doctorId._id.toString()
      }
    };

    const order = await razorpayInstance.orders.create(options);

    const payment = await Payment.create({
      razorpayOrderId: order.id,
      appointmentId: appointment._id,
      patientId: req.user._id,
      doctorId: appointment.doctorId._id,
      amount: amount / 100,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      order,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'successful';
    payment.transactionDate = new Date();

    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    appointment.isPaid = true;
    appointment.paymentId = payment._id;
    appointment.status = 'confirmed';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('appointmentId', 'appointmentId appointmentDate appointmentTime')
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialization');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
