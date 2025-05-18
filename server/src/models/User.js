import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for the User model
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      // Basic email format validation
      match: [/.+\@.+\..+/, 'Please enter a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false, // Do not return password field by default in queries
    },
    // Add other user-related fields if needed (e.g., registration date, last login)
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// --- Mongoose Middleware ---

// Hash password before saving a new user or when password is modified
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
    // Hash the password using the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/error handler
  }
});

// --- Mongoose Instance Methods ---

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // 'this.password' refers to the hashed password of the user instance
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the User model from the schema
const User = mongoose.model('User', userSchema);

export default User;
