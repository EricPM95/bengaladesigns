import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import type { ArrivalPoint } from '../../../lib/arrivalReturn'
import { fijarDiaDePrueba } from '../../../lib/pago'
import { dayColorIndex } from '../../../lib/dayColors'
import { computeDayTravelInfo } from '../../../lib/dayTravelInfo'
import { fichaDelDia } from '../../../lib/nombreDeDia'
import { useNombreDeDias } from '../../../lib/tituloDelDia'
import { TarjetaDeDia } from '../../route/TarjetaDeDia'
import { DayDetailPanel } from '../../route/dayDetail/DayDetailPanel'
import { PiezaSegura } from '../../PiezaSegura'
import { BOTON_ORO } from '../../ui/botonesOro'
import { Filtro, SERIE, Vacio, boton, etiquetaMono, tarjetaGrande } from '../estilo'
import {
  CASOS_RAPIDOS,
  DESTINOS_DEL_PROBADOR,
  HORAS_DE_FREE_TOUR,
  casoPorDefecto,
  conCasoRapido,
  probar,
  puntosDeLlegada,
  type CasoProbador,
  type DestinoDelProbador,
  type ResultadoProbador,
} from './motorDelProbador'

/**
 * (V57) «PROBAR REORGANIZAR» (`/admin/reorganizar`, solo administradores; se baja a demanda, nunca en el paquete de los viajeros). Se elige el destino, los días, las horas de llegada y de salida, el aeropuerto y el Free Tour;
 * debajo, en una línea, lo que ha decidido el motor; y el primer y el último día como salen en DÍAS (la misma tarjeta, `TarjetaDeDia`), ANTES (sin vuelos) y DESPUÉS de Reorganizar. No guarda nada (ver `motorDelProbador.ts`).
 * Las piezas son las del panel (`estilo.tsx`: tarjetas, filtros, botones) y el botón dorado de `botonesOro`. Solo pide al motor al pulsar un caso o [Probar]; nada en bucle.
 * Para capturas: `data-probador="contenedor|linea-del-motor|antes|despues|probar"`, `data-probador-caso="<id>"` en los casos rápidos y `data-probador-dia="primero|ultimo"` en cada tarjeta. Por la dirección:
 * `/admin/reorganizar?caso=llegada-1600-ft-1700&destino=Lanzarote&dias=6` monta el caso rápido y lo prueba (también `llegada=HH:MM`, `salida=HH:MM`, `ft=no|sin_hora|HH:MM`, `punto=<id>`, `inicio=AAAA-MM-DD`, `probar=1`).
 */
const campo: CSSProperties = { minHeight: 44, borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 12px', font: "500 14px 'Geist'", background: '#FFFFFF', color: '#1C2230' }

function Fila({ titulo, children }: { titulo: string; children: ReactNode }): ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ ...etiquetaMono, width: 110, flex: 'none', textTransform: 'uppercase' }}>{titulo}</span>
      {children}
    </div>
  )
}

/** Un día como sale en DÍAS (la misma tarjeta, abierta), pero de la ruta de prueba en memoria y de solo lectura. */
function DiaDelProbador({ ruta, dia, cual }: { ruta: Route; dia: DayPlan; cual: 'primero' | 'ultimo' }): ReactNode {
  const nombreDe = useNombreDeDias(ruta)
  const [abierto, setAbierto] = useState(true)
  const index = ruta.days.findIndex((candidato) => candidato.id === dia.id)
  const sinVuelta = ruta.days.filter((candidato) => !candidato.isReturnLeg)
  const allDays = sinVuelta.map((candidato) => ({ id: candidato.id, dayNumber: candidato.dayNumber, city: candidato.city }))
  const travel = computeDayTravelInfo(ruta, index)
  return (
    <div data-probador-dia={cual} style={{ minWidth: 0 }}>
      <PiezaSegura nombre={`día ${dia.dayNumber} del probador`}>
        <TarjetaDeDia
          route={ruta}
          day={dia}
          reservations={[]}
          colorIndex={dayColorIndex(dia, Math.max(0, sinVuelta.findIndex((candidato) => candidato.id === dia.id)))}
          expanded={abierto}
          pasado={false}
          hizoAlgo={false}
          fotosDelDia={0}
          diaCompleto={false}
          travel={travel}
          nombre={nombreDe(dia)}
          ficha={fichaDelDia(ruta, dia.dayNumber)}
          menu={null}
          onToggle={() => setAbierto(!abierto)}
          onPonleNombre={() => {}}
        >
          {abierto && <DayDetailPanel day={dia} travel={travel} isLastDay={index === ruta.days.length - 1} origin={ruta.origin} allDays={allDays} isFirstDayOfTrip={index === 0} soloLectura vista={{ route: ruta, reservations: [] }} />}
        </TarjetaDeDia>
      </PiezaSegura>
    </div>
  )
}

