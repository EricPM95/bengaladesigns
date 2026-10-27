import { useUnirseUi } from '../../store/useUnirseUi'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { textoDeComoEntra, textoDeMisPases } from '../../lib/ajustes'
import { borrarMiCuenta, cerrarSesion } from '../../lib/cuentas'
import { compartirEnlace } from '../../lib/compartirEnlace'
import { enlaceDeAmigo, miCodigoDeAmigo } from '../../lib/invitaciones'
import { marca } from '../../lib/marca'
import { apagarAvisosDelMovil, avisosDelMovilEncendidos, encenderAvisosDelMovil } from '../../lib/permisoAvisos'
import { misPases, type PaseMio } from '../../lib/pagoPase'
import { ponerSonido, sonidoActivado } from '../../lib/sonidos'
import { useAjustesUi } from '../../store/useAjustesUi'
import { useMomentosUI } from '../logros/momentos/useMomentosUI'
import { PrivacidadScreen } from '../cuenta/PrivacidadScreen'
import { useCuenta } from '../cuenta/useCuenta'
import { Icono } from '../ui/Icono'
import type { NombreIcono } from '../../lib/iconos'
import { MisPases } from './MisPases'
import listaAjustes from '../../../data/pase/lista_ajustes.json'
import { TextoConPase } from '../cuenta/TextoConPase'

const ROJO = 'oklch(0.52 0.19 25)'

