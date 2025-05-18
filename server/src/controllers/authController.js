import asyncHandler from 'express-async-handler'; // Middleware to handle async errors
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    res.status(400); // Bad Request
    throw new Error('Please provide username, email, and password');
  }

  // Check if user already exists (by email or username)
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400); // Bad Request
    throw new Error('User already exists with this email or username');
  }

  // Create new user (password hashing is handled by Mongoose middleware)
  const user = await User.create({
    username,
    email,
    password,
  });

  // If user creation was successful
  if (user) {
    // Generate JWT token
    const token = generateToken(user._id);

    // Respond with user info (excluding password) and token
    res.status(201).json({ // 201 Created
      _id: user._id,
      username: user.username,
      email: user.email,
      token: token,
    });
  } else {
    res.status(400); // Bad Request
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user by email (include password field for comparison)
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Generate JWT token
    const token = generateToken(user._id);

    // Respond with user info (excluding password) and token
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: token,
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Requires valid JWT)
const getUserProfile = asyncHandler(async (req, res) => {
  // The user object is attached to req by the 'protect' middleware
  const user = await User.findById(req.user._id); // req.user comes from protect middleware

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      // Add any other profile fields you want to return
    });
  } else {
    res.status(404); // Not Found
    throw new Error('User not found');
  }
});


export { registerUser, loginUser, getUserProfile };
