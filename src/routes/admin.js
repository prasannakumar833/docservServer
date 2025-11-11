const express = require('express');
const router = express.Router();
const {
  verifyDoctorCertificates,
  blockUser,
  unblockUser,
  deleteUser,
  getAllDoctors,
  getAllPatients,
  getSupportMessages,
  respondToSupport,
  getDashboardStats,
  createAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

router.use(protect);
router.use(authorize('admin'));

router.post('/doctors/verify', checkPermission('canVerify'), verifyDoctorCertificates);
router.post('/users/block', checkPermission('canBlock'), blockUser);
router.post('/users/unblock', checkPermission('canBlock'), unblockUser);
router.delete('/users/delete', checkPermission('canDelete'), deleteUser);
router.get('/doctors', getAllDoctors);
router.get('/patients', getAllPatients);
router.get('/support', getSupportMessages);
router.post('/support/:messageId/respond', checkPermission('canEdit'), respondToSupport);
router.get('/stats', getDashboardStats);
router.post('/create', createAdmin);

module.exports = router;
