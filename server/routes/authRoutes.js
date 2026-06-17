const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rute Registrasi
router.post('/register', authController.register);

// Rute Login
router.post('/login', authController.login);

module.exports = router;
