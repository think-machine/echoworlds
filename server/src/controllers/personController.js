import asyncHandler from 'express-async-handler';
import Person from '../models/Person.js';
import World from '../models/World.js';
import mongoose from 'mongoose';

// --- Helper function to check world existence and ownership ---
const checkWorldAccess = async (worldId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(worldId)) {
    return { error: 'Invalid World ID format', status: 400, world: null };
  }
  const world = await World.findById(worldId);
  if (!world) {
    return { error: 'World not found', status: 404, world: null };
  }
  if (world.owner.toString() !== userId.toString()) {
    return { error: 'Not authorized to access this world', status: 403, world: null };
  }
  return { world };
};

const populateFields = [
    { path: 'nationality', select: 'name type' },
    { path: 'spouses.person', select: 'name birthYear deathYear gender' },
    {
        path: 'parents.mother', select: 'name birthYear deathYear gender parents',
        populate: [ { path: 'parents.mother', select: 'name birthYear' }, { path: 'parents.father', select: 'name birthYear' } ]
    },
    {
        path: 'parents.father', select: 'name birthYear deathYear gender parents',
        populate: [ { path: 'parents.mother', select: 'name birthYear' }, { path: 'parents.father', select: 'name birthYear' } ]
    },
    {
        path: 'adoptiveParents.mother', select: 'name birthYear deathYear gender parents',
        populate: [ { path: 'parents.mother', select: 'name birthYear' }, { path: 'parents.father', select: 'name birthYear' } ]
    },
    {
        path: 'adoptiveParents.father', select: 'name birthYear deathYear gender parents',
        populate: [ { path: 'parents.mother', select: 'name birthYear' }, { path: 'parents.father', select: 'name birthYear' } ]
    }
];

// @desc    Create a new person in a specific world
// @route   POST /api/worlds/:worldId/people
// @access  Private
const createPersonInWorld = asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }

  const { name, gender, birthYear, deathYear, bio, nationality, spouses, parents, adoptiveParents } = req.body;
  if (!name) { res.status(400); throw new Error('Person name is required'); }

  let processedAdoptiveParents = null;
  if (adoptiveParents) {
    processedAdoptiveParents = {
        mother: (adoptiveParents.mother && mongoose.Types.ObjectId.isValid(adoptiveParents.mother)) ? adoptiveParents.mother : null,
        father: (adoptiveParents.father && mongoose.Types.ObjectId.isValid(adoptiveParents.father)) ? adoptiveParents.father : null,
        adoptionYear: adoptiveParents.adoptionYear ? Number(adoptiveParents.adoptionYear) : null
    };
    if (!processedAdoptiveParents.mother) delete processedAdoptiveParents.mother;
    if (!processedAdoptiveParents.father) delete processedAdoptiveParents.father;
    if (!processedAdoptiveParents.adoptionYear) delete processedAdoptiveParents.adoptionYear;
  }

  let processedSpouses = [];
  if (spouses && Array.isArray(spouses)) {
    processedSpouses = spouses.map(s => ({
        person: s.person,
        marriageYear: s.marriageYear ? Number(s.marriageYear) : null,
        endYear: s.endYear ? Number(s.endYear) : null,
        reasonForEnd: s.reasonForEnd || null,
    })).filter(s => s.person && mongoose.Types.ObjectId.isValid(s.person));
  }

  const personDataToCreate = { 
      world: worldId, name, gender, 
      birthYear: birthYear ? Number(birthYear) : null, 
      deathYear: deathYear ? Number(deathYear) : null, 
      bio, 
      nationality: (nationality && mongoose.Types.ObjectId.isValid(nationality)) ? nationality : null, 
      spouses: processedSpouses, 
      parents: {
          mother: (parents?.mother && mongoose.Types.ObjectId.isValid(parents.mother)) ? parents.mother : null,
          father: (parents?.father && mongoose.Types.ObjectId.isValid(parents.father)) ? parents.father : null,
      }, 
      adoptiveParents: processedAdoptiveParents 
  };
  // Clean up null parent objects if they are empty
  if (personDataToCreate.parents && !personDataToCreate.parents.mother && !personDataToCreate.parents.father) {
    delete personDataToCreate.parents;
  }
  if (personDataToCreate.adoptiveParents && !personDataToCreate.adoptiveParents.mother && !personDataToCreate.adoptiveParents.father && !personDataToCreate.adoptiveParents.adoptionYear) {
    delete personDataToCreate.adoptiveParents;
  }


  const person = await Person.create(personDataToCreate);
  
  if (processedSpouses.length > 0) {
    for (const spouseRel of processedSpouses) {
      const spouseId = spouseRel.person;
      const otherSpouse = await Person.findById(spouseId);
      if (otherSpouse && otherSpouse.world.toString() === worldId) {
        const existingSpouseLink = otherSpouse.spouses.find(s => s.person.toString() === person._id.toString());
        if (!existingSpouseLink) {
          otherSpouse.spouses.push({ 
            person: person._id, 
            marriageYear: spouseRel.marriageYear,
            endYear: spouseRel.endYear,
            reasonForEnd: spouseRel.reasonForEnd
          });
          await otherSpouse.save();
        }
      }
    }
  }

  const populatedPerson = await Person.findById(person._id).populate(populateFields);
  res.status(201).json(populatedPerson || person);
});