/** (V61) Un día, ANTES y DESPUÉS lado a lado (en el móvil, uno encima del otro): «Primer día» y «Último día» son dos filas. */
function ParDeDias({ cual, rotulo, antes, despues, tituloDespues, movil }: { cual: 'primero' | 'ultimo'; rotulo: string; antes: Route; despues: Route; tituloDespues: string; movil: boolean }): ReactNode {
  const dia = (ruta: Route): DayPlan | undefined => (cual === 'primero' ? ruta.days[0] : ruta.days.length > 1 ? ruta.days[ruta.days.length - 1] : undefined)
  const a = dia(antes)
  const d = dia(despues)
  if (!a || !d) return null
  return (
    <div data-probador-fila={cual} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={etiquetaMono}>{rotulo}</span>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div data-probador="antes" style={{ ...tarjetaGrande, minWidth: 0, gap: 12 }}>
          <span style={{ font: `400 22px/1 ${SERIE}` }}>Antes (sin vuelos)</span>
          <DiaDelProbador ruta={antes} dia={a} cual={cual} />
        </div>
        <div data-probador="despues" style={{ ...tarjetaGrande, minWidth: 0, gap: 12 }}>
          <span style={{ font: `400 22px/1 ${SERIE}` }}>{tituloDespues}</span>
          <DiaDelProbador ruta={despues} dia={d} cual={cual} />
        </div>
      </div>
    </div>
  )
}

const aplicarDireccion = (base: CasoProbador): { caso: CasoProbador; ejecutar: boolean } => {
  const q = new URLSearchParams(window.location.search)
  const destino = (DESTINOS_DEL_PROBADOR as readonly string[]).includes(q.get('destino') ?? '') ? (q.get('destino') as DestinoDelProbador) : base.destino
  let caso: CasoProbador = destino === base.destino ? base : casoPorDefecto(destino)
  const rapido = CASOS_RAPIDOS.find((c) => c.id === q.get('caso'))
  if (rapido) caso = conCasoRapido(caso, rapido.cambia)
  const hora = (v: string | null) => (v !== null && /^\d{1,2}:\d{2}$/.test(v) ? v.padStart(5, '0') : null)
  const dias = Number(q.get('dias'))
  if (dias >= 2 && dias <= 14) caso = { ...caso, dias }
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('inicio') ?? '')) caso = { ...caso, inicio: q.get('inicio') as string }
  if (hora(q.get('llegada'))) caso = { ...caso, llegada: hora(q.get('llegada')) as string }
  if (hora(q.get('salida'))) caso = { ...caso, salida: hora(q.get('salida')) as string }
  const ft = q.get('ft')
  if (ft === 'no' || ft === 'sin_hora' || hora(ft)) caso = { ...caso, freeTour: ft === 'no' || ft === 'sin_hora' ? ft : (hora(ft) as string) }
  if (q.get('punto') !== null) caso = { ...caso, punto: q.get('punto') ?? '' }
  return { caso, ejecutar: Boolean(rapido) || q.get('probar') === '1' }
}

