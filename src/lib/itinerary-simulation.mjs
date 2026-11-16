import {validateItineraryRequest,validateItineraryResponse} from './itinerary-contract.mjs'
/** Explicit deterministic demonstration; no recommendations, model or network. */
export function simulateItinerary(input,selection,catalog){
 const request=validateItineraryRequest(input,catalog)
 if(!Array.isArray(selection)||!selection.length)throw new Error('SELECT_ITEMS_FIRST')
 if(new Set(selection).size!==selection.length)throw new Error('DUPLICATE_SELECTION')
 const cap={slow:2,balanced:3,active:4}[request.pace]
 if(selection.length>request.days*cap)throw new Error('SELECTION_EXCEEDS_CAPACITY')
 const days=Array.from({length:request.days},(_,i)=>({day:i+1,items:[]}))
 selection.forEach((id,i)=>{const entry=catalog.experiences.find(e=>e.id===id&&e.destinationId===request.destinationId);if(!entry)throw new Error('INVALID_SELECTION');days[Math.floor(i/cap)].items.push({catalogId:id,reason:entry.interests.some(x=>request.interests.includes(x))?'interest-match':'destination-context'})})
 return {mode:'local-deterministic-simulation-not-ai',...validateItineraryResponse({version:1,destinationId:request.destinationId,days},request,catalog)}
}
