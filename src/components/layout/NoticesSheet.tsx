import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { NombreIcono } from '../../lib/iconos'
import { useNoticesStore } from '../../store/useNoticesStore'
import type { AppNotice } from '../../hooks/useAppNotices'
import { Icono } from '../ui/Icono'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { claveDeAviso, ListaDeAvisos } from '../avisos/ListaDeAvisos'
import { abrirAviso } from '../avisos/abrirAviso'
import { FilaDeAviso, letraDeAviso, SIN_SELECCION, type SeleccionDeAvisos } from '../avisos/FilaDeAviso'
import { useFotosDePerfil } from '../../hooks/useFotosDePerfil'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { ICONOS_OPCION, OpcionTarjeta } from '../ui/HojaOpciones'

const ETIQUETA: Record<AppNotice['kind'], string> = { error: 'Error', warning: 'Aviso', info: 'Información', friend: 'Amigos' }
const ICONO_DE_TIPO: Record<AppNotice['kind'], NombreIcono> = { error: 'error', warning: 'alerta', info: 'info', friend: 'compartido' }
const CALENDARIO = 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'
const DOBLE_CHECK = 'M2 13l4 4 7-9M11 17l1 .6L22 7'
const SEGUNDOS_DEL_DESHACER = 6

const claveDeApp = (id: string) => `a:${id}`
/** Lo que se puede marcar como leído o eliminar: los errores y los avisos del viaje no (se arreglan; no se eliminan). */
const seleccionable = (item: AppNotice) => Boolean(item.canMarkRead || item.fecha)

/**
 * LA CAMPANA (la lista de avisos de la cabecera), a PANTALLA COMPLETA y como en Design (Tanda 10N4 §2, `Piezas/Avisos Gestion`): arriba «TUS AVISOS», «Avisos» grande y [Seleccionar].
 *   · Normal (01): tocar un aviso lo abre (la propuesta, el gasto, el día que ha cambiado…) y lo da por leído. Abrir la campana NO marca nada como leído.
 *   · [Seleccionar] (02): circulito a la izquierda de cada aviso, «2 seleccionados» y «Seleccionar todos»; [Seleccionar] pasa a [Cancelar]. Al elegir el primero sube desde abajo una hoja con
 *     «Marcar como leído» (o «…no leído») y «Eliminar» (en rojo), con el formato de las demás hojas de opciones; baja al no quedar ninguno o al tocar [Cancelar].
 *   · Eliminar (03): sin preguntar, los quita de la campana de esta persona y sale la franja oscura «2 avisos eliminados» con [Deshacer] unos segundos.
 */
