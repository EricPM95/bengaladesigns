import { useCallback, useEffect, useRef, useState } from 'react'
import { displayStopName } from '../../../lib/format'
import { subirFoto, urlParaMostrar } from '../../../lib/fotosViaje'
import { demoActivo, enviarDeshacerVisto, enviarFotoDeGaleria, enviarFotoDeLaCamara, enviarVisto, llamar, ubicacionDeAhora, type RespuestaDeHecho } from '../../../lib/logros'
import { reproducirMomentos } from '../../../lib/sonidos'
import { listarFotos } from '../../../lib/fotosViaje'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { CamaraApp } from './CamaraApp'
import { fechasDelViaje, hoyLocal, lineaDeGaleria, textoDelPlazo } from './fechas'
import { AvisoDeVisto, EstilosDelVisto, FranjaSinConexion, HojaDePermisos, HojaDelVisto, HojaFotoDentro, HojaGaleria, HojaLoDeAyer, NotaCorta, type ParadaDeAyer } from './Hojas'
import { abrirHoja, cerrarHoja, useVistoStore, type DestinoDeFoto, type Hoja, type ParadaVista, type QueFalta } from './vistoStore'

/**
 * EL VISTO Y LAS FOTOS (Tanda 8b, App · HOY apartado 02). Un solo componente montado una vez (desde `LogrosPorVisto`, detrás del interruptor de los logros) que dibuja, encima de la app:
 *   A1 los permisos · A2 la franja de «Sin conexión» · V1 el aviso de 5 segundos · V2-V5 y «Guarda un recuerdo» (hojas) · la cámara de la app (9b) · la galería (9c) con sus fechas
 *   · V7 las fotos que no valen · V8 «Lo de ayer también cuenta».
 * El servidor decide lo que se gana; aquí solo se elige qué tarjeta enseñar con lo que contesta (`ubic`, `hay_pedazo`, `hay_emblema`, `nuevos`). Las sorpresas (pedazos, emblemas…) NO se pintan aquí:
 * caen en `useLogrosStore.momentos` y esperan mientras `hojaAbierta` sea true (lo mantiene `vistoStore.ts`).
 */

const CLAVE_PERMISOS = 'trazo:logros:permisos-vistos'
const MS_DEL_AVISO = 5000
const esperar = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

let resolverPermisos: (() => void) | null = null
let contadorDeAvisos = 0
const avisos = new Map<number, { deshacer: () => void }>()

const leerMarca = (clave: string) => {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return null
  }
}
const ponerMarca = (clave: string, valor: string) => {
  try {
    window.localStorage.setItem(clave, valor)
  } catch {
    /* sin almacenamiento */
  }
}

/* ------------------------------------------------------------------ */
/* A1: los permisos, una sola vez                                      */
/* ------------------------------------------------------------------ */

/** La primera vez que toca [Visto]: nuestra pantalla con su línea y, al continuar, las ventanas del móvil (ubicación y cámara). Las demás veces pasa de largo. */
export function asegurarPermisos(): Promise<void> {
  if (leerMarca(CLAVE_PERMISOS) === '1') return Promise.resolve()
  return new Promise((resolver) => {
    resolverPermisos = resolver
    useVistoStore.getState().poner({ permisos: true })
  })
}

async function continuarPermisos() {
  ponerMarca(CLAVE_PERMISOS, '1')
  useVistoStore.getState().poner({ permisos: false })
  const pedir = [ubicacionDeAhora(3000).catch(() => null)]
  if (navigator.mediaDevices?.getUserMedia) {
    pedir.push(
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          s.getTracks().forEach((t) => t.stop())
          return null
        })
        .catch(() => null),
    )
  }
  // No se espera a que contesten las ventanas del móvil más de un momento: el Visto sigue su camino.
  await Promise.race([Promise.all(pedir), esperar(1500)])
  resolverPermisos?.()
  resolverPermisos = null
}

