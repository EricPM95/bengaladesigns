import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria, fetchDestinationPlaces, porQueRecomendamosDe } from '../../../../lib/destinationPlacesApi'
import { fetchPlaceDetail, fichaEnMemoria, type PlaceDetail } from '../../../../lib/placeDetailApi'
import { displayStopName, formatDuration } from '../../../../lib/format'
import type { MasVisita } from '../../../../lib/masVisitas'
import { Icono } from '../../../ui/Icono'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { ParadaFoto } from './ParadaFoto'

const OJO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(28,34,48,.55)' }

/** La hoja de abajo de HOY v2 (diseño: esquinas de 28, tirador, fondo oscuro suave). Va en el body, por encima de la cabecera y de la barra. */
export function HojaV2({ children, onCerrar, etiqueta, ancha = false }: { children: ReactNode; onCerrar: () => void; etiqueta: string; ancha?: boolean }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={etiqueta}>
      <div className="absolute inset-0" style={{ background: 'rgba(28,34,48,.4)' }} onClick={onCerrar} />
      <div className={`relative flex max-h-[88dvh] w-full flex-col gap-3.5 overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] px-[18px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 md:rounded-[28px] ${ancha ? 'md:w-[520px]' : 'md:w-[440px]'}`} style={{ boxShadow: '0 -10px 30px -12px rgba(0,0,0,.4)', scrollbarWidth: 'none' }}>
        <span className="h-1 w-[42px] flex-none self-center rounded bg-[rgba(28,34,48,.18)]" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Cruz({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Cerrar" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#F1EADC] text-[#1C2230]">
      <Icono nombre="cerrar" size={15} grosor={2} />
    </button>
  )
}

/** Pantalla 7: «¿Qué hacemos con esta parada?». Con la entrada reservada, antes se avisa; sin poder moverla (reservada o sin otros días), solo [No me da tiempo]. */
export function HojaQueHacemos({ nombre, horaReservada, dias, ahora, onSaltar, onMover, onCerrar }: { nombre: string; horaReservada: string | null; dias: { id: string; dayNumber: number; city: string }[]; ahora: number; onSaltar: () => void; onMover: (dayId: string) => void; onCerrar: () => void }) {
  const [paso, setPaso] = useState<'a' | 'b'>('a')
  const puedeMover = !horaReservada && dias.length > 0
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="¿Qué hacemos con esta parada?">
      {paso === 'a' ? (
        <>
          <div className="flex items-start gap-3">
            <span className="flex flex-1 flex-col gap-1">
              <span style={OJO}>¿Qué hacemos con esta parada?</span>
              <span style={{ font: "400 24px/1.1 'Instrument Serif',serif" }}>{nombre}</span>
            </span>
            <Cruz onClick={onCerrar} />
          </div>
          {horaReservada && <p className="text-[13.5px] leading-[1.45] text-[#1C2230]/80">Tienes la entrada reservada a las {horaReservada}.</p>}
          <div className="grid gap-2" style={{ gridTemplateColumns: puedeMover ? '1fr 1.4fr' : '1fr' }}>
            <button type="button" onClick={onSaltar} className="h-12 rounded-full border border-[rgba(28,34,48,.18)] bg-white text-[13.5px] font-semibold text-[#1C2230]">
              {horaReservada ? 'Saltar igual' : 'No me da tiempo'}
            </button>
            {puedeMover && (
              <button type="button" onClick={() => setPaso('b')} className="flex h-12 items-center justify-center gap-[7px] rounded-full bg-[#1C2230] text-[13.5px] font-semibold text-[#FFFDF8]">
                <Icono nombre="dias" size={15} />
                Pasarla a otro día
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <ListaDeDias dias={dias} ahora={ahora} onElegir={onMover} />
          </div>
          <Cruz onClick={onCerrar} />
        </div>
      )}
    </HojaV2>
  )
}

/** Pantalla 8: «Más para tu día» (solo en días recortados). Cada fila: la foto, el nombre, cuánto dura y [Añadir]; al añadir, «✓ Añadida» (el aviso con [Deshacer] de la app sale aparte). */
export function HojaMasParaTuDia({ visitas, anadidas, onAnadir, onCerrar }: { visitas: MasVisita[]; anadidas: Set<string>; onAnadir: (visita: MasVisita) => void; onCerrar: () => void }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Más para tu día">
      <div className="flex items-start gap-3">
        <span className="flex flex-1 flex-col gap-1.5">
          <span style={{ font: "400 28px/1 'Instrument Serif',serif" }}>
            Más para <em style={{ color: 'rgb(var(--accent))' }}>tu día</em>
          </span>
          <span className="text-[13px] leading-[1.5] text-[#1C2230]/70">Estas visitas son de la ruta completa de hoy. Si vas bien, añade las que quieras.</span>
        </span>
        <Cruz onClick={onCerrar} />
      </div>
      <div data-hoja-mas-visitas className="flex flex-col gap-3.5">
        {visitas.map((v) => {
          const hecha = anadidas.has(v.stop.id)
          return (
            <div key={v.stop.id} data-mas-visita={v.stop.name} className="flex min-h-[72px] items-center gap-3 rounded-[18px] p-2" style={{ background: hecha ? 'oklch(0.96 0.035 150)' : '#FFFFFF', border: `1px solid ${hecha ? 'oklch(0.55 0.11 150 / .3)' : 'rgba(28,34,48,.08)'}` }}>
              <ParadaFoto nombre={v.stop.name} photoUrl={v.stop.photoUrl} vista marca={false} size={56} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span style={{ font: "400 18px/1.1 'Instrument Serif',serif" }}>{displayStopName(v.stop.name)}</span>
                {v.stop.durationMinutes > 0 && <span className="text-[11.5px] font-medium text-[#1C2230]/60">{formatDuration(v.stop.durationMinutes)}</span>}
              </span>
              {hecha ? (
                <span className="pr-1 text-[12px] font-semibold" style={{ color: 'oklch(0.4 0.1 150)' }}>
                  ✓ Añadida
                </span>
              ) : (
                <button type="button" onClick={() => onAnadir(v)} className="flex h-11 flex-none items-center gap-1.5 rounded-full bg-[#1C2230] pl-3 pr-3.5 text-[12.5px] font-semibold text-[#FFFDF8]">
                  <Icono nombre="anadir" size={12} grosor={2.4} />
                  Añadir
                </button>
              )}
            </div>
          )
        })}
      </div>
    </HojaV2>
  )
}

/** Lo que cuenta «Sobre este lugar»: la descripción, qué vas a ver y NUESTRO «Por qué te lo recomendamos» (campo `por_que_recomendamos`). */
export function useSobreEsteLugar(destino: string, parada: Stop | null) {
  const nombre = parada?.name ?? ''
  const [ficha, setFicha] = useState<PlaceDetail | null>(() => (nombre ? fichaEnMemoria(destino, nombre) : null))
  const [porQue, setPorQue] = useState<string | null>(() => (nombre ? porQueRecomendamosDe(catalogoEnMemoria(destino), nombre) : null))
  useEffect(() => {
    if (!nombre) return undefined
    let vivo = true
    setFicha(fichaEnMemoria(destino, nombre))
    void fetchPlaceDetail(destino, nombre).then((d) => vivo && setFicha(d))
    void fetchDestinationPlaces(destino).then((c) => vivo && setPorQue(porQueRecomendamosDe(c, nombre)))
    return () => {
      vivo = false
    }
  }, [destino, nombre])
  const secciones: { k: string; t?: string; l?: string[] }[] = []
  const descripcion = ficha?.description || parada?.description || ''
  if (descripcion) secciones.push({ k: 'Qué es', t: descripcion })
  if (ficha?.what_to_see?.length) secciones.push({ k: 'Qué vas a ver', l: ficha.what_to_see })
  if (porQue) secciones.push({ k: 'Por qué te lo recomendamos', t: porQue })
  return secciones
}

/** Pantalla 11: «Sobre este lugar». Solo texto: sin Cómo llegar, sin etiquetas y sin botones. */
export function HojaSobreEsteLugar({ route, parada, onCerrar }: { route: Route; parada: Stop; onCerrar: () => void }) {
  const secciones = useSobreEsteLugar(route.destination, parada)
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Sobre este lugar" ancha>
      <div className="flex items-start gap-3">
        <span className="flex flex-1 flex-col gap-1.5">
          <span style={{ ...OJO, letterSpacing: '.16em' }}>Sobre este lugar</span>
          <span style={{ font: "400 32px/1.02 'Instrument Serif',serif", textWrap: 'balance' as never }}>{displayStopName(parada.name)}</span>
        </span>
        <Cruz onClick={onCerrar} />
      </div>
      {secciones.length === 0 && <p className="text-[14px] leading-[1.5] text-[#1C2230]/65">De este sitio todavía no tenemos más que contarte.</p>}
      {secciones.map((s) => (
        <div key={s.k} className="flex flex-col gap-[7px] border-t border-[rgba(28,34,48,.08)] pt-4">
          <span style={{ font: "italic 400 20px/1.1 'Instrument Serif',serif", color: 'rgb(var(--accent-hover))' }}>{s.k}</span>
          {s.t && (
            <p className="m-0 text-[15px] leading-[1.62] text-[#1C2230]/85" style={{ textWrap: 'pretty' as never }}>
              {s.t}
            </p>
          )}
          {s.l?.map((punto) => (
            <p key={punto} className="m-0 text-[15px] leading-[1.62] text-[#1C2230]/85" style={{ textWrap: 'pretty' as never }}>
              {punto}
            </p>
          ))}
        </div>
      ))}
    </HojaV2>
  )
}