export function NoticesSheet({ items, onAction, onClose }: { items: AppNotice[]; onAction: (action: NonNullable<AppNotice['action']>) => void; onClose: () => void }) {
  const markRead = useNoticesStore((state) => state.markRead)
  const markUnread = useNoticesStore((state) => state.markUnread)
  const hide = useNoticesStore((state) => state.hide)
  const unhide = useNoticesStore((state) => state.unhide)
  const avisosDeLaCuenta = useAvisosStore((state) => state.avisos)
  const resaltado = useAvisosStore((state) => state.enAviso)
  const marcarLeidosDeLaCuenta = useAvisosStore((state) => state.marcarLeidos)
  const marcarNoLeidosDeLaCuenta = useAvisosStore((state) => state.marcarNoLeidos)
  const eliminarDeLaCuenta = useAvisosStore((state) => state.eliminar)
  const devolverALaCuenta = useAvisosStore((state) => state.devolver)
  const cerrar = onClose

  // La foto de quien hace lo que cuenta el aviso (si es de este viaje y la tiene puesta).
  const gente = useViajeCompartido((state) => state.gente)
  const enlacesDeFotos = useFotosDePerfil(gente.map((p) => p.foto))
  const fotoDeLaPersona = (aviso: { payload: Record<string, unknown> }) => {
    const id = (aviso.payload.autor_id ?? aviso.payload.persona_id ?? aviso.payload.admin_id) as string | undefined
    const ruta = gente.find((p) => p.id === id)?.foto
    return ruta ? (enlacesDeFotos[ruta] ?? null) : null
  }

  const [seleccionando, setSeleccionando] = useState(false)
  const [elegidos, setElegidos] = useState<ReadonlySet<string>>(new Set())
  const [toast, setToast] = useState<{ texto: string; cuenta: string[]; app: string[] } | null>(null)
  const temporizador = useRef<number | null>(null)
  useEffect(() => () => void (temporizador.current && window.clearTimeout(temporizador.current)), [])

  // Los nuevos, siempre arriba; los leídos, abajo (Tanda 10M). Un aviso de la cuenta ya contestado («Aceptada») cuenta como leído.
  const cuentaNuevos = avisosDeLaCuenta.filter((a) => !a.leido && !a.etiqueta)
  const cuentaLeidos = avisosDeLaCuenta.filter((a) => a.leido || a.etiqueta)
  const appNuevos = items.filter((i) => !i.read)
  const appLeidos = items.filter((i) => i.read)
  const nada = items.length === 0 && avisosDeLaCuenta.length === 0

  // Todo lo que se puede elegir (para «Seleccionar todos») y cuáles de lo elegido ya están leídos.
  const elegibles = useMemo(
    () => [...avisosDeLaCuenta.map((a) => claveDeAviso(a.id)), ...items.filter(seleccionable).map((i) => claveDeApp(i.id))],
    [avisosDeLaCuenta, items],
  )
  const clavesVivas = elegibles.filter((c) => elegidos.has(c))
  const cuantos = clavesVivas.length
  const estaLeido = (clave: string) => {
    if (clave.startsWith('c:')) {
      const a = avisosDeLaCuenta.find((x) => claveDeAviso(x.id) === clave)
      return Boolean(a && (a.leido || a.etiqueta))
    }
    return Boolean(items.find((i) => claveDeApp(i.id) === clave)?.read)
  }
  const todosLeidos = cuantos > 0 && clavesVivas.every(estaLeido)

  const alternar = (clave: string) =>
    setElegidos((previo) => {
      const siguiente = new Set(previo)
      if (siguiente.has(clave)) siguiente.delete(clave)
      else siguiente.add(clave)
      return siguiente
    })
  const seleccion: SeleccionDeAvisos = seleccionando ? { activa: true, elegidos, alternar } : SIN_SELECCION

  const salirDeSeleccionar = () => {
    setSeleccionando(false)
    setElegidos(new Set())
  }
  const empezarASeleccionar = () => {
    setToast(null)
    setSeleccionando(true)
    setElegidos(new Set())
  }

  const leerDeLaApp = (item: AppNotice) => {
    item.onRead?.()
    markRead(item.id)
    if (item.fecha) useRouteStore.getState().markDateNoticeRead(item.fecha.id)
  }

  const partirElegidos = () => {
    const cuenta = clavesVivas.filter((c) => c.startsWith('c:')).map((c) => c.slice(2))
    const app = clavesVivas.filter((c) => c.startsWith('a:')).map((c) => c.slice(2))
    return { cuenta, app }
  }
  const marcar = (leer: boolean) => {
    const { cuenta, app } = partirElegidos()
    if (leer) {
      if (cuenta.length) void marcarLeidosDeLaCuenta(cuenta)
      for (const id of app) {
        const item = items.find((i) => i.id === id)
        if (item) leerDeLaApp(item)
      }
    } else {
      if (cuenta.length) void marcarNoLeidosDeLaCuenta(cuenta)
      if (app.length) markUnread(app)
    }
    salirDeSeleccionar()
  }
  const eliminar = () => {
    const { cuenta, app } = partirElegidos()
    const total = cuenta.length + app.length
    if (total === 0) return
    if (cuenta.length) void eliminarDeLaCuenta(cuenta)
    if (app.length) hide(app)
    salirDeSeleccionar()
    setToast({ texto: total === 1 ? '1 aviso eliminado' : `${total} avisos eliminados`, cuenta, app })
    if (temporizador.current) window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setToast(null), SEGUNDOS_DEL_DESHACER * 1000)
  }
  const deshacer = () => {
    if (!toast) return
    if (toast.cuenta.length) void devolverALaCuenta(toast.cuenta)
    if (toast.app.length) unhide(toast.app)
    if (temporizador.current) window.clearTimeout(temporizador.current)
    setToast(null)
  }

  /** Tocar un aviso de la app (normal): lo da por leído y, si es una fecha, abre su tarjeta. */
  const tocarDeLaApp = (item: AppNotice) => {
    if (item.fecha) {
      leerDeLaApp(item)
      item.onOpen?.()
      onClose()
      return
    }
    if (item.canMarkRead && !item.read) leerDeLaApp(item)
  }

  const fila = (item: AppNotice) => {
    const esFecha = Boolean(item.fecha)
    // «Fecha especial» (el calendario) es la del día señalado; si solo cuenta qué cierra, es información (la «i»).
    const cierres = esFecha && (item.fecha?.cierran?.length ?? 0) > 0
    const etiqueta = esFecha ? (cierres ? 'Información' : 'Fecha especial') : ETIQUETA[item.kind]
    const icono: ReactNode = esFecha ? (
      cierres ? (
        'i'
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={CALENDARIO} />
        </svg>
      )
    ) : item.kind === 'info' ? (
      'i'
    ) : (
      <Icono nombre={ICONO_DE_TIPO[item.kind]} size={20} />
    )
    const botones = [
      ...(item.action || item.run ? [{ label: item.actionLabel ?? '', ir: () => (item.run ? (item.run(), onClose()) : onAction(item.action!)) }] : []),
      ...(item.acciones ?? []).map((accion) => ({ label: accion.label, ir: () => (accion.run(), onClose()) })),
    ]
    return (
      <FilaDeAviso
        key={item.id}
        clave={claveDeApp(item.id)}
        leido={item.read}
        seleccion={seleccion}
        seleccionable={seleccionable(item)}
        tocable={seleccionable(item)}
        onTocar={() => tocarDeLaApp(item)}
        icono={icono}
        etiqueta={etiqueta}
        atributos={esFecha ? { 'data-aviso-fecha': item.fecha!.id, 'data-aviso-fecha-estado': item.read ? 'leido' : 'nuevo' } : { 'data-aviso-app': item.id }}
      >
        <span data-aviso-texto {...(esFecha ? { 'data-aviso-fecha-frase': '1' } : {})} style={letraDeAviso(item.read)}>
          {item.title}
        </span>
        {item.text && <span style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.62)' }}>{item.text}</span>}
        {botones.length > 0 && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, pointerEvents: seleccionando ? 'none' : undefined }}>
            {botones.map((boton) => (
              <button key={boton.label} type="button" onClick={boton.ir} className="rounded-full border border-accent px-3 py-1 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft">
                {boton.label}
              </button>
            ))}
          </span>
        )}
      </FilaDeAviso>
    )
  }

  const hojaVisible = seleccionando && cuantos > 0

  return createPortal(
    <div data-campana="1" className="trazo-notice-panel fixed inset-0 z-[90] flex flex-col items-center" style={{ background: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", color: '#1C2230' }} role="dialog" aria-modal="true" aria-labelledby="notices-heading">
      <div className="relative flex min-h-0 w-full max-w-[520px] flex-1 flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ flex: 'none', padding: '14px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#6F4E37' }}>TUS AVISOS</span>
            <h2 id="notices-heading" style={{ font: "400 34px/1.05 'Instrument Serif',serif", margin: 0 }}>
              Avisos
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            {seleccionando ? (
              <button type="button" data-campana-cancelar onClick={salirDeSeleccionar} style={{ height: 36, padding: '0 15px', borderRadius: 999, background: '#1C2230', color: '#FBF3E2', border: 'none', display: 'flex', alignItems: 'center', font: "600 13.5px 'Geist'", cursor: 'pointer' }}>
                Cancelar
              </button>
            ) : (
              <>
                {!nada && (
                  <button type="button" data-campana-seleccionar onClick={empezarASeleccionar} style={{ height: 36, padding: '0 15px', borderRadius: 999, border: '1px solid rgba(181,138,46,.6)', background: '#FBF3E2', color: '#6E5018', display: 'flex', alignItems: 'center', gap: 6, font: "600 13.5px 'Geist'", cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12.5l3 3 5-6" />
                    </svg>
                    Seleccionar
                  </button>
                )}
                <button type="button" onClick={cerrar} aria-label="Cerrar" data-campana-cerrar style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2230', cursor: 'pointer' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {seleccionando && (
          <div style={{ flex: 'none', padding: '0 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span data-campana-cuenta style={{ font: "600 14px 'Geist'" }}>
              {cuantos === 0 ? 'Elige uno o más avisos' : cuantos === 1 ? '1 seleccionado' : `${cuantos} seleccionados`}
            </span>
            <button
              type="button"
              data-campana-todos
              onClick={() => setElegidos(cuantos === elegibles.length && cuantos > 0 ? new Set() : new Set(elegibles))}
              style={{ font: "600 13.5px 'Geist'", color: '#6E5018', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {cuantos === elegibles.length && cuantos > 0 ? 'Quitar selección' : 'Seleccionar todos'}
            </button>
          </div>
        )}

        <div data-campana-lista className="min-h-0 flex-1 overflow-y-auto" style={{ padding: `4px 14px ${hojaVisible ? 280 : toast ? 120 : 40}px`, display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
          {nada && (
            <div style={{ margin: '70px 30px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#FBF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />
                </svg>
              </span>
              <span style={{ font: "400 24px/1.1 'Instrument Serif',serif" }}>No tienes avisos</span>
            </div>
          )}
          {cuentaNuevos.length > 0 && <ListaDeAvisos avisos={cuentaNuevos} resaltado={resaltado} onTocar={(aviso) => void abrirAviso(aviso)} alLeer={(aviso) => void marcarLeidosDeLaCuenta([aviso.id])} fotoDe={fotoDeLaPersona} seleccion={seleccion} />}
          {appNuevos.map(fila)}
          {cuentaLeidos.length > 0 && <ListaDeAvisos avisos={cuentaLeidos} resaltado={resaltado} onTocar={(aviso) => void abrirAviso(aviso)} alLeer={(aviso) => void marcarLeidosDeLaCuenta([aviso.id])} fotoDe={fotoDeLaPersona} seleccion={seleccion} />}
          {appLeidos.map(fila)}
        </div>

        {/* Las opciones de lo elegido: una hoja pequeña desde abajo, con el formato de «Hojas Opciones» de Design; no tapa la lista (la lista deja su hueco abajo). */}
        <div
          data-campana-hoja={hojaVisible ? 'visible' : 'oculta'}
          aria-hidden={!hojaVisible}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '32px 32px 0 0',
            background: '#FDFBF4',
            padding: '10px 20px calc(34px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 -20px 40px rgba(0,0,0,.25)',
            transform: hojaVisible ? 'translateY(0)' : 'translateY(105%)',
            visibility: hojaVisible ? 'visible' : 'hidden',
            transition: hojaVisible ? 'transform .35s cubic-bezier(0.2,0.8,0.2,1), visibility 0s' : 'transform .3s ease-in, visibility 0s .3s',
          }}
        >
          <span aria-hidden="true" style={{ display: 'block', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)', margin: '0 auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todosLeidos ? (
              <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.campana} titulo="Marcar como no leído" linea="Vuelven a salir como nuevos" datos="no-leido" onClick={() => marcar(false)} />
            ) : (
              <OpcionTarjeta tono="salvia" icono={DOBLE_CHECK} titulo="Marcar como leído" linea="Dejan de salir como nuevos" datos="leido" onClick={() => marcar(true)} />
            )}
            <OpcionTarjeta tono="rojo" peligro icono={ICONOS_OPCION.papelera} titulo="Eliminar" linea="Se quitan de tu campana. Puedes deshacerlo" datos="eliminar" onClick={eliminar} />
          </div>
        </div>

        {toast && !seleccionando && (
          <div data-campana-toast style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(26px + env(safe-area-inset-bottom))', height: 54, borderRadius: 18, background: '#1C2230', color: '#FBF3E2', display: 'flex', alignItems: 'center', padding: '0 16px', font: "500 14px 'Geist'", boxShadow: '0 18px 30px -14px rgba(14,21,48,.8)' }}>
            <span style={{ flex: 1 }}>{toast.texto}</span>
            <button type="button" data-campana-deshacer onClick={deshacer} style={{ color: '#E9C77A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', font: "700 14px 'Geist'" }}>
              Deshacer
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
