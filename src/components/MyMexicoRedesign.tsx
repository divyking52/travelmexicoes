"use client"
import React, { useState, useId, useRef, useEffect } from 'react'
import { type Locale } from '@/lib/content'
import ItinerarySimulation from './ItinerarySimulation'
import { exportGuidePDF } from '@/lib/pdf-export'
import {
  emptyDraft,
  interestLabels,
  matchingExperiences,
  moveExperience,
  normalizeDraft,
  recommendationReason,
  selectedExperiences,
  type Catalog,
  type TravelDraft,
} from '@/lib/catalog'

type ExperienceOption = {
  id: string
  en: string
  es: string
  catalogInterest?: string
}

// Exact 17 experience items ordered so that a 3-column row-major grid matches the screenshot:
// Col 1: Beaches, Archaeology, Water activities, Cities & architecture, Learning & workshops, Folklore & crafts
// Col 2: Food & flavours, Nature & landscapes, Wildlife, Music, festivals & events, Rural & community experiences, Luxury
// Col 3: Culture & traditions, Adventure, Wellness & SPA, Nightlife, Pueblos Mágicos
const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  // Row 1
  { id: 'Beaches', en: 'Beaches', es: 'Playas', catalogInterest: 'Beaches' },
  { id: 'Food & flavours', en: 'Food & flavours', es: 'Gastronomía y sabores', catalogInterest: 'Food & flavours' },
  { id: 'Culture & traditions', en: 'Culture & traditions', es: 'Cultura y tradiciones', catalogInterest: 'Culture & traditions' },
  // Row 2
  { id: 'Archaeology', en: 'Archaeology', es: 'Arqueología', catalogInterest: 'Archaeology' },
  { id: 'Nature & landscapes', en: 'Nature & landscapes', es: 'Naturaleza y paisajes', catalogInterest: 'Nature & landscapes' },
  { id: 'Adventure', en: 'Adventure', es: 'Aventura', catalogInterest: 'Adventure' },
  // Row 3
  { id: 'Water activities', en: 'Water activities', es: 'Actividades acuáticas', catalogInterest: 'Water activities' },
  { id: 'Wildlife', en: 'Wildlife', es: 'Fauna', catalogInterest: 'Wildlife' },
  { id: 'Wellness & SPA', en: 'Wellness & SPA', es: 'Bienestar y SPA' },
  // Row 4
  { id: 'Cities & architecture', en: 'Cities & architecture', es: 'Ciudades y arquitectura', catalogInterest: 'Cities & architecture' },
  { id: 'Music, festivals & events', en: 'Music, festivals & events', es: 'Música, festivales y eventos' },
  { id: 'Nightlife', en: 'Nightlife', es: 'Vida nocturna' },
  // Row 5
  { id: 'Learning & workshops', en: 'Learning & workshops', es: 'Aprendizaje y talleres', catalogInterest: 'Learning & workshops' },
  { id: 'Rural & community experiences', en: 'Rural & community experiences', es: 'Turismo rural y comunitario' },
  { id: 'Pueblos Mágicos', en: 'Pueblos Mágicos', es: 'Pueblos Mágicos', catalogInterest: 'Pueblos Mágicos' },
  // Row 6
  { id: 'Folklore & crafts', en: 'Folklore & crafts', es: 'Folclore y artesanías', catalogInterest: 'Folklore & crafts' },
  { id: 'Luxury', en: 'Luxury', es: 'Lujo y confort' },
]

type SuggestionPreset = {
  id: string
  label: { en: string; es: string }
  destinationId: string
  destinationQuery: string
  interests: string[]
  notes: { en: string; es: string }
}

