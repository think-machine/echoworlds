import asyncHandler from 'express-async-handler';
import Location from '../models/Location.js';
import World from '../models/World.js'; // To verify world ownership
import mongoose from 'mongoose';

// --- Helper function to check world existence and ownership ---
const checkWorldAccess = async (worldId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(worldId)) {
    return { error: 'Invalid World ID format', status: 400, world: null };
  }
  const world = await World.findById(worldId);
  if (!world) {
    return { error: 'World not found', status: 404, world: null };
  }
  if (world.owner.toString() !== userId.toString()) {
    return { error: 'Not authorized to access this world', status: 403, world: null };
  }
  return { world }; 
};

// @desc    Create a new location (Country) in a specific world
// @route   POST /api/worlds/:worldId/locations
// @access  Private
const createLocationInWorld = asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) {
    res.status(worldAccess.status);
    throw new Error(worldAccess.error);
  }

  const { 
    name, 
    type = 'Country', // Default to Country as per current focus
    description, 
    parentLocations, 
    foundingYear, 
    dissolutionYear,
    geometry // Expecting { currentShapeType, borderHistory: [{year, coordinates, eventDescription}], staticMapProperties }
  } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Location name is required');
  }
  if (!geometry || !geometry.borderHistory || !Array.isArray(geometry.borderHistory) || geometry.borderHistory.length === 0) {
    res.status(400);
    throw new Error('Initial border history with at least one entry (year and coordinates) is required for geometry.');
  }
  if (!geometry.borderHistory[0].year || !geometry.borderHistory[0].coordinates) {
    res.status(400);
    throw new Error('The first border history entry must have a year and coordinates.');
  }
  
  // Validate parentLocations if provided
  let validParentLocations = [];
  if (parentLocations && Array.isArray(parentLocations)) {
    for (const pLoc of parentLocations) {
      if (pLoc.location && mongoose.Types.ObjectId.isValid(pLoc.location)) {
        const parentExists = await Location.findOne({ _id: pLoc.location, world: worldId });
        if (parentExists) {
          validParentLocations.push({ location: pLoc.location });
        }
      }
    }
  }

  // Ensure borderHistory is sorted by year if multiple entries are provided at creation (unlikely but good practice)
  const sortedBorderHistory = [...geometry.borderHistory].sort((a, b) => a.year - b.year);

  const locationData = {
    world: worldId,
    name,
    type, // Should be 'Country' for now
    description,
    parentLocations: validParentLocations,
    foundingYear: foundingYear ? Number(foundingYear) : (sortedBorderHistory[0]?.year || undefined), // Default founding year to first border history year
    dissolutionYear: dissolutionYear ? Number(dissolutionYear) : undefined,
    geometry: {
      currentShapeType: geometry.currentShapeType || 'Polygon', // Default to Polygon
      borderHistory: sortedBorderHistory.map(bh => ({
          year: Number(bh.year),
          coordinates: bh.coordinates, // Add validation for coordinate structure later
          eventDescription: bh.eventDescription || undefined,
      })),
      staticMapProperties: geometry.staticMapProperties || { color: '#CCCCCC', fillOpacity: 0.7, strokeColor: '#333333', strokeOpacity: 1, strokeWidth: 1 }
    }
  };

  const location = await Location.create(locationData);

  const populatedLocation = await Location.findById(location._id)
    .populate('parentLocations.location', 'name type');

  res.status(201).json(populatedLocation);
});

// @desc    Get all locations in a specific world
// @route   GET /api/worlds/:worldId/locations
// @access  Private
const getLocationsInWorld = asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) {
    res.status(worldAccess.status);
    throw new Error(worldAccess.error);
  }

  // For map display, you might want to send all locations
  // The frontend will then use location.getBordersForYear(currentMapYear)
  const locations = await Location.find({ world: worldId })
    .populate('parentLocations.location', 'name type')
    .sort({ type: 1, name: 1 });

  res.json(locations);
});

// @desc    Get details of a specific location
// @route   GET /api/worlds/:worldId/locations/:locationId
// @access  Private
const getLocationDetails = asyncHandler(async (req, res) => {
  const { worldId, locationId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) {
    res.status(worldAccess.status);
    throw new Error(worldAccess.error);
  }

  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    res.status(400);
    throw new Error('Invalid Location ID format');
  }

  const location = await Location.findOne({ _id: locationId, world: worldId })
    .populate('parentLocations.location', 'name type');

  if (!location) {
    res.status(404);
    throw new Error('Location not found in this world');
  }

  res.json(location);
});

