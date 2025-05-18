import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; // Your pre-configured Axios instance
import { PlusCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // Example icons

const DashboardPage = () => {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user info from localStorage (if stored during login)
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error("Failed to parse user info from localStorage", e);
        // Potentially clear corrupted item or handle error
      }
    }

    // Fetch worlds for the logged-in user
    const fetchWorlds = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/worlds'); // GET /api/worlds
        setWorlds(response.data);
      } catch (err) {
        console.error('Error fetching worlds:', err);
        if (err.response && err.response.status === 401) {
          // Token might be invalid or expired, redirect to login
          setError('Your session has expired. Please log in again.');
          // Consider clearing token and user info here
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch worlds. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorlds();
  }, [navigate]);

  const handleLogout = () => {
    // Clear token and user info from localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    // TODO: Update global auth state if using Context API or Redux/Zustand
    // Redirect to login page
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-gray-600 dark:text-gray-400">Loading your worlds...</p>
        {/* You can add a spinner icon here */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
          {userInfo ? `Welcome, ${userInfo.username}!` : 'Your Dashboard'}
        </h1>
        <div className="flex gap-x-3">
          <Link
            to="/worlds/create" // We'll need to create this page/route next
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-150"
          >
            <PlusCircleIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Create New World
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-150"
          >
            <ArrowRightOnRectangleIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Display Worlds */}
      {worlds.length === 0 && !loading && !error && (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No worlds yet!</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first world.</p>
          <div className="mt-6">
            <Link
              to="/worlds/create"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create New World
            </Link>
          </div>
        </div>
      )}

      {worlds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.map((world) => (
            <Link
              key={world._id}
              to={`/worlds/${world._id}`} // Link to the specific world detail page
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 mb-2">{world.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                {world.description || 'No description available.'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Created: {new Date(world.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
