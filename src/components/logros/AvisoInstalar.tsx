import { useEffect, useState } from 'react'
import marca from '../../../data/marca.json'
import { logrosActivos } from '../../lib/logros'
import { avisoYaMostrado, debeEnseñarAvisoDeInstalar, marcarAvisoMostrado, pasosParaInstalar, plataformaDe, prepararInstalacion, yaEstaInstalada } from '../../lib/instalar'

/**
 * «AÑÁDELA A TU PANTALLA DE INICIO» (Tanda 8A, provisional: el diseño llega con Design). Sale una vez, se puede cerrar y no sale si la web ya está instalada.
 * Explica cómo hacerlo en iPhone y en Android (en Android, con el aviso del propio navegador si lo da). Solo con los logros encendidos.
 */
type AvisoDelNavegador = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function AvisoInstalar() {
  if (!logrosActivos()) return null
  return <Encendido />
}

function Encendido() {
  const plataforma = plataformaDe(navigator.userAgent, navigator.maxTouchPoints)
  const [visible, setVisible] = useState(() => debeEnseñarAvisoDeInstalar({ instalada: yaEstaInstalada(), yaMostrado: avisoYaMostrado(), plataforma }))
  const [aviso, setAviso] = useState<AvisoDelNavegador | null>(null)

  useEffect(() => {
    prepararInstalacion(marca)
    const alAvisar = (e: Event) => {
      e.preventDefault()
      setAviso(e as AvisoDelNavegador)
    }
    window.addEventListener('beforeinstallprompt', alAvisar)
    // (Sale una sola vez: se apunta en cuanto se enseña.)
    if (visible) marcarAvisoMostrado()
    return () => window.removeEventListener('beforeinstallprompt', alAvisar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null
  const pasos = pasosParaInstalar(plataforma, marca.nombre, aviso != null)
  return (
    <div role="dialog" aria-label="Añadir a la pantalla de inicio" data-aviso-instalar className="fixed inset-x-4 bottom-4 z-[80] rounded-2xl border border-text/10 bg-bg-card p-4 shadow-lg">
      <p className="font-display text-[19px] leading-tight text-text">Añádela a tu pantalla de inicio</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13.5px] leading-snug text-text/75">
        {pasos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        {aviso && (
          <button type="button" onClick={() => void aviso.prompt().then(() => setVisible(false))} className="zona-toque h-10 flex-1 rounded-full btn-champan text-[14px] font-semibold ">
            Instalar
          </button>
        )}
        <button type="button" onClick={() => setVisible(false)} className="zona-toque h-10 flex-1 rounded-full border border-text/15 text-[14px] font-medium text-text">
          Cerrar
        </button>
      </div>
    </div>
  )
}
