import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userToken = localStorage.getItem('userToken'); // Check if user is logged in
  const location = useLocation(); // To redirect back after login

  if (!userToken) {
    // User not authenticated, redirect to login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the children components
  return children;
};

export default ProtectedRoute; // Ensure this line is present
