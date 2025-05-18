import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold">HomePage Content:</h2> {/* TEMPORARY: For debugging */}
      <h1 className="text-4xl font-bold mb-4">Welcome to World Builder</h1>
      <p className="text-lg mb-6">Create and manage your fictional worlds with ease.</p>
      <div className="space-x-4">
        <Link
          to="/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