/* ------------------------------------------------------------------ */
/* V1-V5: un Visto                                                     */
/* ------------------------------------------------------------------ */

function paradaDe(dayId: string, stopId: string, tripId: string): ParadaVista | null {
  const route = useRouteStore.getState().route
  const dia = route?.days.find((d) => d.id === dayId)
  const parada = dia?.stops.find((s) => s.id === stopId)
  return dia && parada ? { tripId, dayId, dayNumber: dia.dayNumber, stopId, nombre: parada.name } : null
}

/** Qué tarjeta toca según lo que contesta el servidor (la tabla de «Cómo se gana cada cosa al tocar Visto»). null = ninguna. */
export function hojaSegunRespuesta(r: RespuestaDeHecho | null, parada: ParadaVista): Hoja | null {
  // El nombre que sale en los textos es SIEMPRE el de la parada que se acaba de marcar (nunca el de otra).
  const nombreSitio = displayStopName(parada.nombre)
  const base = { parada, nombreSitio, fotoDentro: r?.foto_dentro ?? null }
  if (!r) return { ...base, tipo: 'recuerdo' }
  if (r.motivo === 'pregunta_medio_dia' || r.repetido) return null
  if (r.motivo === 'lejos' && (r.hay_pedazo || r.hay_emblema)) return { ...base, tipo: 'lejos', mensaje: `Parece que no estás en ${nombreSitio}. Tu pedazo te espera allí.` }
  if (r.motivo === 'lejos') return { ...base, tipo: 'recuerdo' }
  if (r.cuenta === false) return { ...base, tipo: 'recuerdo' }
  if (r.hay_emblema) return { ...base, tipo: 'oculto' }
  if (r.ubic === 'sin' && r.hay_pedazo) return { ...base, tipo: 'sin_ubicacion' }
  const pedazo = r.nuevos?.find((m) => m.tipo === 'suma') ?? null
  if (pedazo) return { ...base, tipo: 'ganado', pedazo }
  return { ...base, tipo: 'recuerdo' }
}

const FALTA_DE: Record<Hoja['tipo'], QueFalta | null> = { oculto: 'sorpresa', sin_ubicacion: 'pedazo', ganado: 'recuerdo', recuerdo: 'recuerdo', lejos: null }

/**
 * Lo que pasa al tocar [Visto] con los logros encendidos: permisos (la primera vez), el aviso de 5 segundos con [Deshacer], el envío al servidor y, pasados los 5 segundos, la tarjeta que toque.
 * Las sorpresas esperan desde el toque hasta que se cierra la tarjeta. Si se deshace dentro de los 5 segundos, lo que había caído en el almacén se quita.
 */
export async function procesarVisto(p: { tripId: string; dayId: string; stopId: string; nombre: string }): Promise<void> {
  const parada = paradaDe(p.dayId, p.stopId, p.tripId)
  if (!parada) return
  const { poner } = useVistoStore.getState()
  await asegurarPermisos()
  const id = ++contadorDeAvisos
  let deshecho = false
  const fin = new Promise<void>((resolver) => {
    avisos.set(id, {
      deshacer: () => {
        deshecho = true
        resolver()
      },
    })
    window.setTimeout(resolver, MS_DEL_AVISO)
  })
  poner({ aviso: { id, parada, nombre: parada.nombre } })
  const llegada = enviarVisto({ tripId: p.tripId, stopId: p.stopId, nombre: p.nombre }).then((r) => {
    useLogrosStore.getState().recibir(r)
    if (r?.nuevos?.length) reproducirMomentos(r.nuevos.map((m) => m.tipo))
    return r
  })
  const [r] = await Promise.all([llegada, fin])
  avisos.delete(id)
  if (useVistoStore.getState().aviso?.id === id) poner({ aviso: null })
  if (deshecho) {
    // Lo que había llegado de este Visto se quita; y por si el Visto llegó DESPUÉS de deshacer, se vuelve a deshacer (no pasa nada si ya estaba).
    if (r?.nuevos?.length) useLogrosStore.setState((s) => ({ momentos: s.momentos.filter((m) => !r.nuevos.includes(m)) }))
    if (r) void enviarDeshacerVisto({ tripId: p.tripId, stopId: p.stopId, nombre: p.nombre })
    return
  }
  const hoja = hojaSegunRespuesta(r, parada)
  if (!hoja) return
  const falta = FALTA_DE[hoja.tipo]
  if (falta) useVistoStore.getState().anotarPendiente(p.stopId, { tripId: p.tripId, falta, nombre: parada.nombre, fotoDentro: hoja.fotoDentro ?? null })
  abrirHoja(hoja)
}

