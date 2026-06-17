const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route untuk mendapatkan statistik dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Route untuk mendapatkan daftar pengguna
router.get('/users', adminController.getUsers);

// Route untuk block/suspend pengguna
router.put('/users/:userId/toggle-status', adminController.toggleUserStatus);

module.exports = router;
