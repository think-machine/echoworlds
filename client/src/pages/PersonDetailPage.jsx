import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';
import FamilyTree from '../components/FamilyTree'; 

const PersonDetailPage = () => {
  const { worldId, personId } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [children, setChildren] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [worldName, setWorldName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchPersonData = async () => {
      setLoading(true);
      setError('');
      setChildren([]);
      setSiblings([]);
      setPerson(null);
      try {
        const worldRes = await apiClient.get(`/worlds/${worldId}`);
        setWorldName(worldRes.data.name);

        const personRes = await apiClient.get(`/worlds/${worldId}/people/${personId}`);
        if (personRes.data) {
            setPerson(personRes.data);
            
            const childrenRes = await apiClient.get(`/worlds/${worldId}/people/${personId}/children`);
            setChildren(childrenRes.data);

            const siblingsRes = await apiClient.get(`/worlds/${worldId}/people/${personId}/siblings`);
            setSiblings(siblingsRes.data);

        } else {
            setError(`Person not found (API returned no data).`);
            setPerson(null);
        }

      } catch (err) {
        console.error('Error fetching person data:', err);
         if (err.response && err.response.status === 401) {
            setError('Your session has expired. Please log in again.');
        } else if (err.response && err.response.status === 404) {
            setError(`Person or World not found.`);
        } else if (err.response && err.response.status === 403) {
            setError('You are not authorized to view this person.');
        } else {
            setError(err.response?.data?.message || 'Failed to fetch person details.');
        }
        setPerson(null);
      } finally {
        setLoading(false);
      }
    };

    if (worldId && personId) {
      fetchPersonData();
    }
  }, [worldId, personId, navigate]);

  const handleDeletePerson = async () => { 
    try {
      await apiClient.delete(`/worlds/${worldId}/people/${personId}`);
      setShowDeleteConfirm(false);
      navigate(`/worlds/${worldId}/people`); 
    } catch (err) {
      console.error('Error deleting person:', err);
      setError(err.response?.data?.message || 'Failed to delete person.');
      setShowDeleteConfirm(false);
    }
  };

  const createSanitizedMarkup = (htmlContent) => { 
    if (!htmlContent) return { __html: '' };
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  const handleAddChildWithSpouse = (spouse) => { 
    if (!person) return;

    let fatherId = '';
    let motherId = '';
    let defaultBirthYear = '';

    if (person.gender === 'Male') {
      fatherId = person._id;
      if (spouse) motherId = spouse._id;
    } else if (person.gender === 'Female') {
      motherId = person._id;
      if (spouse) fatherId = spouse._id;
    } else { 
        if(spouse?.gender === 'Male') motherId = person._id;
        else if(spouse?.gender === 'Female') fatherId = person._id;
        if (spouse) { 
           if(spouse.gender !== 'Female') fatherId = person._id; else motherId = person._id;
           if(spouse.gender !== 'Male') motherId = spouse._id; else fatherId = spouse._id;
        } else { 
            if(person.gender === 'Male') fatherId = person._id;
            else if(person.gender === 'Female') motherId = person._id;
        }
    }

    if (spouse) {
      const currentSpouseRel = person.spouses.find(s => (s.person?._id || s.person) === spouse._id);
      if (currentSpouseRel?.marriageYear) {
        defaultBirthYear = currentSpouseRel.marriageYear;
      }
    }
    if (!defaultBirthYear) {
      const youngestParentBirthYear = Math.max(
        person.birthYear || -Infinity,
        spouse?.birthYear || -Infinity
      );
      if (youngestParentBirthYear > -Infinity) {
        defaultBirthYear = youngestParentBirthYear + 18;
      }
    }
    
    navigate(`/worlds/${worldId}/people/add`, { 
      state: { 
        fatherId: fatherId || undefined,
        motherId: motherId || undefined,
        defaultBirthYear: defaultBirthYear || undefined,
      } 
    });
  };

  if (loading) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-xl text-gray-600 dark:text-gray-400">Loading person details...</p>
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
          to={`/worlds/${worldId}/people`}
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to People List
        </Link>
      </div>
    );
   }
  if (!person) { 
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">Person data not available.</p>
            <div className="mt-4">
                <Link
                to={`/worlds/${worldId}/people`}
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to People List
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to={`/worlds/${worldId}/people`}
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Back to People in {worldName}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8">
        {/* Person Name and Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {person?.name || 'Unnamed Person'}
          </h1>
          {/* Restored Action Buttons */}
          <div className="flex space-x-3 flex-shrink-0">
            <Link
              to={`/worlds/${worldId}/people/${personId}/edit`}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 transition-colors duration-150"
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden="true"/>
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-150"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true"/>
              Delete
            </button>
          </div>
        </div>

        {/* Family Tree Component - now receives siblingsData */}
        {person && (
          <FamilyTree 
            currentPerson={person} 
            childrenData={children} 
            siblingsData={siblings} // Pass siblings data
            worldId={worldId}
            onAddChildWithSpouse={handleAddChildWithSpouse}
          />
        )}

        {/* Core Details Section - Can be placed after the tree or integrated differently */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-gray-700 dark:text-gray-300">
          <div><strong>Gender:</strong> {person?.gender || 'N/A'}</div>
          <div><strong>Birth Year:</strong> {person?.birthYear || 'N/A'}</div>
          <div><strong>Death Year:</strong> {person?.deathYear || 'N/A'}</div>
          <div><strong>Age:</strong> {(person && (person.age !== null && person.age !== undefined)) ? person.age : 'N/A'}</div>
        </div>

        {/* Biography Section */}
         {person?.bio && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Biography</h2>
            <div 
              className="prose dark:prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg" 
              dangerouslySetInnerHTML={createSanitizedMarkup(person.bio)} 
            />
          </div>
        )}
        
        {/* Events Timeline Section */}
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Events Timeline</h2>
            <p className="text-gray-500 dark:text-gray-400">Significant events in {person?.name || 'this person'}'s life will appear here.</p>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{person?.name || 'this person'}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePerson}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonDetailPage;
