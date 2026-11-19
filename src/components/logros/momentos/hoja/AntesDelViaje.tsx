import { useEffect, useState, type ReactNode } from 'react'
import { Insignia } from '../../dibujos'
import { sitiosDeColeccion } from '../../dibujos/Insignia'
import { configDelPase, eur } from '../../../../lib/pagoPase'
import { abrirPase } from '../../../../lib/pago'
import { diaProsa } from '../../../../lib/nombreDeDia'
import { sinTildes } from '../../../../lib/destinosCurados'
import { useRouteStore } from '../../../../store/useRouteStore'
import type { Route } from '../../../../lib/types'
import type { ColeccionDeEstado } from '../api'
import { ListaDeColeccion } from '../../ficha/ListaDeColeccion'
import { sinSorteo } from '../../../../lib/sorteo'

/**
 * LO DE LA HOJA DE LOGROS «ANTES DEL VIAJE» (V25, Design `Logros Antes Viaje`): lo que te puedes llevar, la franja de colecciones que se abre una a una, y el bloque que vende el pase (sin pase). Solo piezas: los números salen
 * de lo que manda el servidor (`GET /api/logros/estado`) y el precio, de `/api/pase/config`; nada está escrito a mano. Sin frases que digan dónde está lo siguiente que ganar.
 */

const ORO = '#8A6A2C'

