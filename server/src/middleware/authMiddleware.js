import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Middleware to protect routes that require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for the token in the Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header ('Bearer TOKEN_STRING')
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user associated with the token's ID
      // Exclude the password field from the returned user object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
      }

      // User is authenticated, proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401); // Unauthorized
      throw new Error('Not authorized, token failed');
    }
  }

  // If no token is found in the header
  if (!token) {
    res.status(401); // Unauthorized
    throw new Error('Not authorized, no token');
  }
});

// Optional: Middleware for role-based access control (if needed later)
// const admin = (req, res, next) => {
//   if (req.user && req.user.isAdmin) { // Assuming you add an 'isAdmin' field to User model
//     next();
//   } else {
//     res.status(401);
//     throw new Error('Not authorized as an admin');
//   }
// };

export { protect }; // Add 'admin' here if you implement it
