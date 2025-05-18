import mongoose from 'mongoose';

// Subdocument schema for a single border state in history
const borderStateSchema = new mongoose.Schema({
  year: { // The year these borders became effective
    type: Number,
    required: true,
  },
  coordinates: { // Stores the polygon/multipolygon coordinate data for this year
    // For 'Polygon': [[[x1, y1], [x2, y2], ..., [x1, y1]]] (array of linear rings, first is exterior, others are holes)
    // For 'MultiPolygon': [[[[x1,y1],...]], [[[x1,y1],...]]] (array of Polygons)
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  eventDescription: { // Optional: Brief note about the change (e.g., "Treaty of Verden", "Conquest of Westlands")
    type: String,
    trim: true,
  },
  // You could also store specific map properties per keyframe if they change, e.g., color due to regime change
  // mapProperties: { color: String, fillOpacity: Number } 
}, { _id: false }); // No separate _id for subdocuments unless needed

// Define the schema for the Location model
const locationSchema = new mongoose.Schema(
  {
    world: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'World',
    },
    name: { // e.g., "Kingdom of Eldoria"
      type: String,
      required: [true, 'Location name is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: { // Semantic type, will be "Country" for this focus
      type: String,
      required: [true, 'Location type is required.'],
      default: 'Country', // Defaulting to Country as per current focus
      trim: true,
    },
    // customTypeDetail: String, // Less relevant if type is fixed to 'Country' for now

    parentLocations: [{ // e.g., A country might be part of a "Continent" location
      location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    }],
    
    // Key lifecycle dates for the location entity itself (distinct from border changes)
    foundingYear: { type: Number }, // Year the entity (e.g., Kingdom of Eldoria) was first considered to exist
    dissolutionYear: { type: Number }, // Year the entity ceased to exist

    // --- Geometry for Three.js map data ---
    geometry: {
      // General shape type for the location (most countries will be Polygon/MultiPolygon)
      // This might be useful if a location can change its fundamental shapeType over time,
      // but for countries, it's usually consistent.
      currentShapeType: { 
        type: String,
        enum: ['Polygon', 'MultiPolygon', 'None'], // Countries are typically areas
        default: 'Polygon', // Default for a new country
      },
      
      // History of border definitions
      borderHistory: [borderStateSchema], // Array of border states over time, sorted by year

      // Static map properties (can be overridden by borderHistory mapProperties if implemented there)
      staticMapProperties: {
        color: { type: String, default: '#CCCCCC' }, // Default display color
        fillOpacity: { type: Number, default: 0.7, min: 0, max: 1 },
        strokeColor: { type: String, default: '#333333' },
        strokeOpacity: { type: Number, default: 1, min: 0, max: 1 },
        strokeWidth: {type: Number, default: 1},
        // labelDisplay: Boolean, // etc.
      }
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// --- Indexes ---
locationSchema.index({ world: 1 });
locationSchema.index({ world: 1, name: 1 });
locationSchema.index({ world: 1, type: 1 });
locationSchema.index({ 'geometry.borderHistory.year': 1 }); // Index on the year within borderHistory

// --- Methods ---

// Method to get the effective borders for a given year
locationSchema.methods.getBordersForYear = function(targetYear) {
  if (!this.geometry || !this.geometry.borderHistory || this.geometry.borderHistory.length === 0) {
    return null; // No border history defined
  }
  // Sort history by year descending to find the most recent one less than or equal to targetYear
  const historySorted = [...this.geometry.borderHistory].sort((a, b) => b.year - a.year);
  
  const effectiveState = historySorted.find(state => state.year <= targetYear);
  
  return effectiveState || null; // Return the state or null if no state is effective for that year (e.g., before first entry)
};


// Create the Location model from the schema
const Location = mongoose.model('Location', locationSchema);

export default Location;
