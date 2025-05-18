import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TiptapEditor from '../components/TiptapEditor';

const EditPersonPage = () => {
  const { worldId, personId } = useParams();
  const navigate = useNavigate();

  const [worldName, setWorldName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Unknown',
    birthYear: '',
    deathYear: '',
    bio: '',
    nationality: '',
    parents: { mother: '', father: '' },
    adoptiveParents: { mother: '', father: '', adoptionYear: '' },
    spouses: [], // Array of { person: ID, marriageYear: '', endYear: '', reasonForEnd: '' }
  });
  const [allPeopleInWorld, setAllPeopleInWorld] = useState([]);
  const [currentPersonDetails, setCurrentPersonDetails] = useState(null);
  const [currentPersonChildrenIds, setCurrentPersonChildrenIds] = useState([]);
  const [currentPersonSiblingIds, setCurrentPersonSiblingIds] = useState([]);
  const [originalPersonName, setOriginalPersonName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isContentLoadedRef = useRef(false);

  const [showAddSpouseForm, setShowAddSpouseForm] = useState(false);
  const [newSpouseData, setNewSpouseData] = useState({ person: '', marriageYear: '', endYear: '', reasonForEnd: '' });

  const marriageEndReasons = ['Divorce', 'Death', 'Annullment', 'Other', 'Unknown'];

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      isContentLoadedRef.current = false;
      try {
        const worldRes = await apiClient.get(`/worlds/${worldId}`);
        setWorldName(worldRes.data.name);

        const allPeopleRes = await apiClient.get(`/worlds/${worldId}/people`);
        setAllPeopleInWorld(allPeopleRes.data); 

        const personRes = await apiClient.get(`/worlds/${worldId}/people/${personId}`);
        const personData = personRes.data;
        setCurrentPersonDetails(personData); 
        
        setFormData({
          name: personData.name || '',
          gender: personData.gender || 'Unknown',
          birthYear: personData.birthYear || '',
          deathYear: personData.deathYear || '',
          bio: personData.bio || '',
          nationality: personData.nationality?._id || personData.nationality || '',
          parents: {
            mother: personData.parents?.mother?._id || personData.parents?.mother || '',
            father: personData.parents?.father?._id || personData.parents?.father || '',
          },
          adoptiveParents: {
            mother: personData.adoptiveParents?.mother?._id || personData.adoptiveParents?.mother || '',
            father: personData.adoptiveParents?.father?._id || personData.adoptiveParents?.father || '',
            adoptionYear: personData.adoptiveParents?.adoptionYear || '',
          },
          spouses: personData.spouses?.map(s => ({
            person: s.person?._id || s.person,
            marriageYear: s.marriageYear || '',
            endYear: s.endYear || '',
            reasonForEnd: s.reasonForEnd || '',
          })) || [],
        });
        setOriginalPersonName(personData.name);
        isContentLoadedRef.current = true;

        const childrenRes = await apiClient.get(`/worlds/${worldId}/people/${personId}/children`);
        setCurrentPersonChildrenIds(childrenRes.data.map(c => c._id));

        const siblingsRes = await apiClient.get(`/worlds/${worldId}/people/${personId}/siblings`);
        setCurrentPersonSiblingIds(siblingsRes.data.map(s => s._id));
        
      } catch (err) {
        console.error('Error fetching data for edit page:', err);
        if (err.response && err.response.status === 401) navigate('/login');
        else if (err.response && err.response.status === 404) setError('Person or World not found.');
        else setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (worldId && personId) {
      fetchInitialData();
    }
  }, [worldId, personId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mother" || name === "father") {
      setFormData(prev => ({ ...prev, parents: { ...prev.parents, [name]: value } }));
    } else if (name === "adoptiveMother" || name === "adoptiveFather" || name === "adoptionYear") {
      const isYear = name === "adoptionYear";
      const parentType = name === "adoptiveMother" ? "mother" : (name === "adoptiveFather" ? "father" : null);
      setFormData(prev => ({ 
        ...prev, 
        adoptiveParents: { 
          ...prev.adoptiveParents, 
          [isYear ? 'adoptionYear' : parentType]: value 
        } 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBioChange = (htmlContent) => {
    setFormData(prev => ({ ...prev, bio: htmlContent }));
  };

  const handleNewSpouseDataChange = (e) => {
    const { name, value } = e.target;
    setNewSpouseData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRemoveSpouse = (spousePersonIdToRemove) => {
    setFormData(prev => ({
        ...prev,
        spouses: prev.spouses.filter(s => s.person !== spousePersonIdToRemove)
    }));
  };

  const handleSpouseDetailChange = (spousePersonId, fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      spouses: prev.spouses.map(s => 
        s.person === spousePersonId ? { ...s, [fieldName]: value } : s
      )
    }));
  };

  const handleConfirmAddSpouse = () => {
    if (!newSpouseData.person) { 
      alert("Please select a person to add as a spouse.");
      return; 
    }
    const selectedSpouseDetails = allPeopleInWorld.find(p => p._id === newSpouseData.person);
    let calculatedDefaultMarriageYear = '';
    if (currentPersonDetails?.birthYear && selectedSpouseDetails?.birthYear) {
        const minMarriageYearForCurrent = parseInt(currentPersonDetails.birthYear, 10) + 18;
        const minMarriageYearForSpouse = parseInt(selectedSpouseDetails.birthYear, 10) + 18;
        calculatedDefaultMarriageYear = Math.max(minMarriageYearForCurrent, minMarriageYearForSpouse).toString();
    }
    let marriageYearToSet = newSpouseData.marriageYear ? newSpouseData.marriageYear.toString() : '';
    if (calculatedDefaultMarriageYear) {
        if (marriageYearToSet) { 
            if (parseInt(marriageYearToSet, 10) < parseInt(calculatedDefaultMarriageYear, 10)) {
                alert(`Marriage year cannot be earlier than ${calculatedDefaultMarriageYear}. Defaulting to ${calculatedDefaultMarriageYear}.`);
                marriageYearToSet = calculatedDefaultMarriageYear;
            }
        } else { marriageYearToSet = calculatedDefaultMarriageYear; }
    }
    setFormData(prev => ({
      ...prev,
      spouses: [...prev.spouses, { 
          person: newSpouseData.person, 
          marriageYear: marriageYearToSet ? parseInt(marriageYearToSet, 10) : '',
          endYear: newSpouseData.endYear ? parseInt(newSpouseData.endYear, 10) : '',
          reasonForEnd: newSpouseData.reasonForEnd || '',
        }]
    }));
    setNewSpouseData({ person: '', marriageYear: '', endYear: '', reasonForEnd: '' });
    setShowAddSpouseForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setError('Person name is required.');
      setSaving(false);
      return;
    }
    
    let processedSpouses = [];
    if (Array.isArray(formData.spouses)) {
        processedSpouses = formData.spouses.map(s => ({
            person: s.person, 
            marriageYear: s.marriageYear ? Number(s.marriageYear) : null,
            endYear: s.endYear ? Number(s.endYear) : null,
            reasonForEnd: s.reasonForEnd || null,
        })).filter(s => s.person && typeof s.person === 'string');
    }

    const payload = {
        name: formData.name,
        gender: formData.gender,
        birthYear: formData.birthYear ? Number(formData.birthYear) : null,
        deathYear: formData.deathYear ? Number(formData.deathYear) : null,
        bio: formData.bio,
        nationality: formData.nationality || null,
        parents: {
            mother: formData.parents.mother || null,
            father: formData.parents.father || null,
        },
        adoptiveParents: {
            mother: formData.adoptiveParents.mother || null,
            father: formData.adoptiveParents.father || null,
            adoptionYear: formData.adoptiveParents.adoptionYear ? Number(formData.adoptiveParents.adoptionYear) : null,
        },
        spouses: processedSpouses,
    };
    
    if (payload.birthYear === null) delete payload.birthYear;
    if (payload.deathYear === null) delete payload.deathYear;
    if (payload.nationality === null) delete payload.nationality;
    if (!payload.parents.mother && !payload.parents.father) delete payload.parents;
    else {
      if (payload.parents.mother === null) delete payload.parents.mother;
      if (payload.parents.father === null) delete payload.parents.father;
    }
    if (!payload.adoptiveParents.mother && !payload.adoptiveParents.father && !payload.adoptiveParents.adoptionYear) delete payload.adoptiveParents;
    else {
      if (payload.adoptiveParents.mother === null) delete payload.adoptiveParents.mother;
      if (payload.adoptiveParents.father === null) delete payload.adoptiveParents.father;
      if (payload.adoptiveParents.adoptionYear === null) delete payload.adoptiveParents.adoptionYear;
    }
    payload.spouses = payload.spouses.map(s => {
        const cleanedSpouse = {...s};
        if (cleanedSpouse.marriageYear === null) delete cleanedSpouse.marriageYear;
        if (cleanedSpouse.endYear === null) delete cleanedSpouse.endYear;
        if (cleanedSpouse.reasonForEnd === null || cleanedSpouse.reasonForEnd === '') delete cleanedSpouse.reasonForEnd;
        return cleanedSpouse;
    });

    console.log('[FRONTEND EditPersonPage] Payload being sent to backend:', JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.put(`/worlds/${worldId}/people/${personId}`, payload);
      setSuccessMessage(`Person "${response.data.name}" updated successfully!`);
      setOriginalPersonName(response.data.name);
      
      const updatedPersonData = response.data;
      setCurrentPersonDetails(updatedPersonData);
      setFormData({
          name: updatedPersonData.name || '',
          gender: updatedPersonData.gender || 'Unknown',
          birthYear: updatedPersonData.birthYear || '',
          deathYear: updatedPersonData.deathYear || '',
          bio: updatedPersonData.bio || '',
          nationality: updatedPersonData.nationality?._id || updatedPersonData.nationality || '',
          parents: {
            mother: updatedPersonData.parents?.mother?._id || updatedPersonData.parents?.mother || '',
            father: updatedPersonData.parents?.father?._id || updatedPersonData.parents?.father || '',
          },
          adoptiveParents: {
            mother: updatedPersonData.adoptiveParents?.mother?._id || updatedPersonData.adoptiveParents?.mother || '',
            father: updatedPersonData.adoptiveParents?.father?._id || updatedPersonData.adoptiveParents?.father || '',
            adoptionYear: updatedPersonData.adoptiveParents?.adoptionYear || '',
          },
          spouses: updatedPersonData.spouses?.map(s => ({
            person: s.person?._id || s.person,
            marriageYear: s.marriageYear || '',
            endYear: s.endYear || '',
            reasonForEnd: s.reasonForEnd || '',
          })) || [],
      });

      setTimeout(() => {
        navigate(`/worlds/${worldId}/people/${personId}`);
      }, 1500);
    } catch (err) { 
        if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
        } else {
            setError('Failed to update person. Please try again.');
        }
        console.error('Update person error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other', 'Unknown'];
  const availableSpouseOptions = React.useMemo(() => {
    if (!currentPersonDetails || !allPeopleInWorld) return [];
    
    return allPeopleInWorld.filter(p => {
      if (p._id === personId) return false; 
      if (formData.spouses.find(s => s.person === p._id)) return false; 

      const actualBioMotherId = currentPersonDetails.parents?.mother?._id || currentPersonDetails.parents?.mother;
      const actualBioFatherId = currentPersonDetails.parents?.father?._id || currentPersonDetails.parents?.father;
      const actualAdoptiveMotherId = currentPersonDetails.adoptiveParents?.mother?._id || currentPersonDetails.adoptiveParents?.mother;
      const actualAdoptiveFatherId = currentPersonDetails.adoptiveParents?.father?._id || currentPersonDetails.adoptiveParents?.father;

      if (p._id === actualBioMotherId || p._id === actualBioFatherId || p._id === actualAdoptiveMotherId || p._id === actualAdoptiveFatherId) {
          return false;
      }

      if (currentPersonChildrenIds.includes(p._id)) return false;
      if (currentPersonSiblingIds.includes(p._id)) return false;
      
      const cpd = currentPersonDetails;
      const grandparentIds = [
          cpd.parents?.mother?.parents?.mother?._id, cpd.parents?.mother?.parents?.father?._id,
          cpd.parents?.father?.parents?.mother?._id, cpd.parents?.father?.parents?.father?._id,
          cpd.adoptiveParents?.mother?.parents?.mother?._id, cpd.adoptiveParents?.mother?.parents?.father?._id,
          cpd.adoptiveParents?.father?.parents?.mother?._id, cpd.adoptiveParents?.father?.parents?.father?._id,
      ].filter(Boolean);
      if (grandparentIds.includes(p._id)) return false;

      if (currentPersonDetails.birthYear && p.birthYear) {
        const ageDiff = Math.abs(parseInt(currentPersonDetails.birthYear,10) - parseInt(p.birthYear,10));
        if (ageDiff > 15) return false;
      }

      if (currentPersonDetails.gender === 'Male' && p.gender !== 'Female') return false;
      if (currentPersonDetails.gender === 'Female' && p.gender !== 'Male') return false;
      
      return true;
    });
  }, [allPeopleInWorld, currentPersonDetails, formData.spouses, personId, currentPersonChildrenIds, currentPersonSiblingIds]);


  if (loading) { return <div className="flex justify-center items-center min-h-screen"><p>Loading form...</p></div>; }
  if (error && !originalPersonName && !formData.name) { 
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-6 rounded-md shadow-md max-w-md mx-auto" role="alert">
              <p className="font-bold text-lg">Error</p>
              <p>{error}</p>
            </div>
            <Link
                to={worldId ? `/worlds/${worldId}/people` : "/dashboard"}
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={`/worlds/${worldId}/people/${personId}`}
            className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to {originalPersonName || 'Person'} Details
          </Link>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-8">
          Edit: {originalPersonName || 'Person'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error & Success Messages */}
          {error && !successMessage && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>)}
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
              <input id="birthYear" name="birthYear" type="number" placeholder="YYYY" value={formData.birthYear} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500"/>
            </div>
          </div>
          <div>
            <label htmlFor="deathYear" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Death Year</label>
            <input id="deathYear" name="deathYear" type="number" placeholder="YYYY" value={formData.deathYear} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500"/>
          </div>

          {/* Biological Parents Selection */}
          <fieldset className="mt-4 border p-4 rounded-md border-gray-300 dark:border-gray-600">
            <legend className="text-md font-medium text-gray-900 dark:text-white px-2">Biological Parents (Optional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label htmlFor="mother" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Mother</label>
                <select id="mother" name="mother" value={formData.parents.mother} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Mother</option>
                  {allPeopleInWorld.filter(p => p._id !== personId && p._id !== formData.parents.father && p._id !== formData.adoptiveParents.mother && p._id !== formData.adoptiveParents.father).map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="father" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Father</label>
                <select id="father" name="father" value={formData.parents.father} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500">
                  <option value="">Select Father</option>
                  {allPeopleInWorld.filter(p => p._id !== personId && p._id !== formData.parents.mother && p._id !== formData.adoptiveParents.mother && p._id !== formData.adoptiveParents.father).map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}</option>
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
                <select id="adoptiveMother" name="adoptiveMother" value={formData.adoptiveParents.mother} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3">
                  <option value="">Select Adoptive Mother</option>
                  {allPeopleInWorld.filter(p => p._id !== personId && p._id !== formData.adoptiveParents.father && p._id !== formData.parents.mother && p._id !== formData.parents.father).map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="adoptiveFather" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Adoptive Father</label>
                <select id="adoptiveFather" name="adoptiveFather" value={formData.adoptiveParents.father} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3">
                  <option value="">Select Adoptive Father</option>
                  {allPeopleInWorld.filter(p => p._id !== personId && p._id !== formData.adoptiveParents.mother && p._id !== formData.parents.mother && p._id !== formData.parents.father).map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="adoptionYear" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Adoption Year (Optional)</label>
              <input
                id="adoptionYear"
                name="adoptionYear"
                type="number"
                placeholder="YYYY"
                value={formData.adoptiveParents.adoptionYear}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>
          </fieldset>

          {/* Spouses Management */}
          <fieldset className="mt-6 border p-4 rounded-md border-gray-300 dark:border-gray-600">
            <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">Spouses</legend>
            {formData.spouses && formData.spouses.length > 0 && (
              <div className="mt-2 space-y-4">
                {formData.spouses.map((spouseRel, index) => {
                  const spouseDetails = allPeopleInWorld.find(p => p._id === spouseRel.person);
                  return (
                    <div key={spouseRel.person || index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">
                          {spouseDetails ? spouseDetails.name : 'Spouse (details may update on save)'}
                        </span>
                        <button type="button" onClick={() => handleRemoveSpouse(spouseRel.person)} className="p-1.5 text-red-500 hover:text-red-700 self-start sm:self-center" title="Remove Spouse">
                          <XMarkIcon className="h-5 w-5"/>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                        <div>
                            <label htmlFor={`marriageYear-${index}`} className="text-xs text-gray-600 dark:text-gray-400 block">Marriage Year:</label>
                            <input type="number" id={`marriageYear-${index}`} placeholder="YYYY" value={spouseRel.marriageYear}
                                onChange={(e) => handleSpouseDetailChange(spouseRel.person, 'marriageYear', e.target.value)}
                                className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded-md text-sm dark:bg-gray-600 mt-0.5"/>
                        </div>
                        <div>
                            <label htmlFor={`marriageEndYear-${index}`} className="text-xs text-gray-600 dark:text-gray-400 block">End Year:</label>
                            <input type="number" id={`marriageEndYear-${index}`} placeholder="YYYY" value={spouseRel.endYear}
                                onChange={(e) => handleSpouseDetailChange(spouseRel.person, 'endYear', e.target.value)}
                                className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded-md text-sm dark:bg-gray-600 mt-0.5"/>
                        </div>
                        <div>
                            <label htmlFor={`reasonForEnd-${index}`} className="text-xs text-gray-600 dark:text-gray-400 block">Reason for End:</label>
                            <select id={`reasonForEnd-${index}`} value={spouseRel.reasonForEnd}
                                onChange={(e) => handleSpouseDetailChange(spouseRel.person, 'reasonForEnd', e.target.value)}
                                className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded-md text-sm dark:bg-gray-600 mt-0.5">
                                <option value="">Select Reason</option>
                                {marriageEndReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                            </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!showAddSpouseForm && (
              <button
                type="button"
                onClick={() => setShowAddSpouseForm(true)}
                className="mt-4 inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" />
                Add Spouse
              </button>
            )}

            {showAddSpouseForm && (
                <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md space-y-3">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-100">Add New Spouse</h4>
                    <div>
                        <label htmlFor="newSpousePerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person:</label>
                        <select id="newSpousePerson" name="person" value={newSpouseData.person} onChange={handleNewSpouseDataChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3">
                            <option value="">Select a potential spouse</option>
                            {availableSpouseOptions.map(p => (<option key={p._id} value={p._id}>{p.name} {p.birthYear ? `(b. ${p.birthYear})` : ''} ({p.gender})</option>))}
                        </select>
                        {availableSpouseOptions.length === 0 && !loading && <p className="text-xs text-gray-500 mt-1">No eligible spouses found based on current criteria.</p>}
                    </div>
                    <div>
                        <label htmlFor="newSpouseMarriageYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marriage Year:</label>
                        <input type="number" id="newSpouseMarriageYear" name="marriageYear" value={newSpouseData.marriageYear} onChange={handleNewSpouseDataChange} placeholder="YYYY" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="newSpouseEndYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marriage End Year (Optional):</label>
                        <input type="number" id="newSpouseEndYear" name="endYear" value={newSpouseData.endYear} onChange={handleNewSpouseDataChange} placeholder="YYYY" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label htmlFor="newSpouseReasonForEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for End (Optional):</label>
                        <select id="newSpouseReasonForEnd" name="reasonForEnd" value={newSpouseData.reasonForEnd} onChange={handleNewSpouseDataChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3">
                            <option value="">Select Reason</option>
                            {marriageEndReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-x-2">
                        <button type="button" onClick={() => { setShowAddSpouseForm(false); setNewSpouseData({ person: '', marriageYear: '', endYear: '', reasonForEnd: '' });}} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                        <button type="button" onClick={handleConfirmAddSpouse} className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Confirm Add</button>
                    </div>
                </div>
            )}
          </fieldset>

          {/* Bio Tiptap Editor */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">Biography / Notes</label>
            {isContentLoadedRef.current && (
                <TiptapEditor content={formData.bio} onChange={handleBioChange} placeholder="Key life events, personality traits, relationships, etc."/>
            )}
            {!isContentLoadedRef.current && loading && (
                <div className="min-h-[150px] p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                    <p className="text-gray-400">Loading biography...</p>
                </div>
            )}
          </div>

          {/* Submit Button */}
           <div className="pt-2 flex justify-end">
            <button type="submit" disabled={saving || loading} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonPage;
