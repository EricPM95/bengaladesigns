import { useMemo, useState } from 'react'
import { resolverRecomendacion, vistaPrevia, type CambioDeUnDia, type DiaPosible, type Recomendacion } from '../../lib/aplicarRecomendacion'
import { etiquetaDeDia, lineasDelDia, titularDeRecomendacion, type Linea } from '../../lib/propuesta'
import { ElDia, elDia } from '../../lib/nombreDeDia'
import { mandarAvisosPendientes } from '../../lib/permisoAvisos'
import { aceptarRecomendacion, rechazarRecomendacion } from '../../lib/recomendacionesViaje'
import type { Route } from '../../lib/types'
import { nombreDe, useViajeCompartido } from '../../store/useViajeCompartido'
import { useRouteStore } from '../../store/useRouteStore'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { CambioParada } from './CambioParada'

const ROJO = 'oklch(0.55 0.17 5)'
const VERDE = 'oklch(0.55 0.11 150)'

/** Una línea de un día en R2: lo que no cambia, en gris; lo que sale, tachado en rojo; lo que entra, en verde; la pareja «cambiar», en su recuadro. */
function LineaDeDia({ l }: { l: Linea<string> }) {
  const punto = (fondo: string, signo: string) => <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: fondo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 11px 'Geist'", textDecoration: 'none' }}>{signo}</span>
  if (l.tipo === 'pareja') return <CambioParada a={l.a} b={l.b} tamano="pequena" />
  if (l.tipo === 'igual') return <span data-linea="igual" style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 13.5px/1.3 'Geist'" }}>{punto('rgba(28,34,48,.2)', '')}{l.b}</span>
  if (l.tipo === 'sale') return <span data-linea="sale" style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 13.5px/1.3 'Geist'", color: ROJO, textDecoration: 'line-through' }}>{punto(ROJO, '−')}{l.a}</span>
  if (l.tipo === 'mueve') return <span data-linea="mueve" style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 13.5px/1.3 'Geist'" }}>{punto('#1C2230', '↕')}{l.b}</span>
  return <span data-linea="entra" style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 13.5px/1.3 'Geist'", color: 'oklch(0.38 0.1 150)' }}>{punto(VERDE, '+')}{l.b}</span>
}