/** P10: la pregunta de las 12:00 del día de prueba (la pide el servidor). */
export function HojaPregunta({ texto, onResponder }: { texto: string; onResponder: (r: 'hoy' | 'manana') => void }) {
  const corte = texto.indexOf('. ')
  const corta = corte >= 0 ? texto.slice(0, corte + 1) : texto
  const resto = corte >= 0 ? texto.slice(corte + 2) : ''
  return (
    <HojaV2 onCerrar={() => undefined} etiqueta="Tu día de prueba">
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'oklch(0.5 0.12 65)' }}>Tu día de prueba</span>
      <span style={{ font: "400 32px/1.02 'Instrument Serif',serif" }}>{corta}</span>
      {resto && <span className="text-[15px] leading-[1.5] text-[#1C2230]/75">{resto}</span>}
      <button type="button" onClick={() => onResponder('hoy')} className="h-[54px] rounded-full text-[15px] font-bold text-[#17120a]" style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', boxShadow: '0 12px 24px -12px oklch(0.75 0.13 70)' }}>
        Hoy
      </button>
      <button type="button" onClick={() => onResponder('manana')} className="h-[46px] rounded-full border border-[rgba(28,34,48,.25)] text-[13.5px] font-semibold text-[#1C2230]">
        Mañana
      </button>
    </HojaV2>
  )
}