/** El Visto se ha quitado (menú «···», [Deshacer] de HOY…): ya no espera foto. */
export function alQuitarVisto(stopId: string) {
  useVistoStore.getState().quitarPendiente(stopId)
}

function deshacerDelAviso(id: number) {
  const a = avisos.get(id)
  const aviso = useVistoStore.getState().aviso
  if (!a || !aviso || aviso.id !== id) return
  // Quita la marca de visto en la ruta: `LogrosPorVisto` manda el «deshacer» al servidor.
  useRouteStore.getState().setStopVisto(aviso.parada.dayId, aviso.parada.stopId, false)
  alQuitarVisto(aviso.parada.stopId)
  a.deshacer()
}

function desmarcarDeLaHoja(h: Hoja) {
  useRouteStore.getState().setStopVisto(h.parada.dayId, h.parada.stopId, false)
  alQuitarVisto(h.parada.stopId)
  cerrarHoja()
}

/* ------------------------------------------------------------------ */
/* Las fotos                                                           */
/* ------------------------------------------------------------------ */

/** Empieza una foto para una parada: la cámara de la app (con la línea de «foto dentro» antes, si la hay) o la galería (con las fechas del viaje antes). */
export function empezarFoto(destino: DestinoDeFoto, via: 'camara' | 'galeria') {
  const { poner } = useVistoStore.getState()
  if (via === 'camara') {
    if (destino.fotoDentro) poner({ avisoDentro: destino })
    else poner({ camara: destino })
  } else poner({ galeria: { ...destino, error: null, subiendo: false } })
}

/** El botón de cámara de una parada (V6): abre la cámara con el destino correcto. */
export function fotoDeParada(parada: ParadaVista, falta: QueFalta, fotoDentro?: string | null) {
  empezarFoto({ parada, nombreSitio: displayStopName(parada.nombre), oculto: falta === 'sorpresa', fotoDentro }, 'camara')
}

async function subirAlAlbum(destino: DestinoDeFoto, archivo: File) {
  const { parada } = destino
  try {
    await subirFoto({ tripId: parada.tripId, dayId: parada.dayId, dayNumber: parada.dayNumber, stopName: parada.nombre, file: archivo })
  } catch {
    /* sin Supabase o sin red: la foto de los logros ya se mandó; el álbum es aparte */
  }
}

