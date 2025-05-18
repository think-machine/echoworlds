import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables specifically for db connection if not already loaded globally
// This might be redundant if server.js loads it, but ensures MONGO_URI is available
dotenv.config({ path: '../../.env' }); // Adjust path if .env is in the root project folder


const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log successful connection
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log any connection errors
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit the process with failure status code
    process.exit(1);
  }
};

export default connectDB;