// @desc    Update a location in a specific world (including adding/modifying border keyframes)
// @route   PUT /api/worlds/:worldId/locations/:locationId
// @access  Private
const updateLocationInWorld = asyncHandler(async (req, res) => {
  const { worldId, locationId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(locationId)) { res.status(400); throw new Error('Invalid Location ID format');}

  const location = await Location.findOne({ _id: locationId, world: worldId });
  if (!location) { res.status(404); throw new Error('Location not found in this world');}

  const { name, type, description, parentLocations, foundingYear, dissolutionYear, geometry } = req.body;

  // Update basic fields
  if (name !== undefined) location.name = name;
  if (type !== undefined) location.type = type; // Should remain 'Country' for now
  if (description !== undefined) location.description = description;
  if (foundingYear !== undefined) location.foundingYear = Number(foundingYear) || null;
  if (dissolutionYear !== undefined) location.dissolutionYear = Number(dissolutionYear) || null;

  // Update parentLocations (similar to create)
  if (parentLocations !== undefined && Array.isArray(parentLocations)) {
    let validParentLocations = [];
    for (const pLoc of parentLocations) {
      if (pLoc.location && mongoose.Types.ObjectId.isValid(pLoc.location)) {
        const parentExists = await Location.findOne({ _id: pLoc.location, world: worldId });
        if (parentExists && parentExists._id.toString() !== locationId) {
          validParentLocations.push({ location: pLoc.location });
        }
      }
    }
    location.parentLocations = validParentLocations;
  }

  // Update geometry: currentShapeType, staticMapProperties, and borderHistory
  if (geometry) {
    if (geometry.currentShapeType !== undefined) {
        location.geometry.currentShapeType = geometry.currentShapeType;
    }
    if (geometry.staticMapProperties !== undefined) {
        // Merge new properties with existing ones to allow partial updates
        location.geometry.staticMapProperties = { 
            ...location.geometry.staticMapProperties, 
            ...geometry.staticMapProperties 
        };
    }

    // Handle borderHistory updates (this is the complex part for keyframes)
    // The request could send a full new borderHistory array, or a specific keyframe to add/update.
    // For simplicity now, let's assume the frontend sends the *entire desired borderHistory array*.
    // More granular updates (add/modify/delete specific keyframe) could be separate endpoints or actions.
    if (geometry.borderHistory !== undefined && Array.isArray(geometry.borderHistory)) {
        const validatedHistory = [];
        for (const state of geometry.borderHistory) {
            if (state.year !== undefined && state.coordinates !== undefined) { // Basic validation
                validatedHistory.push({
                    year: Number(state.year),
                    coordinates: state.coordinates, // Add deeper validation for coordinate structure later
                    eventDescription: state.eventDescription || undefined,
                });
            } else {
                console.warn("Skipping border history entry due to missing year or coordinates:", state);
            }
        }
        // Sort by year to ensure correct order for the getBordersForYear method
        location.geometry.borderHistory = validatedHistory.sort((a, b) => a.year - b.year);
    }
  }

  await location.save();
  
  const populatedLocation = await Location.findById(location._id)
    .populate('parentLocations.location', 'name type');

  res.json(populatedLocation);
});

// @desc    Delete a location from a specific world
// @route   DELETE /api/worlds/:worldId/locations/:locationId
// @access  Private
const deleteLocationInWorld = asyncHandler(async (req, res) => {
  const { worldId, locationId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(locationId)) { res.status(400); throw new Error('Invalid Location ID format');}

  const location = await Location.findOne({ _id: locationId, world: worldId });
  if (!location) { res.status(404); throw new Error('Location not found');}

  await Location.updateMany(
    { world: worldId, 'parentLocations.location': locationId },
    { $pull: { parentLocations: { location: locationId } } }
  );
  await mongoose.model('Person').updateMany(
    { world: worldId, nationality: locationId },
    { $unset: { nationality: "" } }
  );
  // TODO: Unlink from Events

  await Location.deleteOne({ _id: locationId });
  res.json({ message: 'Location removed successfully' });
});

export {
  createLocationInWorld,
  getLocationsInWorld,
  getLocationDetails,
  updateLocationInWorld,
  deleteLocationInWorld,
};
