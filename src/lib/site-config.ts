import type {Locale} from './content'
export type SiteVariant='travelmexico'|'baja'
export type Region='baja'|'caribe'
export type SiteConfig={id:SiteVariant;name:string;regions:Region[];eyebrow:Record<Locale,string>;hero:Record<Locale,string>;intro:Record<Locale,string>;title:Record<Locale,string>}
const sites:Record<SiteVariant,SiteConfig>={
 travelmexico:{id:'travelmexico',name:'Travel México',regions:['baja','caribe'],eyebrow:{es:'Somos Especialistas en México',en:'Mexico Is Our Specialty'},hero:{es:'México te mueve. Hazlo tuyo.',en:'Mexico moves you. Make it yours.'},intro:{es:'Empieza con Baja o el Caribe Mexicano. Conserva tus decisiones en una guía editable y explora después el motor de reservaciones.',en:'Start with Baja or the Mexican Caribbean. Keep your choices in an editable guide, then explore the booking engine.'},title:{es:'Travel México | Baja y Caribe, a tu manera',en:'Travel Mexico | Baja and the Caribbean, your way'}},
 baja:{id:'baja',name:'Baja California Edit',regions:['baja'],eyebrow:{es:'Una mirada editorial a Baja California',en:'An editorial view of Baja California'},hero:{es:'Baja California. A tu manera.',en:'Baja California. Your way.'},intro:{es:'Explora el catálogo de Baja con fuentes, contexto y límites. Selecciona experiencias y arma tu guía sin inventar rutas, horarios ni disponibilidad.',en:'Explore the Baja catalog with sources, context and limits. Select experiences and shape your guide without invented routes, schedules or availability.'},title:{es:'Baja California Edit | Guías con fuentes y contexto',en:'Baja California Edit | Guides with sources and context'}},
}
export function getSiteConfig(value:string|undefined=process.env.SITE_VARIANT):SiteConfig {
 if(value!==undefined&&value!==''&&value!=='travelmexico'&&value!=='baja')throw new Error('SITE_VARIANT must be travelmexico or baja.')
 const site=sites[value==='baja'?'baja':'travelmexico']
 return {...site,regions:[...site.regions]}
}
