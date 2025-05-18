import mongoose from 'mongoose';

// Define the schema for the World model
const worldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'World name is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '', // Optional description
    },
    // Link the world to the user who created/owns it
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model
    },
    // We will add references to People, Locations, Events within this world later
    // Example (will be expanded):
    // people: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    // locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    // events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Add indexes for potentially queried fields
worldSchema.index({ owner: 1 });
worldSchema.index({ name: 1, owner: 1 }); // Index for finding worlds by name for a specific owner

// Create the World model from the schema
const World = mongoose.model('World', worldSchema);

export default World;
