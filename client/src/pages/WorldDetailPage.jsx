import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, UsersIcon, MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';
import FamilyTree from '../components/FamilyTree'; 

const WorldDetailPage = () => {
  const { worldId } = useParams();
  const navigate = useNavigate();

  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // We are not fetching children/siblings here anymore, PersonDetailPage does that.
  // If you need a count or quick summary, you might add separate API calls.

  useEffect(() => {
    const fetchWorldDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/worlds/${worldId}`);
        setWorld(response.data);
      } catch (err) {
        console.error('Error fetching world details:', err);
        if (err.response && err.response.status === 401) {
            setError('Your session has expired. Please log in again.');
            navigate('/login');
        } else if (err.response && err.response.status === 404) {
            setError('World not found. It might have been deleted or the ID is incorrect.');
        } else if (err.response && err.response.status === 403) {
            setError('You are not authorized to view this world.');
        }
        else {
            setError(err.response?.data?.message || 'Failed to fetch world details.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (worldId) {
      fetchWorldDetails();
    }
  }, [worldId, navigate]);

  const handleDeleteWorld = async () => {
    try {
      await apiClient.delete(`/worlds/${worldId}`);
      setShowDeleteConfirm(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting world:', err);
      setError(err.response?.data?.message || 'Failed to delete world.');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) { /* ... loading UI ... */ }
  if (error) { /* ... error UI ... */ }
  if (!world) { /* ... no world data UI ... */ }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Dashboard Link */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>

      {/* World Header */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {world?.name || "World Details"}
          </h1>
          <div className="flex space-x-3 flex-shrink-0">
            <Link
              to={`/worlds/${worldId}/edit`}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 transition-colors duration-150"
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden="true"/>
              Edit World
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-150"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true"/>
              Delete World
            </button>
          </div>
        </div>
        {world?.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg leading-relaxed">
            {world.description}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Created: {world?.createdAt ? new Date(world.createdAt).toLocaleDateString() : 'N/A'} | 
            Last Updated: {world?.updatedAt ? new Date(world.updatedAt).toLocaleDateString() : 'N/A'}
        </p>
      </div>

      {/* Entity Management Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* People Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <UsersIcon className="h-7 w-7 mr-3 text-indigo-500 dark:text-indigo-400" />
            People
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Characters and inhabitants of {world?.name || "this world"}.</p>
          <Link to={`/worlds/${worldId}/people`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-150">
            Manage People &rarr;
          </Link>
        </div>

        {/* Locations Card - Updated Link */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <MapPinIcon className="h-7 w-7 mr-3 text-green-500 dark:text-green-400" />
            Locations
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Key places, regions, and countries within {world?.name || "this world"}.</p>
          <Link to={`/worlds/${worldId}/locations`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-150">
            Manage Locations &rarr;
          </Link>
        </div>

        {/* Events Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-3 text-red-500 dark:text-red-400" />
            Events
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Significant happenings and history of {world?.name || "this world"}.</p>
          <Link to={`/worlds/${worldId}/events`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-150">
            Manage Events &rarr;
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal (remains the same) */}
      {showDeleteConfirm && ( /* ... */ )}
    </div>
  );
};

export default WorldDetailPage;