// @desc    Get all people in a specific world
// @route   GET /api/worlds/:worldId/people
// @access  Private
const getPeopleInWorld = asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user._id;
  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  // Added select for fields needed by EditPersonPage spouse/parent dropdowns
  const people = await Person.find({ world: worldId })
                         .select('name birthYear gender') // Select fields needed for dropdowns
                         .sort({ name: 1 });
  res.json(people);
});

// @desc    Get details of a specific person
// @route   GET /api/worlds/:worldId/people/:personId
// @access  Private
const getPersonDetails = asyncHandler(async (req, res) => {
  const { worldId, personId } = req.params;
  const userId = req.user._id;
  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(personId)) { res.status(400); throw new Error('Invalid Person ID format');}

  const person = await Person.findOne({ _id: personId, world: worldId }).populate(populateFields);
  if (!person) { res.status(404); throw new Error('Person not found in this world');}
  res.json(person);
});

// @desc    Update a person in a specific world
// @route   PUT /api/worlds/:worldId/people/:personId
// @access  Private
const updatePersonInWorld = asyncHandler(async (req, res) => {
  const { worldId, personId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(personId)) { res.status(400); throw new Error('Invalid Person ID format'); }

  const person = await Person.findById(personId); 
  if (!person || person.world.toString() !== worldId) { 
    res.status(404); throw new Error('Person not found in this world'); 
  }

  const oldSpousesFull = JSON.parse(JSON.stringify(person.spouses)); 

  const { name, gender, birthYear, deathYear, bio, nationality, spouses, parents, adoptiveParents } = req.body;
  
  person.name = name !== undefined ? name : person.name;
  person.gender = gender !== undefined ? gender : person.gender;
  person.birthYear = birthYear !== undefined ? (Number(birthYear) || null) : person.birthYear;
  person.deathYear = deathYear !== undefined ? (Number(deathYear) || null) : person.deathYear;
  person.bio = bio !== undefined ? bio : person.bio;
  person.nationality = nationality !== undefined ? (mongoose.Types.ObjectId.isValid(nationality) ? nationality : null) : person.nationality;
  
  if (parents !== undefined) {
    person.parents = {
        mother: (parents.mother && mongoose.Types.ObjectId.isValid(parents.mother)) ? parents.mother : null,
        father: (parents.father && mongoose.Types.ObjectId.isValid(parents.father)) ? parents.father : null,
    };
     if (person.parents && !person.parents.mother && !person.parents.father) person.parents = undefined; // Unset if both are null
  }
  if (adoptiveParents !== undefined) {
    person.adoptiveParents = {
        mother: (adoptiveParents.mother && mongoose.Types.ObjectId.isValid(adoptiveParents.mother)) ? adoptiveParents.mother : null,
        father: (adoptiveParents.father && mongoose.Types.ObjectId.isValid(adoptiveParents.father)) ? adoptiveParents.father : null,
        adoptionYear: adoptiveParents.adoptionYear ? Number(adoptiveParents.adoptionYear) : null,
    };
    if (!person.adoptiveParents.adoptionYear) delete person.adoptiveParents.adoptionYear;
    if (person.adoptiveParents && !person.adoptiveParents.mother && !person.adoptiveParents.father && !person.adoptiveParents.adoptionYear) person.adoptiveParents = undefined; // Unset if all are null/empty
  }
  
  if (spouses !== undefined && Array.isArray(spouses)) {
    const processedSpouses = [];
    for (const s of spouses) {
        if (!s.person || !mongoose.Types.ObjectId.isValid(s.person)) continue;

        let endYearToSet = s.endYear ? Number(s.endYear) : null;
        let reasonToSet = s.reasonForEnd || null;

        if (reasonToSet === 'Death' && !endYearToSet) {
            const otherSpouseDoc = await Person.findById(s.person).select('deathYear');
            if (otherSpouseDoc?.deathYear) {
                endYearToSet = otherSpouseDoc.deathYear;
            } else if (person.deathYear && s.person.toString() !== personId) { 
                // If current person being edited died, and this is their spouse record
                // This is a bit circular for *this* person's record, but important for reciprocal.
                // For this person's record, if their own deathYear is set, it's the primary end.
            }
        }
        if (!reasonToSet && endYearToSet) reasonToSet = "Unknown";

        processedSpouses.push({
            person: s.person, 
            marriageYear: s.marriageYear ? Number(s.marriageYear) : null,
            endYear: endYearToSet,
            reasonForEnd: reasonToSet
        });
    }
    person.spouses = processedSpouses;
  }

  await person.save();
  
  const newSpouseRels = person.spouses; 
  const oldSpouseIds = oldSpousesFull.map(s => s.person.toString());
  const newSpouseIds = newSpouseRels.map(s => s.person.toString());

  for (const newSpouseRel of newSpouseRels) {
    const spouseId = newSpouseRel.person.toString();
    const otherSpouseDoc = await Person.findById(spouseId);

    if (otherSpouseDoc && otherSpouseDoc.world.toString() === worldId) {
      let existingLinkOnOther = otherSpouseDoc.spouses.find(s => s.person.toString() === personId);
      let reasonForEndOnOther = newSpouseRel.reasonForEnd;
      let endYearOnOther = newSpouseRel.endYear;

      if (newSpouseRel.reasonForEnd === 'Death' && !newSpouseRel.endYear && otherSpouseDoc.deathYear) {
          endYearOnOther = otherSpouseDoc.deathYear;
      }
      if (person.deathYear && reasonForEndOnOther === 'Death' && !endYearOnOther) {
          endYearOnOther = person.deathYear;
      }

      if (!existingLinkOnOther) {
        otherSpouseDoc.spouses.push({ 
            person: personId, 
            marriageYear: newSpouseRel.marriageYear,
            endYear: endYearOnOther,
            reasonForEnd: reasonForEndOnOther
        });
        await otherSpouseDoc.save();
      } else { 
        if (existingLinkOnOther.marriageYear !== newSpouseRel.marriageYear ||
            existingLinkOnOther.endYear !== endYearOnOther ||
            existingLinkOnOther.reasonForEnd !== reasonForEndOnOther) {
              existingLinkOnOther.marriageYear = newSpouseRel.marriageYear;
              existingLinkOnOther.endYear = endYearOnOther;
              existingLinkOnOther.reasonForEnd = reasonForEndOnOther;
              await otherSpouseDoc.save();
            }
      }
    }
  }

  for (const oldSpouse of oldSpousesFull) {
    const oldSpouseIdStr = oldSpouse.person.toString();
    if (!newSpouseIds.includes(oldSpouseIdStr)) { 
      const otherSpouseDoc = await Person.findById(oldSpouseIdStr);
      if (otherSpouseDoc && otherSpouseDoc.world.toString() === worldId) {
        otherSpouseDoc.spouses = otherSpouseDoc.spouses.filter(s => s.person.toString() !== personId);
        await otherSpouseDoc.save();
      }
    }
  }

  const populatedPerson = await Person.findById(person._id).populate(populateFields);
  res.json(populatedPerson || person);
});

