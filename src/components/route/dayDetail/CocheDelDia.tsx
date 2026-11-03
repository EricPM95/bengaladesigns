import type { AeropuertoDelDia, CenaCerca, DayPlan, TrayectoCoche } from '../../../lib/types'
import { Icono } from '../../ui/Icono'

/**
 * (LZ2a) Lo que el motor de coche pinta en un día de Lanzarote (contrato: `docs/dias/_estado_lz2a_contrato.md`): cada trayecto «En coche · 25 min · 18 km» con [Abrir en Maps],
 * la salida de casa y la vuelta, el aviso de más de 3 h, la cena cerca del alojamiento, los opcionales quitados y el «¿Sin coche?».
 */

const km1 = (km: number) => `${Math.round(km)} km`
const min1 = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`)

/** Un trayecto en coche en una fila: icono de coche, el texto del motor y [Abrir en Maps] (a la coordenada de la parada, su aparcamiento). */
export function FilaCoche({ texto, aparcar, mapsUrl, llegada }: { texto: string; aparcar?: number; mapsUrl?: string; llegada?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5 py-1 text-text/60" data-trayecto-coche>
      <span className="flex items-center gap-1.5">
        <Icono nombre="coche" className="h-[15px] w-[15px] shrink-0" />
        <span className="font-mono text-[12px] font-medium">{texto}</span>
      </span>
      {(aparcar || mapsUrl) && (
        <span className="flex items-center gap-2 pl-[21px] text-[12px]">
          {aparcar ? <span>+{aparcar} min para aparcar</span> : null}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="zona-toque text-[12.5px] font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover">
              Abrir en Maps
            </a>
          )}
        </span>
      )}
      {llegada && <span className="pl-[21px] text-[12px] leading-[1.35] text-text/60">{llegada}</span>}
    </span>
  )
}

/** La vuelta a casa como un trayecto más (para el hueco del final del día). Null si el día no la trae. */
export function trayectoDeVuelta(day: DayPlan): TrayectoCoche | null {
  const v = day.coche?.activo ? day.coche.vuelta : null
  if (!v || !v.maps_url) return null
  return { modo: 'car', minutos: v.minutos, km: v.km, texto: `Vuelta a casa · ${min1(v.minutos)} · ${km1(v.km)}`, maps_url: v.maps_url, ...(v.llegas ? { llegada_texto: `Llegas hacia las ${v.llegas} (hora de Canarias)` } : {}) }
}

/** La cabecera del día en coche: salir de casa, el aviso de más de 3 h, la excursión «¿Sin coche?» y lo que se quitó para que el día quepa. */
export function CabeceraDelDiaCoche({ day }: { day: DayPlan }) {
  const coche = day.coche
  const ida = coche?.activo ? coche.ida : null
  const sin = day.sinCoche
  const sinCoche = coche ? !coche.activo : false
  const quitados = day.opcionalesQuitados ?? []
  if (!coche && !sin && quitados.length === 0) return null
  return (
    <div className="flex flex-col gap-2 px-1" data-coche-cabecera>
      {ida && (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-text/80">{coche?.salir_texto ?? (ida.salir ? `Sal de casa a las ${ida.salir}` : '')}</span>
          <FilaCoche texto={`En coche · ${min1(ida.minutos)} · ${km1(ida.km)}`} aparcar={ida.aparcar_min} mapsUrl={ida.maps_url} />
        </div>
      )}
      {coche?.aviso_tope && <p className="text-[12.5px] leading-[1.4] text-text/65" data-aviso-tope>{coche.aviso_tope.texto}</p>}
      {sin && (
        <div className="rounded-xl border border-text/10 bg-bg-card/70 p-3" data-sin-coche>
          <p className="text-[13px] font-medium text-text/85">{sinCoche ? '¿Sin coche? Así lo haces' : '¿Sin coche?'}</p>
          <p className="mt-0.5 text-[12.5px] leading-[1.4] text-text/70">{sin.excursion}</p>
          {sin.deja_fuera && <p className="mt-0.5 text-[12.5px] leading-[1.4] text-text/55">{sin.deja_fuera}</p>}
          {sin.civitatis?.url && (
            <a href={sin.civitatis.url} target="_blank" rel="noopener noreferrer" className="zona-toque mt-1 inline-block text-[12.5px] font-medium text-accent underline underline-offset-[3px]">
              Ver la excursión
            </a>
          )}
        </div>
      )}
      {quitados.length > 0 && (
        <div className="text-[12.5px] leading-[1.4] text-text/60" data-opcionales-quitados>
          {quitados.map((q) => (
            <p key={q.name}>
              <span className="font-medium">{q.name}</span>: {q.texto ?? 'Lo quitamos para que el día quepa.'} Puedes añadirlo desde EXPLORAR (posiblemente ya esté cerrado).
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** «Cena cerca de tu alojamiento»: con pase, con 2-3 restaurantes de tu zona; sin pase, solo el aviso. */
export function CenaCercaBloque({ cena }: { cena: CenaCerca }) {
  return (
    <div className="rounded-xl border border-text/10 bg-bg-card/70 p-3" data-cena-cerca>
      <p className="text-[13px] font-medium text-text/85">{cena.titulo}</p>
      {cena.texto && <p className="mt-0.5 text-[12.5px] leading-[1.4] text-text/65">{cena.zona?.nombre ? cena.texto.replace(cena.zona.nombre, cena.zona.nombre.split(' (')[0]) : cena.texto}</p>}
      {(cena.restaurantes ?? []).length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {cena.restaurantes!.map((r) => (
            <li key={r.name} className="text-[12.5px] leading-[1.35] text-text/75">
              <span className="font-medium">{r.name}</span>
              {r.direccion ? ` · ${r.direccion}` : ''}
              {typeof r.lat === 'number' && typeof r.lng === 'number' && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" className="zona-toque ml-1 text-accent underline underline-offset-[3px]">
                  Mapa
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** (LZ2a) «Hoy vuelves a casa» en coche: del alojamiento (la zona del viajero) al aeropuerto, con la hora de Canarias. */
export function VueltaEnCoche({ aeropuerto, zona, horaVuelo }: { aeropuerto: AeropuertoDelDia; zona?: string | null; horaVuelo?: string | null }) {
  const t = aeropuerto.zona_a_aeropuerto
  if (!t) return null
  return (
    <div className="mt-2 rounded-xl border border-text/10 bg-bg-card/70 p-3" data-vuelta-en-coche>
      <p className="text-[13px] font-medium text-text/85">{zona ? `De ${zona} al aeropuerto` : 'Al aeropuerto'}</p>
      <div className="mt-1">
        <FilaCoche texto={`En coche · ${min1(t.minutos)} · ${km1(t.km)}`} mapsUrl={t.maps_url} />
      </div>
      <p className="mt-1 text-[12.5px] leading-[1.4] text-text/60">
        Llena el depósito y devuelve el coche en la T1.{horaVuelo ? ` Tu vuelo sale a las ${horaVuelo}, hora de Canarias.` : ' Todas las horas son de Canarias.'}
      </p>
    </div>
  )
}