/** Una foto hecha o elegida: se manda al servidor; si vale, va al álbum y lo ganado cae en el almacén; si no vale, se enseña el motivo con [Elegir otra foto]. */
async function resolverFoto(destino: DestinoDeFoto, archivo: File, origen: 'app' | 'galeria') {
  const { poner, quitarPendiente } = useVistoStore.getState()
  const { parada } = destino
  poner({ camara: null, avisoDentro: null, galeria: origen === 'galeria' ? { ...destino, error: null, subiendo: true } : null })
  const datos = { tripId: parada.tripId, stopId: parada.stopId, nombre: parada.nombre }
  const r = origen === 'app' ? await enviarFotoDeLaCamara(datos) : await enviarFotoDeGaleria({ ...datos, archivo })
  if (r && r.valida === false) {
    // Con el nombre de la parada de esta foto (nunca el de otra).
    const mensaje = r.motivo === 'otro_sitio' ? `Esta foto no es de ${destino.nombreSitio}.` : (r.mensaje ?? 'Esta foto no vale. Elige otra.')
    poner({ galeria: { ...destino, error: mensaje, subiendo: false } })
    return
  }
  // El álbum va aparte y sin esperar: si no hay red o Supabase, la foto de los logros ya está mandada.
  void subirAlAlbum(destino, archivo)
  quitarPendiente(parada.stopId)
  useVistoStore.getState().marcarConFoto(parada.stopId)
  void refrescarPendientes(parada.tripId)
  if (r) {
    useLogrosStore.getState().recibir(r)
    if (r.nuevos?.length) reproducirMomentos(r.nuevos.map((m) => m.tipo))
  }
  poner({ galeria: null, nota: r ? (r.nuevos?.length ? null : 'Foto guardada') : 'Foto guardada. Tus sorpresas saldrán al volver la señal.' })
}

/* ------------------------------------------------------------------ */
/* V6 y V8: lo que falta                                               */
/* ------------------------------------------------------------------ */

interface Pendiente {
  sitio: string
  stop_id?: string | null
  nombre?: string | null
  foto_dentro?: string | null
  falta: string[]
}

/** Pide al servidor lo que falta por parada (días anteriores y, después del viaje, todo lo del plazo). */
export async function refrescarPendientes(tripId: string): Promise<Pendiente[]> {
  const r = await llamar<{ ok: boolean; pendientes?: Pendiente[] }>(`/api/logros/lo-de-ayer?trip_id=${encodeURIComponent(tripId)}`)
  const lista = r?.ok ? (r.pendientes ?? []) : []
  const servidor: Record<string, { tripId: string; falta: QueFalta; nombre: string; fotoDentro?: string | null }> = {}
  for (const x of lista) {
    if (!x.stop_id) continue
    servidor[x.stop_id] = { tripId, falta: x.falta.includes('emblema') ? 'sorpresa' : 'pedazo', nombre: x.nombre ?? '', fotoDentro: x.foto_dentro ?? null }
  }
  useVistoStore.getState().poner({ servidor })
  return lista
}

/** V8: «Lo de ayer también cuenta», una vez por día y viaje (o `forzar`). Solo si hay paradas de días anteriores sin su pedazo o su emblema. */
export async function mostrarLoDeAyer(tripId: string, forzar = false): Promise<boolean> {
  const route = useRouteStore.getState().route
  const f = fechasDelViaje(route)
  const hoy = hoyLocal()
  if (!forzar && (!f || hoy < f.inicio)) return false
  const marca = `trazo:logros:ayer:${tripId}:${hoy}`
  if (!forzar && leerMarca(marca)) return false
  const lista = await refrescarPendientes(tripId)
  const paradas: ParadaDeAyer[] = lista.filter((x) => x.stop_id).map((x) => ({ stopId: x.stop_id as string, nombre: x.nombre ?? '', fotoDentro: x.foto_dentro ?? null }))
  if (paradas.length === 0) return false
  ponerMarca(marca, '1')
  useVistoStore.getState().poner({ paradasAyer: paradas, ayer: true })
  return true
}

/* ------------------------------------------------------------------ */
/* El componente                                                       */
/* ------------------------------------------------------------------ */

