import asyncHandler from 'express-async-handler';
import World from '../models/World.js';
import mongoose from 'mongoose'; // Needed for ObjectId validation

// @desc    Create a new world
// @route   POST /api/worlds
// @access  Private (requires login via 'protect' middleware)
const createWorld = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Basic validation
  if (!name) {
    res.status(400); // Bad Request
    throw new Error('World name is required');
  }

  // Create the world object
  const world = new World({
    name,
    description: description || '', // Use provided description or default to empty string
    owner: req.user._id, // Get owner ID from the authenticated user (attached by 'protect' middleware)
  });

  // Save the world to the database
  const createdWorld = await world.save();
  res.status(201).json(createdWorld); // Respond with the created world data (201 Created)
});

// @desc    Get all worlds belonging to the logged-in user
// @route   GET /api/worlds
// @access  Private
const getMyWorlds = asyncHandler(async (req, res) => {
  // Find all worlds where the owner field matches the logged-in user's ID
  const worlds = await World.find({ owner: req.user._id }).sort({ createdAt: -1 }); // Sort by newest first
  res.json(worlds); // Respond with the list of worlds
});

// @desc    Get a single world by its ID
// @route   GET /api/worlds/:id
// @access  Private
const getWorldById = asyncHandler(async (req, res) => {
  const worldId = req.params.id;

  // Validate if the provided ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(worldId)) {
      res.status(400); // Bad Request
      throw new Error('Invalid World ID format');
  }

  // Find the world by ID
  const world = await World.findById(worldId);

  // Check if the world exists
  if (!world) {
    res.status(404); // Not Found
    throw new Error('World not found');
  }

  // Check if the logged-in user is the owner of the world
  // Convert ObjectId to string for comparison
  if (world.owner.toString() !== req.user._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to access this world');
  }

  // Respond with the world data
  res.json(world);
});

// @desc    Update a world
// @route   PUT /api/worlds/:id
// @access  Private
const updateWorld = asyncHandler(async (req, res) => {
  const worldId = req.params.id;
  const { name, description } = req.body;

   // Validate if the provided ID is a valid MongoDB ObjectId
   if (!mongoose.Types.ObjectId.isValid(worldId)) {
    res.status(400); // Bad Request
    throw new Error('Invalid World ID format');
}

  // Find the world by ID
  const world = await World.findById(worldId);

  // Check if the world exists
  if (!world) {
    res.status(404); // Not Found
    throw new Error('World not found');
  }

  // Check if the logged-in user is the owner
  if (world.owner.toString() !== req.user._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to update this world');
  }

  // Update the world fields if provided in the request body
  world.name = name || world.name; // Keep original name if not provided
  world.description = description !== undefined ? description : world.description; // Allow setting empty description

  // Save the updated world
  const updatedWorld = await world.save();
  res.json(updatedWorld); // Respond with the updated world data
});

// @desc    Delete a world
// @route   DELETE /api/worlds/:id
// @access  Private
const deleteWorld = asyncHandler(async (req, res) => {
  const worldId = req.params.id;

   // Validate if the provided ID is a valid MongoDB ObjectId
   if (!mongoose.Types.ObjectId.isValid(worldId)) {
    res.status(400); // Bad Request
    throw new Error('Invalid World ID format');
}

  // Find the world by ID
  const world = await World.findById(worldId);

  // Check if the world exists
  if (!world) {
    res.status(404); // Not Found
    throw new Error('World not found');
  }

  // Check if the logged-in user is the owner
  if (world.owner.toString() !== req.user._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to delete this world');
  }

  // Delete the world
  // Mongoose v6+ uses deleteOne() on the model instance result
  await World.deleteOne({ _id: worldId });


  // TODO: Consider deleting associated People, Locations, Events within this world later.
  // This requires cascading deletes or careful data management.

  res.json({ message: 'World removed successfully' }); // Respond with success message
});


export {
  createWorld,
  getMyWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
};
