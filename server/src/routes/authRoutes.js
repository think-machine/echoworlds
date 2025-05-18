import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; // Middleware to verify token

const router = express.Router();

// --- Public Routes ---

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginUser);

// --- Protected Routes ---

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Requires valid JWT)
// We use the 'protect' middleware here
router.get('/profile', protect, getUserProfile);

// Add routes for password reset later
// router.post('/forgotpassword', forgotPassword);
// router.put('/resetpassword/:resettoken', resetPassword);

export default router;
