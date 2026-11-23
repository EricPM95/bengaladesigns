import { useState } from 'react'
import { enlaceAlPuntoDeEncuentro } from '../../../lib/civitatis'
import { limpiarImportes, precioConNumero } from '../../../lib/importesTexto'
import { precioTiendaEnVista } from '../../../lib/moneda'
import type { StopEntrada } from '../../../lib/types'

/**
 * (V40D, Design `Entradas Ficha Pestana`; antes V23) CADA OPCIÓN DE LA PESTAÑA «ENTRADAS», como en Design. Cerrada: la foto a la izquierda (esquinas redondas), el título en letra de titular, la ★ dorada con la nota y «· N opiniones»,
 * en la misma fila la etiqueta del idioma («es») y la duración, y a la derecha «desde» pequeño y el precio grande. Abierta, bajo una línea de puntos: «INCLUYE» (dorado, pequeño) con cada cosa con su ✓ verde en un círculo; el punto de encuentro en su cajita
 * (pin y [Ver mapa]); dos cajitas juntas, CANCELACIÓN (en verde con ✓ si es gratis) y SE RESERVA; y [Ver horas y reservar]. Los datos son los de Civitatis tal como vienen (lo que no dan, no sale: nunca un «€» sin número).
 * La foto pequeña va por delante con un fondo suave del tamaño de la foto (no salta nada); la grande no se pide.
 */

const CODIGO_DE_IDIOMA: Record<string, string> = { español: 'es', castellano: 'es', inglés: 'en', ingles: 'en', italiano: 'it', francés: 'fr', frances: 'fr', alemán: 'de', aleman: 'de', portugués: 'pt', portugues: 'pt', es: 'es', en: 'en', it: 'it', fr: 'fr', de: 'de', pt: 'pt' }

/** Las etiquetas de la tarjeta (dos como mucho): lo que de verdad dicen los datos de la actividad. */
export function etiquetasDeLaEntrada(entrada: StopEntrada): string[] {
  const c = entrada.civitatis
  if (!c) return []
  const etiquetas: string[] = []
  if (c.cancelacion && /gratis/i.test(c.cancelacion)) etiquetas.push('Cancelación gratis')
  if (c.incluye.some((linea) => /audio ?gu[ií]a/i.test(linea))) etiquetas.push('Con audioguía')
  if (etiquetas.length < 2 && c.idiomas.length > 0) etiquetas.push(c.idiomas.slice(0, 2).join(' · '))
  return etiquetas.slice(0, 2)
}

/** El texto del precio de la tarjeta: «desde 7 €», «Gratis» o nada (si no hay precio con número, no sale ningún «€»). */
export function precioDeLaEntrada(entrada: StopEntrada): string | null {
  if (entrada.civitatis?.gratis) return 'Gratis'
  const importe = entrada.civitatis?.desde ?? entrada.desde
  if (importe == null) return null
  const texto = precioTiendaEnVista(importe)
  return precioConNumero(texto) ? `desde ${texto}` : null
}

const MONO = "600 10px 'Geist Mono',monospace"

