/** Local boundary contract only. No provider, network, generation, or booking. */
const fail=(message)=>{throw new Error(message)}
const exact=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value))fail('OBJECT_REQUIRED');if(Object.keys(value).some(k=>!keys.includes(k)))fail('UNSUPPORTED_FIELD')}
export function validateItineraryRequest(value,catalog){
 exact(value,['version','locale','destinationId','days','pace','interests']);
 if(value.version!==1)fail('UNSUPPORTED_VERSION');
 if(!['es','en'].includes(value.locale))fail('UNSUPPORTED_LOCALE');
 const destination=catalog.destinations.find(d=>d.id===value.destinationId&&d.sourced);
 if(!destination)fail('DESTINATION_NOT_IN_REVIEWED_CATALOG');
 if(!Number.isInteger(value.days)||value.days<1||value.days>14)fail('DAYS_OUT_OF_RANGE');
 if(!['slow','balanced','active'].includes(value.pace))fail('INVALID_PACE');
 if(!Array.isArray(value.interests)||value.interests.length>8||value.interests.some(i=>typeof i!=='string'||i.length>80))fail('INVALID_INTERESTS');
 const known=new Set(catalog.experiences.filter(e=>e.destinationId===value.destinationId).flatMap(e=>e.interests));
 if(value.interests.some(i=>!known.has(i)))fail('INTEREST_NOT_IN_CATALOG');
 return {version:1,locale:value.locale,destinationId:destination.id,days:value.days,pace:value.pace,interests:[...new Set(value.interests)]};
}
export function validateItineraryResponse(value,request,catalog){
 exact(value,['version','destinationId','days']);
 if(value.version!==1||value.destinationId!==request.destinationId)fail('RESPONSE_MISMATCH');
 if(!Array.isArray(value.days)||value.days.length!==request.days)fail('INVALID_DAY_COUNT');
 const selected=new Set();const max=request.pace==='slow'?2:request.pace==='balanced'?3:4;
 const days=value.days.map((day,i)=>{
  exact(day,['day','items']);if(day.day!==i+1||!Array.isArray(day.items)||day.items.length>max)fail('INVALID_DAY_OR_PACE');
  return {day:i+1,items:day.items.map(item=>{
   exact(item,['catalogId','reason']);if(!['interest-match','destination-context'].includes(item.reason))fail('UNSUPPORTED_REASON');
   const entry=catalog.experiences.find(e=>e.id===item.catalogId&&e.destinationId===request.destinationId);
   if(!entry||selected.has(entry.id))fail('UNKNOWN_OR_DUPLICATE_ITEM');selected.add(entry.id);
   if(item.reason==='interest-match'&&!entry.interests.some(i=>request.interests.includes(i)))fail('UNSUPPORTED_INTEREST_MATCH');
   if(!Array.isArray(entry.sources)||!entry.sources.length||entry.sources.some(s=>{try{const u=new URL(s.url);return u.protocol!=='https:'||Boolean(u.username||u.password)}catch{return true}}))fail('INVALID_CATALOG_SOURCE');
   // Descriptive content and URLs are copied from the catalog, NEVER from model output.
   return {catalogId:entry.id,kind:entry.kind||'verified-experience',title:entry.title,description:entry.description,reason:item.reason,sources:entry.sources.map(s=>({...s})),checkedOn:entry.checkedOn,checks:[...entry.checks],coverageGaps:entry.coverageGaps};
  })};
 });
 if(!selected.size)fail('EMPTY_PLAN');
 return {version:1,destinationId:request.destinationId,locale:request.locale,status:'validated-structure-not-operationally-verified',days,limits:{availabilityVerified:false,transportCalculated:false,bookingCreated:false,preferencesTransferred:false},globalCheck:catalog.globalCheck};
}
