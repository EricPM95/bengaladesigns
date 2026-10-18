import { createElement } from 'react'
import { BotonVisual } from '../../components/logros/momentos/BotonFlotanteLogros'
import { datosDePrueba, type EstadoLogros } from '../../components/logros/momentos/api'
import { useMomentosUI } from '../../components/logros/momentos/useMomentosUI'
import { useLogrosStore } from '../../store/useLogrosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'
import antes from './datos/hoja_antes.json'
import dia1 from './datos/hoja_dia1.json'
import despues from './datos/hoja_despues.json'
import ultimo from './datos/hoja_ultimo.json'
import roma from '../../../data/logros/roma.json'

/**
 * Escaparates de «Logros · el botón del destino» (8C2): el botón en sus estados (1a, 1b) y la hoja antes (2a), durante (3a, 3b, 3c) y después del viaje (4a). Los estados salen de
 * `scripts/destino/generarEstadosHoja8c.mjs`, que usa las funciones reales del servidor (la misma forma y los mismos números que `GET /api/logros/estado`).
 */
const como = (e: unknown) => e as EstadoLogros
const cerrarHoja = () => {
  useMomentosUI.getState().cerrarHojaLogros()
  datosDePrueba.estado = null
}

async function conRuta(modo: 'days' | 'route' | 'today' = 'days'): Promise<void> {
  try {
    window.localStorage.setItem('trazo:logros:primerdia', 'si')
  } catch {
    /* sin almacenamiento */
  }
  if (!useRouteStore.getState().route) {
    const crear = (window as unknown as { __rutaPrueba?: () => Promise<unknown> }).__rutaPrueba
    if (!crear) throw new Error('No está __rutaPrueba')
    // La primera vez la pantalla de inicio tarda en pintarse: se espera a su botón de desarrollo.
    for (let i = 0; i < 160 && !Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Dev: ruta rápida')); i++) await espera(250)
    await crear()
  }
  useRouteStore.setState({ screen: 'route', mode: modo } as never)
  await espera(800)
  // La tarjeta de temporada y los avisos de fechas salen solos la primera vez: se cierran para ver la pantalla.
  for (let i = 0; i < 4; i++) {
    const entendido = Array.from(document.querySelectorAll('button')).find((b) => /^(Entendido|Empezar mi día)$/.test(b.textContent?.trim() ?? ''))
    if (!entendido) break
    entendido.click()
    await espera(700)
  }
}

const abrirHoja = async (estado: unknown, despues?: () => Promise<void> | void) => {
  datosDePrueba.estado = como(estado)
  useMomentosUI.getState().abrirHojaLogros()
  await espera(900)
  await despues?.()
}
const tocar = (selector: string) => (document.querySelector(selector) as HTMLElement | null)?.click()

/** El aro del botón en cada grado: lo que lleva del sello grande (escalones de `data/logros/roma.json`). */
const sello = roma.sellos[0]!
const total = roma.colecciones.find((c) => c.id === sello.coleccion)!.sitios.length
const fraccionDe = (grado: string) => (sello.grados.find((g) => g.grado === grado)?.desde ?? 0) / total

const ESTADOS_DEL_BOTON: { id: string; que: string; grado: 'bronce' | 'plata' | 'oro' | 'diamante' | null; punto?: boolean }[] = [
  { id: 'antes', que: 'Antes del viaje: el sello en gris', grado: null },
  { id: 'bronce', que: 'Bronce', grado: 'bronce' },
  { id: 'plata', que: 'Plata', grado: 'plata' },
  { id: 'oro', que: 'Oro', grado: 'oro' },
  { id: 'diamante', que: 'Diamante', grado: 'diamante' },
  { id: 'punto', que: 'Con algo nuevo sin ver', grado: 'plata', punto: true },
]

const lista: Escaparate[] = [
  {
    id: '1a',
    que: 'El botón sobre DÍAS (con el viaje de pruebas)',
    abrir: async () => {
      datosDePrueba.estado = como(ultimo)
      useLogrosStore.setState({ puntito: false })
      await conRuta('days')
      await espera(1500)
    },
    cerrar: () => {
      datosDePrueba.estado = null
    },
  },
  {
    id: '1a-hoy',
    que: 'El botón sobre HOY (sube un poco para no tapar Visto)',
    abrir: async () => {
      datosDePrueba.estado = como(dia1)
      await conRuta('today')
      await espera(1500)
    },
    cerrar: () => {
      datosDePrueba.estado = null
    },
  },
  {
    id: '1b',
    que: 'El botón en cada estado, a tamaño real',
    abrir: async () => {
      montarEnBody(
        '1b',
        createElement(
          'div',
          { style: { minHeight: '100%', background: '#F4EEE3', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, alignContent: 'start', fontFamily: "'Geist',system-ui,sans-serif" } },
          ESTADOS_DEL_BOTON.map((e) =>
            createElement(
              'div',
              { key: e.id, style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              createElement(
                'div',
                { style: { position: 'relative', height: 120, borderRadius: 22, background: '#E9E0CF', boxShadow: '0 0 0 1px rgba(28,34,48,.12)' } },
                createElement(
                  'span',
                  { style: { position: 'absolute', right: 14, bottom: 14, width: 58, height: 58, borderRadius: '50%', background: '#FFFDF8', boxShadow: '0 0 0 1px rgba(28,34,48,.08),0 12px 22px -10px rgba(28,34,48,.6)' } },
                  createElement(BotonVisual, { sello: 'roma', grado: e.grado, fraccion: e.grado ? fraccionDe(e.grado) : 0, puntito: Boolean(e.punto), animado: false }),
                ),
              ),
              createElement('span', { style: { font: "600 13px 'Geist'", color: '#1C2230' } }, e.que),
            ),
          ),
        ),
      )
      await espera(300)
    },
    cerrar: () => desmontar('1b'),
  },
  { id: '2a', que: 'La hoja antes del viaje', abrir: () => abrirHoja(antes), cerrar: cerrarHoja },
  { id: '3a', que: 'La hoja el día 1 (bronce, con «Lo nuevo de hoy»)', abrir: () => abrirHoja(dia1), cerrar: cerrarHoja },
  { id: '3b', que: 'Una colección abierta, con sus sitios', abrir: () => abrirHoja(dia1, () => tocar('[data-coleccion="roma_antigua"] > div')), cerrar: cerrarHoja },
  { id: '3c', que: 'La hoja el último día (oro)', abrir: () => abrirHoja(ultimo), cerrar: cerrarHoja },
  { id: '3d', que: 'Tocar un pedazo dice su nombre', abrir: () => abrirHoja(dia1, async () => {
    const insignia = document.querySelector('[data-coleccion="roma_antigua"] > div > span') as HTMLElement | null
    if (!insignia) return
    const c = insignia.getBoundingClientRect()
    insignia.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: c.left + c.width * 0.5, clientY: c.top + c.height * 0.1 }))
    await espera(300)
  }), cerrar: cerrarHoja },
  { id: '3e', que: 'Tocar un emblema encontrado vuelve a poner su escena', capturas: [2500], abrir: () => abrirHoja(ultimo, async () => {
    tocar('[data-secretos] button')
    await espera(300)
  }), cerrar: cerrarHoja },
  { id: '4a', que: 'La hoja después del viaje', abrir: () => abrirHoja(despues), cerrar: cerrarHoja },
]
export default lista
