import type {Catalog} from './catalog'
export type Simulation={mode:string;locale:string;days:{day:number;items:{catalogId:string;kind:string;title:string;description:string;reason:string;sources:{label:string;url:string}[];checkedOn:string;checks:string[];coverageGaps:string}[]}[];globalCheck:string;limits:{availabilityVerified:false;transportCalculated:false;bookingCreated:false;preferencesTransferred:false}}
export function simulateItinerary(input:unknown,selection:string[],catalog:Catalog):Simulation
