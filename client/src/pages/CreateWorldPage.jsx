import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api'; // Your pre-configured Axios instance
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CreateWorldPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('World name is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/worlds', { name, description });
      setLoading(false);
      setSuccessMessage(`World "${response.data.name}" created successfully!`);
      // Clear form
      setName('');
      setDescription('');

      // Redirect to the dashboard or the new world's detail page after a delay
      setTimeout(() => {
        navigate('/dashboard'); // Or navigate(`/worlds/${response.data._id}`);
      }, 2000);

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create world. Please try again.');
      }
      console.error('Create world error:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <div className="mb-6">
            <Link
                to="/dashboard"
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
            </Link>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-8">
          Create a New World
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
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
                placeholder="e.g., Aethelgard, The Star Kingdom of Xylos"
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
                placeholder="A brief overview of your world, its key characteristics, or themes."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? 'Creating World...' : 'Create World'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorldPage;
