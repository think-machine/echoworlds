import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditWorldPage = () => {
  const { worldId } = useParams(); // Get worldId from URL
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [originalName, setOriginalName] = useState(''); // To display in title while editing
  const [loading, setLoading] = useState(true); // Start true to load initial data
  const [saving, setSaving] = useState(false); // For save button state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchWorldData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/worlds/${worldId}`);
        setName(response.data.name);
        setOriginalName(response.data.name);
        setDescription(response.data.description || '');
      } catch (err) {
        console.error('Error fetching world data for edit:', err);
        if (err.response && err.response.status === 401) {
            navigate('/login'); // Redirect if not authorized
        } else if (err.response && err.response.status === 404) {
            setError('World not found.');
        } else {
            setError('Failed to load world data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (worldId) {
      fetchWorldData();
    }
  }, [worldId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('World name is required.');
      setSaving(false);
      return;
    }

    try {
      const response = await apiClient.put(`/worlds/${worldId}`, { name, description });
      setSuccessMessage(`World "${response.data.name}" updated successfully!`);
      setOriginalName(response.data.name); // Update original name in case user edits again
      // Optionally, redirect after a delay
      setTimeout(() => {
        navigate(`/worlds/${worldId}`); // Navigate back to the detail page
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update world. Please try again.');
      }
      console.error('Update world error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-gray-600 dark:text-gray-400">Loading world for editing...</p>
      </div>
    );
  }

  if (error && !name) { // If error and no data loaded (e.g. world not found)
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-6 rounded-md shadow-md max-w-md mx-auto" role="alert">
              <p className="font-bold text-lg">Error</p>
              <p>{error}</p>
            </div>
            <Link
                to="/dashboard"
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
            </Link>
        </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <div className="mb-6">
            <Link
                to={worldId ? `/worlds/${worldId}` : "/dashboard"} // Link back to detail page or dashboard if no ID
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to World Details
            </Link>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-8">
          Edit World: {originalName || 'Loading...'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && ( // Display general errors here, specific field errors could be handled differently
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success: </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="worldName"
              className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
            >
              World Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-2">
              <input
                id="worldName"
                name="worldName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="worldDescription"
              className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
            >
              Description (Optional)
            </label>
            <div className="mt-2">
              <textarea
                id="worldDescription"
                name="worldDescription"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading} // Disable if loading initial data or saving
              className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorldPage;
