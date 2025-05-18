import React from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';

// Helper component for displaying a single person card in the tree
const PersonNode = ({
  person,
  role,
  worldId,
  isCurrentPerson = false,
  onAddChildClick,
  spouseForAddChild,
  isGrandparent = false,
  isSibling = false,
  siblingType = '', // New prop for sibling type
  isAdoptive = false // New prop to indicate adoptive relationship to the child node
}) => {
  const handleAddChild = (e) => {
    e.stopPropagation();
    if (onAddChildClick && spouseForAddChild) {
      onAddChildClick(spouseForAddChild);
    } else if (onAddChildClick && isCurrentPerson) {
      onAddChildClick(null);
    }
  };

  let nodeClasses = `relative p-2 md:p-3 border rounded-lg text-center shadow-sm hover:shadow-md transition-shadow min-w-[100px] md:min-w-[140px] w-28 md:w-40 shrink-0 ${isAdoptive ? 'border-dashed border-sky-500 dark:border-sky-400' : 'border-gray-300 dark:border-gray-600'}`;
  if (isCurrentPerson) {
    nodeClasses += " bg-indigo-100 dark:bg-indigo-800 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500 dark:ring-indigo-600";
  } else if (isGrandparent) {
    nodeClasses += " bg-gray-100 dark:bg-gray-700 scale-90";
  } else if (isSibling) {
    nodeClasses += ` ${isAdoptive ? 'bg-sky-50 dark:bg-sky-900/50' : 'bg-white dark:bg-gray-700'} scale-95`;
  } else {
    nodeClasses += ` ${isAdoptive ? 'bg-sky-50 dark:bg-sky-900/50' : 'bg-white dark:bg-gray-700'}`;
  }

  if (!person || !person._id) {
    let emptyNodeClasses = `p-2 md:p-3 border border-dashed rounded-lg text-center min-w-[100px] md:min-w-[120px] w-28 md:w-36 shrink-0 ${isCurrentPerson ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500' : 'bg-gray-50 dark:bg-gray-700/50'}`;
    if(isGrandparent) emptyNodeClasses += " scale-90";
    if(isAdoptive) emptyNodeClasses += " border-sky-400 dark:border-sky-500"; else emptyNodeClasses += " border-gray-300 dark:border-gray-600";
    
    return (
      <div className={emptyNodeClasses}>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{role || 'Unknown'}{isAdoptive ? ' (Adoptive)' : ''}</p>
        <UserCircleIcon className="h-8 md:h-10 w-8 md:w-10 text-gray-400 dark:text-gray-500 mx-auto my-1" />
        <p className="text-2xs md:text-xs text-gray-400 dark:text-gray-500 italic">Not specified</p>
      </div>
    );
  }

  return (
    <div className={nodeClasses}>
      {role && <p className="text-2xs md:text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-0.5 md:mb-1">{role}{isAdoptive ? ' (Adoptive)' : ''}</p>}
      {isSibling && siblingType && <p className="text-2xs md:text-xs text-teal-600 dark:text-teal-400 mb-0.5 md:mb-1 italic">({siblingType})</p>}
      <UserCircleIcon className={`h-10 md:h-12 w-10 md:w-12 mx-auto mb-1 md:mb-2 ${isCurrentPerson ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
      <Link to={`/worlds/${worldId}/people/${person._id}`} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 block text-xs md:text-sm break-words">
        {person.name}
      </Link>
      <p className="text-2xs md:text-xs text-gray-500 dark:text-gray-400">
        {person.birthYear && `b. ${person.birthYear}`}
        {person.birthYear && person.deathYear && ' - '}
        {person.deathYear && `d. ${person.deathYear}`}
      </p>
      {onAddChildClick && (isCurrentPerson || spouseForAddChild) && (
         <button
            onClick={handleAddChild}
            title={`Add child with ${spouseForAddChild ? spouseForAddChild.name : (isCurrentPerson ? person.name : 'this person')}`}
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 p-0.5 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
        >
            <PlusCircleIcon className="h-4 w-4 md:h-5 md:h-5" />
        </button>
      )}
    </div>
  );
};

// Simple line component
const Line = ({ type = 'solid', orientation = 'vertical', length = 'h-8', thickness = 'w-px' }) => {
  const style = type === 'dashed' ? 'border-dashed' : 'border-solid';
  const color = 'border-gray-300 dark:border-gray-600'; 
  
  let lineClasses = `${color} ${style} mx-auto`;
  if (orientation === 'vertical') {
    lineClasses += ` ${length} ${thickness === 'w-px' ? 'border-l' : 'border-t'}`; // Use border-l for vertical w-px
  } else { // horizontal
    lineClasses += ` ${thickness} ${length === 'h-px' ? 'border-t' : 'border-l'}`; // Use border-t for horizontal h-px
  }

  return <div className={lineClasses}></div>;
};


const FamilyTree = ({ currentPerson, childrenData, siblingsData, worldId, onAddChildWithSpouse }) => {
  if (!currentPerson) {
    return <p className="text-center text-gray-500 dark:text-gray-400">No person data available for the family tree.</p>;
  }

  const { _id: currentPersonId, parents, adoptiveParents, spouses } = currentPerson;
  
  const bioFather = parents?.father;
  const bioMother = parents?.mother;
  const paternalBioGrandfather = bioFather?.parents?.father;
  const paternalBioGrandmother = bioFather?.parents?.mother;
  const maternalBioGrandfather = bioMother?.parents?.father;
  const maternalBioGrandmother = bioMother?.parents?.mother;

  const adoptiveFather = adoptiveParents?.father;
  const adoptiveMother = adoptiveParents?.mother;
  const paternalAdoptiveGrandfather = adoptiveFather?.parents?.father;
  const paternalAdoptiveGrandmother = adoptiveFather?.parents?.mother;
  const maternalAdoptiveGrandfather = adoptiveMother?.parents?.father;
  const maternalAdoptiveGrandmother = adoptiveMother?.parents?.mother;

  const childrenBySpouse = {}; 
  const childrenOfCurrentPersonDirectly = []; 

  if (childrenData) {
    childrenData.forEach(child => {
      const childBioMotherId = child.parents?.mother?._id || child.parents?.mother;
      const childBioFatherId = child.parents?.father?._id || child.parents?.father;
      const childAdoptiveMotherId = child.adoptiveParents?.mother?._id || child.adoptiveParents?.mother;
      const childAdoptiveFatherId = child.adoptiveParents?.father?._id || child.adoptiveParents?.father;

      let isBioChildOfCurrent = (childBioMotherId === currentPersonId || childBioFatherId === currentPersonId);
      let isAdoptiveChildOfCurrent = (childAdoptiveMotherId === currentPersonId || childAdoptiveFatherId === currentPersonId);

      if (isBioChildOfCurrent || isAdoptiveChildOfCurrent) {
        let otherBioParentId = isBioChildOfCurrent ? (childBioMotherId === currentPersonId ? childBioFatherId : childBioMotherId) : null;
        let otherAdoptiveParentId = isAdoptiveChildOfCurrent ? (childAdoptiveMotherId === currentPersonId ? childAdoptiveFatherId : childAdoptiveMotherId) : null;
        
        const spouseLink = spouses?.find(s => {
            const sId = s.person?._id || s.person;
            return sId === otherBioParentId || sId === otherAdoptiveParentId;
        });

        if (spouseLink) {
          const spouseId = spouseLink.person?._id || spouseLink.person;
          if (!childrenBySpouse[spouseId]) childrenBySpouse[spouseId] = [];
          // Flag if the child's connection to *this specific pairing* (currentPerson + spouseLink) is adoptive
          let isAdoptiveToThisPairing = false;
          if (isAdoptiveChildOfCurrent) { // Child is adoptive to currentPerson
            // If other parent is biological to child, or if other parent is also adoptive to child
            if (otherBioParentId === (spouseLink.person?._id || spouseLink.person) || otherAdoptiveParentId === (spouseLink.person?._id || spouseLink.person)) {
                 isAdoptiveToThisPairing = true;
            }
          } else if (isBioChildOfCurrent && otherAdoptiveParentId === (spouseLink.person?._id || spouseLink.person)) { // Child is bio to currentPerson, but adoptive to spouse
            isAdoptiveToThisPairing = true;
          }


          childrenBySpouse[spouseId].push({...child, isAdoptiveConnection: isAdoptiveToThisPairing });
        } else {
          // Child of currentPerson, other parent not a listed spouse or unknown
          childrenOfCurrentPersonDirectly.push({...child, isAdoptiveConnection: isAdoptiveChildOfCurrent && !isBioChildOfCurrent });
        }
      }
    });
  }
  
  const hasBioGrandparents = paternalBioGrandfather || paternalBioGrandmother || maternalBioGrandfather || maternalBioGrandmother;
  const hasAdoptiveGrandparents = paternalAdoptiveGrandfather || paternalAdoptiveGrandmother || maternalAdoptiveGrandfather || maternalAdoptiveGrandmother;
  const hasBioParents = bioFather || bioMother;
  const hasAdoptiveParents = adoptiveFather || adoptiveMother;
  const hasSiblings = siblingsData && siblingsData.length > 0;

  return (
    <div className="my-8 p-2 md:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-lg overflow-x-auto">
      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6 md:mb-8 text-center">
        Family Connections
      </h3>

      {/* Grandparents Layer */}
      {(hasBioGrandparents || hasAdoptiveGrandparents) && (
        <div className="mb-8 md:mb-12 text-center">
          <div className="flex justify-around items-start gap-2 md:gap-4 flex-wrap">
            {/* Paternal Line (Bio) */}
            {(paternalBioGrandfather || paternalBioGrandmother) && bioFather && (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex gap-1 md:gap-2">
                  <PersonNode person={paternalBioGrandfather} role="P. Grandfather" worldId={worldId} isGrandparent={true}/>
                  <PersonNode person={paternalBioGrandmother} role="P. Grandmother" worldId={worldId} isGrandparent={true}/>
                </div>
                <Line orientation="vertical" length="h-4 md:h-6" />
              </div>
            )}
            {/* Paternal Line (Adoptive) */}
            {(paternalAdoptiveGrandfather || paternalAdoptiveGrandmother) && adoptiveFather && (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                 <div className="flex gap-1 md:gap-2">
                  <PersonNode person={paternalAdoptiveGrandfather} role="P. Adpt. Grandfather" worldId={worldId} isGrandparent={true} isAdoptive={true}/>
                  <PersonNode person={paternalAdoptiveGrandmother} role="P. Adpt. Grandmother" worldId={worldId} isGrandparent={true} isAdoptive={true}/>
                </div>
                <Line orientation="vertical" length="h-4 md:h-6" type="dashed"/>
              </div>
            )}
            {((paternalBioGrandfather || paternalBioGrandmother || paternalAdoptiveGrandfather || paternalAdoptiveGrandmother) && 
              (maternalBioGrandfather || maternalBioGrandmother || maternalAdoptiveGrandfather || maternalAdoptiveGrandmother)) && 
              <div className="w-4 md:w-8 shrink-0 self-stretch"></div>}

            {/* Maternal Line (Bio) */}
            {(maternalBioGrandfather || maternalBioGrandmother) && bioMother && (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex gap-1 md:gap-2">
                  <PersonNode person={maternalBioGrandfather} role="M. Grandfather" worldId={worldId} isGrandparent={true}/>
                  <PersonNode person={maternalBioGrandmother} role="M. Grandmother" worldId={worldId} isGrandparent={true}/>
                </div>
                <Line orientation="vertical" length="h-4 md:h-6" />
              </div>
            )}
            {/* Maternal Line (Adoptive) */}
            {(maternalAdoptiveGrandfather || maternalAdoptiveGrandmother) && adoptiveMother && (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex gap-1 md:gap-2">
                  <PersonNode person={maternalAdoptiveGrandfather} role="M. Adpt. Grandfather" worldId={worldId} isGrandparent={true} isAdoptive={true}/>
                  <PersonNode person={maternalAdoptiveGrandmother} role="M. Adpt. Grandmother" worldId={worldId} isGrandparent={true} isAdoptive={true}/>
                </div>
                <Line orientation="vertical" length="h-4 md:h-6" type="dashed"/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parents Layer */}
      {(hasBioParents || hasAdoptiveParents) && (
        <div className="mb-8 md:mb-10 text-center">
          <div className="flex justify-center items-start gap-2 md:gap-4 sm:gap-8 flex-wrap">
            {bioFather && <PersonNode person={bioFather} role="Father" worldId={worldId} />}
            {bioMother && <PersonNode person={bioMother} role="Mother" worldId={worldId} />}
            {adoptiveFather && <PersonNode person={adoptiveFather} role="Adoptive Father" worldId={worldId} isAdoptive={true} />}
            {adoptiveMother && <PersonNode person={adoptiveMother} role="Adoptive Mother" worldId={worldId} isAdoptive={true} />}
          </div>
          <div className="flex justify-center mt-1 md:mt-2">
            {(bioFather || adoptiveFather) && <div className="relative w-1/2 flex justify-end pr-1"><Line orientation="vertical" length="h-6 md:h-10" type={(adoptiveFather && !bioFather) ? 'dashed' : 'solid'} /></div>}
            {(bioMother || adoptiveMother) && <div className="relative w-1/2 flex justify-start pl-1"><Line orientation="vertical" length="h-6 md:h-10" type={(adoptiveMother && !bioMother) ? 'dashed' : 'solid'} /></div>}
          </div>
           {(bioFather || adoptiveFather || bioMother || adoptiveMother) && 
             <div className="h-px bg-gray-300 dark:bg-gray-600 w-1/4 mx-auto "></div>
           }
        </div>
      )}
      
      {/* Siblings, Current Person, Spouses Row */}
      <div className="flex flex-col items-center">
        {hasSiblings && (
            <div className="mb-2 md:mb-4 text-center">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Siblings</h4>
                <div className="flex justify-center items-center gap-2 md:gap-3 flex-wrap">
                    {siblingsData.map(sibling => (
                        <PersonNode 
                            key={sibling._id} 
                            person={sibling} 
                            worldId={worldId} 
                            isSibling={true} 
                            siblingType={sibling.siblingType}
                        />
                    ))}
                </div>
                <Line orientation="vertical" length="h-4 md:h-6" />
            </div>
        )}

        <div className="flex justify-center mb-2 md:mb-4 relative">
          <PersonNode person={currentPerson} worldId={worldId} isCurrentPerson={true} onAddChildClick={onAddChildWithSpouse} />
          {spouses && spouses.length > 0 && (
              <div className="absolute top-1/2 left-1/2 w-full h-px bg-gray-300 dark:bg-gray-600 -translate-y-1/2 z-0" style={{width: 'calc(100% - 100px)', minWidth: '50px'}}></div>
          )}
        </div>

        {spouses && spouses.length > 0 && (
          <div className="flex justify-center items-start gap-x-4 md:gap-x-12 lg:gap-x-16 flex-nowrap overflow-x-auto pb-4 relative pt-6 md:pt-8 w-full">
            {spouses.map((spouseRel, index) => {
              const spouseObject = spouseRel.person; 
              const spouseId = spouseObject?._id || spouseRel.person;
              const sharedChildren = childrenBySpouse[spouseId] || [];
              
              return (
                <div key={spouseId || `spouse-group-${index}`} className="flex flex-col items-center shrink-0 relative pt-6 md:pt-8">
                  <div className="absolute top-0 left-1/2 w-px h-6 md:h-8 bg-gray-300 dark:bg-gray-600 -translate-x-1/2"></div>
                  <PersonNode 
                    person={spouseObject} 
                    role="Spouse" 
                    worldId={worldId} 
                    onAddChildClick={onAddChildWithSpouse} 
                    spouseForAddChild={spouseObject}
                  />
                  {sharedChildren.length > 0 && (
                    <>
                      <Line orientation="vertical" length="h-6 md:h-8" type={sharedChildren.some(c => c.isAdoptiveConnection) ? 'dashed' : 'solid'} />
                      <div className="flex flex-col items-center gap-2 md:gap-3 mt-1 md:mt-2">
                        {sharedChildren.map((child, childIdx) => (
                          <PersonNode 
                            key={child._id || `child-${childIdx}`} 
                            person={child} 
                            role="Child" 
                            worldId={worldId} 
                            isAdoptive={child.isAdoptiveConnection} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {childrenOfCurrentPersonDirectly.length > 0 && (
        <div className="mt-6 md:mt-10 text-center">
          <Line orientation="vertical" length="h-6 md:h-8" type={childrenOfCurrentPersonDirectly.some(c => c.isAdoptiveConnection) ? 'dashed' : 'solid'} />
          <h4 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
            Children with {currentPerson.name} (other parent not listed as current spouse / unknown)
          </h4>
          <div className="flex justify-center items-start gap-2 md:gap-4 sm:gap-6 flex-wrap mt-1 md:mt-2">
            {childrenOfCurrentPersonDirectly.map((child, index) => (
              <PersonNode 
                key={child._id || `unknown-child-${index}`} 
                person={child} 
                role="Child" 
                worldId={worldId} 
                isAdoptive={child.isAdoptiveConnection}
              />
            ))}
          </div>
        </div>
      )}
      
      {(!hasBioParents && !hasAdoptiveParents && (!spouses || spouses.length === 0) && (!childrenData || childrenData.length === 0) && !hasSiblings) && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">No immediate family information recorded.</p>
      )}
    </div>
  );
};

export default FamilyTree;
