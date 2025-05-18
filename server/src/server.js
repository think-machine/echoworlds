import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import route handlers
import authRoutes from './routes/authRoutes.js';
import worldRoutes from './routes/worldRoutes.js';
import personRoutes from './routes/personRoutes.js'; // Import person routes

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the World Builder API!' });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount world routes
app.use('/api/worlds', worldRoutes);

// Mount person routes nested under worlds
// Any request to /api/worlds/:worldId/people will be handled by personRoutes
app.use('/api/worlds/:worldId/people', personRoutes);


// --- Error Handling Middleware ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
