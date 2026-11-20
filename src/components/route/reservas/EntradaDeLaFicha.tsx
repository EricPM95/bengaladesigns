import { useState } from 'react'
import { enlaceAlPuntoDeEncuentro } from '../../../lib/civitatis'
import { limpiarImportes, precioConNumero } from '../../../lib/importesTexto'
import { precioTiendaEnVista } from '../../../lib/moneda'
import type { StopEntrada } from '../../../lib/types'
import { Icono } from '../../ui/Icono'

/**
 * (V23, Design `App · Explorar y fichas → 06` y `Piezas/Entradas Pestana`) CADA OPCIÓN DE LA PESTAÑA «ENTRADAS»: cerrada, una tarjeta estrecha (foto pequeña a la izquierda; a la derecha nombre, ★ nota y opiniones,
 * dos etiquetas, duración y «desde X €»), una debajo de otra para ver varias de un vistazo. Al tocarla se abre con los detalles (qué incluye y qué no, punto de encuentro con su mapa, cancelación, hasta cuándo
 * se reserva, la hora que recomendamos) y un solo botón [Ver horas y reservar] con su flechita. La foto pequeña va por delante y con un fondo suave del tamaño de la foto (no salta nada); la grande no se pide: solo se usa la pequeña.
 * Sin datos reales de la actividad (API apagada): la tarjeta lleva el nombre, «desde X €» y lo que dicen los datos. Nunca un «€» sin número, nunca «24EUR».
 */

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

export function EntradaDeLaFicha({ entrada, reservarTexto, recomendada, onReservar }: { entrada: StopEntrada; reservarTexto: string; recomendada: { tipo: string; texto: string } | null; /** null = sin botón (no hay página de ese sitio en ninguna tienda): nunca un botón que lleve a otra página. */ onReservar: (() => void) | null }) {
  const [abierta, setAbierta] = useState(false)
  const [cargada, setCargada] = useState(false)
  const c = entrada.civitatis
  const foto = c?.fotos.principal?.url ?? null
  const precio = precioDeLaEntrada(entrada)
  const etiquetas = etiquetasDeLaEntrada(entrada)
  const enlaceMapa = enlaceAlPuntoDeEncuentro(c?.puntoDeEncuentro ?? null)
  const nota = c?.valoracion != null ? c.valoracion.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null
  const filas = [
    c?.cancelacion ? { etiqueta: 'Cancelación', texto: limpiarImportes(c.cancelacion) } : null,
    c?.reservarHasta ? { etiqueta: 'Se reserva', texto: limpiarImportes(c.reservarHasta) } : null,
  ].filter((f): f is { etiqueta: string; texto: string } => f !== null)
  return (
    <div data-entrada-ficha={entrada.nombre} data-abierta={abierta ? '1' : '0'} className="overflow-hidden rounded-[20px] border border-text/[.07] bg-bg-card">
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-entrada-tarjeta className="flex w-full items-stretch gap-3 p-2.5 text-left transition-transform active:scale-[.99]">
        {foto && (
          // El fondo suave ocupa el tamaño de la foto desde el principio: al llegar, no salta nada.
          <span data-entrada-foto className="relative block h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px]" style={{ background: '#E9DFC8' }}>
            <img src={foto} alt="" loading="eager" decoding="async" onLoad={() => setCargada(true)} className="h-full w-full object-cover" style={{ opacity: cargada ? 1 : 0, transition: 'opacity .2s' }} />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="font-display text-[17px] leading-[1.15] text-text">{entrada.nombre}</span>
          {(nota || c?.opiniones != null) && (
            <span className="text-[12.5px] text-text/70" data-nota-entrada>
              {nota && <b className="font-semibold text-text">★ {nota}</b>}
              {c?.opiniones != null && <span>{nota ? ' · ' : ''}{c.opiniones.toLocaleString('de-DE')} opiniones</span>}
            </span>
          )}
          {etiquetas.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {etiquetas.map((e) => (
                <span key={e} className="rounded-full bg-text/[.06] px-2 py-[2px] text-[11.5px] font-medium text-text/75">
                  {e}
                </span>
              ))}
            </span>
          )}
          {(c?.duracion || precio) && (
            <span className="flex items-baseline justify-between gap-2 text-[12.5px] text-text/70">
              <span>{c?.duracion ?? ''}</span>
              {precio && (
                <span data-precio-entrada className="font-display text-[17px] leading-none text-text">
                  {precio}
                </span>
              )}
            </span>
          )}
        </span>
      </button>
      {abierta && (
        <div data-entrada-detalle className="space-y-2.5 border-t border-text/[.07] px-3.5 pb-3.5 pt-3">
          {c ? (
            <>
              {c.incluye.length > 0 && (
                <div className="text-[13px] leading-[1.45] text-text/72">
                  <p className="m-0 font-semibold text-text/85">Incluye</p>
                  <ul className="m-0 list-disc pl-5">
                    {c.incluye.slice(0, 5).map((linea) => (
                      <li key={linea}>{limpiarImportes(linea)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.noIncluye.length > 0 && (
                <div className="text-[13px] leading-[1.45] text-text/72">
                  <p className="m-0 font-semibold text-text/85">No incluye</p>
                  <ul className="m-0 list-disc pl-5">
                    {c.noIncluye.slice(0, 4).map((linea) => (
                      <li key={linea}>{limpiarImportes(linea)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.puntoDeEncuentro?.texto && (
                <p className="m-0 text-[13px] leading-[1.45] text-text/72" data-punto-de-encuentro>
                  <span className="font-semibold text-text/85">Punto de encuentro: </span>
                  {limpiarImportes(c.puntoDeEncuentro.texto)}
                  {enlaceMapa && (
                    <>
                      {' · '}
                      <a href={enlaceMapa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-text underline underline-offset-2">
                        <Icono nombre="mapa" size={13} /> Ver en el mapa <Icono nombre="fuera" size={12} />
                      </a>
                    </>
                  )}
                </p>
              )}
              {filas.map((fila) => (
                <p key={fila.etiqueta} className="m-0 text-[13px] leading-[1.45] text-text/72">
                  <span className="font-semibold text-text/85">{fila.etiqueta}: </span>
                  {fila.texto}
                </p>
              ))}
            </>
          ) : (
            entrada.incluye && <p className="m-0 text-[13px] leading-[1.5] text-text/72">{limpiarImportes(entrada.incluye)}</p>
          )}
          {recomendada && (
            // La hora recomendada es un consejo: no parece un botón (sin relleno de botón ni sombra).
            <div data-hora-recomendada={recomendada.tipo} className={`rounded-xl px-3 py-2 text-[12.5px] leading-[1.4] ${recomendada.tipo === 'hora' ? 'text-accent-green' : 'text-text-soft'}`} style={{ background: recomendada.tipo === 'hora' ? 'rgba(30,110,70,.07)' : 'rgba(28,34,48,.04)' }}>
              {recomendada.tipo === 'hora' && <p className="m-0 mb-0.5 text-[10.5px] font-semibold uppercase tracking-[.12em] opacity-80">La hora que te recomendamos</p>}
              <p className="m-0 font-medium">{recomendada.texto}</p>
            </div>
          )}
          {onReservar && <button type="button" onClick={onReservar} data-ver-horas-y-reservar className="h-11 w-full whitespace-nowrap rounded-full btn-champan text-small font-semibold active:scale-[.97]">
            <span className="inline-flex items-center justify-center gap-1.5">
              {reservarTexto}
              <Icono nombre="fuera" size={15} />
            </span>
          </button>}
        </div>
      )}
    </div>
  )
}
