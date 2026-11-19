import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion } from '../../../lib/types'
import { precioTiendaEnVista } from '../../../lib/moneda'
import { useRouteStore } from '../../../store/useRouteStore'
import { removeReservationWithUndo } from '../../../store/useAddFlowStore'
import { addDaysToIso, formatWeekdayAbbrEs } from '../../../lib/dateRange'
import { AddReservationSheet, type ReservationTarget } from '../reservas/AddReservationSheet'
import { RemoveReservationDialog, useExcursionReservation } from '../reservas/ReservedMarks'
import { Icono } from '../../ui/Icono'
import { useExcursionesCompletas } from '../../../lib/excursionesDatos'
import { etiquetasDeExcursion, textoDeRutaPorDestino } from '../../../lib/excursionEtiquetas'

/**
 * (V18, Design «Excursion Bloque» E1 a E4) EL BLOQUE DE LA EXCURSIÓN en DÍAS, rehecho:
 *   E1 sin reservar (foto, «desde», nota y opiniones, cancelación y etiquetas; [Ver disponibilidad] y «¿Ya la has reservado? Añade tu confirmación»),
 *   E2 reservada («✓ Reservada · mié 11» y «Salida a las 08:15» con el código y [Cambiar]),
 *   E3 «¿Qué hacemos con este día?» y E4 la hoja «Más excursiones» con [Elegir esta].
 * Los datos son los de verdad de cada excursión (los datos del destino o la API): foto del operador, el «desde» real, la nota y las opiniones. Lo que no se sabe, no sale: nada de «Con guía» si la ficha no lo dice.
 */

const precio = (e: Excursion): string => e.priceLabel ?? (e.price > 0 ? precioTiendaEnVista(e.price) : '')
const nota = (e: Excursion): string | null => (e.rating ? e.rating.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null)
const opiniones = (e: Excursion): string | null => (e.reviewCount ? `${String(e.reviewCount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} opiniones` : null)
const fotoDe = (e: Excursion): string | null => e.photoUrlBig || e.photoUrl || null
const DEGRADADO = 'linear-gradient(120deg,#6FC0D8 0%,#2E86B0 55%,#1C5A84 100%)'

function Estrella({ t = 13 }: { t?: number }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="#C9942E" aria-hidden="true">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  )
}

/** «La Graciosa» → «La <em>Graciosa</em>»: la última palabra en cursiva dorada, como el diseño. */
function TituloConEnfasis({ texto }: { texto: string }): ReactNode {
  const limpio = texto.replace(/\s*\(excursión\)\s*$/i, '').trim()
  const i = limpio.lastIndexOf(' ')
  if (i < 0) return <em style={{ color: '#8E6820' }}>{limpio}</em>
  return (
    <>
      {limpio.slice(0, i + 1)}
      <em style={{ color: '#8E6820' }}>{limpio.slice(i + 1)}</em>
    </>
  )
}

/** «mié 11», el día de ESTE bloque. */
function diaDelBloque(dayNumber: number | null): string | null {
  const route = useRouteStore.getState().route
  const inicio = route?.answers.dateRange?.start
  if (!inicio || dayNumber == null) return null
  const fecha = addDaysToIso(inicio, dayNumber - 1)
  return `${formatWeekdayAbbrEs(fecha).toLowerCase().replace('.', '')} ${Number(fecha.slice(8, 10))}`
}

