import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: '../../.env' }); // Adjust path if .env is in the root project folder


// Function to generate a JWT for a given user ID
const generateToken = (id) => {
  // Sign the token with the user's ID as payload
  return jwt.sign(
    { id }, // Payload: typically contains user identifier
    process.env.JWT_SECRET, // Secret key from environment variables
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d', // Token expiration time
    }
  );
};

export default generateToken;