// @desc    Delete a person from a specific world
// @route   DELETE /api/worlds/:worldId/people/:personId
// @access  Private
const deletePersonInWorld = asyncHandler(async (req, res) => {
  const { worldId, personId } = req.params;
  const userId = req.user._id;

  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(personId)) { res.status(400); throw new Error('Invalid Person ID format'); }
  
  const personToDelete = await Person.findOne({ _id: personId, world: worldId });
  if (!personToDelete) { res.status(404); throw new Error('Person not found in this world'); }
  
  if (personToDelete.spouses && personToDelete.spouses.length > 0) {
    for (const spouseRel of personToDelete.spouses) {
      const otherSpouseId = spouseRel.person;
      await Person.findByIdAndUpdate(otherSpouseId, {
        $pull: { spouses: { person: personId } }
      });
    }
  }
  await Person.updateMany({ world: worldId, 'parents.mother': personId }, { $unset: { 'parents.mother': "" } });
  await Person.updateMany({ world: worldId, 'parents.father': personId }, { $unset: { 'parents.father': "" } });
  await Person.updateMany({ world: worldId, 'adoptiveParents.mother': personId }, { $unset: { 'adoptiveParents.mother': "" } });
  await Person.updateMany({ world: worldId, 'adoptiveParents.father': personId }, { $unset: { 'adoptiveParents.father': "" } });

  await Person.deleteOne({ _id: personId });
  res.json({ message: 'Person removed successfully' });
});

