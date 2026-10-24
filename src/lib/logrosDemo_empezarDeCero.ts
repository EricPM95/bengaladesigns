/**
 * Solo desarrollo (modo demo de los logros, ?logrosDemo=1): lo que contesta el servidor al panel de administrador y a [Empezar de cero], sin tocar nada de verdad.
 * Con `sessionStorage['trazo:demo-no-admin'] = '1'` contesta como una cuenta que NO es de administrador (el botón no sale).
 */
const noEsAdmin = (): boolean => {
  try {
    return window.sessionStorage.getItem('trazo:demo-no-admin') === '1'
  } catch {
    return false
  }
}

export function responder(ruta: string, _url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (ruta === '/api/admin/empezar-de-cero/puede') return { ok: true, puede: !noEsAdmin() }
  if (ruta === '/api/admin/empezar-de-cero' && opciones.metodo !== 'GET') return !noEsAdmin() && c.confirmar === true ? { ok: true, borrados: {}, archivos: 0, avisos: [] } : null
  if (ruta === '/api/admin/logros/datos') return { ok: true, destinos: {}, avisos: [], viajero: [], personas: [], interruptores: { logros: true, push: false, cobro: false } }
  if (ruta === '/api/pase/sin-pase') return { ok: true, es_admin: !noEsAdmin(), activo: false }
  return undefined
}
