import { createPortal } from 'react-dom'
import type { NombreIcono } from '../../lib/iconos'
import { useNoticesStore } from '../../store/useNoticesStore'
import type { AppNotice } from '../../hooks/useAppNotices'
import { Icono } from '../ui/Icono'

const KIND_STYLE: Record<AppNotice['kind'], { label: string; color: string; icon: NombreIcono }> = {
  error: { label: 'Error', color: 'rgb(var(--accent-red))', icon: 'error' },
  warning: { label: 'Aviso', color: 'rgb(var(--accent-gold))', icon: 'alerta' },
  info: { label: 'Información', color: 'oklch(0.56 0.1 220)', icon: 'info' },
  friend: { label: 'Amigos', color: 'oklch(0.55 0.12 295)', icon: 'compartido' },
}

/**
 * La lista de avisos (la campana de la cabecera): sube desde abajo, con el mismo estilo que «+ Añadir día».
 * Cada aviso lleva su tipo, su texto y, si tiene arreglo, su botón. Los de tipo información y amigos se marcan como leídos (y dejan de contar);
 * los errores y los avisos del viaje no: cuentan hasta que se arreglan.
 */
export function NoticesSheet({ items, onAction, onClose }: { items: AppNotice[]; onAction: (action: NonNullable<AppNotice['action']>) => void; onClose: () => void }) {
  const markRead = useNoticesStore((state) => state.markRead)
  const readable = items.filter((item) => item.canMarkRead && !item.read)

  const read = (item: AppNotice) => {
    item.onRead?.()
    markRead(item.id)
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="notices-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[80vh] w-full flex-col rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <div className="flex justify-center" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Tus avisos</p>
        <h2 id="notices-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
          {items.length === 0 ? 'Todo en orden' : 'Avisos'}
        </h2>

        <div className="mt-4 flex min-h-0 flex-col gap-2.5 overflow-y-auto pb-1">
          {items.length === 0 && <p className="py-4 text-[14px] text-text-soft">No tienes avisos. Cuando haya algo que mirar, saldrá aquí.</p>}
          {items.map((item) => {
            const style = KIND_STYLE[item.kind]
            return (
              <div key={item.id} className={`rounded-2xl border border-text/[.12] px-3.5 py-3 transition-opacity ${item.read ? 'opacity-55' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${style.color} 14%, transparent)`, color: style.color }}>
                    <Icono nombre={style.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-text/50" style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {style.label}
                      {item.read && ' · leído'}
                    </p>
                    <p className="font-display text-[19px] leading-tight text-text">{item.title}</p>
                    <p className="mt-1 text-[13.5px] leading-snug text-text-soft">{item.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item.action && (
                        <button type="button" onClick={() => onAction(item.action!)} className="rounded-full border border-accent px-3 py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft">
                          {item.actionLabel}
                        </button>
                      )}
                      {item.canMarkRead && !item.read && (
                        <button type="button" onClick={() => read(item)} className="text-caption font-semibold text-text-soft underline underline-offset-2">
                          Marcar como leído
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {readable.length > 1 && (
            <button type="button" onClick={() => readable.forEach(read)} className="self-center py-1 text-caption font-semibold text-text-soft underline underline-offset-2">
              Marcar todos como leídos
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
