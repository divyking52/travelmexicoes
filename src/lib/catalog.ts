import source from '../data/catalog.json'
import type { Region } from './site-config'
import { bookingURL, escapeHTML, safeNotes, type Locale } from './content'

export type Source = { label: string; url: string; publisher?: string }
export type CatalogDestination = {
  id: string
  title: string
  summary: string
  coverage: string
  sourced: boolean
  region: Region
  image?: { url: string; alt: string; credit: string }
  checkedOn?: string
  sourceDateKind?: 'reviewed' | 'recovered'
  introduction?: string[]
  beforeBooking?: string[]
  sources?: Source[]
}
export type CatalogExperience = {
  kind?: 'verified-experience' | 'editorial-block'
  id: string
  destinationId: string
  title: string
  description: string
  area: string
  interests: string[]
  checks: string[]
  coverageGaps: string
  checkedOn: string
  sources: Source[]
}
export type Catalog = {
  mode: 'local-review' | 'cms'
  destinations: CatalogDestination[]
  experiences: CatalogExperience[]
  scope: string
  globalCheck: string
}
export type TravelDraft = {
  version: 2
  destinationId: string
  interests: string[]
  experienceIds: string[]
  notes: string
}
export const DRAFT_KEY = 'travelmexico-personal-draft-v2'
export const interestLabels: Record<string, { es: string; en: string }> = {
  'Adventure': { es: 'Aventura', en: 'Adventure' },
  'Archaeology': { es: 'Arqueología', en: 'Archaeology' },
  'Beaches': { es: 'Playas', en: 'Beaches' },
  'Cities & architecture': { es: 'Ciudades y arquitectura', en: 'Cities & architecture' },
  'Culture & traditions': { es: 'Cultura y tradiciones', en: 'Culture & traditions' },
  'Folklore & crafts': { es: 'Folclore y artesanías', en: 'Folklore & crafts' },
  'Food & flavours': { es: 'Gastronomía', en: 'Food & flavours' },
  'Learning & workshops': { es: 'Aprendizaje y talleres', en: 'Learning & workshops' },
  'Nature & landscapes': { es: 'Naturaleza y paisajes', en: 'Nature & landscapes' },
  'Pueblos Mágicos': { es: 'Pueblos Mágicos', en: 'Pueblos Mágicos' },
  'Water activities': { es: 'Actividades acuáticas', en: 'Water activities' },
  'Wildlife': { es: 'Fauna', en: 'Wildlife' },
}
export function safeSourceURL(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null
  } catch {
    return null
  }
}
export function localCatalog(locale: Locale): Catalog {
  const coverage = source.experienceReview.coverage as Record<string, Record<Locale, string>>
  return {
    mode: 'local-review',
    scope: source.experienceReview.scope[locale],
    globalCheck: source.experienceReview.globalCheck[locale],
    destinations: [
      ...source.destinations.map(d => ({
        id: d.id,
        region: 'baja' as const,
        title: d.name,
        summary: d.intro[locale === 'es' ? 0 : 1],
        coverage: coverage[d.id]?.[locale] || '',
        sourced: true,
        checkedOn: source.experienceReview.checkedOn,
        sources: [{ label: d.name, url: d.official }],
      })),
      {
        id: 'bahia-de-los-angeles',
        region: 'baja',
        title: 'Bahía de los Ángeles',
        summary:
          locale === 'es'
            ? 'Destino conservado de la primera maqueta.'
            : 'Destination retained from the first mockup.',
        coverage:
          locale === 'es'
            ? 'Sin experiencias verificadas en este catálogo.'
            : 'No verified experiences in this catalog.',
        sourced: false,
      },
    ],
    experiences: source.experiences
      .filter(e => e.reviewStatus === 'reviewed')
      .map(e => ({
        id: e.id,
        destinationId: e.destinationId,
        title: e.title[locale],
        description: e.description[locale],
        area: e.area[locale],
        interests: e.interests,
        checks: e.checks.map(c => c.text[locale]),
        coverageGaps: e.coverageGaps[locale],
        checkedOn: e.checkedOn,
        sources: e.sources.filter(s => safeSourceURL(s.url)).map(s => ({ label: s.label, url: s.url, publisher: s.publisher })),
      })),
  }
}
export function emptyDraft(catalog: Catalog): TravelDraft {
  return { version: 2, destinationId: catalog.destinations[0]?.id || '', interests: [], experienceIds: [], notes: '' }
}
export function normalizeDraft(value: unknown, catalog: Catalog): TravelDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid draft')
  const v = value as Record<string, unknown>
  if (v.version !== 2 || typeof v.destinationId !== 'string' || !catalog.destinations.some(d => d.id === v.destinationId)) {
    throw new Error('Invalid draft destination or version')
  }
  const unique = (x: unknown): string[] => Array.isArray(x) ? [...new Set(x.filter((i): i is string => typeof i === 'string'))] : []
  const validIds = new Set(catalog.experiences.filter(e => e.destinationId === v.destinationId).map(e => e.id))
  return {
    version: 2,
    destinationId: v.destinationId,
    interests: unique(v.interests).filter(i => Object.hasOwn(interestLabels, i)),
    experienceIds: unique(v.experienceIds).filter(i => validIds.has(i)).slice(0, 40),
    notes: safeNotes(typeof v.notes === 'string' ? v.notes : ''),
  }
}
export function moveExperience(ids: string[], id: string, direction: -1 | 1): string[] {
  const i = ids.indexOf(id), next = i + direction
  if (i < 0 || next < 0 || next >= ids.length) return ids
  const copy = [...ids]
  ;[copy[i], copy[next]] = [copy[next], copy[i]]
  return copy
}
export function matchingExperiences(catalog: Catalog, draft: TravelDraft): CatalogExperience[] {
  return catalog.experiences.filter(
    e => e.destinationId === draft.destinationId && (e.kind === 'editorial-block' || !draft.interests.length || e.interests.some(i => draft.interests.includes(i)))
  )
}
export function selectedExperiences(catalog: Catalog, draft: TravelDraft): CatalogExperience[] {
  const map = new Map(catalog.experiences.filter(e => e.destinationId === draft.destinationId).map(e => [e.id, e]))
  return draft.experienceIds.flatMap(id => (map.has(id) ? [map.get(id)!] : []))
}
export function recommendationReason(e: CatalogExperience, interests: string[], locale: Locale): string {
  if (e.kind === 'editorial-block') return locale === 'es' ? 'Bloque editorial flexible.' : 'Flexible editorial block.'
  const matches = e.interests.filter(i => interests.includes(i)).map(i => interestLabels[i]?.[locale] || i)
  return matches.length ? (locale === 'es' ? 'Coincide con: ' : 'Matches: ') + matches.join(', ') : locale === 'es' ? 'Experiencia del destino seleccionado.' : 'Experience in your selected destination.'
}
