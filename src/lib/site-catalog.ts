import caribbean from '../data/caribbean-guides.json'
import { localCatalog, type Catalog } from './catalog'
import type { Locale } from './content'
import type { SiteConfig } from './site-config'

export function caribbeanCatalog(locale: Locale): Catalog {
  const es = locale === 'es'
  const scope = es
    ? 'Guías editoriales recuperadas, con fuente del destino fechada 6 de noviembre de 2026.'
    : 'Recovered editorial guides with destination sources dated November 6, 2026.'
  return {
    mode: 'local-review',
    scope,
    globalCheck: es
      ? 'Confirma condiciones, acceso, transporte, precios y disponibilidad directamente antes de viajar.'
      : 'Confirm conditions, access, transport, prices and availability directly before traveling.',
    destinations: [
      ...caribbean.destinations.map(d => ({
        id: d.id,
        title: d.name[locale],
        region: 'caribe' as const,
        summary: d.summary[locale],
        coverage: scope,
        sourced: true,
        introduction: d.introduction[locale],
        beforeBooking: d.beforeBooking[locale],
        sources: d.sources,
        checkedOn: d.checkedOn,
        sourceDateKind: 'recovered' as const,
      })),
      {
        id: 'riviera-maya',
        title: 'Riviera Maya',
        region: 'caribe',
        summary: es
          ? 'Referencia regional conservada de la maqueta.'
          : 'Regional reference retained from the mockup.',
        coverage: es
          ? 'Sin guía propia recuperada.'
          : 'No standalone guide was recovered.',
        sourced: false,
      },
    ],
    experiences: caribbean.destinations.flatMap(d =>
      d.sections.map(section => ({
        kind: 'editorial-block' as const,
        id: section.id,
        destinationId: d.id,
        title: section.title[locale],
        description: section.body[locale],
        area: d.name[locale],
        interests: [],
        checks: [section.check[locale]],
        coverageGaps: scope,
        checkedOn: d.checkedOn,
        sources: d.sources,
      }))
    ),
  }
}

export function catalogForSite(locale: Locale, site: SiteConfig): Catalog {
  const baja = localCatalog(locale)
  if (!site.regions.includes('caribe')) return baja
  const caribe = caribbeanCatalog(locale)
  return {
    mode: 'local-review',
    destinations: [...baja.destinations, ...caribe.destinations],
    experiences: [...baja.experiences, ...caribe.experiences],
    scope:
      locale === 'es'
        ? 'Baja y Caribe Mexicano: experiencias específicas y guías editoriales.'
        : 'Baja California and Mexican Caribbean: specific experiences and editorial guides.',
    globalCheck: baja.globalCheck,
  }
}