function Fila({ icono, titulo, sub, color, onClick, interruptor, chevron = false, boton, datos }: { icono: NombreIcono; titulo: string; sub?: ReactNode; color?: string; onClick?: () => void; interruptor?: { activo: boolean; cambiar: () => void }; chevron?: boolean; boton?: string; datos?: string }) {
  const contenido: ReactNode = (
    <>
      <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F1EADC] text-[#1C2230]">
        <Icono nombre={icono} size={16} grosor={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-[14.5px] font-medium" style={{ color: color ?? '#1C2230' }}>
          {titulo}
        </span>
        {sub && <span className="text-[12px] leading-[1.35] text-text/60">{sub}</span>}
      </span>
      {interruptor && (
        <span aria-hidden="true" className="flex h-7 w-[46px] flex-none rounded-full p-[3px]" style={{ background: interruptor.activo ? 'oklch(0.55 0.11 150)' : 'rgba(28,34,48,.18)', justifyContent: interruptor.activo ? 'flex-end' : 'flex-start' }}>
          <span className="h-[22px] w-[22px] rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
        </span>
      )}
      {boton && <span className="flex h-9 flex-none items-center rounded-full btn-champan px-3.5 text-[12.5px] font-semibold ">{boton}</span>}
      {chevron && <Icono nombre="adelante" size={16} grosor={2} className="text-text/45" />}
    </>
  )
  const clase = 'flex min-h-[56px] w-full items-center gap-3 border-t border-text/[.07] px-3.5 py-2 first:border-t-0'
  return interruptor ? (
    <button type="button" role="switch" aria-checked={interruptor.activo} data-ajuste={datos} onClick={interruptor.cambiar} className={clase}>
      {contenido}
    </button>
  ) : (
    <button type="button" data-ajuste={datos} onClick={onClick} className={clase}>
      {contenido}
    </button>
  )
}

function Grupo({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {titulo && (
        <span className="px-1.5 uppercase text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
          {titulo}
        </span>
      )}
      <div className="overflow-hidden rounded-[20px] border border-text/[.07] bg-[#FFFDF8]">{children}</div>
    </div>
  )
}

/**
 * AJUSTES (P3 de «Logros · Pantallas», cuentas parte 3): «Mi cuenta» (su email, cómo entra y [Cerrar sesión]), «Mis pases» (con los suyos de verdad), «La app» (el sonido de los momentos, los
 * avisos en el móvil —se encienden y se apagan de verdad—, ver otra vez el tutorial), «Privacidad y condiciones», invitar a un amigo y [Borrar mi cuenta] (P5). Lo abre el botón de Ajustes del Perfil.
 */
export function AjustesScreen({ onVolver, emailInicial, proveedorInicial, pasesIniciales = null, borrandoInicial = false, avisosInicial = false }: { onVolver: () => void; emailInicial?: string | null; proveedorInicial?: string | null; pasesIniciales?: PaseMio[] | null; borrandoInicial?: boolean; avisosInicial?: boolean }) {
  const cuenta = useCuenta()
  const pantalla = useAjustesUi((s) => s.pantalla)
  const abrir = useAjustesUi((s) => s.abrir)
  const [pases, setPases] = useState<PaseMio[]>(pasesIniciales ?? [])
  const [sonido, setSonido] = useState(() => sonidoActivado())
  const [avisosMovil, setAvisosMovil] = useState(avisosInicial)
  const [privacidad, setPrivacidad] = useState(false)
  const [borrando, setBorrando] = useState(borrandoInicial)
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const email = emailInicial ?? (cuenta.tipo === 'cuenta' ? cuenta.email : null)
  const proveedor = proveedorInicial ?? (cuenta.tipo === 'cuenta' ? (cuenta.proveedor ?? null) : null)

  useEffect(() => {
    if (pasesIniciales) return undefined
    let vivo = true
    void misPases().then((p) => vivo && setPases(p))
    void avisosDelMovilEncendidos().then((v) => vivo && setAvisosMovil(v))
    return () => {
      vivo = false
    }
  }, [pasesIniciales])

  const cambiarAvisos = async () => {
    if (avisosMovil) {
      await apagarAvisosDelMovil()
      setAvisosMovil(false)
      setMensaje(null)
      return
    }
    const ok = await encenderAvisosDelMovil()
    setAvisosMovil(ok)
    setMensaje(ok ? null : 'No se han podido encender los avisos en este móvil. En iPhone solo funcionan con la web añadida a la pantalla de inicio.')
  }
  const invitarAmigo = async () => {
    const c = await miCodigoDeAmigo()
    if (!c) {
      setMensaje('No se ha podido crear tu enlace. Inténtalo de nuevo.')
      return
    }
    const r = await compartirEnlace({ titulo: marca.nombre, texto: `Te invito a ${marca.nombre}`, url: enlaceDeAmigo(window.location.origin, c) })
    setMensaje(r === 'copiado' ? 'Enlace copiado' : r === 'error' ? 'No se ha podido compartir.' : null)
  }
  const borrar = async () => {
    setOcupado(true)
    setErrorBorrar(null)
    const e = await borrarMiCuenta()
    setOcupado(false)
    if (e) setErrorBorrar(e)
  }
  if (pantalla === 'pases') return <MisPases onVolver={() => abrir('ajustes')} />

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Ajustes" data-ajustes-pantalla className="fixed inset-0 z-[76] flex flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+4px)]">
        <button type="button" onClick={onVolver} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-text/[.14] bg-[#FFFDF8]">
          <Icono nombre="atras" size={16} grosor={2} />
        </button>
        <h1 className="m-0 font-display text-[30px] leading-none">Ajustes</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pb-10 pt-0.5" style={{ scrollbarWidth: 'none' }}>
        <Grupo titulo="Mi cuenta">
          <Fila icono="correo" titulo={email ?? 'Tu cuenta'} sub={textoDeComoEntra(proveedor)} datos="cuenta" />
          <Fila icono="salir" titulo="Cerrar sesión" chevron onClick={() => void cerrarSesion()} datos="cerrar-sesion" />
          <Fila icono="llave" titulo="Tengo un código de invitación" chevron onClick={() => useUnirseUi.getState().abrir()} datos="codigo" />
        </Grupo>
        <Grupo titulo="Mis pases">
          <Fila icono="pase" titulo="Mis pases" sub={textoDeMisPases(pases)} chevron onClick={() => abrir('pases')} datos="mis-pases" />
        </Grupo>
        <Grupo titulo="La app">
          <Fila
            icono="altavoz"
            titulo="Sonido de los momentos"
            interruptor={{
              activo: sonido,
              cambiar: () => {
                ponerSonido(!sonido)
                setSonido(!sonido)
              },
            }}
            datos="sonido"
          />
          <Fila icono="avisos" titulo="Avisos en el móvil" sub="El resumen del viaje y «en 10 días empieza tu viaje»" interruptor={{ activo: avisosMovil, cambiar: () => void cambiarAvisos() }} datos="avisos-movil" />
          <Fila
            icono="seguir"
            titulo="Ver otra vez el tutorial"
            chevron
            onClick={() => {
              onVolver()
              useMomentosUI.getState().ponerPrimerDia(true)
            }}
            datos="tutorial"
          />
        </Grupo>
        <Grupo>
          <Fila icono="compartido" titulo="Invitar a un amigo" sub={<TextoConPase texto={listaAjustes.textos['Invita a un amigo']} />} boton="Compartir el enlace" onClick={() => void invitarAmigo()} datos="invitar-amigo" />
          <Fila icono="candado" titulo="Privacidad y condiciones" chevron onClick={() => setPrivacidad(true)} datos="privacidad" />
        </Grupo>
        {mensaje && (
          <p role="status" data-mensaje-ajustes className="m-0 px-1.5 text-[13px] text-text/70">
            {mensaje}
          </p>
        )}
        <button type="button" onClick={() => setBorrando(true)} data-borrar-cuenta className="h-12 bg-transparent text-[14px] font-semibold" style={{ color: ROJO }}>
          Borrar mi cuenta
        </button>
      </main>
      {privacidad && <PrivacidadScreen onVolver={() => setPrivacidad(false)} />}
      {borrando && (
        <div className="fixed inset-0 z-[90]" role="alertdialog" aria-modal="true" aria-label="Borrar la cuenta" data-borrar-dialogo>
          <div className="hoja-fondo absolute inset-0" style={{ background: 'rgba(28,34,48,.5)' }} onClick={() => setBorrando(false)} />
          <div className="absolute left-[22px] right-[22px] top-[250px] mx-auto flex max-w-[420px] flex-col items-center gap-2.5 rounded-[26px] bg-[#FFFDF8] px-5 pb-[18px] pt-[22px] text-center">
            <span aria-hidden="true" className="flex h-[52px] w-[52px] items-center justify-center rounded-full" style={{ background: 'oklch(0.52 0.19 25 / .12)', color: ROJO }}>
              <Icono nombre="papelera" size={24} grosor={1.8} />
            </span>
            <span className="font-display text-[26px] leading-[1.05]">¿Borrar tu cuenta?</span>
            <span className="text-[14px] leading-[1.5] text-text/75">Se borrarán tu cuenta, tus fotos y tus logros. No se puede deshacer.</span>
            {errorBorrar && (
              <p role="alert" className="m-0 text-[13px]" style={{ color: ROJO }}>
                {errorBorrar}
              </p>
            )}
            <button type="button" disabled={ocupado} onClick={() => void borrar()} data-confirmar-borrar className="mt-1.5 h-[50px] w-full rounded-full text-[14.5px] font-semibold text-white disabled:opacity-60" style={{ background: ROJO }}>
              Borrar mi cuenta
            </button>
            <button type="button" disabled={ocupado} onClick={() => setBorrando(false)} className="h-[46px] w-full rounded-full bg-[#F1EADC] text-[14px] font-semibold text-[#1C2230]">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

/** El anfitrión de Ajustes: se abre desde el Perfil (el botón de Ajustes) y se monta una sola vez. */
export function AjustesHost() {
  const pantalla = useAjustesUi((s) => s.pantalla)
  const cerrar = useAjustesUi((s) => s.cerrar)
  if (!pantalla) return null
  return <AjustesScreen onVolver={cerrar} />
}
