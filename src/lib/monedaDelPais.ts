import { cambiarMoneda, MONEDA_BASE } from './moneda'
import { pedirCambio } from './useMoneda'

/**
 * (V56, 4) LA MONEDA SEGÚN EL PAÍS DONDE VIVE EL VIAJERO. Al contestar «¿En qué país vives?» (la primera vez o en Ajustes) la moneda del viajero pasa a ser la de ese país (México → MXN);
 * zona euro o sin contestar: euros. «Manda lo último que dice el viajero»: si después cambia la moneda (Ajustes o presupuesto) manda esa (`cambiarMoneda`), y si más tarde cambia el país, vuelve a mandar la del país nuevo.
 * Los precios se guardan siempre en la moneda en que se apuntaron y el pago es siempre en euros: esto solo cambia cómo SE ENSEÑAN.
 */
const MONEDAS: Record<string, string> = {
  AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AL: 'ALL', AM: 'AMD', AO: 'AOA', AR: 'ARS', AT: 'EUR', AU: 'AUD', AZ: 'AZN', BA: 'BAM', BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF', BG: 'EUR', BH: 'BHD', BI: 'BIF', BJ: 'XOF',
  BN: 'BND', BO: 'BOB', BR: 'BRL', BS: 'BSD', BT: 'BTN', BW: 'BWP', BY: 'BYN', BZ: 'BZD', CA: 'CAD', CD: 'CDF', CF: 'XAF', CG: 'XAF', CH: 'CHF', CI: 'XOF', CL: 'CLP', CM: 'XAF', CN: 'CNY', CO: 'COP', CR: 'CRC', CU: 'CUP',
  CV: 'CVE', CY: 'EUR', CZ: 'CZK', DE: 'EUR', DJ: 'DJF', DK: 'DKK', DM: 'XCD', DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP', ER: 'ERN', ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD', FR: 'EUR', GA: 'XAF', GB: 'GBP',
  GD: 'XCD', GE: 'GEL', GH: 'GHS', GM: 'GMD', GN: 'GNF', GQ: 'XAF', GR: 'EUR', GT: 'GTQ', GW: 'XOF', GY: 'GYD', HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF', ID: 'IDR', IE: 'EUR', IL: 'ILS', IN: 'INR', IQ: 'IQD', IR: 'IRR',
  IS: 'ISK', IT: 'EUR', JM: 'JMD', JO: 'JOD', JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KM: 'KMF', KN: 'XCD', KP: 'KPW', KR: 'KRW', KW: 'KWD', KZ: 'KZT', LA: 'LAK', LB: 'LBP', LC: 'XCD', LI: 'CHF', LK: 'LKR', LR: 'LRD',
  LS: 'LSL', LT: 'EUR', LU: 'EUR', LV: 'EUR', LY: 'LYD', MA: 'MAD', MC: 'EUR', MD: 'MDL', ME: 'EUR', MG: 'MGA', MK: 'MKD', ML: 'XOF', MM: 'MMK', MN: 'MNT', MR: 'MRU', MT: 'EUR', MU: 'MUR', MV: 'MVR', MW: 'MWK', MX: 'MXN',
  MY: 'MYR', MZ: 'MZN', NA: 'NAD', NE: 'XOF', NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NZ: 'NZD', OM: 'OMR', PA: 'USD', PE: 'PEN', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN', PT: 'EUR', PY: 'PYG', QA: 'QAR',
  RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF', SA: 'SAR', SB: 'SBD', SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SI: 'EUR', SK: 'EUR', SL: 'SLE', SM: 'EUR', SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP', ST: 'STN', SV: 'USD',
  SY: 'SYP', SZ: 'SZL', TD: 'XAF', TG: 'XOF', TH: 'THB', TJ: 'TJS', TL: 'USD', TM: 'TMT', TN: 'TND', TO: 'TOP', TR: 'TRY', TT: 'TTD', TW: 'TWD', TZ: 'TZS', UA: 'UAH', UG: 'UGX', US: 'USD', UY: 'UYU', UZ: 'UZS', VA: 'EUR',
  VC: 'XCD', VE: 'VES', VN: 'VND', VU: 'VUV', WS: 'WST', YE: 'YER', ZA: 'ZAR', ZM: 'ZMW', ZW: 'USD',
}

/** Pura: la moneda de un país (2 letras). Zona euro, país que no está en la lista o sin país (null): euros. */
export const monedaDelPais = (iso: string | null | undefined): string => (iso ? MONEDAS[iso.toUpperCase()] ?? MONEDA_BASE : MONEDA_BASE)

/**
 * Pone la moneda del viajero según el país que acaba de decir. Se pide el cambio del día (una vez por sesión, ya lo pide la app) y, si ese servicio no tiene tasa para esa moneda, se queda en euros
 * (no habría con qué convertir los precios). Sin cambio (sin red) se pone igual: al volver la red se enseña convertido.
 * Consulta a Supabase: una sola escritura de `travelers.moneda` cada vez que el viajero contesta el país (muy rara vez); no baja nada.
 */
export async function ponerMonedaDelPais(iso: string | null | undefined): Promise<string> {
  let moneda = monedaDelPais(iso)
  if (moneda !== MONEDA_BASE) {
    const cambio = await pedirCambio()
    if (cambio && cambio.tasas[moneda] === undefined) moneda = MONEDA_BASE
  }
  void cambiarMoneda(moneda)
  return moneda
}
