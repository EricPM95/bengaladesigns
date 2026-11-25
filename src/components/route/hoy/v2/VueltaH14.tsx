import type { DayPlan, Route, TarjetaHoyVuelvesDato } from '../../../../lib/types'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { medioOf, type ArrivalInfo } from '../../../../lib/arrivalReturn'
import { datosDelDiaDeVuelta, textoDelMargen, type MedioDeLaVuelta } from '../../../../lib/diaDeVuelta'
import { lineasDeVuelta, minutosDe } from '../../../../lib/hoyParada'
import { nombreDelPase } from '../../../../lib/nombrePase'
import { Marca } from '../../../pase/Marca'
import { Icono } from '../../../ui/Icono'
import { CandadoRedondo } from '../../../pase/Candado'
import type { MitadDeHoy } from '../llegadaVuelta'
import { BOTON_ORO } from '../../../ui/botonesOro'

const ORO_CLARO = '#F3D88F'

/** Lo que Lanzarote trae del motor en `planVuelta` (la hora del vuelo, la hora límite del coche en la T1, a qué hora se sale de la zona y a cuál se llega a la T1). */
function datosDeCoche(route: Route, day: DayPlan): { hora: string | null; hasta: string | null; trayectoMin: number | null; limiteT1: string | null } {
  const texto = (x: unknown): string | null => (typeof x === 'string' && /^\d{1,2}:\d{2}/.test(x) ? x : null)
  // El día de vuelta del motor de coche trae lo suyo en `day.coche.vuelta` (sale de la zona, minutos hasta la T1 y hora límite); si no, lo del plan de la vuelta.
  const dv = day.coche?.activo ? day.coche.vuelta : null
  if (dv?.al_aeropuerto) return { hora: texto(route.departureFlightTime), hasta: texto(dv.sale), trayectoMin: Number.isFinite(dv.minutos) ? dv.minutos : null, limiteT1: texto(dv.limite_t1) }
  const v = (route.planVuelta ?? {}) as Record<string, unknown>
  const sale = texto(v.salir_de_la_zona)
  const llega = texto(v.llegas_t1)
  const a = minutosDe(sale)
  const b = minutosDe(llega)
  return { hora: texto(v.hora), hasta: sale, trayectoMin: a != null && b != null && b > a ? b - a : null, limiteT1: texto(v.limite_t1) }
}

/**
 * (V57) La hora del vuelo y a qué hora hay que salir hacia el aeropuerto/estación/puerto (`hasta`), con el trayecto y el margen. UNA sola cuenta para la tarjeta, el aviso de «hoy no te da tiempo» y el «Buen viaje».
 * Sin consultas a Supabase: todo sale del viaje y de los datos del destino en memoria.
 */
export function datosDeLaSalida({ route, day, mitad, info }: { route: Route; day: DayPlan; mitad: MitadDeHoy; info: ArrivalInfo }): { hora: string | null; hasta: string | null; trayectoMin: number | null; sitio: string | null; margen: string | null; limiteT1: string | null; sinTiempo: boolean } {
  const d = datosDelDiaDeVuelta({ modo: (mitad.mode === 'coche' ? 'avion' : mitad.mode) as MedioDeLaVuelta, hora: mitad.hora, punto: mitad.point, medio: medioOf(info, mitad.mode), info, zonaId: route.accommodationZone ?? null })
  if (esDestinoDeCoche(route.destination)) {
    // Con el día de vuelta del motor (tras Reorganizar) manda su hora y su límite del coche; sin él NO se inventa la hora de salir (el motor de coche cuenta distinto: carretera, devolver el coche, T1): hasta que reorganice, solo «Devuelve el coche en la T1».
    const c = datosDeCoche(route, day)
    return { hora: c.hora ?? mitad.hora, hasta: c.hasta, trayectoMin: c.trayectoMin, sitio: 'aeropuerto', margen: textoDelMargen(120), limiteT1: c.limiteT1, sinTiempo: false }
  }
  return { hora: mitad.hora, hasta: d.hasta ?? d.sale, trayectoMin: d.trayecto?.min ?? null, sitio: d.sitio, margen: d.margen ? textoDelMargen(d.margen) : null, limiteT1: null, sinTiempo: d.sinTiempo }
}