const CURATED_SUGGESTIONS: SuggestionPreset[] = [
  {
    id: 'san-quintin-coastal',
    label: {
      en: '🌊 San Quintín Bays & Nature',
      es: '🌊 Bahías y naturaleza de San Quintín',
    },
    destinationId: 'san-quintin',
    destinationQuery: 'San Quintín',
    interests: ['Nature & landscapes', 'Wildlife', 'Water activities'],
    notes: {
      en: 'Focus on tranquil Pacific bays, volcanic wetland scenery, and local seafood tables.',
      es: 'Enfoque en bahías pacíficas, humedales volcánicos y gastronomía marina local.',
    },
  },
  {
    id: 'valle-wine-food',
    label: {
      en: '🍷 Valle de Guadalupe Wine & Dine',
      es: '🍷 Ruta enológica en Valle de Guadalupe',
    },
    destinationId: 'valle-de-guadalupe',
    destinationQuery: 'Valle de Guadalupe',
    interests: ['Food & flavours', 'Nature & landscapes', 'Culture & traditions'],
    notes: {
      en: 'Unhurried afternoons across granite hills, farm-to-table cuisine, and boutique vineyards.',
      es: 'Tardes sin prisa entre colinas de granito, cocina de huerto y vinícolas boutique.',
    },
  },
  {
    id: 'ensenada-pacific',
    label: {
      en: '⚓ Ensenada Pacific & Port Culture',
      es: '⚓ Ensenada Pacífico y cultura portuaria',
    },
    destinationId: 'ensenada',
    destinationQuery: 'Ensenada',
    interests: ['Beaches', 'Food & flavours', 'Water activities'],
    notes: {
      en: 'Coastal breezes, seafood carts, surf beaches, and panoramic ocean lookouts.',
      es: 'Brisa marina, carretas de mariscos, playas de surf y miradores oceánicos.',
    },
  },
  {
    id: 'tijuana-craft',
    label: {
      en: '🎨 Tijuana Culinary & Urban Craft',
      es: '🎨 Tijuana gastronómica y artesanal',
    },
    destinationId: 'tijuana',
    destinationQuery: 'Tijuana',
    interests: ['Cities & architecture', 'Food & flavours', 'Folklore & crafts'],
    notes: {
      en: 'Baja Med culinary scenes, passage art studios, and border cultural innovation.',
      es: 'Escena gastronómica Baja Med, pasajes de arte y dinamismo cultural fronterizo.',
    },
  },
  {
    id: 'cancun-caribe',
    label: {
      en: '🌴 Cancún & Caribbean Coast',
      es: '🌴 Cancún y Caribe Mexicano',
    },
    destinationId: 'cancun',
    destinationQuery: 'Cancún',
    interests: ['Beaches', 'Water activities', 'Nature & landscapes'],
    notes: {
      en: 'Turquoise ocean swims, white sands, coastal light, and maritime nature excursions.',
      es: 'Playas de arena blanca, aguas turquesa, luz tropical y paseos de naturaleza marina.',
    },
  },
]

type DestinationMedia = {
  photo: string
  photoAlt: string
  tagline: { en: string; es: string }
  headline: { en: string; es: string }
  location: { en: string; es: string }
}