export function EntradaDeLaFicha({ entrada, reservarTexto, recomendada, onReservar }: { entrada: StopEntrada; reservarTexto: string; recomendada: { tipo: string; texto: string } | null; /** null = sin botón (no hay página de ese sitio en ninguna tienda): nunca un botón que lleve a otra página. */ onReservar: (() => void) | null }) {
  const [abierta, setAbierta] = useState(false)
  const [cargada, setCargada] = useState(false)
  const c = entrada.civitatis
  const foto = c?.fotos.principal?.url ?? null
  const precio = precioDeLaEntrada(entrada)
  const enlaceMapa = enlaceAlPuntoDeEncuentro(c?.puntoDeEncuentro ?? null)
  const nota = c?.valoracion != null ? c.valoracion.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null
  const filas = [
    c?.cancelacion ? { etiqueta: 'Cancelación', texto: limpiarImportes(c.cancelacion) } : null,
    c?.reservarHasta ? { etiqueta: 'Se reserva', texto: limpiarImportes(c.reservarHasta) } : null,
  ].filter((f): f is { etiqueta: string; texto: string } => f !== null)
  const codigos = (c?.idiomas ?? []).map((n) => CODIGO_DE_IDIOMA[n.trim().toLowerCase()] ?? null).filter((x): x is string => x !== null).slice(0, 2)
  const precioGrande = precio ? precio.replace(/^desde /, '') : null
  const conDesde = Boolean(precio && precio.startsWith('desde '))
  const cancelacionGratis = c?.cancelacion ? /gratis/i.test(c.cancelacion) : false
  return (
    <div data-entrada-ficha={entrada.nombre} data-abierta={abierta ? '1' : '0'} style={{ borderRadius: 24, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 10px 22px -18px rgba(28,34,48,.45)', overflow: 'hidden' }}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-entrada-tarjeta style={{ display: 'flex', width: '100%', gap: 14, padding: 14, textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>
        {foto && (
          // El fondo suave ocupa el tamaño de la foto desde el principio: al llegar, no salta nada.
          <span data-entrada-foto style={{ position: 'relative', display: 'block', flex: 'none', width: 92, height: 92, borderRadius: 18, overflow: 'hidden', background: '#E9DFC8', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3)' }}>
            <img src={foto} alt="" loading="eager" decoding="async" onLoad={() => setCargada(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: cargada ? 1 : 0, transition: 'opacity .2s' }} />
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: "400 20px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never, color: '#1C2230' }}>{entrada.nombre}</span>
          {(nota || c?.opiniones != null) && (
            <span data-nota-entrada style={{ display: 'flex', alignItems: 'center', gap: 6, font: "500 13px 'Geist'", color: 'rgba(28,34,48,.62)' }}>
              {nota && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#C99A44" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                </svg>
              )}
              {nota && <b style={{ fontSize: 15, color: '#1C2230' }}>{nota}</b>}
              {c?.opiniones != null && <span>{nota ? '· ' : ''}{c.opiniones.toLocaleString('de-DE')} opiniones</span>}
            </span>
          )}
          {(codigos.length > 0 || c?.duracion || precio) && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {codigos.length > 0 && (
                  <span data-idioma-entrada style={{ height: 24, padding: '0 10px', borderRadius: 999, background: '#F1EADC', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                    {codigos.join(' · ')}
                  </span>
                )}
                {c?.duracion && <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{c.duracion}</span>}
              </span>
              {precioGrande && (
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {conDesde && <span style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>desde</span>}
                  <span data-precio-entrada style={{ font: "400 24px/1 'Instrument Serif',serif", color: '#1C2230' }}>{precioGrande}</span>
                </span>
              )}
            </span>
          )}
        </span>
      </button>
      {abierta && (
        <>
          <div style={{ margin: '0 14px', borderTop: '1px dashed rgba(28,34,48,.18)' }} />
          <div data-entrada-detalle style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {c ? (
              <>
                {c.incluye.length > 0 && (
                  <div data-incluye style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ font: MONO, letterSpacing: '.14em', color: '#8A6A2C' }}>INCLUYE</span>
                    {c.incluye.slice(0, 5).map((linea) => (
                      <span key={linea} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: "400 14px/1.4 'Geist'", color: '#1C2230' }}>
                        <span style={{ flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#DCEBDD', color: '#2F6B43', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          </svg>
                        </span>
                        {limpiarImportes(linea)}
                      </span>
                    ))}
                  </div>
                )}
                {c.puntoDeEncuentro?.texto && (
                  <div data-punto-de-encuentro style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: '#F7F1E4' }}>
                    <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 12, background: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A6A2C' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                      </svg>
                    </span>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ font: MONO, letterSpacing: '.14em', color: 'rgba(28,34,48,.5)' }}>PUNTO DE ENCUENTRO</span>
                      <span style={{ font: "500 13.5px/1.3 'Geist'", color: '#1C2230' }}>{limpiarImportes(c.puntoDeEncuentro.texto)}</span>
                    </span>
                    {enlaceMapa && (
                      <a href={enlaceMapa} target="_blank" rel="noopener noreferrer" data-ver-mapa style={{ flex: 'none', height: 32, padding: '0 12px', borderRadius: 999, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.5)', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'", color: '#7A5A1E', textDecoration: 'none' }}>
                        Ver mapa
                      </a>
                    )}
                  </div>
                )}
                {filas.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: filas.length > 1 ? '1fr 1fr' : '1fr', gap: 10 }}>
                    {filas.map((fila) => {
                      const verde = fila.etiqueta === 'Cancelación' && cancelacionGratis
                      return (
                        <div key={fila.etiqueta} data-caja-entrada={fila.etiqueta} style={{ padding: 12, borderRadius: 16, background: '#F7F1E4', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ font: MONO, letterSpacing: '.14em', color: 'rgba(28,34,48,.5)' }}>{fila.etiqueta.toUpperCase()}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: "600 13.5px/1.25 'Geist'", color: verde ? '#2F6B43' : '#1C2230' }}>
                            {verde && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </svg>
                            )}
                            {fila.texto}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              entrada.incluye && <p style={{ margin: 0, font: "400 13px/1.5 'Geist'", color: 'rgba(28,34,48,.72)' }}>{limpiarImportes(entrada.incluye)}</p>
            )}
            {recomendada && (
              // La hora recomendada es un consejo: no parece un botón (sin relleno de botón ni sombra).
              <div data-hora-recomendada={recomendada.tipo} className={`rounded-xl px-3 py-2 text-[12.5px] leading-[1.4] ${recomendada.tipo === 'hora' ? 'text-accent-green' : 'text-text-soft'}`} style={{ background: recomendada.tipo === 'hora' ? 'rgba(30,110,70,.07)' : 'rgba(28,34,48,.04)' }}>
                {recomendada.tipo === 'hora' && <p className="m-0 mb-0.5 text-[10.5px] font-semibold uppercase tracking-[.12em] opacity-80">La hora que te recomendamos</p>}
                <p className="m-0 font-medium">{recomendada.texto}</p>
              </div>
            )}
            {onReservar && (
              <button type="button" onClick={onReservar} data-ver-horas-y-reservar style={{ height: 54, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: "700 15.5px 'Geist'", cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {reservarTexto}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
