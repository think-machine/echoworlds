import express from 'express';
import {
  createPersonInWorld,
  getPeopleInWorld,
  getPersonDetails,
  updatePersonInWorld,
  deletePersonInWorld,
  getPersonChildren,
  getPersonSiblings, // Import the new controller function
} from '../controllers/personController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// --- Routes for People within a World ---
// Base path for these routes will be /api/worlds/:worldId/people

router.route('/')
  .post(createPersonInWorld)
  .get(getPeopleInWorld);

router.route('/:personId')
  .get(getPersonDetails)
  .put(updatePersonInWorld)
  .delete(deletePersonInWorld);

router.route('/:personId/children')
  .get(getPersonChildren);

// New route to get siblings of a specific person
router.route('/:personId/siblings')
  .get(getPersonSiblings); // GET /api/worlds/:worldId/people/:personId/siblings


export default router;