const DESTINATION_MEDIA: Record<string, DestinationMedia> = {
  'san-quintin': {
    photo: '/images/san-quintin.jpg',
    photoAlt: 'San Quintín volcanic bay and coastal waters in Baja California',
    tagline: {
      en: 'A place to begin. A story to make your own.',
      es: 'Un lugar para empezar. Una historia para hacerla tuya.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'San Quintín · Baja California',
      es: 'San Quintín · Baja California',
    },
  },
  'ensenada': {
    photo: '/images/ensenada.jpg',
    photoAlt: 'Ensenada Pacific coastal cliffs and ocean horizon',
    tagline: {
      en: 'Ocean air, coastal tables and open horizons.',
      es: 'Brisa del Pacífico, mesas costeras y horizontes abiertos.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Ensenada · Baja California',
      es: 'Ensenada · Baja California',
    },
  },
  'valle-de-guadalupe': {
    photo: '/images/valle-de-guadalupe.jpg',
    photoAlt: 'Vineyards and sun-drenched hills in Valle de Guadalupe',
    tagline: {
      en: 'Vineyards among granite hills and unhurried afternoons.',
      es: 'Viñedos entre colinas de granito y tardes sin prisa.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Valle de Guadalupe · Baja California',
      es: 'Valle de Guadalupe · Baja California',
    },
  },
  'tijuana': {
    photo: '/images/tijuana.jpg',
    photoAlt: 'Urban culture and vibrant streetscape in Tijuana',
    tagline: {
      en: 'Border creativity, culinary craft and urban energy.',
      es: 'Creatividad fronteriza, oficio culinario y energía urbana.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Tijuana · Baja California',
      es: 'Tijuana · Baja California',
    },
  },
  'mexicali': {
    photo: '/images/mexicali.jpg',
    photoAlt: 'Dramatic desert peaks and desert sunsets in Mexicali',
    tagline: {
      en: 'Desert horizons, heritage kitchens and warm canyon skies.',
      es: 'Horizontes del desierto, cocinas tradicionales y cañones cálidos.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Mexicali · Baja California',
      es: 'Mexicali · Baja California',
    },
  },
  'rosarito': {
    photo: '/images/rosarito.jpg',
    photoAlt: 'Pacific surf waves and sweeping sandy beaches in Playas de Rosarito',
    tagline: {
      en: 'Pacific swells, artisan galleries and sunset shores.',
      es: 'Olas del Pacífico, galerías artesanales y atardeceres en la costa.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Playas de Rosarito · Baja California',
      es: 'Playas de Rosarito · Baja California',
    },
  },
  'tecate': {
    photo: '/images/tecate.jpg',
    photoAlt: 'Mount Cuchumá foothills and tranquil town of Tecate',
    tagline: {
      en: 'Sacred mountain trails, stone ovens and tranquil oak foothills.',
      es: 'Senderos de montaña sagrada, hornos de leña y sosiego campestre.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Tecate · Pueblo Mágico · Baja California',
      es: 'Tecate · Pueblo Mágico · Baja California',
    },
  },
  'san-felipe': {
    photo: '/images/san-felipe.jpg',
    photoAlt: 'Sea of Cortez azure waters and golden sands in San Felipe',
    tagline: {
      en: 'Warm tides on the Sea of Cortez and tranquil desert shores.',
      es: 'Mareas cálidas en el Mar de Cortés y playas doradas del desierto.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'San Felipe · Baja California',
      es: 'San Felipe · Baja California',
    },
  },
  'bahia-de-los-angeles': {
    photo: '/images/bahia-de-los-angeles.jpg',
    photoAlt: 'Untouched island archipelago and turquoise waters in Bahía de los Ángeles',
    tagline: {
      en: 'Pristine islands, marine sanctuaries and untouched desert coast.',
      es: 'Islas vírgenes, santuarios marinos y costas desiertas.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Bahía de los Ángeles · Baja California',
      es: 'Bahía de los Ángeles · Baja California',
    },
  },
  'cancun': {
    photo: '/images/cancun.jpg',
    photoAlt: 'Turquoise ocean waters and tropical coast in Cancún',
    tagline: {
      en: 'Turquoise waters, coastal light and warm Caribbean days.',
      es: 'Aguas turquesa, luz costera y días cálidos en el Caribe.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Cancún · Caribe Mexicano',
      es: 'Cancún · Mexican Caribbean',
    },
  },
  'playa-del-carmen': {
    photo: '/images/playa-del-carmen.jpg',
    photoAlt: 'Tropical palm-lined white beach in Playa del Carmen',
    tagline: {
      en: 'Vibrant coastal avenues, crystalline waters and palm shores.',
      es: 'Avenidas costeras vibrantes, aguas cristalinas y palmeras.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Playa del Carmen · Riviera Maya',
      es: 'Playa del Carmen · Riviera Maya',
    },
  },
  'tulum': {
    photo: '/images/tulum.jpg',
    photoAlt: 'Cliffside Mayan ruins overlooking the Caribbean sea in Tulum',
    tagline: {
      en: 'Ancient cliffside sanctuaries and secluded turquoise coves.',
      es: 'Santuarios antiguos sobre acantilados y caletas color turquesa.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Tulum · Caribe Mexicano',
      es: 'Tulum · Caribe Mexicano',
    },
  },
  'isla-cozumel': {
    photo: '/images/cozumel.jpg',
    photoAlt: 'Coral reef formations and clear tropical waters in Cozumel',
    tagline: {
      en: 'World-renowned coral reefs, marine parks and island stillness.',
      es: 'Arrecifes de coral legendarios, parques marinos y calma insular.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Cozumel · Caribe Mexicano',
      es: 'Cozumel · Caribe Mexicano',
    },
  },
  'cozumel': {
    photo: '/images/cozumel.jpg',
    photoAlt: 'Coral reef formations and clear tropical waters in Cozumel',
    tagline: {
      en: 'World-renowned coral reefs, marine parks and island stillness.',
      es: 'Arrecifes de coral legendarios, parques marinos y calma insular.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Cozumel · Caribe Mexicano',
      es: 'Cozumel · Caribe Mexicano',
    },
  },
  'isla-mujeres': {
    photo: '/images/isla-mujeres.jpg',
    photoAlt: 'Pristine Playa Norte turquoise shallows in Isla Mujeres',
    tagline: {
      en: 'Shallow turquoise lagoons, island breezes and barefoot ease.',
      es: 'Aguas cristalinas y poco profundas, brisas del Caribe y vida isleña.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Isla Mujeres · Caribe Mexicano',
      es: 'Isla Mujeres · Caribe Mexicano',
    },
  },
  'bacalar': {
    photo: '/images/bacalar.jpg',
    photoAlt: 'Lagoon of Seven Colors shades of blue and wooden pier in Bacalar',
    tagline: {
      en: 'The legendary lagoon of seven blues and freshwater stillness.',
      es: 'La legendaria laguna de siete azules y serenidad de agua dulce.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Bacalar · Pueblo Mágico · Quintana Roo',
      es: 'Bacalar · Pueblo Mágico · Quintana Roo',
    },
  },
  'holbox': {
    photo: '/images/holbox.jpg',
    photoAlt: 'Tranquil barefoot sandbars and waters in Isla Holbox',
    tagline: {
      en: 'Barefoot sand streets, flamingos and tranquil shallow waters.',
      es: 'Calles de arena sin prisa, flamencos y aguas tranquilas.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Holbox · Caribe Mexicano',
      es: 'Holbox · Caribe Mexicano',
    },
  },
  'chetumal': {
    photo: '/images/chetumal.jpg',
    photoAlt: 'Bay of Chetumal shoreline and coastal nature',
    tagline: {
      en: 'Historic bay breezes, southern mangroves and Caribbean gateway.',
      es: 'Brisas históricas de la bahía, manglares del sur y puerta al Caribe.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Chetumal · Caribe Mexicano',
      es: 'Chetumal · Caribe Mexicano',
    },
  },
  'costa-mujeres': {
    photo: '/images/costa-mujeres.jpg',
    photoAlt: 'Secluded pristine white sand beach in Costa Mujeres',
    tagline: {
      en: 'Secluded dunes, coastal tranquility and pristine turquoise shores.',
      es: 'Dunas protegidas, tranquilidad costera y playas vírgenes.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Costa Mujeres · Caribe Mexicano',
      es: 'Costa Mujeres · Caribe Mexicano',
    },
  },
  'mahahual': {
    photo: '/images/mahahual.jpg',
    photoAlt: 'Grand Costa Maya coral barrier and palm beaches in Mahahual',
    tagline: {
      en: 'Coral reef horizons, sleepy fishing docks and coconut palms.',
      es: 'Barrera de arrecife, muelles de pescadores y palmeras frente al mar.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Mahahual · Grand Costa Maya',
      es: 'Mahahual · Grand Costa Maya',
    },
  },
  'maya-ka-an': {
    photo: '/images/maya-ka-an.jpg',
    photoAlt: 'Pristine Sian Ka\'an biosphere waterways and emerald nature in Maya Ka\'an',
    tagline: {
      en: 'Protected biosphere canals, sacred lagoons and living Mayan culture.',
      es: 'Canales protegidos de la biósfera, lagunas sagradas y cultura maya viva.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Maya Ka’an · Quintana Roo',
      es: 'Maya Ka’an · Quintana Roo',
    },
  },
  'puerto-morelos': {
    photo: '/images/puerto-morelos.jpg',
    photoAlt: 'Historic leaning lighthouse and national reef park in Puerto Morelos',
    tagline: {
      en: 'Bohemian fishing village charm and protected reef sanctuaries.',
      es: 'Encanto de pueblo pesquero y arrecifes protegidos del Caribe.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Puerto Morelos · Riviera Maya',
      es: 'Puerto Morelos · Riviera Maya',
    },
  },
  'riviera-maya': {
    photo: '/images/riviera-maya.jpg',
    photoAlt: 'Tropical Caribbean coast and lush jungle fringe along Riviera Maya',
    tagline: {
      en: 'Tropical jungle meet turquoise waters and sacred cenotes.',
      es: 'Selva tropical frente a aguas turquesa y cenotes sagrados.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Riviera Maya · Caribe Mexicano',
      es: 'Riviera Maya · Caribe Mexicano',
    },
  },
  'oaxaca': {
    photo: '/images/oaxaca.jpg',
    photoAlt: 'Historic colonial colors, mountain valleys and culinary heritage in Oaxaca',
    tagline: {
      en: 'Artisan valleys, ancestral kitchens and vibrant cultural heritage.',
      es: 'Valles artesanales, cocinas ancestrales y patrimonio cultural vibrante.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Oaxaca · México',
      es: 'Oaxaca · México',
    },
  },
  'merida': {
    photo: '/images/merida.jpg',
    photoAlt: 'White City colonial architecture and Yucatán cultural life in Mérida',
    tagline: {
      en: 'White city architecture, Mayan traditions and unhurried tropical evenings.',
      es: 'Arquitectura de la Ciudad Blanca, tradiciones mayas y tardes cálidas.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Mérida · Yucatán · México',
      es: 'Mérida · Yucatán · México',
    },
  },
  'default': {
    photo: '/images/san-quintin.jpg',
    photoAlt: 'Baja California coastline and tranquil Pacific bay',
    tagline: {
      en: 'A place to begin. A story to make your own.',
      es: 'Un lugar para empezar. Una historia para hacerla tuya.',
    },
    headline: {
      en: 'Follow the feeling. Find your México.',
      es: 'Sigue lo que sientes. Encuentra tu México.',
    },
    location: {
      en: 'Baja California · México',
      es: 'Baja California · México',
    },
  },
}

