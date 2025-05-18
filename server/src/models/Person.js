import mongoose from 'mongoose';

const personSchema = new mongoose.Schema(
  {
    world: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'World',
    },
    name: {
      type: String,
      required: [true, 'Person name is required.'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-binary', 'Other', 'Unknown'],
      default: 'Unknown',
    },
    birthYear: {
      type: Number,
    },
    deathYear: {
      type: Number,
    },
    bio: { 
      type: String,
      default: '',
    },
    nationality: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    // Biological Parents
    parents: {
      mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      father: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    },
    // Adoptive Parents
    adoptiveParents: {
      mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      father: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      adoptionYear: { type: Number }, // Year adoption took place
    },
    spouses: [{
      person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      marriageYear: { type: Number },
      endYear: { type: Number }, // Year marriage ended
      reasonForEnd: { // Reason marriage ended
        type: String,
        enum: ['Divorce', 'Death', 'Annullment', 'Other', 'Unknown'], // Customizable
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

personSchema.index({ world: 1 });
personSchema.index({ world: 1, name: 1 });

personSchema.virtual('age').get(function() {
  if (this.birthYear) {
    const endYear = this.deathYear || new Date().getFullYear();
    return endYear - this.birthYear;
  }
  return null;
});

// Virtual to calculate adoption age if adoptionYear and birthYear are present
personSchema.virtual('adoptionAge').get(function() {
  if (this.birthYear && (this.adoptiveParents?.adoptionYear)) {
    return this.adoptiveParents.adoptionYear - this.birthYear;
  }
  return null;
});


const Person = mongoose.model('Person', personSchema);

export default Person;
