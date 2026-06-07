export type MockCategory = {
  id: string
  name: string
  slug: string
  icon: string
  count: number
}

export type MockBusiness = {
  id: string
  name: string
  description: string
  category: string
  categorySlug: string
  city: string
  address: string
  phone: string
  website: string
  verified: boolean
  initials: string
  featured: boolean
}

export const mockCategories: MockCategory[] = [
  { id: '1', name: 'Restaurant', slug: 'restaurant', icon: '🍽️', count: 142 },
  { id: '2', name: 'Frisør', slug: 'frisor', icon: '✂️', count: 87 },
  { id: '3', name: 'Rørlegger', slug: 'rorlegger', icon: '🔧', count: 54 },
  { id: '4', name: 'Elektriker', slug: 'elektriker', icon: '⚡', count: 63 },
  { id: '5', name: 'Lege', slug: 'lege', icon: '🏥', count: 38 },
  { id: '6', name: 'Advokat', slug: 'advokat', icon: '⚖️', count: 29 },
  { id: '7', name: 'Regnskapsfører', slug: 'regnskapsforer', icon: '📊', count: 41 },
  { id: '8', name: 'Bilverksted', slug: 'bilverksted', icon: '🚗', count: 76 },
]

export const mockBusinesses: MockBusiness[] = [
  {
    id: '1',
    name: 'Bella Italia',
    description: 'Autentisk italiensk mat i hjertet av Oslo. Vi serverer tradisjonelle oppskrifter med de beste råvarene fra hele Italia.',
    category: 'Restaurant',
    categorySlug: 'restaurant',
    city: 'Oslo',
    address: 'Karl Johans gate 12, 0154 Oslo',
    phone: '+47 22 33 44 55',
    website: 'https://bellaitalia.no',
    verified: true,
    initials: 'BI',
    featured: true,
  },
  {
    id: '2',
    name: 'Frisørsalong Nora',
    description: 'Moderne frisørsalong med erfarne stylister. Vi spesialiserer oss i farging, klipp og styling for alle hårtyper.',
    category: 'Frisør',
    categorySlug: 'frisor',
    city: 'Bergen',
    address: 'Bryggen 5, 5003 Bergen',
    phone: '+47 55 66 77 88',
    website: 'https://frisornora.no',
    verified: true,
    initials: 'FN',
    featured: true,
  },
  {
    id: '3',
    name: 'TechRør AS',
    description: 'Profesjonell rørleggerservice tilgjengelig 24/7. Vi løser alle typer VVS-problemer raskt og effektivt.',
    category: 'Rørlegger',
    categorySlug: 'rorlegger',
    city: 'Trondheim',
    address: 'Nedre Elvehavn 4, 7042 Trondheim',
    phone: '+47 73 44 55 66',
    website: 'https://techror.no',
    verified: true,
    initials: 'TR',
    featured: true,
  },
  {
    id: '4',
    name: 'Volt Elektriker',
    description: 'Sertifiserte elektrikere med over 20 års erfaring. Vi utfører alle typer elektriske installasjoner og reparasjoner.',
    category: 'Elektriker',
    categorySlug: 'elektriker',
    city: 'Stavanger',
    address: 'Kirkegata 22, 4006 Stavanger',
    phone: '+47 51 77 88 99',
    website: 'https://voltelektriker.no',
    verified: true,
    initials: 'VE',
    featured: true,
  },
  {
    id: '5',
    name: 'Advokatfirma Hansen',
    description: 'Erfarne advokater innen familie-, arve- og arbeidsrett. Vi gir deg trygg juridisk bistand når du trenger det.',
    category: 'Advokat',
    categorySlug: 'advokat',
    city: 'Oslo',
    address: 'Stortingsgata 8, 0161 Oslo',
    phone: '+47 22 11 22 33',
    website: 'https://hansenlegal.no',
    verified: true,
    initials: 'AH',
    featured: true,
  },
  {
    id: '6',
    name: 'Legekontoret Sentrum',
    description: 'Allmennlege med full liste og akuttimer. Vi fokuserer på helhetlig og personlig helsetjeneste for hele familien.',
    category: 'Lege',
    categorySlug: 'lege',
    city: 'Oslo',
    address: 'Pilestredet 31, 0166 Oslo',
    phone: '+47 22 55 66 77',
    website: 'https://legesentrum.no',
    verified: true,
    initials: 'LS',
    featured: true,
  },
]
