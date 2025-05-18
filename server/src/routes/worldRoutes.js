import express from 'express';
import {
  createWorld,
  getMyWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
} from '../controllers/worldController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import protect middleware

const router = express.Router();

// All routes defined here will be automatically prefixed with '/api/worlds' (defined in server.js)

// Apply the 'protect' middleware to all routes in this file
// This ensures only logged-in users can access these world endpoints
router.use(protect);

// Define routes and link them to controller functions
router.route('/')
  .post(createWorld)   // POST /api/worlds - Create a new world
  .get(getMyWorlds);    // GET /api/worlds - Get all worlds for the logged-in user

router.route('/:id')
  .get(getWorldById)    // GET /api/worlds/:id - Get a specific world by its ID
  .put(updateWorld)     // PUT /api/worlds/:id - Update a specific world
  .delete(deleteWorld); // DELETE /api/worlds/:id - Delete a specific world

export default router;
