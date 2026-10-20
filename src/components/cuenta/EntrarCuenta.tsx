import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { entrarConEmail, entrarConGoogle, errorDeEntradaPendiente } from '../../lib/cuentas'
import { enlaceDeCorreo, emailResumido, esperaRestante, textoDeEspera } from '../../lib/entrarCuenta'
import { marca } from '../../lib/marca'
import { BotonHoja, EnlaceHoja, Hoja } from '../ui/Hoja'
import { LogoDeLaApp } from '../ui/LogoDeLaApp'
import { PrivacidadScreen } from './PrivacidadScreen'

type Paso = 'inicio' | 'email' | 'enviado'
const CLAVE_ULTIMO_ENVIO = 'trazo:cuenta:ultimoEnlace'

const leerUltimoEnvio = (): number | null => {
  try {
    const v = Number(window.sessionStorage.getItem(CLAVE_ULTIMO_ENVIO))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}
const guardarUltimoEnvio = (ms: number) => {
  try {
    window.sessionStorage.setItem(CLAVE_ULTIMO_ENVIO, String(ms))
  } catch {
    /* sin almacenamiento: la espera solo vale mientras esta pantalla siga abierta */
  }
}

/**
 * LA PANTALLA DE ENTRAR (cuentas parte 3, diseño «Pase y cuenta» A1 a A3). La cuenta se pide al empezar: no hay «seguir sin cuenta».
 *   A1: el nombre de la app (de data/marca.json), el hueco del logo, [Continuar con Google] y [Entrar con mi email].
 *   A2: la hoja con el email. A3: «Te hemos enviado un enlace…», [Abrir mi correo] y «¿No te llega? Enviar otra vez» (no deja pedir otro hasta pasado un minuto).
 * `pasoInicial`/`emailInicial` solo los usan las capturas y la prueba.
 */
export function EntrarCuenta({ pasoInicial = 'inicio', emailInicial = '', aviso = null }: { pasoInicial?: Paso; emailInicial?: string; aviso?: string | null }) {
  const [paso, setPaso] = useState<Paso>(pasoInicial)
  const [email, setEmail] = useState(emailInicial)
  const [mensaje, setMensaje] = useState<string | null>(aviso)
  const [ocupado, setOcupado] = useState(false)
  const [privacidad, setPrivacidad] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const [ultimo, setUltimo] = useState<number | null>(() => (pasoInicial === 'enviado' ? Date.now() : leerUltimoEnvio()))
  const restante = esperaRestante(ultimo, ahora)

  // Si el último intento de entrar con Google no pudo (arreglo de entrar): se dice, con el mismo botón de siempre; la página no se recarga.
  useEffect(() => {
    const e = errorDeEntradaPendiente()
    if (e) setMensaje(e)
  }, [])

  useEffect(() => {
    if (restante <= 0) return undefined
    const t = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [restante > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const mandar = async (): Promise<boolean> => {
    setOcupado(true)
    setMensaje(null)
    const r = await entrarConEmail(email)
    setOcupado(false)
    if (r.error) {
      setMensaje(r.error)
      return false
    }
    const t = Date.now()
    guardarUltimoEnvio(t)
    setUltimo(t)
    setAhora(t)
    return true
  }

  const alGoogle = async () => {
    setOcupado(true)
    setMensaje(null)
    const r = await entrarConGoogle()
    setOcupado(false)
    if (r.error) setMensaje(r.error)
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Entrar en ${marca.nombre}`}
      data-entrar
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'radial-gradient(120% 70% at 50% 10%,#2E3550 0%,#141826 70%)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(150px, 18vh) 26px calc(44px + env(safe-area-inset-bottom))', gap: 14, textAlign: 'center', overflowY: 'auto' }}
    >
      <LogoDeLaApp />
      <h1 data-nombre-app style={{ margin: 0, font: "400 40px/1 'Instrument Serif',serif" }}>{marca.nombre}</h1>
      <p style={{ margin: 0, font: "400 15px/1.45 'Geist'", color: 'rgba(255,253,248,.78)' }}>Guarda tus viajes, tus fotos y tus logros.</p>
      <span style={{ flex: 1, minHeight: 24 }} />
      {mensaje && paso === 'inicio' && (
        <p role="alert" data-mensaje-entrar style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: '#F3D59A' }}>
          {mensaje}
        </p>
      )}
      <button
        type="button"
        onClick={() => void alGoogle()}
        disabled={ocupado}
        data-entrar-google
        style={{ width: '100%', maxWidth: 420, height: 54, flex: 'none', borderRadius: 999, border: 'none', background: '#FFFDF8', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, font: "600 15px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}
      >
        <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: 'conic-gradient(#EA4335 0 25%,#FBBC05 0 50%,#34A853 0 75%,#4285F4 0)' }} />
        Continuar con Google
      </button>
      <button
        type="button"
        onClick={() => setPaso('email')}
        data-entrar-email
        style={{ width: '100%', maxWidth: 420, height: 54, flex: 'none', borderRadius: 999, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: '#FFFDF8', font: "600 15px 'Geist'", cursor: 'pointer' }}
      >
        Entrar con mi email
      </button>
      <button type="button" onClick={() => setPrivacidad(true)} style={{ minHeight: 44, padding: '0 12px', border: 'none', background: 'transparent', color: 'rgba(255,253,248,.55)', font: "400 12px 'Geist'", textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
        Privacidad y condiciones
      </button>

      {paso === 'email' && (
        <Hoja onCerrar={() => setPaso('inicio')} titulo="Entra con tu email" z={95} datos="A2">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (await mandar()) setPaso('enviado')
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Tu email"
              style={{ height: 52, borderRadius: 14, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 14px', font: "500 16px 'Geist'", color: '#1C2230', background: '#FFFFFF', outline: 'none' }}
            />
            {mensaje && (
              <p role="alert" data-mensaje-entrar style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
                {mensaje}
              </p>
            )}
            <BotonHoja tipo="oscuro" enviar disabled={ocupado || email.trim().length === 0 || restante > 0} datos="enviar-enlace">
              Enviarme el enlace
            </BotonHoja>
            {restante > 0 && <p style={{ margin: 0, textAlign: 'center', font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{textoDeEspera(restante)}</p>}
          </form>
        </Hoja>
      )}

      {paso === 'enviado' && (
        <Hoja onCerrar={() => setPaso('email')} titulo={`Te hemos enviado un enlace a ${emailResumido(email)}`} z={95} datos="A3">
          <p style={{ margin: 0, font: "400 13.5px/1.5 'Geist'", opacity: 0.75 }}>Ábrelo desde este móvil para entrar.</p>
          <a
            href={enlaceDeCorreo(email)}
            target={enlaceDeCorreo(email).startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            data-abrir-correo
            style={{ height: 54, flex: 'none', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 15px 'Geist'", textDecoration: 'none' }}
          >
            Abrir mi correo
          </a>
          {mensaje && (
            <p role="alert" data-mensaje-entrar style={{ margin: 0, textAlign: 'center', font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
              {mensaje}
            </p>
          )}
          <EnlaceHoja datos="reenviar" disabled={ocupado || restante > 0} subtitulo={restante > 0 ? textoDeEspera(restante) : undefined} onClick={() => void mandar()}>
            ¿No te llega? Enviar otra vez
          </EnlaceHoja>
        </Hoja>
      )}
      {privacidad && <PrivacidadScreen onVolver={() => setPrivacidad(false)} />}
    </div>,
    document.body,
  )
}
