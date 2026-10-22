// Ayudante de pruebaTanda10F.mjs y de las capturas de la 10F: abre la app con el viaje de pruebas, le pone tres viajes guardados más (uno hecho, uno próximo y uno compartido donde estás invitada),
// una nube de mentira que apunta lo que se le pide, y abre el Perfil. Hace falta `npm run dev` y `npm run server`.
import { abrirApp } from './_enLaApp.mjs'

export async function abrirConViajes({ ruta = '/?cuentas=on&logros=on&logrosDemo=1' } = {}) {
  const app = await abrirApp('http://localhost:5173', { ruta })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(5000)
  for (let i = 0; i < 4; i++) {
    const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await app.esp(700)
  }
  // Los viajes guardados: el abierto (Roma, estás de viaje ahora mismo), uno hecho, uno próximo y uno compartido de otra persona.
  const datos = await app.evaluar(`(async () => {
    const { buildTripPayload } = await import('/src/components/sync/TripSync.tsx')
    const { useSyncStore } = await import('/src/store/useSyncStore.ts')
    const base = buildTripPayload()
    const clon = (fila, rutaId, destino, inicio, fin, extra = {}) => ({
      id: fila,
      route: { ...base.route, id: rutaId, destination: destino, answers: { ...base.route.answers, dateRange: { start: inicio, end: fin } } },
      bookings: base.bookings, wishlist: [], uiState: base.uiState, generationState: null, ...extra,
    })
    const abierto = { id: 'fila-abierto', route: base.route, bookings: base.bookings, wishlist: base.wishlist, uiState: base.uiState, generationState: null }
    const hecho = clon('fila-hecho', 'ruta-hecho', 'Florencia', '2026-03-13', '2026-03-16')
    const proximo = clon('fila-proximo', 'ruta-proximo', 'Venecia', '2026-12-04', '2026-12-07')
    const compartido = clon('fila-compartido', 'ruta-compartido', 'Nápoles', '2027-02-05', '2027-02-08', { esInvitado: true })
    useSyncStore.getState().setSavedTrips([abierto, hecho, proximo, compartido])
    useSyncStore.getState().setActiveTripId('fila-abierto')
    window.__fotosPrueba = { [base.route.id]: 0, 'ruta-hecho': 155, 'ruta-proximo': 0, 'ruta-compartido': 12 }
    window.__llamadasNube = []
    window.__ponerNubeEliminar?.({ eliminar: async (v) => { window.__llamadasNube.push(v); return null }, invitados: async (fila) => (fila === 'fila-proximo' ? ['Ana', 'Luis'] : []) })
    return { abierto: base.route.id }
  })()`)
  return { app, abiertoId: datos.abierto, ids: { abierto: datos.abierto, hecho: 'ruta-hecho', proximo: 'ruta-proximo', compartido: 'ruta-compartido' } }
}

export const abrirPerfil = async (app) => {
  await app.evaluar("document.querySelector('[data-boton-perfil]').click(); true")
  await app.esp(2500)
}