/** «LO QUE TE PUEDES LLEVAR DE ROMA»: medallas, insignias por completar y el sello del pasaporte (tres números, sin texto de más). */
export function LoQueTePuedesLlevar({ ciudad, insignias, medallas }: { ciudad: string; insignias: number; medallas: number }): ReactNode {
  const piezas: { n: string; l: string }[] = [
    { n: String(medallas), l: 'medallas, de bronce a diamante' },
    { n: String(insignias), l: 'insignias por completar' },
    { n: '1', l: 'sello en tu pasaporte' },
  ]
  return (
    <div data-lo-que-te-puedes-llevar="1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(28,34,48,.55)', textTransform: 'uppercase' }}>{`Lo que te puedes llevar de ${ciudad}`}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {piezas.map((k) => (
          <div key={k.l} style={{ borderRadius: 18, background: '#F7F1E4', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <span style={{ font: "400 28px/1 'Instrument Serif',serif", color: ORO }}>{k.n}</span>
            <span style={{ font: "500 11.5px/1.25 'Geist'", color: 'rgba(28,34,48,.7)' }}>{k.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Las colecciones que la ruta puede completar, primero; el resto, detrás (el orden del servidor se respeta dentro de cada grupo). */
export function ordenAntes(colecciones: ColeccionDeEstado[]): ColeccionDeEstado[] {
  return [...colecciones.filter((c) => c.en_tu_ruta), ...colecciones.filter((c) => !c.en_tu_ruta)]
}

/** La insignia a medio rellenar (la mitad de sus trozos), como en el diseño: es lo que «te puedes llevar», no lo que ya tienes. */
function InsigniaMedia({ c, tam }: { c: ColeccionDeEstado; tam: number }): ReactNode {
  const todos = sitiosDeColeccion(c.id)
  const mitad = todos.slice(0, Math.ceil(todos.length / 2))
  return <Insignia coleccion={c.id} ganados={mitad} completa={false} tam={tam} />
}

/** El día de la ruta en que se visita un sitio («jueves 26»), por el nombre; null si no está en ninguno. */
export function diaDelSitioEnLaRuta(route: Route | null, nombre: string): string | null {
  if (!route) return null
  const buscado = sinTildes(nombre)
  for (const day of route.days) {
    if (day.stops.some((stop) => sinTildes(stop.name) === buscado || sinTildes(stop.name).includes(buscado) || buscado.includes(sinTildes(stop.name)))) return diaProsa(route, day.dayNumber)
  }
  return null
}

/**
 * LA FRANJA «Con tu ruta puedes completar 4 de las 11 colecciones»: dorada, con sus insignias (a medio rellenar) en dos filas de dos y SIN texto de «toca para…». Al tocarla se abre y van saliendo, una a una, las colecciones, todas
 * CERRADAS: primero las que la ruta puede completar. Cada una se abre sola al tocarla y enseña sus lugares (foto, «En tu ruta · jueves 26» o «Fuera de tu ruta») y [Ver la colección ›].
 */
export function ColeccionesAntes({ estado, sinPase, ciudad, destino, cerrarHoja }: { estado: { colecciones: ColeccionDeEstado[]; con_tu_ruta_puedes_completar?: number | null }; sinPase: boolean; ciudad: string; destino: string; cerrarHoja: () => void }): ReactNode {
  const [abierta, setAbierta] = useState(false)
  const [filas, setFilas] = useState<Set<string>>(new Set())
  const route = useRouteStore((s) => s.route)
  const orden = ordenAntes(estado.colecciones)
  const puede = estado.con_tu_ruta_puedes_completar ?? orden.filter((c) => c.en_tu_ruta).length
  const minis = orden.slice(0, 4)
  const alternar = (id: string) =>
    setFilas((a) => {
      const n = new Set(a)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  return (
    <div data-colecciones-antes={abierta ? 'abierta' : 'cerrada'} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        type="button"
        data-franja-colecciones
        aria-expanded={abierta}
        onClick={() => setAbierta((v) => !v)}
        style={{ cursor: 'pointer', textAlign: 'left', borderRadius: 22, background: 'linear-gradient(135deg,#FFF6DC,#F6E3B4)', border: '1px solid #D8BE84', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, font: 'inherit', color: 'inherit' }}
      >
        <span style={{ flex: 1, minWidth: 0, font: "400 21px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          Con tu ruta puedes completar <em style={{ color: ORO }}>{`${puede} de las ${estado.colecciones.length}`}</em> colecciones
        </span>
        <span data-franja-insignias style={{ flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(2,52px)', gridAutoRows: '52px', gap: 4, justifyItems: 'center', alignItems: 'center' }}>
          {minis.map((c) => (
            <span key={c.id} style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InsigniaMedia c={c} tam={52} />
            </span>
          ))}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORO} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: abierta ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierta && (
        <div data-colecciones-una-a-una style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orden.map((c, i) => {
            const abierto = filas.has(c.id)
            return (
              <div key={c.id} data-coleccion={c.id} data-coleccion-abierta={abierto ? '1' : '0'} style={{ borderRadius: 24, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 10px 22px -18px rgba(28,34,48,.45)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, animation: `lbIn .5s ease-out ${(0.15 + i * 0.22).toFixed(2)}s both` }}>
                <button type="button" aria-expanded={abierto} onClick={() => alternar(c.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, border: 'none', background: 'transparent', padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit' }}>
                  <span style={{ width: 56, height: 56, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InsigniaMedia c={c} tam={56} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span data-nombre-de-coleccion style={{ font: "400 19px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{c.nombre}</span>
                    <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`0 de ${c.total}`}</span>
                    {c.en_tu_ruta && <span style={{ font: "500 12px 'Geist'", color: '#2F6B43' }}>Se completa con tu ruta</span>}
                  </span>
                  {sinPase && (
                    <svg data-candado-pequeno="1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                      <path d="M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {abierto && (
                  <div data-lista-abierta={c.id} style={{ padding: '6px 6px 2px', borderRadius: 14, background: '#F5EFE4', animation: 'moPop .3s ease both' }}>
                    <ListaDeColeccion
                      destino={destino}
                      coleccion={c.id}
                      ciudad={ciudad}
                      sitios={c.sitios.map((s) => {
                        const nombre = s.nombre ?? s.sitio
                        const dia = s.en_ruta ? diaDelSitioEnLaRuta(route, nombre) : null
                        return { sitio: s.sitio, nombre, visto: s.visto, nota: s.en_ruta ? (dia ? `En tu ruta · ${dia}` : 'En tu ruta') : 'Fuera de tu ruta', notaVerde: Boolean(s.en_ruta) }
                      })}
                      antesDeVer={cerrarHoja}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** El precio del pase de 1 persona que da el servidor («6,99 €»), o null mientras llega o si no hay cobro. Nunca escrito a mano. */
export function usePrecioDelPase(): string | null {
  const [precio, setPrecio] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void configDelPase().then((c) => {
      if (!vivo) return
      const uno = c.precios?.planes.find((p) => p.id === 'uno')
      setPrecio(uno?.precio_total != null ? eur(uno.precio_total) : null)
    })
    return () => {
      vivo = false
    }
  }, [])
  return precio
}

const PUNTOS_DEL_PASE = ['Medallas, insignias y 11 emblemas secretos', 'Tu sello en el pasaporte de Roma', 'Experiencia, niveles y sorteo anual']

/** SIN PASE: «Los logros vienen con el Pase Roma», lo que incluye y [Conseguir el pase · 6,99 €], que abre la hoja de compra de siempre. El número de secretos sale del servidor; sin cobro, este bloque ni se pinta. */
export function BloqueDelPase({ ciudad, secretos }: { ciudad: string; secretos: number }): ReactNode {
  const precio = usePrecioDelPase()
  const puntos = PUNTOS_DEL_PASE.map((p, i) => sinSorteo(i === 0 ? `Medallas, insignias y ${secretos > 0 ? secretos : 11} emblemas secretos` : i === 1 ? `Tu sello en el pasaporte de ${ciudad}` : p))
  return (
    <div data-bloque-del-pase="1" style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, background: '#1C2230', border: '1.5px solid #D8BE84', boxShadow: '0 18px 32px -18px rgba(28,34,48,.8)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span aria-hidden="true" style={{ position: 'absolute', right: -40, top: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(243,213,154,.28),transparent 68%)' }} />
      <span style={{ position: 'relative', font: "400 25px/1.1 'Instrument Serif',serif", color: '#FFFDF8', textWrap: 'balance' as never }}>
        Los logros vienen con el <em style={{ color: '#F3D59A' }}>{`Pase ${ciudad}`}</em>
      </span>
      {puntos.map((p) => (
        <span key={p} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, font: "400 14px/1.3 'Geist'", color: 'rgba(255,253,248,.88)' }}>
          <span style={{ flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#F3D59A', color: '#2A1D10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          {p}
        </span>
      ))}
      <button
        type="button"
        data-conseguir-el-pase
        onClick={() => abrirPase()}
        style={{ position: 'relative', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', boxShadow: '0 12px 22px -14px rgba(110,80,24,.75)', color: '#3A2A0A', font: "700 15.5px 'Geist'" }}
      >
        {precio ? `Conseguir el pase · ${precio}` : 'Conseguir el pase'}
      </button>
    </div>
  )
}