export default function ProbarReorganizar({ movil }: { movil: boolean }): ReactNode {
  const inicial = useRef(aplicarDireccion(casoPorDefecto('Roma'))).current
  const [caso, setCaso] = useState<CasoProbador>(inicial.caso)
  const [puntos, setPuntos] = useState<ArrivalPoint[]>([])
  const [resultado, setResultado] = useState<{ n: number; datos: ResultadoProbador } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const vuelta = useRef(0)

  // Con el viaje de prueba, lo de pago está abierto para quien lo mira (como el día de prueba de HOY): se apaga al salir de esta página.
  useEffect(() => {
    fijarDiaDePrueba(true)
    return () => fijarDiaDePrueba(false)
  }, [])
  // Los aeropuertos del destino: una petición por destino elegido (datos del servidor, sin base de datos; se guardan en memoria).
  useEffect(() => {
    let vivo = true
    void puntosDeLlegada(caso.destino).then((lista) => vivo && setPuntos(lista))
    return () => {
      vivo = false
    }
  }, [caso.destino])

  const ejecutar = async (c: CasoProbador) => {
    const mia = ++vuelta.current
    setOcupado(true)
    setError('')
    try {
      const datos = await probar(c)
      if (mia === vuelta.current) setResultado({ n: mia, datos })
    } catch (e) {
      if (mia === vuelta.current) setError(e instanceof Error ? e.message : 'No se ha podido probar.')
    } finally {
      if (mia === vuelta.current) setOcupado(false)
    }
  }
  // Solo una vez al abrir, y solo si la dirección trae un caso (`?caso=…` o `?probar=1`).
  useEffect(() => {
    if (inicial.ejecutar) void ejecutar(inicial.caso)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const poner = (cambia: Partial<CasoProbador>) => setCaso((c) => ({ ...c, ...cambia }))
  const cambiarDestino = (destino: DestinoDelProbador) => setCaso((c) => ({ ...casoPorDefecto(destino), llegada: c.llegada, salida: c.salida, freeTour: c.freeTour }))

  return (
    <div data-probador="contenedor" data-seccion="reorganizar" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      <div style={{ ...tarjetaGrande, gap: 12 }}>
        <Fila titulo="Destino">
          {DESTINOS_DEL_PROBADOR.map((d) => (
            <Filtro key={d} dato={`destino-${d}`} activo={caso.destino === d} onClick={() => cambiarDestino(d)}>{d}</Filtro>
          ))}
        </Fila>
        <Fila titulo="Días">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Filtro key={n} dato={`dias-${n}`} activo={caso.dias === n} onClick={() => poner({ dias: n })}>{n}</Filtro>
          ))}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: "500 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            Primer día
            <input data-probador="inicio" type="date" value={caso.inicio} onChange={(e) => e.target.value && poner({ inicio: e.target.value })} style={campo} />
          </label>
        </Fila>
        <Fila titulo="Llegada">
          <input data-probador="llegada" type="time" value={caso.llegada} onChange={(e) => poner({ llegada: e.target.value })} aria-label="Hora de llegada" style={campo} />
          <Filtro dato="sin-llegada" activo={caso.llegada === ''} onClick={() => poner({ llegada: '' })}>Sin vuelo de llegada</Filtro>
          <select data-probador="punto" value={caso.punto} onChange={(e) => poner({ punto: e.target.value })} aria-label="Aeropuerto o punto de llegada" style={campo}>
            <option value="">Punto: el que elige el motor</option>
            {puntos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` (${p.codigo})` : ''}</option>
            ))}
          </select>
        </Fila>
        <Fila titulo="Salida">
          <input data-probador="salida" type="time" value={caso.salida} onChange={(e) => poner({ salida: e.target.value })} aria-label="Hora de salida" style={campo} />
          <Filtro dato="sin-salida" activo={caso.salida === ''} onClick={() => poner({ salida: '' })}>Sin vuelo de vuelta</Filtro>
        </Fila>
        <Fila titulo="Free Tour">
          <Filtro dato="ft-no" activo={caso.freeTour === 'no'} onClick={() => poner({ freeTour: 'no' })}>Sin Free Tour</Filtro>
          <Filtro dato="ft-sin-hora" activo={caso.freeTour === 'sin_hora'} onClick={() => poner({ freeTour: 'sin_hora' })}>Con Free Tour, sin hora reservada</Filtro>
          <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Con hora reservada:</span>
          {HORAS_DE_FREE_TOUR.map((h) => (
            <Filtro key={h} dato={`ft-${h}`} activo={caso.freeTour === h} onClick={() => poner({ freeTour: h })}>{h}</Filtro>
          ))}
        </Fila>
        <Fila titulo="Casos rápidos">
          {CASOS_RAPIDOS.map((c) => (
            <button key={c.id} type="button" data-probador-caso={c.id} disabled={ocupado} onClick={() => { const siguiente = conCasoRapido(caso, c.cambia); setCaso(siguiente); void ejecutar(siguiente) }} style={{ ...boton(false, ocupado), minHeight: 40, font: "600 13px 'Geist'" }}>
              {c.texto}
            </button>
          ))}
        </Fila>
        <div>
          <button type="button" data-probador="probar" disabled={ocupado} onClick={() => void ejecutar(caso)} style={{ height: 44, padding: '0 26px', borderRadius: 14, border: 'none', ...BOTON_ORO, font: "700 14px 'Geist'", opacity: ocupado ? 0.5 : 1, cursor: ocupado ? 'default' : 'pointer' }}>
            {ocupado ? 'Probando…' : 'Probar'}
          </button>
        </div>
      </div>

      {error && <p data-probador="error" style={{ margin: 0, font: "600 14px 'Geist'", color: 'oklch(0.5 0.19 5)' }}>{error}</p>}
      {resultado ? (
        <>
          <p data-probador="linea-del-motor" data-camino={resultado.datos.camino} style={{ margin: 0, padding: '12px 16px', borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', font: "600 14px/1.4 'Geist'" }}>
            {resultado.datos.linea}
          </p>
          <div key={resultado.n} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {(() => {
              const tituloDespues = resultado.datos.camino === 'generacion' ? 'Después (con vuelos y el Free Tour reservado)' : 'Después de Reorganizar'
              return (
                <>
                  <ParDeDias cual="primero" rotulo="PRIMER DÍA" antes={resultado.datos.antes} despues={resultado.datos.despues} tituloDespues={tituloDespues} movil={movil} />
                  <ParDeDias cual="ultimo" rotulo="ÚLTIMO DÍA" antes={resultado.datos.antes} despues={resultado.datos.despues} tituloDespues={tituloDespues} movil={movil} />
                </>
              )
            })()}
          </div>
          </>
      ) : (
        !ocupado && !error && <Vacio>Elige un caso y pulsa «Probar»: el motor monta el viaje sin vuelos y lo reorganiza con ellos. No se guarda nada.</Vacio>
      )}
    </div>
  )
}
