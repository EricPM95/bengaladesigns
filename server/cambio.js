import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * El cambio del día para el presupuesto (Tanda 6z2). Fuente: el Banco Central Europeo (tipos de referencia diarios, gratis y oficiales):
 * https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml. El servidor lo pide como mucho una vez al día y lo guarda (en memoria y en un archivo temporal);
 * la app nunca llama a la fuente desde el móvil. Las monedas son las que publica el BCE (unas 30); el resto sale sin cambio. Sin red y sin nada guardado: tasas vacías.
 */
const URL_BCE = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
const ARCHIVO = join(tmpdir(), 'trazo-cambio-bce.json')
const UNA_HORA = 60 * 60 * 1000

let guardado = null
let ultimoIntento = 0

/** El XML del BCE → { fecha, tasas } (cuántas unidades de cada moneda son 1 euro). */
export function leerXmlBce(xml) {
  const fecha = /<Cube time='(\d{4}-\d{2}-\d{2})'/.exec(xml)?.[1] ?? null
  const tasas = {}
  for (const [, moneda, tasa] of xml.matchAll(/<Cube currency='([A-Z]{3})' rate='([\d.]+)'/g)) tasas[moneda] = Number(tasa)
  return fecha && Object.keys(tasas).length > 0 ? { fecha, tasas } : null
}

function leerArchivo() {
  try {
    return existsSync(ARCHIVO) ? JSON.parse(readFileSync(ARCHIVO, 'utf8')) : null
  } catch {
    return null
  }
}

/** Hoy en «AAAA-MM-DD» (UTC). */
const hoyIso = () => new Date().toISOString().slice(0, 10)

/**
 * El cambio guardado si es de hoy (o de la última publicación: el BCE no publica sábados, domingos ni festivos, y publica hacia las 16:00); si no, lo pide al BCE.
 * Si el BCE no responde, sirve el último que tenga (con su fecha) para no dejar al viajero sin nada.
 */
export async function cambioDelDia(pedir = fetch) {
  if (!guardado) guardado = leerArchivo()
  const reciente = guardado && Date.now() - (guardado.pedidoEn ?? 0) < 12 * UNA_HORA
  if (reciente || Date.now() - ultimoIntento < UNA_HORA) return guardado ? { fecha: guardado.fecha, tasas: guardado.tasas } : { fecha: hoyIso(), tasas: {} }
  ultimoIntento = Date.now()
  try {
    const respuesta = await pedir(URL_BCE, { signal: AbortSignal.timeout(8000) })
    if (!respuesta.ok) throw new Error(`BCE ${respuesta.status}`)
    const leido = leerXmlBce(await respuesta.text())
    if (!leido) throw new Error('XML del BCE sin tasas')
    guardado = { ...leido, pedidoEn: Date.now() }
    try {
      writeFileSync(ARCHIVO, JSON.stringify(guardado))
    } catch {
      // Sin dónde escribir (el servidor de Vercel solo deja /tmp): se queda en memoria.
    }
  } catch (error) {
    console.warn('[cambio] no se pudo pedir el cambio al BCE:', error.message)
  }
  return guardado ? { fecha: guardado.fecha, tasas: guardado.tasas } : { fecha: hoyIso(), tasas: {} }
}