// @desc    Get children of a specific person (biological or adoptive)
// @route   GET /api/worlds/:worldId/people/:personId/children
// @access  Private
const getPersonChildren = asyncHandler(async (req, res) => {
  const { worldId, personId } = req.params;
  const userId = req.user._id;
  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(personId)) { res.status(400); throw new Error('Invalid Person ID format');}
  const parentPerson = await Person.findOne({ _id: personId, world: worldId });
  if (!parentPerson) { res.status(404); throw new Error('Parent person not found');}

  const children = await Person.find({
    world: worldId,
    $or: [
      { 'parents.mother': personId }, { 'parents.father': personId },
      { 'adoptiveParents.mother': personId }, { 'adoptiveParents.father': personId }
    ]
  }).select('name birthYear deathYear gender parents adoptiveParents').sort({ birthYear: 1, name: 1 });
  res.json(children);
});

// @desc    Get siblings of a specific person (biological, half, adoptive)
// @route   GET /api/worlds/:worldId/people/:personId/siblings
// @access  Private
const getPersonSiblings = asyncHandler(async (req, res) => {
  const { worldId, personId } = req.params;
  const userId = req.user._id;
  const worldAccess = await checkWorldAccess(worldId, userId);
  if (worldAccess.error) { res.status(worldAccess.status); throw new Error(worldAccess.error); }
  if (!mongoose.Types.ObjectId.isValid(personId)) { res.status(400); throw new Error('Invalid Person ID format');}

  const person = await Person.findById(personId).select('parents adoptiveParents world');
  if (!person || person.world.toString() !== worldId) { res.status(404); throw new Error('Person not found');}

  const bioMotherId = person.parents?.mother;
  const bioFatherId = person.parents?.father;
  const adoptiveMotherId = person.adoptiveParents?.mother;
  const adoptiveFatherId = person.adoptiveParents?.father;

  const siblingQueries = [];
  if (bioMotherId) siblingQueries.push({ 'parents.mother': bioMotherId });
  if (bioFatherId) siblingQueries.push({ 'parents.father': bioFatherId });
  if (adoptiveMotherId) siblingQueries.push({ 'adoptiveParents.mother': adoptiveMotherId });
  if (adoptiveFatherId) siblingQueries.push({ 'adoptiveParents.father': adoptiveFatherId });

  if (siblingQueries.length === 0) return res.json([]);

  let siblings = await Person.find({
    world: worldId,
    _id: { $ne: personId }, 
    $or: siblingQueries
  }).select('name birthYear deathYear gender parents adoptiveParents').sort({ birthYear: 1, name: 1 });

  siblings = siblings.map(sib => {
    const sibling = sib.toObject(); 
    
    const sharesBioMother = bioMotherId && sibling.parents?.mother?.equals(bioMotherId);
    const sharesBioFather = bioFatherId && sibling.parents?.father?.equals(bioFatherId);
    const sharesAdoptiveMother = adoptiveMotherId && sibling.adoptiveParents?.mother?.equals(adoptiveMotherId);
    const sharesAdoptiveFather = adoptiveFatherId && sibling.adoptiveParents?.father?.equals(adoptiveFatherId);

    if (sharesBioMother && sharesBioFather) {
        sibling.siblingType = 'Full Sibling';
    } else if (sharesAdoptiveMother && sharesAdoptiveFather) {
        sibling.siblingType = 'Adoptive Sibling';
    } else if (sharesBioMother || sharesBioFather) {
        sibling.siblingType = 'Half-Sibling (Biological)';
    } else if (sharesAdoptiveMother || sharesAdoptiveFather) {
        sibling.siblingType = 'Half-Sibling (Adoptive)';
    } else {
        sibling.siblingType = 'Related (Complex)'; 
    }
    return sibling;
  });

  res.json(siblings);
});


export {
  createPersonInWorld,
  getPeopleInWorld,
  getPersonDetails,
  updatePersonInWorld,
  deletePersonInWorld,
  getPersonChildren,
  getPersonSiblings,
};
