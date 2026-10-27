import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFotosDePerfil } from '../../hooks/useFotosDePerfil'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useFranjaStore, type ItemDeFranja } from '../../store/useFranjaStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { Avatar } from '../ajustes/Avatar'
import { abrirAviso } from './abrirAviso'

/**
 * LA FRANJA DE AVISO NUEVO (Tanda 10N4 §4b), exactamente como `Piezas/Avisos Franja` de Design (la 11): barra oscura #1C2230 con la moneda dorada delante y dos líneas (lo que ha pasado, en negrita; el detalle,
 * debajo). Una persona: su inicial en la moneda dorada (o su foto). La app: su icono dorado en un círculo oscuro con borde dorado. Varios a la vez: las monedas una encima de otra, «3 avisos nuevos»,
 * los nombres debajo y [Ver] a la derecha. Al tocarla abre lo que sea (como tocar el aviso en la campana) y lo marca leído; deslizada hacia arriba se va antes; se va sola a los pocos segundos.
 * No tapa la barra de arriba del iPhone (la hora y la batería): baja lo que mida la zona segura.
 */
const MS_VISIBLE = 4600
const MS_SALIDA = 240

const TRAZO_ICONO = { fill: 'none', stroke: '#E9C77A', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
// Los iconos de la app, los de la pieza de Design (el calendario y la «i» van cruzados en la pieza: aquí, el calendario con las fechas especiales y la «i» con la información).
const ICONOS: Record<string, ReactNode> = {
  calendario: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M10 14l4 4M14 14l-4 4" />,
  info: <path d="M12 11v5M12 8v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
  estrella: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  ticket: <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4zM14.5 7v2M14.5 11v2M14.5 15v2" />,
}

function MonedaDelAviso({ item, foto, tam = 44 }: { item: ItemDeFranja; foto: string | null; tam?: number }) {
  if (item.icono === 'persona' && item.quien) {
    const inicial = (item.quien[0] ?? '·').toUpperCase()
    return <Avatar foto={foto} inicial={inicial} tam={tam} fondo="linear-gradient(145deg,#FFF6DC,#E9C77A 60%,#B58A2E)" color="#4A3510" />
  }
  return (
    <span data-franja-icono={item.icono} style={{ width: tam, height: tam, flex: 'none', borderRadius: '50%', background: 'rgba(233,199,122,.16)', border: '1px solid rgba(233,199,122,.5)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" {...TRAZO_ICONO} style={{ flex: 'none' }}>
        {ICONOS[item.icono] ?? ICONOS.info}
      </svg>
    </span>
  )
}

/** «Eric, Ana y Laura» (sin repetir); sin nombres (avisos de la app), el primer título y cuántos más. */
export function nombresDeLosAvisos(items: ItemDeFranja[]): string {
  const nombres = [...new Set(items.map((i) => i.quien).filter((n): n is string => Boolean(n)))]
  if (nombres.length === 0) return items.length > 1 ? `${items[0].titulo} y ${items.length - 1} más` : (items[0]?.titulo ?? '')
  if (nombres.length === 1) return nombres[0]
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** Lo que pasa al tocar la franja: un aviso, lo que abre ese aviso en la campana (y queda leído); varios, la campana. */
export async function tocarFranja(items: ItemDeFranja[]) {
  const avisos = useAvisosStore.getState()
  if (items.length !== 1) {
    avisos.abrir()
    return
  }
  const aviso = items[0].aviso
  if (!aviso) return
  // Los que llevan botones dentro (un gasto por decidir, una entrada del dueño) se abren en la campana, en ese aviso, sin darlos por leídos.
  if (aviso.tipo === 'gasto_pendiente' || aviso.tipo === 'reserva_grupo') {
    avisos.abrir(aviso.id)
    return
  }
  await abrirAviso(aviso)
}

export function FranjaDeAviso() {
  const franja = useFranjaStore((s) => s.franja)
  const cerrar = useFranjaStore((s) => s.cerrar)
  const gente = useViajeCompartido((s) => s.gente)
  const enlacesDeFotos = useFotosDePerfil(gente.map((p) => p.foto))
  const [saliendo, setSaliendo] = useState(false)
  const [arrastre, setArrastre] = useState(0)
  const inicio = useRef<{ y: number; id: number } | null>(null)
  const sale = useRef<number | undefined>(undefined)

  const irse = () => {
    setSaliendo(true)
    window.clearTimeout(sale.current)
    sale.current = window.setTimeout(() => {
      cerrar()
      setSaliendo(false)
      setArrastre(0)
    }, MS_SALIDA)
  }

  // Se va sola. Cada cosa nueva (`n`) reinicia el tiempo.
  const n = franja?.n
  useEffect(() => {
    if (n === undefined) return undefined
    setSaliendo(false)
    setArrastre(0)
    const t = window.setTimeout(irse, MS_VISIBLE)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
  useEffect(() => () => window.clearTimeout(sale.current), [])

  if (!franja) return null
  const items = franja.items
  const varios = items.length > 1
  const fotoDe = (item: ItemDeFranja): string | null => {
    const p = item.aviso?.payload ?? {}
    const id = (p.autor_id ?? p.persona_id ?? p.admin_id ?? p.actor_id ?? p.quien_id) as string | undefined
    const ruta = gente.find((g) => g.id === id)?.foto
    return ruta ? (enlacesDeFotos[ruta] ?? null) : null
  }

  const alSoltar = (y: number) => {
    const dy = y - (inicio.current?.y ?? y)
    inicio.current = null
    if (dy < -28) return irse()
    setArrastre(0)
    if (Math.abs(dy) < 8) {
      // Un toque: abre lo que sea y la franja se va.
      irse()
      void tocarFranja(items)
    }
  }

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      data-franja-aviso={varios ? 'varios' : (items[0]?.aviso?.tipo ?? 'app')}
      data-franja-n={items.length}
      onPointerDown={(e) => {
        inicio.current = { y: e.clientY, id: e.pointerId }
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* sin captura */
        }
      }}
      onPointerMove={(e) => {
        if (inicio.current) setArrastre(Math.min(0, e.clientY - inicio.current.y))
      }}
      onPointerUp={(e) => alSoltar(e.clientY)}
      onPointerCancel={() => {
        inicio.current = null
        setArrastre(0)
      }}
      style={{
        position: 'fixed',
        // Debajo de la hora y la batería del iPhone (en una web normal, 12 px).
        top: 'max(12px, calc(env(safe-area-inset-top) + 4px))',
        left: 14,
        right: 14,
        zIndex: 300,
        margin: '0 auto',
        maxWidth: 420,
        touchAction: 'none',
        cursor: 'pointer',
        transform: saliendo ? 'translateY(-140%)' : `translateY(${arrastre}px)`,
        opacity: saliendo ? 0 : 1,
        transition: inicio.current ? 'none' : `transform ${MS_SALIDA}ms ease, opacity ${MS_SALIDA}ms ease`,
        animation: 'trazoFranjaEntra 300ms cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <style>{'@keyframes trazoFranjaEntra{from{transform:translateY(-140%);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 22, background: '#1C2230', color: '#FBF3E2', boxShadow: '0 18px 30px -14px rgba(14,21,48,.75)', fontFamily: "'Geist',sans-serif" }}>
        {varios ? (
          <span style={{ display: 'flex', flex: 'none', width: 44 + 18 * (Math.min(items.length, 3) - 1), height: 44, position: 'relative' }}>
            {items.slice(0, 3).map((item, i) => (
              <span key={item.id} style={{ position: 'absolute', left: 18 * i, top: 0, width: 44, height: 44, borderRadius: '50%', border: '2px solid #1C2230', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', background: 'linear-gradient(145deg,#FFF6DC,#E9C77A 60%,#B58A2E)' }}>
                <MonedaDelAviso item={item} foto={fotoDe(item)} tam={40} />
              </span>
            ))}
          </span>
        ) : (
          <MonedaDelAviso item={items[0]} foto={fotoDe(items[0])} />
        )}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span data-franja-titulo style={{ font: "600 15px/1.25 'Geist'" }}>
            {varios ? `${items.length} avisos nuevos` : items[0].titulo}
          </span>
          {(varios || items[0].detalle) && (
            <span data-franja-detalle style={{ font: "400 13.5px/1.3 'Geist'", color: 'rgba(251,243,226,.72)' }}>
              {varios ? nombresDeLosAvisos(items) : items[0].detalle}
            </span>
          )}
        </span>
        {varios && <span data-franja-ver style={{ font: "600 12.5px 'Geist'", color: '#E9C77A' }}>Ver</span>}
      </div>
    </div>,
    document.body,
  )
}