export function TarjetaDeExcursion({ excursion, dayNumber, reservada }: { excursion: Excursion; dayNumber: number | null; reservada: boolean }): ReactNode {
  const route = useRouteStore((s) => s.route)
  const reserva = useExcursionReservation(excursion.id)
  const [anadiendo, setAnadiendo] = useState(false)
  const [quitando, setQuitando] = useState(false)
  const foto = fotoDe(excursion)
  const etiquetas = etiquetasDeExcursion(excursion)
  const gratis = excursion.cancellation === 'gratuita'
  const dia = diaDelBloque(dayNumber)
  const n = nota(excursion)
  const o = opiniones(excursion)
  const desde = precio(excursion)
  const objetivo: ReservationTarget | null = route
    ? { kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursion, currentDayId: route.days.find((d) => d.selectedExcursionId === excursion.id)?.id ?? route.days.find((d) => d.dayNumber === dayNumber)?.id ?? null, existing: reserva }
    : null
  return (
    <div data-excursion-tarjeta={reservada ? 'reservada' : 'sin-reservar'} style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(181,138,46,.28)', boxShadow: '0 14px 28px -22px rgba(110,80,24,.55)' }}>
      <div style={{ position: 'relative', height: 132, overflow: 'hidden' }}>
        <div data-excursion-foto={foto ? 'operador' : 'degradado'} style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 0,100% 0,100% 100%,0 82%)', background: foto ? `url("${foto}") center/cover, ${DEGRADADO}` : DEGRADADO }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 0,100% 0,100% 100%,0 82%)', background: 'linear-gradient(180deg,rgba(20,30,50,.3),rgba(20,30,50,0) 45%,rgba(20,30,50,.3))' }} />
        <span style={{ position: 'absolute', left: 12, top: 12, height: 26, padding: '0 11px', borderRadius: 999, background: 'rgba(255,253,248,.94)', display: 'flex', alignItems: 'center', gap: 6, font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l2 3h14l2-3M5 17l1-6h12l1 6M12 11V4l5 3-5 2" /></svg>
          EXCURSIÓN
        </span>
        {desde && (
          <span data-excursion-precio style={{ position: 'absolute', right: 12, top: 12, padding: '6px 11px', borderRadius: 13, background: '#1C2230', color: '#FFFDF8', display: 'flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
            <span style={{ font: "500 9px 'Geist Mono',monospace", letterSpacing: '.1em', opacity: 0.7 }}>DESDE</span>
            <span style={{ font: "400 22px/1 'Instrument Serif',serif" }}>{desde}</span>
          </span>
        )}
        {reservada && (
          <span data-excursion-reservada style={{ position: 'absolute', left: 12, bottom: 20, height: 26, padding: '0 11px', borderRadius: 999, background: 'oklch(0.5 0.1 150)', color: '#fff', display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'" }}>
            ✓ Reservada{dia ? ` · ${dia}` : ''}
          </span>
        )}
      </div>
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span data-excursion-titulo style={{ font: "400 27px/1.02 'Instrument Serif',serif", letterSpacing: '-.01em' }}>
            <TituloConEnfasis texto={excursion.title} />
          </span>
          {(n || gratis || excursion.priceOrientativo) && (
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5, font: "500 13px 'Geist'", color: 'rgba(28,34,48,.65)' }}>
              {n && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                  <span data-excursion-nota style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1C2230', fontWeight: 700 }}>
                    <Estrella />
                    {n}
                  </span>
                  {o && <span data-excursion-opiniones>{o}</span>}
                </span>
              )}
              {gratis && (
                <span data-excursion-cancelacion style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'oklch(0.45 0.1 150)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  Cancelación gratuita
                </span>
              )}
              {desde && excursion.priceOrientativo && <span style={{ fontSize: 11.5, color: 'rgba(28,34,48,.5)' }}>Precio orientativo</span>}
            </span>
          )}
          {etiquetas.length > 0 && (
            <div data-excursion-etiquetas style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
              {etiquetas.map((c) => (
                <span key={c.id} data-etiqueta={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px 0 6px', borderRadius: 999, background: '#FBF3E2', font: "600 12px 'Geist'" }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F3E3B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ display: 'flex', color: '#6E5018' }}><Icono nombre={c.icono} size={11} /></span>
                  </span>
                  {c.texto}
                </span>
              ))}
            </div>
          )}
        </div>
        {reserva ? (
          <div data-excursion-salida style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16, background: 'oklch(0.96 0.03 150)', border: '1px solid oklch(0.5 0.1 150 / .3)' }}>
            <span style={{ flex: 'none', width: 32, height: 32, borderRadius: '50%', background: 'oklch(0.5 0.1 150)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ font: "700 14px 'Geist'" }}>{reserva.time ? `Salida a las ${reserva.time}` : 'Reservada'}</span>
              {reserva.locator && <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{reserva.locator}</span>}
            </span>
            <button type="button" data-excursion-cambiar onClick={() => setAnadiendo(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: "italic 400 16px 'Instrument Serif',serif", textDecoration: 'underline', textUnderlineOffset: 3, color: '#6E5018', minHeight: 44, padding: '0 4px' }}>
              Cambiar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {excursion.bookUrl && (
              <a href={excursion.bookUrl} target="_blank" rel="noopener noreferrer" data-ver-disponibilidad style={{ height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: "700 15.5px 'Geist'", textDecoration: 'none' }}>
                Ver disponibilidad
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </a>
            )}
            <button type="button" data-anadir-confirmacion onClick={() => setAnadiendo(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, font: "italic 400 16px 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)' }}>
              <Icono nombre="reservas" size={14} />
              ¿Ya la has reservado? <u style={{ textUnderlineOffset: 3, color: '#6E5018' }}>Añade tu confirmación</u>
            </button>
          </div>
        )}
        {reserva && (
          <button type="button" onClick={() => setQuitando(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', minHeight: 36, font: "400 12px 'Geist'", color: 'rgba(28,34,48,.5)', textDecoration: 'underline' }}>
            Quitar del viaje
          </button>
        )}
      </div>
      {anadiendo && route && objetivo && <AddReservationSheet route={route} target={objetivo} onClose={() => setAnadiendo(false)} />}
      {quitando && reserva && (
        <RemoveReservationDialog
          name={excursion.title}
          onCancel={() => setQuitando(false)}
          onConfirm={() => {
            removeReservationWithUndo(reserva.id)
            setQuitando(false)
          }}
        />
      )}
    </div>
  )
}

/** E4: la hoja «Más excursiones» con [Elegir esta]. */
export function HojaMasExcursiones({ opciones, dia, onElegir, onCerrar }: { opciones: Excursion[]; dia: string | null; onElegir: (id: string) => void; onCerrar: () => void }): ReactNode {
  return createPortal(
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Más excursiones" data-hoja-mas-excursiones>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.42)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86dvh', overflowY: 'auto', borderRadius: '30px 30px 0 0', background: '#FFFDF8', padding: '10px 16px calc(env(safe-area-inset-bottom,0px) + 22px)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 -20px 40px -20px rgba(28,34,48,.5)' }}>
        <span style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, background: 'rgba(28,34,48,.18)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {dia && <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{dia}</span>}
            <span style={{ font: "400 27px/1.05 'Instrument Serif',serif" }}>Más excursiones</span>
          </span>
          <button type="button" aria-label="Cerrar" onClick={onCerrar} style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#F1EADC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {opciones.map((m) => {
          const foto = fotoDe(m)
          const n = nota(m)
          const o = opiniones(m)
          const p = precio(m)
          const meta = [etiquetasDeExcursion(m).map((x) => x.texto).slice(0, 2).join(' · ')].filter(Boolean)[0]
          return (
            <div key={m.id} data-mas-excursion={m.id} style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.1)', boxShadow: '0 10px 22px -18px rgba(28,34,48,.4)' }}>
              <span style={{ flex: 'none', width: 96, borderRadius: 16, background: foto ? `url("${foto}") center/cover, ${DEGRADADO}` : DEGRADADO }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: "400 21px/1.05 'Instrument Serif',serif" }}>{m.title}</span>
                {n && (
                  <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px 8px', font: "500 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1C2230', fontWeight: 700 }}>
                      <Estrella t={12} />
                      {n}
                    </span>
                    {o && <span>{o}</span>}
                  </span>
                )}
                {meta && <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{meta}</span>}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                  <span style={{ font: "400 20px 'Instrument Serif',serif" }}>{p ? p : ''}</span>
                  <button type="button" data-elegir-esta onClick={() => onElegir(m.id)} style={{ minHeight: 44, padding: '0 14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 13px 'Geist'" }}>
                    Elegir esta
                  </button>
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}

/** El día de excursión entero (E1, E2, E3 y E4): la propuesta, «Ver más excursiones» (con [Elegir esta]) y la salida «¿Qué hacemos con este día?». */
export function ExcursionDayBloque({
  destination,
  options: opcionesDelViaje,
  selectedId,
  socialProof,
  dayNumber,
  onSelect,
  onDecline,
}: {
  destination: string
  options: Excursion[]
  selectedId: string | null
  socialProof?: string | null
  dayNumber: number | null
  onSelect: (id: string | null) => void
  onDecline: (fill: 'route' | 'empty') => void
}): ReactNode {
  // (V27) Un viaje guardado con las excursiones sin su ficha (foto vacía, sin «desde» ni nota) se completa con nuestros datos: nunca el degradado vacío.
  const options = useExcursionesCompletas(opcionesDelViaje)
  const [masAbierto, setMasAbierto] = useState(false)
  const [preguntando, setPreguntando] = useState(false)
  const destacada = options.find((o) => o.id === selectedId) ?? options[0] ?? null
  const reserva = useExcursionReservation(destacada?.id)
  if (!destacada) return null
  const reservada = Boolean(reserva)
  const otras = reservada ? [] : options.filter((o) => o.id !== destacada.id)
  const dia = diaDelBloque(dayNumber)

  if (preguntando && !reservada) {
    return (
      <div data-excursion-que-hacemos style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 2px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
          <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(28,34,48,.5)' }}>SIN EXCURSIÓN</span>
          <span style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
            ¿Qué hacemos con <em style={{ color: '#8E6820' }}>este día</em>?
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" data-ruta-a-medida onClick={() => onDecline('route')} style={{ position: 'relative', height: 168, borderRadius: 22, overflow: 'hidden', border: 'none', cursor: 'pointer', textAlign: 'left', background: '#1C2230', color: '#F3EEE4', boxShadow: '0 16px 26px -16px rgba(28,34,48,.8),inset 0 0 0 1px rgba(243,216,143,.4)' }}>
            <svg viewBox="0 0 160 80" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, width: '100%', height: 80 }} aria-hidden="true">
              <path d="M14 56 C 40 14, 64 62, 92 32 S 138 18, 148 44" fill="none" stroke="#F3D88F" strokeWidth="1.8" strokeDasharray="2 5" strokeLinecap="round" />
              <circle cx="14" cy="56" r="4" fill="#F3D88F" />
              <circle cx="92" cy="32" r="3.2" fill="#F3EEE4" />
              <circle cx="148" cy="44" r="4" fill="#F3D88F" />
            </svg>
            <span style={{ position: 'absolute', left: 12, top: 12, width: 32, height: 32, borderRadius: 11, background: 'linear-gradient(135deg,#F6E8BE,#C9A45A)', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>
            </span>
            <span style={{ position: 'absolute', left: 14, right: 12, bottom: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span data-texto-ruta style={{ font: "400 20px/1.05 'Instrument Serif',serif" }}>{textoDeRutaPorDestino(destination)}</span>
            </span>
          </button>
          <button type="button" data-lo-organizo-yo onClick={() => onDecline('empty')} style={{ position: 'relative', height: 168, borderRadius: 22, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', boxShadow: '0 10px 22px -18px rgba(28,34,48,.4)' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 80, clipPath: 'polygon(0 0,100% 0,100% 100%,0 72%)', background: '#F1EADC' }} />
            <span style={{ position: 'absolute', left: 12, top: 12, width: 32, height: 32, borderRadius: 11, background: '#FBF3E2', color: '#6E5018', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" /></svg>
            </span>
            <span style={{ position: 'absolute', left: 14, right: 12, bottom: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ font: "400 20px/1.05 'Instrument Serif',serif" }}>Lo organizo yo</span>
              <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Añado yo los sitios</span>
            </span>
          </button>
        </div>
        <button type="button" onClick={() => setPreguntando(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, font: "italic 400 17px 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          <u style={{ textUnderlineOffset: 3 }}>Mejor me quedo con la excursión</u>
        </button>
      </div>
    )
  }

  return (
    <div data-excursion-bloque style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {socialProof && (
        <p style={{ margin: 0, borderRadius: 14, background: 'rgb(var(--accent-soft))', padding: '10px 12px', font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-hover))' }}>{socialProof}</p>
      )}
      <TarjetaDeExcursion excursion={destacada} dayNumber={dayNumber} reservada={reservada} />
      {otras.length > 0 && (
        <button type="button" data-ver-mas-excursiones onClick={() => setMasAbierto(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 54, padding: '0 14px 0 16px', borderRadius: 18, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ display: 'flex' }} aria-hidden="true">
            {otras.slice(0, 2).map((o, k) => {
              const foto = fotoDe(o)
              return <span key={o.id} style={{ width: 26, height: 26, marginLeft: k ? -8 : 0, borderRadius: '50%', border: '2px solid #FFFDF8', background: foto ? `url("${foto}") center/cover, ${DEGRADADO}` : k ? 'linear-gradient(135deg,#7AD0C0,#1A7A8A)' : 'linear-gradient(135deg,#E8B070,#B8602A)' }} />
            })}
          </span>
          <span style={{ flex: 1, font: "600 14px 'Geist'" }}>
            Ver más excursiones <span style={{ color: 'rgba(28,34,48,.5)', fontWeight: 500 }}>· {otras.length}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
      {!reservada && (
        <button type="button" data-seguir-en-ciudad onClick={() => setPreguntando(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '4px 0 2px', font: "italic 400 16px/1.3 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)', textAlign: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v10H3zM9 21v-6h6v6" /></svg>
          <u style={{ textUnderlineOffset: 3 }}>¿Prefieres seguir en {destination}? Te montamos otro día de ruta</u>
        </button>
      )}
      {masAbierto && (
        <HojaMasExcursiones
          opciones={otras}
          dia={dia}
          onCerrar={() => setMasAbierto(false)}
          onElegir={(id) => {
            onSelect(id)
            setMasAbierto(false)
          }}
        />
      )}
    </div>
  )
}

/** (V18, Design E5) La línea de estado del día de excursión cerrado: «● Sin reservar» (rojo) o «● Reservada · salida 08:15» (verde). */
export function ExcursionEstadoDelDia({ reserva }: { reserva: { time?: string | null } | null }): ReactNode {
  const color = reserva ? 'oklch(0.45 0.1 150)' : '#B3262E'
  return (
    <span data-estado-excursion={reserva ? 'reservada' : 'sin-reservar'} style={{ display: 'flex', alignItems: 'center', gap: 6, font: "600 11.5px 'Geist'", color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {reserva ? `Reservada${reserva.time ? ` · salida ${reserva.time}` : ''}` : 'Sin reservar'}
    </span>
  )
}
