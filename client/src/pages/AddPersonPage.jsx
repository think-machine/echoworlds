import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import TiptapEditor from '../components/TiptapEditor';

const AddPersonPage = () => {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [worldName, setWorldName] = useState('');
  const [allPeopleInWorld, setAllPeopleInWorld] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Unknown',
    birthYear: '',
    deathYear: '',
    bio: '',
    parents: { mother: '', father: '' },
    adoptiveParents: { mother: '', father: '' },
    spouses: [], // Initialize spouses as an empty array
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
        setPageLoading(true);
        try {
            const worldRes = await apiClient.get(`/worlds/${worldId}`);
            setWorldName(worldRes.data.name);

            const peopleRes = await apiClient.get(`/worlds/${worldId}/people`);
            setAllPeopleInWorld(peopleRes.data);

            if (location.state) {
                const { fatherId, motherId, defaultBirthYear } = location.state;
                setFormData(prev => ({
                    ...prev,
                    parents: {
                        mother: motherId || '',
                        father: fatherId || '',
                    },
                    birthYear: defaultBirthYear || '',
                    adoptiveParents: { mother: '', father: '' },
                    spouses: [], // Ensure spouses is initialized if pre-populating parents
                }));
            }
        } catch (err) {
            console.error("Failed to fetch initial data for Add Person page", err);
            setError("Failed to load page data. Please try again.");
            if (err.response && (err.response.status === 404 || err.response.status === 403)) {
                navigate("/dashboard");
            }
        } finally {
            setPageLoading(false);
        }
    };
    if (worldId) {
      fetchInitialData();
    }
  }, [worldId, navigate, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
     if (name === "mother" || name === "father") {
      setFormData(prev => ({ ...prev, parents: { ...prev.parents, [name]: value } }));
    } else if (name === "adoptiveMother" || name === "adoptiveFather") {
      const parentType = name === "adoptiveMother" ? "mother" : "father";
      setFormData(prev => ({ ...prev, adoptiveParents: { ...prev.adoptiveParents, [parentType]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBioChange = (htmlContent) => {
    setFormData(prev => ({ ...prev, bio: htmlContent }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setError('Person name is required.');
      setLoading(false);
      return;
    }

    const payload = {
        name: formData.name,
        gender: formData.gender,
        birthYear: formData.birthYear ? Number(formData.birthYear) : null,
        deathYear: formData.deathYear ? Number(formData.deathYear) : null,
        bio: formData.bio,
        parents: {
            mother: formData.parents.mother || null,
            father: formData.parents.father || null,
        },
        adoptiveParents: { 
            mother: formData.adoptiveParents.mother || null,
            father: formData.adoptiveParents.father || null,
        },
        spouses: formData.spouses.map(s => ({ // Ensure spouses is included
            person: s.person,
            marriageYear: s.marriageYear ? Number(s.marriageYear) : null
        })).filter(s => s.person && mongoose.Types.ObjectId.isValid(s.person)), // Filter invalid entries, ensure mongoose is not on frontend
    };
    // Clean up nulls from payload
    if (payload.birthYear === null) delete payload.birthYear;
    if (payload.deathYear === null) delete payload.deathYear;
    if (payload.parents.mother === null) delete payload.parents.mother;
    if (payload.parents.father === null) delete payload.parents.father;
    if (payload.adoptiveParents.mother === null) delete payload.adoptiveParents.mother;
    if (payload.adoptiveParents.father === null) delete payload.adoptiveParents.father;
    // No need to delete payload.spouses if it's an empty array, backend should handle it.
    // If payload.spouses is empty, it will be [].
    // If an element in spouses has marriageYear: null, it will be sent as null.

    console.log('[FRONTEND AddPersonPage] Payload being sent:', JSON.stringify(payload, null, 2));


    try {
      const response = await apiClient.post(`/worlds/${worldId}/people`, payload);
      setLoading(false);
      setSuccessMessage(`Person "${response.data.name}" added successfully to ${worldName}!`);
      
      setFormData({ name: '', gender: 'Unknown', birthYear: '', deathYear: '', bio: '', parents: {mother: '', father: ''}, adoptiveParents: {mother: '', father: ''}, spouses: []});

      setTimeout(() => {
        navigate(`/worlds/${worldId}/people`);
      }, 2000);

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to add person. Please try again.');
      }
      console.error('Add person error:', err);
    }
  };

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other', 'Unknown'];

  if (pageLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        {/* Back Link and Header */}
        <div className="mb-6">
          <Link
            to={`/worlds/${worldId}/people`}
            className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to People in {worldName || 'World'}
          </Link>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-8">
          Add New Person to {worldName || 'this World'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {error && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>)}
          {successMessage && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Success: </strong><span className="block sm:inline">{successMessage}</span></div>)}

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Full Name <span className="text-red-500">*</span></label>
            <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500"/>
          </div>
          {/* Gender, Birth Year, Death Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                {genderOptions.map(option => (<option key={option} value={option}>{option}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Birth Year</label>
              <input id="birthYear" name="birthYear" type="number" value={formData.birthYear} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500" placeholder="YYYY"/>
            </div>
          </div>
          <div>
            <label htmlFor="deathYear" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Death Year</label>
            <input id="deathYear" name="deathYear" type="number" value={formData.deathYear} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500" placeholder="YYYY"/>
          </div>

          {/* Biological Parents Selection */}
          <fieldset className="mt-4 border p-4 rounded-md border-gray-300 dark:border-gray-600">
            <legend className="text-md font-medium text-gray-900 dark:text-white px-2">Biological Parents (Optional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label htmlFor="mother" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Mother</label>
                <select id="mother" name="mother" value={formData.parents.mother} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Mother</option>
                  {allPeopleInWorld.map(p => (
                    <option key={p._id} value={p._id} disabled={p._id === formData.parents.father || p._id === formData.adoptiveParents.mother || p._id === formData.adoptiveParents.father}>
                      {p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="father" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Father</label>
                <select id="father" name="father" value={formData.parents.father} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Father</option>
                  {allPeopleInWorld.map(p => (
                    <option key={p._id} value={p._id} disabled={p._id === formData.parents.mother || p._id === formData.adoptiveParents.mother || p._id === formData.adoptiveParents.father}>
                      {p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Adoptive Parents Selection */}
          <fieldset className="mt-4 border p-4 rounded-md border-gray-300 dark:border-gray-600">
            <legend className="text-md font-medium text-gray-900 dark:text-white px-2">Adoptive Parents (Optional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label htmlFor="adoptiveMother" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Adoptive Mother</label>
                <select id="adoptiveMother" name="adoptiveMother" value={formData.adoptiveParents.mother} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Adoptive Mother</option>
                  {allPeopleInWorld.map(p => (
                    <option key={p._id} value={p._id} disabled={p._id === formData.adoptiveParents.father || p._id === formData.parents.mother || p._id === formData.parents.father}>
                      {p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="adoptiveFather" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Adoptive Father</label>
                <select id="adoptiveFather" name="adoptiveFather" value={formData.adoptiveParents.father} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Adoptive Father</option>
                  {allPeopleInWorld.map(p => (
                    <option key={p._id} value={p._id} disabled={p._id === formData.adoptiveParents.mother || p._id === formData.parents.mother || p._id === formData.parents.father}>
                      {p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Bio Tiptap Editor */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">Biography / Notes</label>
            <TiptapEditor content={formData.bio} onChange={handleBioChange} placeholder="Key life events, personality traits, relationships, etc."/>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Adding Person...' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonPage;
