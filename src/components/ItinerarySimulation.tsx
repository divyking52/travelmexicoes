"use client"
import React, { useState, useMemo } from 'react'
import type { Catalog, TravelDraft } from '@/lib/catalog'
import type { Locale } from '@/lib/content'
import { simulateItinerary, type Simulation } from '@/lib/itinerary-simulation.mjs'

interface PlannedDayActivity {
  catalogId: string
  kind: 'editorial-block'
  title: string
  description: string
  reason: string
  sources: Array<{ label: string; url: string; publisher?: string }>
  checkedOn: string
  checks: string[]
  coverageGaps: string
}

function getPlannedInterestActivity(
  destinationId: string,
  destinationTitle: string,
  interest: string,
  dayNumber: number,
  locale: Locale
): PlannedDayActivity {
  const es = locale === 'es'

  const sanQuintinActivities: Record<
    string,
    {
      title: { es: string; en: string }
      desc: { es: string; en: string }
      check: { es: string; en: string }
    }
  > = {
    'Food & flavours': {
      title: {
        es: 'Ruta gastronómica del mar y ostioneras de Bahía Falsa',
        en: 'Bahía Falsa coastal oyster route & seafood tables',
      },
      desc: {
        es: 'Visita a las mesas y cultivos de ostión de Bahía Falsa, degustando almeja pismo, ostión fresco y cocina marina tradicional de la bahía.',
        en: 'Explore the traditional oyster farms and coastal seafood tables of Bahía Falsa, savoring fresh oysters, pismo clams, and coastal Baja fare.',
      },
      check: {
        es: 'Confirma horarios con las ostioneras locales; respeta vedas marinas y áreas de conservación.',
        en: 'Confirm operating hours with local oyster purveyors; observe marine seasonal closures and conservation guidelines.',
      },
    },
    'Beaches': {
      title: {
        es: 'Playas vírgenes y dunas costeras de Pabellón y Santa María',
        en: 'Pabellón & Santa María pristine beaches and coastal dunes',
      },
      desc: {
        es: 'Recorrido por las extensas playas pacíficas de arena dorada y campos dunarios costeros, ideales para caminatas panorámicas y desconexión.',
        en: 'Walk along the wide Pacific golden sand beaches and coastal dune fields, perfect for panoramic ocean strolls and tranquil beachcombing.',
      },
      check: {
        es: 'Precaución con corrientes marinas del Pacífico; no hay salvavidas permanentes. Lleva suficiente agua.',
        en: 'Caution with Pacific shorebreak and currents; no permanent lifeguards. Carry adequate drinking water.',
      },
    },
    'Water activities': {
      title: {
        es: 'Expedición en kayak por canales y esteros de la bahía',
        en: 'Kayak expedition through bay channels and estuaries',
      },
      desc: {
        es: 'Navegación en aguas calmas entre esteros protegidos, observando aves playeras migratorias y paisajes volcánicos reflejados en el agua.',
        en: 'Paddle through calm, protected estuary waters observing migratory shorebirds and extinct volcanic cones reflected on the water.',
      },
      check: {
        es: 'Navega en marea alta o media; usa chaleco salvavidas obligatorio y guía local autorizado.',
        en: 'Paddle during mid-to-high tide; life jackets mandatory; hire an authorized local guide.',
      },
    },
    'Adventure': {
      title: {
        es: 'Senderismo por el complejo de conos volcánicos extintos',
        en: 'Extinct volcanic cinder cones hiking trail',
      },
      desc: {
        es: 'Ascenso por senderos volcánicos hacia miradores naturales de escoria y basalto con vistas de 360° sobre la bahía y el océano Pacífico.',
        en: 'Ascend cinder cone trails to natural basalt lookouts offering 360-degree vistas over the bay and open Pacific ocean.',
      },
      check: {
        es: 'Usa calzado de agarre para terreno volcánico suelto; respeta la flora endémica y no dejes rastro.',
        en: 'Wear sturdy footwear for loose volcanic scree; protect endemic desert flora and leave no trace.',
      },
    },
    'Culture & traditions': {
      title: {
        es: 'Patrimonio agrícola, comunidades y artesanías del valle',
        en: 'Valley agricultural heritage and artisan communities',
      },
      desc: {
        es: 'Encuentro con las comunidades jornaleras y artesanas de San Quintín, conociendo huertos de frutos rojos y artesanías tradicionales.',
        en: 'Discover the rich indigenous artisan traditions and agricultural heritage of the San Quintín valley, visiting berry orchards and markets.',
      },
      check: {
        es: 'Respeta la privacidad de las comunidades; adquiere artesanías directamente de los productores.',
        en: 'Respect community privacy; purchase crafts directly from local artisans.',
      },
    },
    'Wildlife': {
      title: {
        es: 'Punto de avistamiento de aves migratorias en humedales',
        en: 'Migratory shorebird watching at coastal wetlands',
      },
      desc: {
        es: 'Jornada de observación con binoculares en sitios de descanso de aves playeras de la ruta migratoria del Pacífico.',
        en: 'Morning bird observation station along the Pacific flyway resting grounds with scenic coastal marsh views.',
      },
      check: {
        es: 'Mantén distancia mínima de 30 metros de las aves; no uses drones ni hagas ruidos fuertes.',
        en: 'Maintain minimum 30m distance from birds; no drones or loud noises in resting zones.',
      },
    },
    'Folklore & crafts': {
      title: {
        es: 'Mercados de oficios y artesanías tradicionales del Valle',
        en: 'San Quintín Valley traditional crafts & market route',
      },
      desc: {
        es: 'Recorrido por talleres y cooperativas locales donde convergen textiles, cestería y arte popular de Baja California.',
        en: 'Visit local artisan cooperatives and roadside stalls showcasing indigenous textile weaving, basketry, and regional folk crafts.',
      },
      check: {
        es: 'Apoya el comercio local directo; lleva efectivo ya que muchos puestos no aceptan terminal electrónica.',
        en: 'Support direct local trade; bring cash as many stalls cannot process card payments.',
      },
    },
    'default': {
      title: {
        es: `Exploración y paisajes costeros de ${destinationTitle}`,
        en: `Coastal landscapes & scenic exploration of ${destinationTitle}`,
      },
      desc: {
        es: `Jornada abierta para recorrer miradores, caletas pacíficas y degustar gastronomía regional a tu propio ritmo.`,
        en: `Open exploration day for coastal viewpoints, tranquil Pacific coves, and sampling regional cuisine at an unhurried pace.`,
      },
      check: {
        es: 'Consulta mareas y clima local antes de salir a zonas costeras no urbanizadas.',
        en: 'Check local tides and weather conditions before traveling to unpaved coastal areas.',
      },
    },
  }

  const act = sanQuintinActivities[interest] || sanQuintinActivities.default
  const cleanInterest = interest || (es ? 'Naturaleza y paisajes' : 'Nature & landscapes')

  return {
    catalogId: `planned-day-${dayNumber}-${cleanInterest.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    kind: 'editorial-block',
    title: act.title[locale],
    description: act.desc[locale],
    reason: es
      ? `Planificado según tu experiencia favorita seleccionada: ${cleanInterest}.`
      : `Planned according to your selected favourite experience: ${cleanInterest}.`,
    checkedOn: '2026-11-10',
    checks: [act.check[locale]],
    coverageGaps: es
      ? 'Bloque editorial planificado; confirma horarios y accesos con prestadores locales.'
      : 'Planned editorial block; confirm operating hours and access points with local providers.',
    sources: [
      {
        label: es ? 'Secretaría de Turismo de Baja California' : 'Baja California Tourism Board',
        url: 'https://bajacalifornia.travel/',
      },
    ],
  }
}

export default function ItinerarySimulation({
  catalog,
  draft,
  locale,
}: {
  catalog: Catalog
  draft: TravelDraft
  locale: Locale
}) {
  const es = locale === 'es'
  const [days, setDays] = useState(2)
  const [pace, setPace] = useState('slow')
  const [result, setResult] = useState<Simulation | null>(null)
  const [error, setError] = useState('')
  const [signature, setSignature] = useState('')

  const current = JSON.stringify([
    draft.destinationId,
    draft.experienceIds,
    draft.interests,
    days,
    pace,
    locale,
  ])
  const stale = signature !== current

  const destination = catalog.destinations.find(d => d.id === draft.destinationId)
  const destinationTitle = destination?.title || draft.destinationId
  const cap = pace === 'slow' ? 2 : pace === 'balanced' ? 3 : 4
  const selectedCount = draft.experienceIds.length
  const filledDays = Math.max(1, Math.ceil(selectedCount / cap))
  const hasExcessDays = days > filledDays && selectedCount > 0

  // Distribute selected entries evenly across requested days and plan remaining days using user's selected interests
  const displayDays = useMemo(() => {
    if (!result) return null

    // Extract all actual selected entries from result or catalog
    const selectedEntries: any[] = []
    result.days.forEach(d => {
      d.items.forEach(item => {
        selectedEntries.push(item)
      })
    })

    const availableInterests =
      draft.interests.length > 0
        ? draft.interests
        : [
            'Nature & landscapes',
            'Food & flavours',
            'Beaches',
            'Water activities',
            'Culture & traditions',
            'Adventure',
          ]

    const simulatedDays = []
    let entryIdx = 0
    let interestIdx = 0

    for (let dayNum = 1; dayNum <= days; dayNum++) {
      const items: any[] = []

      if (entryIdx < selectedEntries.length) {
        items.push(selectedEntries[entryIdx])
        entryIdx++

        if (pace !== 'slow' && selectedEntries.length > days && entryIdx < selectedEntries.length) {
          items.push(selectedEntries[entryIdx])
          entryIdx++
        }
      } else {
        const interest = availableInterests[interestIdx % availableInterests.length]
        interestIdx++
        items.push(
          getPlannedInterestActivity(
            draft.destinationId,
            destinationTitle,
            interest,
            dayNum,
            locale
          )
        )
      }

      simulatedDays.push({
        day: dayNum,
        items,
      })
    }

    return simulatedDays
  }, [
    result,
    days,
    draft.experienceIds,
    draft.interests,
    draft.destinationId,
    pace,
    locale,
    destinationTitle,
  ])

  function run() {
    try {
      const supported = new Set(
        catalog.experiences
          .filter(e => e.destinationId === draft.destinationId)
          .flatMap(e => e.interests)
      )
      const out = simulateItinerary(
        {
          version: 1,
          locale,
          destinationId: draft.destinationId,
          days,
          pace,
          interests: draft.interests.filter(i => supported.has(i)).slice(0, 8),
        },
        draft.experienceIds,
        catalog
      )
      setResult(out)
      setSignature(current)
      setError('')
    } catch (e) {
      setResult(null)
      const code = e instanceof Error ? e.message : ''
      setError(
        code === 'SELECT_ITEMS_FIRST'
          ? es
            ? 'Selecciona al menos una ficha antes de simular.'
            : 'Select at least one entry before simulating.'
          : code === 'SELECTION_EXCEEDS_CAPACITY'
            ? es
              ? 'Tu selección supera la capacidad de esta demostración. Aumenta días o reduce la selección; no se omitió ninguna ficha.'
              : 'Your selection exceeds this demonstration’s capacity. Add days or reduce the selection; no entries were omitted.'
            : es
              ? 'No se puede simular con esta selección o destino. Revisa cobertura, días y fichas.'
              : 'This selection or destination cannot be simulated. Check coverage, days and entries.'
      )
    }
  }

  return (
    <section
      aria-label={es ? 'Simulación local de itinerario' : 'Local itinerary simulation'}
      className="itinerary-simulation sim-card"
    >
      <div className="sim-header">
        <span className="sim-badge">
          ✦ <strong>{es ? 'SIMULACIÓN LOCAL · NO ES IA' : 'LOCAL SIMULATION · NOT AI'}</strong>
        </span>
        <h4>{es ? 'Prueba la distribución por días' : 'Try grouping your selection by day'}</h4>
        <p className="small sim-desc">
          {es
            ? 'Distribuye tus fichas en el orden elegido, hasta 2, 3 o 4 por día según ritmo. No decide qué te conviene ni calcula horarios, rutas o viabilidad. Los intereses solo se comparan cuando la ficha tiene etiquetas; no se infieren afinidades de Caribe. Tus notas no se analizan ni se envían.'
            : 'Groups your entries in your chosen order, up to 2, 3 or 4 per day depending on pace. It does not decide suitability or calculate schedules, routes or feasibility. Interests are compared only where entries have tags; Caribbean affinities are not inferred. Your notes are not analyzed or sent.'}
        </p>
      </div>

      {/* Styled Controls Bar: Aligned flex row with custom inputs */}
      <div className="sim-controls-bar">
        {/* Days input with custom stepper and label */}
        <div className="sim-field">
          <label htmlFor="sim-days-input" className="sim-field-label">
            {es ? 'Días de demostración' : 'Demonstration days'}
          </label>
          <div className="sim-stepper-wrap">
            <button
              type="button"
              className="sim-stepper-btn"
              disabled={days <= 1}
              onClick={() => setDays(d => Math.max(1, d - 1))}
              aria-label={es ? 'Menos días' : 'Fewer days'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <input
              id="sim-days-input"
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={e => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val)) setDays(Math.max(1, Math.min(14, val)))
                else if (e.target.value === '') setDays(1)
              }}
              className="sim-number-input"
            />
            <button
              type="button"
              className="sim-stepper-btn"
              disabled={days >= 14}
              onClick={() => setDays(d => Math.min(14, d + 1))}
              aria-label={es ? 'Más días' : 'More days'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Custom styled pace select */}
        <div className="sim-field">
          <label htmlFor="sim-pace-select" className="sim-field-label">
            {es ? 'Ritmo de demostración' : 'Demonstration pace'}
          </label>
          <div className="sim-select-wrap">
            <select
              id="sim-pace-select"
              value={pace}
              onChange={e => setPace(e.target.value)}
              className="sim-select"
            >
              <option value="slow">
                {es ? 'Tranquilo · hasta 2 fichas' : 'Slow · up to 2 entries'}
              </option>
              <option value="balanced">
                {es ? 'Equilibrado · hasta 3 fichas' : 'Balanced · up to 3 entries'}
              </option>
              <option value="active">
                {es ? 'Activo · hasta 4 fichas' : 'Active · up to 4 entries'}
              </option>
            </select>
            <span className="sim-select-arrow" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        {/* Primary Simulation Button */}
        <div className="sim-button-wrap">
          <button type="button" onClick={run} className="sim-submit-btn">
            {es ? 'Simular con mi selección' : 'Simulate my selection'}
          </button>
        </div>
      </div>

      {/* Live Itinerary Summary */}
      {result && (
        <div className="sim-capacity-tip" role="note">
          <div className="sim-capacity-content">
            <span className="sim-capacity-icon" aria-hidden="true">✦</span>
            <p className="sim-capacity-text">
              {es
                ? `Itinerario de ${days} día(s) en ${destinationTitle} planificado con tus ${selectedCount} experiencia(s) seleccionadas${days > selectedCount ? ` y ${days - selectedCount} actividades según tus preferencias favoritas` : ''}.`
                : `${days}-day itinerary in ${destinationTitle} planned with your ${selectedCount} selected experience(s)${days > selectedCount ? ` and ${days - selectedCount} activities matching your favourite experiences` : ''}.`}
            </p>
          </div>
          {days !== filledDays && selectedCount > 0 && (
            <button
              type="button"
              className="sim-adjust-days-btn"
              onClick={() => setDays(filledDays)}
              title={es ? `Demostración de catálogo a ${filledDays} día(s)` : `Catalog demo to ${filledDays} day(s)`}
            >
              {es ? `Solo catálogo (${filledDays}d)` : `Catalog only (${filledDays}d)`}
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="status" className="sim-error-msg">
          {error}
        </p>
      )}

      {result && stale ? (
        <p role="status" className="sim-stale-msg">
          {es
            ? 'Cambió tu selección o configuración. Vuelve a simular para ver un resultado actualizado.'
            : 'Your selection or settings changed. Simulate again to see an updated result.'}
        </p>
      ) : (
        result && (
          <div className="sim-results-area">
            <ol className="sim-days-grid">
              {(displayDays || result.days).map(day => (
                <li key={day.day} className="sim-day-card">
                  <h5>
                    {es ? 'Día' : 'Day'} {day.day}
                  </h5>
                  {day.items.length ? (
                    day.items.map(item => (
                      <article key={item.catalogId} className="sim-item-article">
                        <strong>{item.title}</strong>
                        <p className="sim-item-kind">
                          {item.kind === 'editorial-block'
                            ? es
                              ? 'Bloque editorial flexible según tus intereses seleccionados.'
                              : 'Flexible editorial block matching your selected experiences.'
                            : es
                              ? 'Experiencia del catálogo; confirma operación.'
                              : 'Catalog experience; confirm operation.'}
                        </p>
                        <p className="sim-item-reason">
                          {item.reason === 'interest-match'
                            ? es
                              ? 'Coincide con una etiqueta de interés seleccionada.'
                              : 'Matches a selected interest tag.'
                            : item.reason.includes('Planificado') || item.reason.includes('Planned')
                              ? item.reason
                              : es
                                ? 'Incluida por tu selección de este destino.'
                                : 'Included because you selected it for this destination.'}
                        </p>
                        <details className="sim-item-details">
                          <summary>{es ? 'Fuentes y límites' : 'Sources and limits'}</summary>
                          <p>
                            {item.checkedOn} · {item.coverageGaps}
                          </p>
                          {item.checks.map((c: string, i: number) => (
                            <p key={i}>• {c}</p>
                          ))}
                          {item.sources.map((s: { label: string; url: string }) => (
                            <p key={s.url}>
                              <a href={s.url} target="_blank" rel="noopener noreferrer">
                                {s.label} ↗
                              </a>
                            </p>
                          ))}
                        </details>
                      </article>
                    ))
                  ) : (
                    <div className="sim-empty-day-card">
                      <span className="sim-empty-day-badge">
                        🌿 {es ? 'Día libre o de traslado' : 'Open / Leisure Day'}
                      </span>
                      <p className="sim-empty-day-title">
                        {es
                          ? 'Día sin actividades programadas'
                          : 'Open day in your itinerary'}
                      </p>
                      <p className="sim-empty-day">
                        {es
                          ? 'Sin fichas seleccionadas para este día. Ideal para descanso o traslados. No se inventaron actividades.'
                          : 'No selected entries for this day. Perfect for scenic travel, local dining, or resting. No activities were invented.'}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <p className="small" style={{ marginTop: '14px', color: '#536c66' }}>
              {result.globalCheck}
            </p>
            <p className="small" style={{ color: '#536c66' }}>
              {es
                ? 'No se guardan ni exportan estos días. La guía descargable conserva tu selección, sin distribución por día. IA real pendiente de proveedor, presupuesto y pruebas autorizadas.'
                : 'These days are not saved or exported. The downloadable guide keeps your selection without day grouping. Real AI awaits provider, budget and authorized testing.'}
            </p>
          </div>
        )
      )}
    </section>
  )
}