export default function MyMexicoRedesign({
  locale,
  catalog,
  showHeader = true,
}: {
  locale: Locale
  catalog: Catalog
  showHeader?: boolean
}) {
  const es = locale === 'es'
  const baseId = useId()
  const formHeadingId = `${baseId}-creator-title`
  const guideDrawerRef = useRef<HTMLElement | null>(null)
  const comboboxRef = useRef<HTMLDivElement | null>(null)

  const defaultDest =
    catalog.destinations.find(d => d.id === 'san-quintin') ||
    catalog.destinations[0]

  const [draft, setDraft] = useState<TravelDraft>(() => {
    const initialDestId = defaultDest?.id || emptyDraft(catalog).destinationId
    const initialExps = catalog.experiences
      .filter(e => e.destinationId === initialDestId)
      .map(e => e.id)
    return {
      ...emptyDraft(catalog),
      destinationId: initialDestId,
      experienceIds: initialExps,
    }
  })

  const [extraInterests, setExtraInterests] = useState<string[]>([])
  const [destinationQuery, setDestinationQuery] = useState<string>(
    defaultDest?.title || 'San Quintín'
  )
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const [customTypedDestination, setCustomTypedDestination] = useState<string>('')
  const [guideOpen, setGuideOpen] = useState<boolean>(false)
  const [toast, setToast] = useState<string>('')

  // Close custom destination popover on outside click or Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const activeDestination =
    catalog.destinations.find(d => d.id === draft.destinationId) || defaultDest

  const normalizedInput = (customTypedDestination || destinationQuery)
    ? (customTypedDestination || destinationQuery).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    : ''

  const mediaConfig =
    (activeDestination && DESTINATION_MEDIA[activeDestination.id]) ||
    (normalizedInput && DESTINATION_MEDIA[normalizedInput]) ||
    DESTINATION_MEDIA[draft.destinationId] ||
    DESTINATION_MEDIA['san-quintin'] ||
    DESTINATION_MEDIA.default

  const allSelectedPills = [...draft.interests, ...extraInterests]
  const allDestinationExperiences = catalog.experiences.filter(
    e => e.destinationId === draft.destinationId
  )
  const strictMatches = matchingExperiences(catalog, draft)
  const displayedExperiences =
    strictMatches.length > 0 ? strictMatches : allDestinationExperiences

  const selected = selectedExperiences(catalog, draft)

  const filteredDestinations = catalog.destinations.filter(d => {
    const q = destinationQuery.trim().toLowerCase()
    if (!q || q === activeDestination?.title.toLowerCase()) return true
    return d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
  })

  function announce(esMsg: string, enMsg: string) {
    setToast(es ? esMsg : enMsg)
  }

  function applySuggestion(sug: SuggestionPreset) {
    const targetDest = catalog.destinations.find(d => d.id === sug.destinationId)
    const destId = targetDest?.id || sug.destinationId
    const matchingExpIds = catalog.experiences
      .filter(e => e.destinationId === destId)
      .map(e => e.id)

    setDraft(old => ({
      ...old,
      destinationId: destId,
      interests: sug.interests,
      notes: sug.notes[locale],
      experienceIds: matchingExpIds,
    }))
    setDestinationQuery(targetDest?.title || sug.destinationQuery)
    setCustomTypedDestination('')
    setDropdownOpen(false)
    announce(
      `Sugerencia aplicada: ${sug.label[locale]}`,
      `Suggestion applied: ${sug.label[locale]}`
    )
  }

  function downloadGuidePDF() {
    try {
      const current = normalizeDraft(draft, catalog)
      exportGuidePDF(locale, current, catalog)
      announce(
        'Guía PDF descargada correctamente.',
        'PDF guide downloaded successfully.'
      )
    } catch {
      announce(
        'No se pudo generar el PDF. Puedes descargar la versión HTML.',
        'Unable to generate PDF. You can download the HTML version.'
      )
    }
  }

  function selectDestination(destId: string) {
    const found = catalog.destinations.find(d => d.id === destId)
    if (!found) return
    const destExps = catalog.experiences
      .filter(e => e.destinationId === found.id)
      .map(e => e.id)
    setDraft(old => ({
      ...old,
      destinationId: found.id,
      experienceIds: destExps,
    }))
    setDestinationQuery(found.title)
    setCustomTypedDestination('')
    setDropdownOpen(false)
    announce(
      `Destino actualizado a ${found.title}.`,
      `Destination updated to ${found.title}.`
    )
  }

  function handleInputChange(value: string) {
    setDestinationQuery(value)
    setDropdownOpen(true)
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) {
      setCustomTypedDestination('')
      return
    }
    const matched = catalog.destinations.find(
      d =>
        d.title.toLowerCase() === trimmed ||
        d.id.toLowerCase() === trimmed
    )
    if (matched && matched.id !== draft.destinationId) {
      selectDestination(matched.id)
    } else if (!matched) {
      setCustomTypedDestination(value.trim())
    } else {
      setCustomTypedDestination('')
    }
  }

  function togglePill(option: ExperienceOption) {
    if (option.catalogInterest && Object.hasOwn(interestLabels, option.catalogInterest)) {
      const key = option.catalogInterest
      setDraft(old => ({
        ...old,
        interests: old.interests.includes(key)
          ? old.interests.filter(x => x !== key)
          : [...old.interests, key],
      }))
    } else {
      setExtraInterests(old =>
        old.includes(option.id) ? old.filter(x => x !== option.id) : [...old, option.id]
      )
    }
  }

  function toggleExperienceSelection(expId: string) {
    setDraft(old => ({
      ...old,
      experienceIds: old.experienceIds.includes(expId)
        ? old.experienceIds.filter(x => x !== expId)
        : [...old.experienceIds, expId],
    }))
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    let nextDraft = draft
    if (draft.experienceIds.length === 0 && displayedExperiences.length > 0) {
      nextDraft = {
        ...draft,
        experienceIds: displayedExperiences.slice(0, 4).map(m => m.id),
      }
      setDraft(nextDraft)
    }
    setGuideOpen(true)
    setTimeout(() => {
      guideDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    announce(
      `Guía creada para ${activeDestination?.title || ''}.`,
      `Guide created for ${activeDestination?.title || ''}.`
    )
  }

  const isCaribeRegion =
    activeDestination?.region === 'caribe' ||
    Boolean(normalizedInput && DESTINATION_MEDIA[normalizedInput]?.location.en.includes('Caribe'))

  const regionUpper = isCaribeRegion
    ? es
      ? 'CARIBE MEXICANO'
      : 'MEXICAN CARIBBEAN'
    : 'BAJA CALIFORNIA'

  const locationText =
    (normalizedInput && DESTINATION_MEDIA[normalizedInput]?.location[locale]) ||
    (customTypedDestination ? `${customTypedDestination} · México` : mediaConfig.location[locale])

  return (
    <section
      className="mmw-section"
      aria-label={es ? 'Creador de experiencias My México' : 'My México Experience Creator'}
    >
      {/* SECTION HEADER MATCHING USER MOCKUP
          Use a div (not <header>) so global site `header { display:flex }`
          rules cannot flatten the vertical text stack. */}
      {showHeader && (
        <div className="mmw-header">
          <p className="mmw-header-eyebrow">
            {es ? 'El Personalizador de Experiencias.' : 'The Experience Personalizer.'}
          </p>
          <h1 className="mmw-header-title">
            <span className="mmw-title-primary">{es ? 'Mi México.' : 'My México.'}</span>{' '}
            <em className="mmw-title-accent">{es ? 'A Mi Manera.' : 'My Way.'}</em>
          </h1>
          <p className="mmw-header-subtitle">
            {es
              ? 'Tú eliges lo que te mueve. Haz la experiencia tuya.'
              : 'You choose the feeling. Make the experience yours.'}
          </p>
          <p className="mmw-header-guide">
            {es ? (
              <>
                Crea tu guía de experiencias personalizadas, o{' '}
                <button
                  type="button"
                  className="mmw-marisol-inline-link"
                  onClick={() => {
                    setGuideOpen(true)
                    setTimeout(() => {
                      guideDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 50)
                    announce(
                      'Marisol: He preparado sugerencias verificadas y la simulación interactiva abajo.',
                      'Marisol: I have prepared verified suggestions and the interactive simulation below.'
                    )
                  }}
                >
                  habla con Marisol.
                </button>
              </>
            ) : (
              <>
                Create your guide to personalized experiences, or talk to{' '}
                <button
                  type="button"
                  className="mmw-marisol-inline-link"
                  onClick={() => {
                    setGuideOpen(true)
                    setTimeout(() => {
                      guideDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 50)
                    announce(
                      'Marisol: He preparado sugerencias verificadas y la simulación interactiva abajo.',
                      'Marisol: I have prepared verified suggestions and the interactive simulation below.'
                    )
                  }}
                >
                  Marisol.
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {/* Two-Column Split Grid matching user screenshot */}
      <div className="mmw-grid">
        {/* LEFT COLUMN: Visual Stage with Real Stock Photo */}
        <article className="mmw-visual-card">
          <header className="mmw-visual-header">
            <p className="mmw-visual-eyebrow">
              {es ? 'TU MÉXICO, A TU MANERA' : 'YOUR MÉXICO, YOUR WAY'} · {regionUpper}
            </p>
          </header>

          <div className="mmw-scenic-stage">
            <img
              className="mmw-stock-photo"
              src={mediaConfig.photo}
              alt={mediaConfig.photoAlt}
            />
            <div className="mmw-photo-overlay" aria-hidden="true" />

            {/* Editorial Copy Overlaid at Bottom Left */}
            <div className="mmw-scenic-content">
              <p className="mmw-scenic-kicker">{mediaConfig.tagline[locale]}</p>
              <h2 className="mmw-scenic-headline">{mediaConfig.headline[locale]}</h2>
              <p className="mmw-scenic-location">{locationText}</p>
            </div>
          </div>
        </article>

        {/* RIGHT COLUMN: Experience Creator Form matching user screenshot */}
        <div className="mmw-creator-panel">
          <form onSubmit={handleFormSubmit} aria-labelledby={formHeadingId} noValidate>
            <div>
              <p className="mmw-creator-eyebrow">
                {es ? 'CREADOR DE TU EXPERIENCIA' : 'YOUR EXPERIENCE CREATOR'}
              </p>
              <h2 id={formHeadingId} className="mmw-creator-title">
                {es ? 'Hazlo tuyo.' : 'Make it yours.'}
              </h2>
            </div>

            {/* Destination Input */}
            <div className="mmw-field-group" ref={comboboxRef}>
              <label htmlFor={`${baseId}-dest-input`} className="mmw-label">
                {es ? 'Quiero crear mi guía para:' : 'I want to create my guide to:'}
              </label>
              <div className="mmw-input-wrap">
                <input
                  id={`${baseId}-dest-input`}
                  name="destination"
                  type="text"
                  className="mmw-destination-input"
                  value={destinationQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={e => handleInputChange(e.target.value)}
                  placeholder="Oaxaca, Mérida, Tijuana..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-expanded={dropdownOpen}
                />
              </div>

              {dropdownOpen && (
                <div
                  className="mmw-dest-dropdown"
                  role="listbox"
                  aria-label={es ? 'Destinos' : 'Destinations'}
                >
                  {filteredDestinations.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      role="option"
                      aria-selected={draft.destinationId === d.id && !customTypedDestination}
                      className="mmw-dest-option"
                      onClick={() => selectDestination(d.id)}
                    >
                      <span>{d.title}</span>
                      <span style={{ fontSize: '11px', opacity: 0.75 }}>
                        {d.region === 'caribe' ? 'Caribe' : 'Baja'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 17 Experience Pill Checkboxes in 3 Columns */}
            <fieldset className="mmw-fieldset">
              <legend className="mmw-legend">
                {es ? 'Incluir mis experiencias favoritas:' : 'Include my favourite experiences:'}
              </legend>
              <p className="mmw-sublegend">
                {es ? 'Elige tantas como quieras' : 'Choose as many as you like'}
              </p>

              <div className="mmw-pills-grid">
                {EXPERIENCE_OPTIONS.map((option, idx) => {
                  const inputId = `${baseId}-pill-${idx}`
                  const isChecked = option.catalogInterest
                    ? draft.interests.includes(option.catalogInterest)
                    : extraInterests.includes(option.id)

                  return (
                    <div key={option.id} className="mmw-pill-item">
                      <input
                        id={inputId}
                        name="interests"
                        type="checkbox"
                        value={option.id}
                        checked={isChecked}
                        onChange={() => togglePill(option)}
                        className="mmw-visually-hidden mmw-pill-input"
                      />
                      <label htmlFor={inputId} className="mmw-pill-label">
                        <span className="mmw-checkbox-box" aria-hidden="true">
                          <svg className="mmw-check-svg" viewBox="0 0 12 10">
                            <polyline points="1.5 5.5 4.5 8.5 10.5 1.5" />
                          </svg>
                        </span>
                        <span className="mmw-pill-text">
                          {es ? option.es : option.en}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>

            {/* Notes Textarea matching user screenshot */}
            <div className="mmw-notes-group">
              <textarea
                id={`${baseId}-notes`}
                name="notes"
                maxLength={1200}
                className="mmw-textarea"
                value={draft.notes}
                onChange={e =>
                  setDraft(old => ({ ...old, notes: e.target.value.slice(0, 1200) }))
                }
                placeholder={
                  es
                    ? 'Escribe cómo te gustaría vivir este viaje (ritmo, intereses, notas personales)...'
                    : 'Write how you would like to experience this trip (pace, food ideas, personal notes)...'
                }
              />
            </div>

            {/* Curated Suggestions Box directly above Create my guide */}
            <div className="mmw-suggestions-box" role="region" aria-label={es ? 'Sugerencias para tu guía' : 'Suggestions for your guide'}>
              <div className="mmw-suggestions-header">
                <span className="mmw-suggestions-label">
                  ✦ {es ? 'Sugerencias para inspirarte:' : 'Suggestions to inspire you:'}
                </span>
              </div>
              <div className="mmw-suggestions-chips" role="group" aria-label={es ? 'Rutas recomendadas' : 'Recommended routes'}>
                {CURATED_SUGGESTIONS.map(sug => (
                  <button
                    key={sug.id}
                    type="button"
                    className="mmw-suggestion-chip"
                    onClick={() => applySuggestion(sug)}
                    title={es ? `Cargar sugerencia: ${sug.label.es}` : `Load suggestion: ${sug.label.en}`}
                  >
                    <span>{sug.label[locale]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons matching user screenshot */}
            <div className="mmw-actions-row">
              <button type="submit" className="mmw-btn-primary">
                {es ? 'Crear mi guía' : 'Create my guide'}
              </button>
              <button
                type="button"
                className="mmw-btn-secondary"
                onClick={() => {
                  setGuideOpen(true)
                  setTimeout(() => {
                    guideDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 50)
                  announce(
                    'Marisol: He preparado sugerencias verificadas y la simulación interactiva abajo.',
                    'Marisol: I have prepared verified suggestions and the interactive simulation below.'
                  )
                }}
              >
                {es ? 'Hablar con Marisol' : 'Talk to Marisol'}
              </button>
            </div>

            {/* Footnote matching user screenshot */}
            <p className="mmw-footnote">
              {es
                ? 'Ingresa cualquier destino en México. Empieza con tus preferencias; este piloto cuenta con sugerencias verificadas con fuentes para ocho destinos de Baja California. La IA no está conectada.'
                : 'Enter any destination in México. Start with your preferences; this pilot has source-based suggestions for eight Baja California destinations. AI is not connected.'}
            </p>

            <p className="mmw-live-toast" role="status" aria-live="polite">
              {toast}
            </p>
          </form>
        </div>
      </div>

      {/* Guide Studio & Simulation (Expands below when "Create my guide" is clicked) */}
      <section
        ref={guideDrawerRef}
        className="mmw-drawer"
        hidden={!guideOpen}
        aria-label={es ? 'Tu guía de viaje' : 'Your travel guide'}
      >
        <div className="mmw-drawer-header">
          <div>
            <p className="mmw-visual-eyebrow" style={{ margin: '0 0 4px', color: '#08433b' }}>
              {es
                ? `TU GUÍA PERSONALIZADA · ${activeDestination?.title.toUpperCase()}`
                : `YOUR PERSONALIZED GUIDE · ${activeDestination?.title.toUpperCase()}`}
            </p>
            <h3 className="mmw-drawer-title">
              {es
                ? `Experiencias verificadas en ${activeDestination?.title}`
                : `Verified experiences in ${activeDestination?.title}`}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#617b75', lineHeight: 1.45 }}>
              {activeDestination?.coverage}
            </p>
          </div>
          <button
            type="button"
            className="mmw-close-btn"
            onClick={() => setGuideOpen(false)}
          >
            {es ? 'Ocultar vista previa ✕' : 'Hide preview ✕'}
          </button>
        </div>

        <div className="mmw-experiences-grid">
          {displayedExperiences.map(exp => {
            const isSelected = draft.experienceIds.includes(exp.id)
            return (
              <article
                key={exp.id}
                className={`mmw-exp-card ${isSelected ? 'is-selected' : ''}`}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#08433b' }}>
                    {exp.area}
                  </span>
                  <h4>{exp.title}</h4>
                  <p className="mmw-exp-desc">{exp.description}</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#08433b', margin: '6px 0 0' }}>
                    {recommendationReason(exp, draft.interests, locale)}
                  </p>
                  <details style={{ fontSize: '12px', marginTop: '6px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                      {es ? 'Fuentes y comprobaciones' : 'Sources & checks'} ({exp.checkedOn})
                    </summary>
                    <ul style={{ paddingInlineStart: '16px', margin: '4px 0' }}>
                      {exp.checks.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                    <p style={{ margin: '4px 0', color: '#617b75' }}>{exp.coverageGaps}</p>
                    <ul style={{ paddingInlineStart: '16px', margin: '4px 0' }}>
                      {exp.sources.map(s => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            {s.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <div className="mmw-exp-actions">
                  <button
                    type="button"
                    className="mmw-exp-toggle-btn"
                    aria-pressed={isSelected}
                    onClick={() => toggleExperienceSelection(exp.id)}
                  >
                    {isSelected
                      ? es
                        ? '✓ En mi guía'
                        : '✓ In my guide'
                      : es
                        ? '+ Agregar'
                        : '+ Add'}
                  </button>

                  {isSelected && (
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="mmw-exp-toggle-btn"
                        style={{ padding: '4px 8px' }}
                        disabled={draft.experienceIds.indexOf(exp.id) === 0}
                        onClick={() =>
                          setDraft(old => ({
                            ...old,
                            experienceIds: moveExperience(old.experienceIds, exp.id, -1),
                          }))
                        }
                        aria-label={(es ? 'Subir ' : 'Move up ') + exp.title}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="mmw-exp-toggle-btn"
                        style={{ padding: '4px 8px' }}
                        disabled={
                          draft.experienceIds.indexOf(exp.id) === draft.experienceIds.length - 1
                        }
                        onClick={() =>
                          setDraft(old => ({
                            ...old,
                            experienceIds: moveExperience(old.experienceIds, exp.id, 1),
                          }))
                        }
                        aria-label={(es ? 'Bajar ' : 'Move down ') + exp.title}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {/* Day-by-Day Itinerary Simulation */}
        <ItinerarySimulation catalog={catalog} draft={draft} locale={locale} />

        {/* Toolbar */}
        <div className="mmw-toolbar">
          <button
            type="button"
            className="mmw-toolbar-btn primary"
            onClick={downloadGuidePDF}
          >
            {es ? 'Descargar Guía (PDF)' : 'Download Guide (PDF)'} ↘
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#153e39', marginInlineStart: 'auto' }}>
            {selected.length}{' '}
            {es
              ? 'experiencias seleccionadas'
              : 'experiences selected in your guide'}
          </span>
        </div>
      </section>
    </section>
  )
}