/** Un día que cambia, con su cabecera «Día 2 · jue 17». */
export function BloqueDeDia({ route, c, titulo }: { route: Route; c: CambioDeUnDia; titulo?: string }) {
  const dia = route.days.find((d) => d.id === c.dayId)
  const cabecera = titulo ?? (dia ? etiquetaDeDia(route, dia.dayNumber) : c.title)
  return (
    <div data-dia-que-cambia={c.dayId} style={{ borderRadius: 16, background: '#F5EFE4', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>{cabecera}</span>
      <LineasPlegadas lineas={lineasDelDia(c.antes, c.despues)} />
    </div>
  )
}

type Trozo = { tipo: 'linea'; l: Linea<string> } | { tipo: 'resumen'; lineas: Linea<string>[] }

/**
 * R2 corta (cuentas parte 3B): lo que cambia, con la parada de antes y la de después en gris; el resto del día, recogido en una línea («12 paradas más, sin cambios») que se abre al tocarla.
 * De cada racha de paradas que no cambian se enseña la que toca a un cambio por arriba y la que toca por abajo (si hay cambio a ese lado).
 */
export function plegarLineas(lineas: Linea<string>[]): Trozo[] {
  const cambia = (l: Linea<string>) => l.tipo !== 'igual'
  const salida: Trozo[] = []
  let i = 0
  while (i < lineas.length) {
    if (cambia(lineas[i])) {
      salida.push({ tipo: 'linea', l: lineas[i++] })
      continue
    }
    let j = i
    while (j < lineas.length && !cambia(lineas[j])) j++
    const racha = lineas.slice(i, j)
    const hayAntes = i > 0
    const hayDespues = j < lineas.length
    const arriba = hayAntes ? 1 : 0
    const abajo = hayDespues ? 1 : 0
    // Si recoger no ahorra nada (una sola parada escondida), se enseñan todas.
    if (racha.length - arriba - abajo <= 1) racha.forEach((l) => salida.push({ tipo: 'linea', l }))
    else {
      racha.slice(0, arriba).forEach((l) => salida.push({ tipo: 'linea', l }))
      salida.push({ tipo: 'resumen', lineas: racha.slice(arriba, racha.length - abajo) })
      racha.slice(racha.length - abajo).forEach((l) => salida.push({ tipo: 'linea', l }))
    }
    i = j
  }
  return salida
}

function LineasPlegadas({ lineas }: { lineas: Linea<string>[] }) {
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
  return (
    <>
      {plegarLineas(lineas).map((t, i) =>
        t.tipo === 'linea' ? (
          <LineaDeDia key={i} l={t.l} />
        ) : abiertos.has(i) ? (
          t.lineas.map((l, k) => <LineaDeDia key={`${i}-${k}`} l={l} />)
        ) : (
          <button
            key={i}
            type="button"
            data-paradas-recogidas={t.lineas.length}
            onClick={() => setAbiertos((previo) => new Set(previo).add(i))}
            style={{ alignSelf: 'flex-start', minHeight: 32, padding: '0 10px', borderRadius: 999, border: '1px dashed rgba(28,34,48,.25)', background: 'transparent', font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.65)', cursor: 'pointer' }}
          >
            {t.lineas.length === 1 ? '1 parada más, sin cambios' : `${t.lineas.length} paradas más, sin cambios`}
          </button>
        )
      )}
    </>
  )
}

/**
 * LA HOJA DEL ADMINISTRADOR (R2a, R2b, R2c y R2d, cuentas parte 3): «Laura te recomienda un cambio / cambios en el día 3 / otra ruta», SIEMPRE por días y solo los días que cambian
 * (lo que sale, tachado en rojo; lo que entra, en verde; lo que no cambia, en gris; cambiar una parada por otra, en su recuadro). [Aceptar] y [No, gracias].
 * El administrador siempre puede aceptar, aunque su ruta haya cambiado: lo propuesto sustituye a lo de ahora (la varita lo deshace). Si el día ya no existe, R2d: «¿En qué día lo pones?».
 */
export function HojaRecomendacion({ rec, route, onCerrar, alResponder, diasIniciales = null, nombreDelAutor }: { rec: Recomendacion; route: Route; onCerrar: () => void; alResponder?: (estado: 'aceptada' | 'rechazada') => void; diasIniciales?: DiaPosible[] | null; nombreDelAutor?: string }) {
  const gente = useViajeCompartido((s) => s.gente)
  const autor = gente.find((p) => p.id === rec.authorId) ?? null
  const nombre = nombreDelAutor ?? nombreDe(autor)
  const [dias, setDias] = useState<DiaPosible[] | null>(diasIniciales)
  const [diaElegido, setDiaElegido] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const resolucion = useMemo(() => resolverRecomendacion(route, rec, diaElegido), [route, rec, diaElegido])
  const necesita = resolucion.ok === false && resolucion.necesitaDia === true ? resolucion : null
  const pideDia = (dias != null || necesita != null) && !diaElegido
  const cambios = useMemo(() => (resolucion.ok ? vistaPrevia(route, resolucion.accion) : []), [resolucion, route])
  const nada = resolucion.ok && resolucion.accion.kind === 'nada' ? resolucion.accion.nota : null
  const diasPosibles = dias ?? necesita?.diasPosibles ?? []

  // El día (para «cambios en el día 3»).
  const p = rec.payload as { dayId?: string; day?: { id?: string } }
  const diaDeLaRec = route.days.find((d) => d.id === (p.dayId ?? p.day?.id))
  const titulo = pideDia
    ? `${diaDeLaRec ? ElDia(route, diaDeLaRec.dayNumber) : 'Ese día'} ya no está en tu viaje. ¿En qué día lo pones?`
    : titularDeRecomendacion(nombre, rec.tipo, rec.tipo === 'dia' && diaDeLaRec ? elDia(route, diaDeLaRec.dayNumber) : null)

  const aceptar = async () => {
    setOcupado(true)
    setMensaje(null)
    const r = await aceptarRecomendacion(rec, diaElegido)
    setOcupado(false)
    if (r.estado === 'necesita_dia') {
      setDias(r.diasPosibles)
      return
    }
    if (r.estado === 'error') {
      setMensaje(r.mensaje)
      return
    }
    alResponder?.('aceptada')
    onCerrar()
  }
  const rechazar = async () => {
    setOcupado(true)
    const e = await rechazarRecomendacion(rec.id)
    setOcupado(false)
    if (e) {
      setMensaje(e)
      return
    }
    alResponder?.('rechazada')
    onCerrar()
  }

  return (
    <Hoja onCerrar={onCerrar} etiqueta={`Recomendación de ${nombre}`} titulo={titulo} datos={pideDia ? 'R2d' : `R2-${rec.tipo}`} z={96}>
      {pideDia && (
        <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {diasPosibles.map((d) => {
            const activo = diaElegido === d.id
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={activo}
                data-elegir-dia={d.id}
                onClick={() => setDiaElegido(d.id)}
                style={{ minHeight: 48, textAlign: 'left', padding: '12px 14px', borderRadius: 16, background: activo ? 'oklch(0.8 0.14 70 / .14)' : '#FFFFFF', border: `1.5px solid ${activo ? 'oklch(0.8 0.14 70)' : 'rgba(28,34,48,.12)'}`, font: "600 14px 'Geist'", color: '#1C2230', cursor: 'pointer' }}
              >
                {etiquetaDeDia(route, d.dayNumber)}
              </button>
            )
          })}
        </div>
      )}
      {pideDia && rec.tipo !== 'ruta' && <PropuestaDelDia rec={rec} />}
      {!pideDia && cambios.map((c) => <BloqueDeDia key={c.dayId} route={route} c={c} />)}
      {!pideDia && nada && (
        <p data-nada-que-cambiar style={{ margin: 0, font: "500 13.5px/1.4 'Geist'", color: 'rgba(28,34,48,.65)' }}>
          {nada} Puedes aceptarla igualmente.
        </p>
      )}
      {mensaje && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
          {mensaje}
        </p>
      )}
      <BotonHoja tipo="principal" disabled={ocupado || (pideDia && !diaElegido)} onClick={() => void aceptar()} datos="aceptar">
        Aceptar
      </BotonHoja>
      <BotonHoja tipo="secundario" disabled={ocupado} onClick={() => void rechazar()} datos="no-gracias">
        No, gracias
      </BotonHoja>
    </Hoja>
  )
}

/** R2d: lo que propone, para ver qué día elegir. */
function PropuestaDelDia({ rec }: { rec: Recomendacion }) {
  const day = (rec.payload as { day?: { stops?: { name: string }[] }; stop?: { name: string } }).day
  const stop = (rec.payload as { stop?: { name: string } }).stop
  const nombres = day?.stops?.map((s) => s.name) ?? (stop ? [stop.name] : [])
  if (nombres.length === 0) return null
  return (
    <div style={{ borderRadius: 16, background: '#F5EFE4', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Lo que propone</span>
      {nombres.map((n, i) => (
        <span key={`${n}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 13.5px/1.3 'Geist'" }}>
          <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: 'rgba(28,34,48,.2)' }} />
          {n}
        </span>
      ))}
    </div>
  )
}

/** El anfitrión de R2 para el administrador: la hoja abierta (desde la etiqueta de un día o desde la campanita), sobre la ruta de ahora. */
export function HojaRecomendacionAbierta({ rec, onCerrar }: { rec: Recomendacion; onCerrar: () => void }) {
  const route = useRouteStore((s) => s.route)
  const cargar = useViajeCompartido((s) => s.cargar)
  if (!route) return null
  return <HojaRecomendacion rec={rec} route={route} onCerrar={onCerrar} alResponder={() => {
    void cargar(rec.tripId)
    mandarAvisosPendientes()
  }} />
}
