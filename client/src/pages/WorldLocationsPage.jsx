import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon, PlusCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';

const WorldLocationsPage = () => {
  const { worldId } = useParams();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [worldName, setWorldName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocationsAndWorld = async () => {
      setLoading(true);
      setError('');
      try {
        const worldResponse = await apiClient.get(`/worlds/${worldId}`);
        setWorldName(worldResponse.data.name);

        const locationsResponse = await apiClient.get(`/worlds/${worldId}/locations`);
        setLocations(locationsResponse.data);

      } catch (err) {
        console.error('Error fetching data for locations page:', err);
        if (err.response && err.response.status === 401) {
            setError('Your session has expired. Please log in again.');
            navigate('/login');
        } else if (err.response && err.response.status === 404) {
            setError(`World with ID ${worldId} not found or you do not have access.`);
        } else if (err.response && err.response.status === 403) {
            setError('You are not authorized to view locations in this world.');
        } else {
            setError(err.response?.data?.message || 'Failed to fetch data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (worldId) {
      fetchLocationsAndWorld();
    }
  }, [worldId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-gray-600 dark:text-gray-400">Loading locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-6 rounded-md shadow-md max-w-md mx-auto" role="alert">
          <p className="font-bold text-lg">Error</p>
          <p>{error}</p>
        </div>
        <Link
          to={`/worlds/${worldId}`}
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to World Details
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <Link
            to={`/worlds/${worldId}`}
            className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 mb-2 sm:mb-0"
            >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to {worldName || 'World'} Details
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mt-1">
                Locations in {worldName || 'this World'}
            </h1>
        </div>
        <Link
          to={`/worlds/${worldId}/locations/add`}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-150"
        >
          <PlusCircleIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add New Location
        </Link>
      </div>

      {locations.length === 0 && (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No locations added yet.</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start by adding the first location (e.g., a Country or Continent) to {worldName || 'this world'}.</p>
          <div className="mt-6">
            <Link
              to={`/worlds/${worldId}/locations/add`}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add New Location
            </Link>
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Parents</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">View/Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {locations.map((location) => (
                <tr key={location._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {location.type === 'Custom' && location.customTypeDetail ? `${location.type} (${location.customTypeDetail})` : location.type}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                    {location.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {location.parentLocations && location.parentLocations.length > 0 
                        ? location.parentLocations.map(p => p.location?.name || 'Unknown').join(', ') 
                        : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/worlds/${worldId}/locations/${location._id}`} // Link to LocationDetailPage
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 mr-3"
                    >
                      View
                    </Link>
                    {/* <Link
                      to={`/worlds/${worldId}/locations/${location._id}/edit`} // Link to EditLocationPage
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200"
                    >
                      Edit
                    </Link> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorldLocationsPage;
