// Middleware to handle requests for routes that don't exist (404 Not Found)
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next error handler
  };
  
  // General error handling middleware (catches errors passed via next())
  const errorHandler = (err, req, res, next) => {
    // Sometimes errors come with a status code, otherwise default to 500 (Internal Server Error)
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
  
    // Handle specific Mongoose errors for better client feedback
    // Mongoose Bad ObjectId Error
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      statusCode = 404; // Not Found
      message = 'Resource not found';
    }
  
    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
      statusCode = 400; // Bad Request
      // Combine multiple validation messages if they exist
      message = Object.values(err.errors)
        .map((val) => val.message)
        .join(', ');
    }
  
      // Mongoose Duplicate Key Error
      if (err.code === 11000) {
        statusCode = 400; // Bad Request
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value entered for ${field}. Please use another value.`;
    }
  
  
    // Send the error response
    res.status(statusCode).json({
      message: message,
      // Include stack trace only in development environment for debugging
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  export { notFound, errorHandler };
  