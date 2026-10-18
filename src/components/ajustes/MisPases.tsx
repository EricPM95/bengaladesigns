import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { estadoDelPase, etiquetaDelPase, filasDelPase, personasDelPase } from '../../lib/ajustes'
import { compartirEnlace } from '../../lib/compartirEnlace'
import { crearInvitacion, enlaceDeInvitacion } from '../../lib/invitaciones'
import { misPases, textoDeCompartirPase, verRecibo, type PaseMio } from '../../lib/pagoPase'
import { Icono } from '../ui/Icono'

const DEGRADADOS = ['linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)', 'linear-gradient(160deg,#F2D3A6,#D98A5E 55%,#7A3E34)', 'linear-gradient(160deg,#B8C7E0,#6F86B5 55%,#2E3E5E)', 'linear-gradient(160deg,#C9D9B8,#7FA06B 55%,#33503A)']
const degradadoDe = (destino: string) => DEGRADADOS[[...destino].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 0) % DEGRADADOS.length]
const hoyEnLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * MIS PASES (P4 de «Logros · Pantallas», cuentas parte 3): cada pase con su tipo, su destino, «En curso» / «Próximo», la fecha de compra, el precio (solo quien lo compró), el viaje, con quién lo
 * comparte («✓ Dentro»), el código y el enlace para invitar y [Ver recibo]. Los datos salen del servidor; `pasesIniciales` solo lo usan las capturas y la prueba.
 */
export function MisPases({ onVolver, pasesIniciales = null, hoy = hoyEnLocal() }: { onVolver: () => void; pasesIniciales?: PaseMio[] | null; hoy?: string }) {
  const [pases, setPases] = useState<PaseMio[] | null>(pasesIniciales)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (pasesIniciales) return undefined
    let vivo = true
    void misPases().then((p) => vivo && setPases(p))
    return () => {
      vivo = false
    }
  }, [pasesIniciales])

  const recargar = async () => setPases(await misPases())
  const crearCodigo = async (p: PaseMio) => {
    const viaje = p.viaje?.id
    if (!viaje) {
      setAviso('Primero guarda un viaje para poder invitar.')
      return
    }
    const r = await crearInvitacion(viaje, { passId: p.id })
    if (r.error) setAviso(r.error)
    else await recargar()
  }
  const enlace = async (p: PaseMio) => {
    if (!p.invitacion) return
    const r = await compartirEnlace({ titulo: textoDeCompartirPase(p.destino), texto: textoDeCompartirPase(p.destino), url: enlaceDeInvitacion(window.location.origin, p.invitacion.codigo) })
    setAviso(r === 'copiado' ? 'Enlace copiado' : r === 'error' ? 'No se ha podido compartir.' : null)
  }
  const recibo = async (p: PaseMio) => setAviso(await verRecibo(p.id))

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Mis pases" data-mis-pases className="fixed inset-0 z-[78] flex flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+4px)]">
        <button type="button" onClick={onVolver} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-text/[.14] bg-[#FFFDF8]">
          <Icono nombre="atras" size={16} grosor={2} />
        </button>
        <h1 className="m-0 font-display text-[30px] leading-none">Mis pases</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-10 pt-0.5" style={{ scrollbarWidth: 'none' }}>
        {pases && pases.length === 0 && <p className="m-0 px-1 text-[14px] text-text/60">Todavía no tienes ningún pase.</p>}
        {aviso && (
          <p role="status" className="m-0 px-1 text-[13px] text-text/70">
            {aviso}
          </p>
        )}
        {(pases ?? []).map((p) => {
          const personas = p.tipo === 'uno' ? [] : personasDelPase(p)
          return (
            <section key={p.id} data-pase={p.id} className="shrink-0 overflow-hidden rounded-3xl border border-text/[.07] bg-[#FFFDF8]" style={{ boxShadow: '0 14px 28px -22px rgba(28,34,48,.5)' }}>
              <div className="relative flex h-24 items-end justify-between px-4 py-3.5 text-[#FFFDF8]" style={{ background: degradadoDe(p.destino) }}>
                <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 20%,rgba(10,12,20,.6))' }} />
                <span className="relative flex flex-col gap-0.5">
                  <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(255,253,248,.8)' }}>{etiquetaDelPase(p)}</span>
                  <span className="font-display text-[26px] leading-none">{p.destino}</span>
                </span>
                <span data-estado-del-pase className="relative flex h-[26px] items-center rounded-full bg-[#FFFDF8]/90 px-2.5 text-[11.5px] font-semibold text-[#1C2230]">
                  {estadoDelPase(p, hoy)}
                </span>
              </div>
              <div className="px-4 py-1.5">
                {filasDelPase(p).map((f) => (
                  <div key={f.k} className="flex min-h-[42px] items-center justify-between gap-2.5 border-b border-text/[.07] text-[13.5px] last:border-b-0">
                    <span className="text-text/60">{f.k}</span>
                    <span className="font-semibold">{f.v}</span>
                  </div>
                ))}
              </div>
              {personas.length > 0 && (
                <div className="mx-3 mb-2.5 mt-1 flex flex-col gap-2.5 rounded-[18px] bg-bg p-3">
                  <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Lo compartes con</span>
                  {personas.map((m, i) => (
                    <div key={i} data-persona-del-pase={m.libre ? 'libre' : 'dentro'} className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full font-display text-[17px] leading-none text-[#FFFDF8]" style={{ background: m.libre ? 'transparent' : m.comprador ? 'oklch(0.3 0.03 250)' : 'oklch(0.55 0.17 5)', border: m.libre ? '1.5px dashed rgba(28,34,48,.3)' : 'none', color: m.libre ? 'rgba(28,34,48,.45)' : '#FFFDF8' }}>
                        {m.libre ? '+' : (m.nombre[0] ?? 'V').toUpperCase()}
                      </span>
                      <span className="flex-1 text-[14px] font-medium">{m.nombre}</span>
                      <span className="text-[12px] font-medium" style={{ color: m.estado.startsWith('✓') ? 'oklch(0.42 0.1 150)' : 'rgba(28,34,48,.55)' }}>
                        {m.estado}
                      </span>
                    </div>
                  ))}
                  {p.es_mio && p.estado === 'activo' && (
                    <div className="flex items-center gap-2 rounded-[14px] border border-dashed border-text/20 bg-white py-2.5 pl-3.5 pr-2.5">
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="text-[11px] font-medium text-text/55">Código para invitar</span>
                        <span data-codigo-del-pase style={{ font: "600 17px 'Geist Mono',monospace", letterSpacing: '.12em' }}>
                          {p.invitacion?.codigo ?? '········'}
                        </span>
                      </span>
                      <button type="button" onClick={() => (p.invitacion ? void enlace(p) : void crearCodigo(p))} className="flex h-11 items-center gap-1.5 rounded-full bg-[#1C2230] px-3.5 text-[12.5px] font-semibold text-[#FFFDF8]">
                        {p.invitacion ? 'Enlace' : 'Crear código'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {p.es_mio && p.tiene_recibo && (
                <button type="button" onClick={() => void recibo(p)} className="mx-3 mb-3 flex h-[44px] w-[calc(100%-24px)] items-center justify-center gap-[7px] rounded-full border border-text/[.16] bg-white text-[13px] font-semibold">
                  <Icono nombre="portapapeles" size={14} grosor={1.8} />
                  Ver recibo
                </button>
              )}
            </section>
          )
        })}
      </main>
    </div>,
    document.body,
  )
}
