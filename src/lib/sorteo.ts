/**
 * (V25, decisión de Eric, 19-nov) EL SORTEO ANUAL, ESCONDIDO hasta que la app salga en las tiendas (App Store y Google Play): hace falta mirarlo antes con el gestor. NO se ha borrado nada: el código, las tablas y los datos
 * siguen. Un interruptor lo vuelve a encender: en el móvil `VITE_SORTEO_VISIBLE=true` y en el servidor `SORTEO_VISIBLE=true` (los dos). Apagado (lo normal): ni el billete dorado, ni el aviso «¡Ya estás en el sorteo de 2027!», ni
 * las invitaciones, ni la palabra «sorteo» en la lista del pase, el Perfil, la vitrina, la hoja de logros ni la campana.
 */
const valor = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SORTEO_VISIBLE : undefined
// (Solo en desarrollo, para las pruebas del sorteo: `window.__sorteoVisible = true` antes de cargar la app.)
const delDesarrollo = typeof import.meta !== 'undefined' && Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) && typeof window !== 'undefined' && (window as unknown as { __sorteoVisible?: boolean }).__sorteoVisible === true
export const SORTEO_VISIBLE: boolean = valor === 'true' || delDesarrollo

/** Quita lo del sorteo de un texto del móvil cuando está escondido: «Experiencia, niveles y sorteo anual» → «Experiencia y niveles». Encendido, el texto no cambia. */
export function sinSorteo(texto: string): string {
  if (SORTEO_VISIBLE) return texto
  return texto.replace('Experiencia, niveles y sorteo anual', 'Experiencia y niveles').replace('Sube de nivel y entra en el sorteo de cada año.', 'Sube de nivel con cada viaje.')
}