export function VistoFlujo({ tripId }: { tripId: string | null }) {
  const s = useVistoStore()
  const route = useRouteStore((st) => st.route)
  const entradaDeGaleria = useRef<HTMLInputElement>(null)
  const [pidiendoUbic, setPidiendoUbic] = useState(false)
  const [errorUbic, setErrorUbic] = useState<string | null>(null)
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({})
  const [sinRed, setSinRed] = useState(typeof navigator !== 'undefined' && navigator.onLine === false)
  const pendienteDeGaleria = useRef<DestinoDeFoto | null>(null)

  // A2: sin conexión.
  useEffect(() => {
    const dentro = () => setSinRed(false)
    const fuera = () => setSinRed(true)
    window.addEventListener('online', dentro)
    window.addEventListener('offline', fuera)
    return () => {
      window.removeEventListener('online', dentro)
      window.removeEventListener('offline', fuera)
    }
  }, [])

  // Lo que falta (V6) y «Lo de ayer también cuenta» (V8) al abrir la app con el viaje.
  useEffect(() => {
    if (!tripId) return
    void mostrarLoDeAyer(tripId)
  }, [tripId])

  // Las miniaturas de V8, de las fotos que ya hay en el álbum (si no hay, salen los colores).
  useEffect(() => {
    if (!s.ayer || !tripId) return
    let vivo = true
    void listarFotos(tripId)
      .then((fotos) => {
        if (!vivo) return
        const m: Record<string, string> = {}
        for (const p of s.paradasAyer) {
          const f = fotos.find((x) => x.stopName === p.nombre)
          if (f) m[p.stopId] = urlParaMostrar(f)
        }
        setMiniaturas(m)
      })
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [s.ayer, s.paradasAyer, tripId])

  const abrirGaleria = useCallback((d: DestinoDeFoto) => {
    pendienteDeGaleria.current = d
    entradaDeGaleria.current?.click()
  }, [])

  const activarUbicacion = async (h: Hoja) => {
    setPidiendoUbic(true)
    setErrorUbic(null)
    const u = await ubicacionDeAhora(5000)
    setPidiendoUbic(false)
    if (!u) {
      setErrorUbic('No hemos podido saber dónde estás. Actívala en los ajustes del móvil o haz una foto.')
      return
    }
    // Con la ubicación, el Visto se vuelve a mandar: quita el de antes (sin ubicación) y pone el de ahora.
    const datos = { tripId: h.parada.tripId, stopId: h.parada.stopId, nombre: h.parada.nombre }
    await enviarDeshacerVisto(datos)
    const r = await enviarVisto(datos)
    useLogrosStore.getState().recibir(r)
    cerrarHoja()
    useVistoStore.getState().quitarPendiente(h.parada.stopId)
    const nueva = hojaSegunRespuesta(r, h.parada)
    if (nueva) {
      const falta = FALTA_DE[nueva.tipo]
      if (falta) useVistoStore.getState().anotarPendiente(h.parada.stopId, { tripId: h.parada.tripId, falta, nombre: h.parada.nombre, fotoDentro: nueva.fotoDentro ?? null })
      abrirHoja(nueva)
    }
  }

  const destinoDe = (h: Hoja): DestinoDeFoto => ({ parada: h.parada, nombreSitio: h.nombreSitio, oculto: h.tipo === 'oculto', fotoDentro: h.fotoDentro ?? null })

  const hoja = s.hoja
  const mostrarFranja = sinRed

  return (
    <>
      <EstilosDelVisto />
      {mostrarFranja && <FranjaSinConexion />}
      {s.permisos && <HojaDePermisos onContinuar={() => void continuarPermisos()} />}
      {s.aviso && <AvisoDeVisto key={s.aviso.id} nombre={s.aviso.nombre} ms={MS_DEL_AVISO} onDeshacer={() => deshacerDelAviso(s.aviso!.id)} />}
      {hoja && !s.camara && !s.avisoDentro && !s.galeria && (
        <HojaDelVisto
          hoja={hoja}
          acciones={{
            onCamara: () => {
              cerrarHoja()
              empezarFoto(destinoDe(hoja), 'camara')
            },
            onGaleria: () => {
              cerrarHoja()
              empezarFoto(destinoDe(hoja), 'galeria')
            },
            onActivarUbicacion: () => void activarUbicacion(hoja),
            onDesmarcar: () => desmarcarDeLaHoja(hoja),
            onCerrar: () => {
              setErrorUbic(null)
              cerrarHoja()
            },
            errorUbicacion: errorUbic,
            pidiendoUbicacion: pidiendoUbic,
          }}
        />
      )}
      {s.avisoDentro && <HojaFotoDentro destino={s.avisoDentro} onSeguir={() => useVistoStore.getState().poner({ avisoDentro: null, camara: s.avisoDentro })} onCerrar={() => useVistoStore.getState().poner({ avisoDentro: null })} />}
      {s.camara && <CamaraApp nombre={s.camara.nombreSitio} oculto={s.camara.oculto} alFoto={(f) => void resolverFoto(s.camara!, f, 'app')} alCerrar={() => useVistoStore.getState().poner({ camara: null })} />}
      {s.galeria && (
        <HojaGaleria
          nombreSitio={s.galeria.nombreSitio}
          linea={lineaDeGaleria(route)}
          error={s.galeria.error}
          subiendo={s.galeria.subiendo}
          onElegir={() => abrirGaleria(s.galeria!)}
          onCerrar={() => useVistoStore.getState().poner({ galeria: null })}
        />
      )}
      {s.ayer && (
        <HojaLoDeAyer
          paradas={s.paradasAyer}
          plazo={textoDelPlazo(route)}
          miniaturas={miniaturas}
          onElegir={(p) => {
            const parada = paradaDeLaRuta(p.stopId, tripId ?? '')
            if (!parada) return
            useVistoStore.getState().poner({ ayer: false, galeria: { parada, nombreSitio: displayStopName(p.nombre), oculto: false, fotoDentro: p.fotoDentro ?? null, error: null, subiendo: false } })
          }}
          onCerrar={() => useVistoStore.getState().poner({ ayer: false })}
        />
      )}
      {s.nota && <NotaCorta texto={s.nota} onFin={() => useVistoStore.getState().poner({ nota: null })} />}
      <input
        ref={entradaDeGaleria}
        type="file"
        accept="image/*"
        className="hidden"
        data-visto="entrada-galeria"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          const d = pendienteDeGaleria.current
          if (f && d) void resolverFoto(d, f, 'galeria')
        }}
      />
    </>
  )
}

