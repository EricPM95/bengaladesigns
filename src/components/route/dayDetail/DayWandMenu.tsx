import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MagicWandIcon } from '../MagicWandIcon'

interface DayWandMenuProps {
  /** Recuperar este día tal como se preparó. null: no hay original (un día que crea el viajero): la opción no sale. */
  dayChanged: boolean | null
  /** ¿Tiene cambios el viaje entero (también días borrados, llegada y vuelta)? */
  routeChanged: boolean
  onRestoreDay: () => void
  onRestoreRoute: () => void
}

const MENU_WIDTH = 252
const itemClass = 'flex min-h-[44px] w-full flex-col items-start justify-center rounded-[10px] px-3 py-1.5 text-left text-[14px] font-medium text-[#F3EEE4] hover:bg-[#F3EEE4]/[.08] disabled:cursor-not-allowed disabled:text-[#F3EEE4]/40 disabled:hover:bg-transparent'

/**
 * La varita de cada día (PARA_CODE_TODO_2026-10-01, paso 8): entre los tres puntos y la flecha, del mismo estilo que los tres
 * puntos (redonda, mismo tamaño y borde). Abre un menú pequeño, por encima de todo (en el body: menús y barra flotante
 * incluidos), con «Recuperar este día» y «Recuperar toda mi ruta». La opción que no tiene nada que recuperar sale en gris,
 * con su línea. En un día que crea el viajero solo sale la de la ruta.
 */
export function DayWandMenu({ dayChanged, routeChanged, onRestoreDay, onRestoreRoute }: DayWandMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)

  // Junto a la varita: debajo y alineado a su derecha; si no cabe debajo, encima.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuHeight = dayChanged === null ? 86 : 150
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8)
    const below = rect.bottom + 6
    const top = below + menuHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 6) : below
    setPosition({ top, left })
  }, [open, dayChanged])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {/* 44 × 44 de zona de toque; el círculo, de 38, como el de los tres puntos. */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        title="Recuperar la ruta original"
        aria-label="Recuperar la ruta original"
        aria-haspopup="menu"
        aria-expanded={open}
        className="-mx-[3px] flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-text/60 hover:bg-bg-hover">
          <MagicWandIcon className="h-[18px] w-[18px]" />
        </span>
      </button>
      {open &&
        position &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[95]" onClick={(event) => (event.stopPropagation(), close())} />
            <div
              role="menu"
              onClick={(event) => event.stopPropagation()}
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
              className="fixed z-[96] flex flex-col rounded-2xl bg-[#1C2230] p-1.5 shadow-[0_18px_40px_-12px_rgba(28,34,48,.5)]"
            >
              {dayChanged !== null && (
                <button
                  type="button"
                  role="menuitem"
                  disabled={!dayChanged}
                  onClick={() => {
                    close()
                    onRestoreDay()
                  }}
                  className={itemClass}
                >
                  Recuperar este día
                  {!dayChanged && <span className="text-[12px] font-normal text-[#F3EEE4]/45">Está tal como te lo preparamos</span>}
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                disabled={!routeChanged}
                onClick={() => {
                  close()
                  onRestoreRoute()
                }}
                className={itemClass}
              >
                Recuperar toda mi ruta
                {!routeChanged && <span className="text-[12px] font-normal text-[#F3EEE4]/45">Está tal como te la preparamos</span>}
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
