export interface Country {
  name: string;
  code: string;
  continent: string;
}

export const COUNTRIES_CATALOG: Country[] = [
  // América del Norte
  { name: 'México', code: 'MX', continent: 'América del Norte' },
  { name: 'Estados Unidos', code: 'US', continent: 'América del Norte' },
  { name: 'Canadá', code: 'CA', continent: 'América del Norte' },

  // América Central y Caribe
  { name: 'Panamá', code: 'PA', continent: 'América Central y Caribe' },
  { name: 'Costa Rica', code: 'CR', continent: 'América Central y Caribe' },
  { name: 'Guatemala', code: 'GT', continent: 'América Central y Caribe' },
  { name: 'El Salvador', code: 'SV', continent: 'América Central y Caribe' },
  { name: 'Honduras', code: 'HN', continent: 'América Central y Caribe' },
  { name: 'Nicaragua', code: 'NI', continent: 'América Central y Caribe' },
  { name: 'Belice', code: 'BZ', continent: 'América Central y Caribe' },
  { name: 'República Dominicana', code: 'DO', continent: 'América Central y Caribe' },
  { name: 'Puerto Rico', code: 'PR', continent: 'América Central y Caribe' },
  { name: 'Jamaica', code: 'JM', continent: 'América Central y Caribe' },
  { name: 'Bahamas', code: 'BS', continent: 'América Central y Caribe' },
  { name: 'Trinidad y Tobago', code: 'TT', continent: 'América Central y Caribe' },
  { name: 'Barbados', code: 'BB', continent: 'América Central y Caribe' },

  // América del Sur
  { name: 'Argentina', code: 'AR', continent: 'América del Sur' },
  { name: 'Colombia', code: 'CO', continent: 'América del Sur' },
  { name: 'Chile', code: 'CL', continent: 'América del Sur' },
  { name: 'Perú', code: 'PE', continent: 'América del Sur' },
  { name: 'Ecuador', code: 'EC', continent: 'América del Sur' },
  { name: 'Brasil', code: 'BR', continent: 'América del Sur' },
  { name: 'Uruguay', code: 'UY', continent: 'América del Sur' },
  { name: 'Paraguay', code: 'PY', continent: 'América del Sur' },
  { name: 'Bolivia', code: 'BO', continent: 'América del Sur' },
  { name: 'Venezuela', code: 'VE', continent: 'América del Sur' },

  // Europa
  { name: 'España', code: 'ES', continent: 'Europa' },
  { name: 'Reino Unido', code: 'GB', continent: 'Europa' },
  { name: 'Francia', code: 'FR', continent: 'Europa' },
  { name: 'Alemania', code: 'DE', continent: 'Europa' },
  { name: 'Italia', code: 'IT', continent: 'Europa' },
  { name: 'Portugal', code: 'PT', continent: 'Europa' },
  { name: 'Países Bajos', code: 'NL', continent: 'Europa' },
  { name: 'Bélgica', code: 'BE', continent: 'Europa' },
  { name: 'Suiza', code: 'CH', continent: 'Europa' },
  { name: 'Austria', code: 'AT', continent: 'Europa' },
  { name: 'Irlanda', code: 'IE', continent: 'Europa' },
  { name: 'Suecia', code: 'SE', continent: 'Europa' },
  { name: 'Noruega', code: 'NO', continent: 'Europa' },
  { name: 'Dinamarca', code: 'DK', continent: 'Europa' },
  { name: 'Finlandia', code: 'FI', continent: 'Europa' },
  { name: 'Polonia', code: 'PL', continent: 'Europa' },
  { name: 'República Checa', code: 'CZ', continent: 'Europa' },
  { name: 'Hungría', code: 'HU', continent: 'Europa' },
  { name: 'Grecia', code: 'GR', continent: 'Europa' },
  { name: 'Rumanía', code: 'RO', continent: 'Europa' },

  // Asia y Oceanía
  { name: 'Japón', code: 'JP', continent: 'Asia y Oceanía' },
  { name: 'China', code: 'CN', continent: 'Asia y Oceanía' },
  { name: 'Taiwán', code: 'TW', continent: 'Asia y Oceanía' },
  { name: 'Australia', code: 'AU', continent: 'Asia y Oceanía' }
];

export const CONTINENTS_LIST = [
  'América del Norte',
  'América Central y Caribe',
  'América del Sur',
  'Europa',
  'Asia y Oceanía'
];

export const getCountriesByContinent = (continentName: string): Country[] => {
  if (!continentName || continentName === 'Todos') return COUNTRIES_CATALOG;
  return COUNTRIES_CATALOG.filter(c => c.continent === continentName);
};

export const getCountryIsoCode = (countryName: string): string => {
  if (!countryName) return 'MX';
  const clean = countryName.toLowerCase().trim();
  const match = COUNTRIES_CATALOG.find(c =>
    c.name.toLowerCase().trim() === clean ||
    c.code.toLowerCase() === clean ||
    (clean === 'mexico' && c.code === 'MX')
  );
  return match ? match.code : 'MX';
};