function paradaDeLaRuta(stopId: string, tripId: string): ParadaVista | null {
  const route = useRouteStore.getState().route
  for (const dia of route?.days ?? []) {
    const parada = dia.stops.find((x) => x.id === stopId)
    if (parada) return { tripId, dayId: dia.id, dayNumber: dia.dayNumber, stopId, nombre: parada.name }
  }
  return null
}

// Solo en desarrollo: el modo demo enseña «Lo de ayer» a mano con `__demo.loDeAyer()`.
if (import.meta.env.DEV && demoActivo()) {
  void import('../../../lib/logrosDemo').then(() => {
    const w = window as unknown as { __demo?: Record<string, unknown> }
    if (!w.__demo) return
    w.__demo.loDeAyer = () => mostrarLoDeAyer(useRouteStore.getState().route?.id ?? '', true)
    w.__demo.abrirHojaDeVisto = (tipo: Hoja['tipo'], stopIndex = 0, fotoDentro: string | null = null) => {
      const route = useRouteStore.getState().route
      const dia = route?.days[0]
      const stop = dia?.stops[stopIndex]
      if (!route || !dia || !stop) return false
      const parada: ParadaVista = { tripId: route.id, dayId: dia.id, dayNumber: dia.dayNumber, stopId: stop.id, nombre: stop.name }
      abrirHoja({ tipo, parada, nombreSitio: displayStopName(stop.name), fotoDentro, pedazo: tipo === 'ganado' ? ({ tipo: 'suma', nombre: 'Los imprescindibles de Roma', linea: '3 de 8', primera_vez: true } as never) : null, mensaje: tipo === 'lejos' ? `Parece que no estás en ${displayStopName(stop.name)}. Tu pedazo te espera allí.` : null })
      return true
    }
  })
}
