import { ref } from 'vue'

// Idioma reactivo compartido
export const currentLang = ref('ESP')

// Tasas de cambio (MXN -> divisas)
// Fallback values used if the fetch fails.
const FALLBACK = { USD: 1 / 19.5, EUR: 1 / 21.5 }
export const exchangeRates = ref({ ...FALLBACK })

const MARKUP = 1.15

const CURRENCY = {
  ESP: { symbol: '$', code: 'MXN' },
  ENG: { symbol: '$', code: 'USD' },
  FRA: { symbol: '€', code: 'EUR' },
}

// Obtener tasas de cambio en tiempo real
export async function fetchRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/MXN')
    const data = await res.json()
    if (data.result === 'success') {
      exchangeRates.value = {
        USD: data.rates.USD,
        EUR: data.rates.EUR,
      }
    }
  } catch {
    // keep fallback rates silently
  }
}

// Formateador de precios
// Receives a price in MXN, applies 15% markup then converts at live rate.
export function formatPrice(mxnPrice) {
  if (mxnPrice === null || mxnPrice === undefined) return '---'
  const cfg = CURRENCY[currentLang.value] ?? CURRENCY.ESP
  if (cfg.code === 'MXN') {
    return `$${Number(mxnPrice).toLocaleString('es-MX')} MXN`
  }
  const rate = exchangeRates.value[cfg.code] ?? FALLBACK[cfg.code]
  const converted = Math.ceil(Number(mxnPrice) * MARKUP * rate)
  return `${cfg.symbol}${converted.toLocaleString('en-US')} ${cfg.code}`
}