/**
 * H14 y H14b: «Hoy vuelves a casa», UNA sola tarjeta con pase y sin pase. Con la cuenta única de `shared/arrival/horaUtil.js` (vía `datosDelDiaDeVuelta`: vuelo − tiempo en el aeropuerto − trayecto desde tu zona − maleta).
 * Con el pase: «Tienes el día libre hasta las…», el trayecto y, en Lanzarote, «Devuelve el coche en la T1» con su hora límite. Sin el pase: lo mismo sin la cuenta, y una línea que dice lo que daría el pase.
 */
export function HoyVuelvesH14({ route, day, tarjeta, mitad, info, conPase, onVerComoIr, onAnadirVuelo }: { route: Route; day: DayPlan; tarjeta: TarjetaHoyVuelvesDato | null; mitad: MitadDeHoy; info: ArrivalInfo; conPase: boolean; onVerComoIr: () => void; /** (V57) Sin vuelo de vuelta: [Añadir mi vuelo] (abre la hoja «Tu vuelo» de RESERVAS). */ onAnadirVuelo?: () => void }) {
  const enCoche = esDestinoDeCoche(route.destination)
  const { hora, hasta, trayectoMin, sitio, margen, limiteT1 } = datosDeLaSalida({ route, day, mitad, info })
  const modo = enCoche ? 'avion' : mitad.mode
  const t = lineasDeVuelta({ modo, hora, hasta: conPase ? hasta : null, trayectoMin: conPase ? trayectoMin : null, sitio, margen, enCoche, limiteT1: conPase ? limiteT1 : null, conPase, nombreDelPase: nombreDelPase(route.destination) })
  // Sin la hora del vuelo no hay cuenta: lo que dice el motor, tal cual.
  const sinHora = !hora
  return (
    <div data-tarjeta-hoy-vuelves={tarjeta?.madrugada ? 'madrugada' : 'dia'} data-hoy-vuelves-h14={conPase ? 'con-pase' : 'sin-pase'} className="flex flex-none flex-col gap-3.5 rounded-[26px] p-[18px]" style={{ background: '#1C2230', color: '#FBF3E2', boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(251,243,226,.1)', color: ORO_CLARO }}>
          <Icono nombre="avion" size={22} grosor={1.7} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: ORO_CLARO }}>HOY VUELVES A CASA</span>
          <b data-hoy-vuelves-titulo style={{ font: "400 26px/1.1 'Instrument Serif',serif" }}>{sinHora ? 'Hoy vuelves a casa' : t.titulo}</b>
        </span>
      </div>
      <div className="flex flex-col gap-2.5" style={{ font: "500 14px/1.35 'Geist'" }}>
        {sinHora ? (
          <span data-hoy-vuelves-texto className="flex items-center gap-2.5">
            <Icono nombre="reloj" size={17} grosor={1.8} style={{ color: ORO_CLARO }} />
            {onAnadirVuelo ? 'Añade tu vuelo de vuelta para saber a qué hora salir.' : (tarjeta?.texto ?? 'Aún no sabemos a qué hora sale tu vuelo.')}
          </span>
        ) : (
          t.lineas.map((l, i) => (
            <span key={i} data-hoy-vuelves-linea className="flex items-center gap-2.5">
              <Icono nombre={l.icono} size={17} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
              {l.texto}
            </span>
          ))
        )}
      </div>
      {sinHora && onAnadirVuelo ? (
        <button type="button" onClick={onAnadirVuelo} data-hoy-vuelves="anadir-vuelo" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_ORO}>
          <Icono nombre="anadir" size={17} grosor={1.9} />
          Añadir mi vuelo
        </button>
      ) : conPase ? (
        <button type="button" onClick={onVerComoIr} data-hoy-vuelves="ver-como-ir" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_ORO}>
          <Icono nombre="localizar" size={17} grosor={1.9} />
          {sitio === 'estación' ? 'Cómo llegar a la estación' : sitio === 'puerto' ? 'Cómo llegar al puerto' : 'Cómo llegar al aeropuerto'}
        </button>
      ) : (
        t.lineaPase && (
          <div data-hoy-vuelves-linea-pase className="flex items-center gap-2.5 rounded-[14px] px-3 py-[11px] text-[13px] font-medium leading-[1.35]" style={{ background: 'rgba(251,243,226,.08)' }}>
            <CandadoRedondo diametro={22} datos="vuelves" />
            <span className="flex-1">
              Con el <Marca oscuro>{nombreDelPase(route.destination)}</Marca>, te decimos hasta qué hora tienes el día.
            </span>
          </div>
        )
      )}
    </div>
  )
}
