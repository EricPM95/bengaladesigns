import { botonChampan } from '../../lib/marcaBoton'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { entrarConCodigo, entrarConEmail, entrarConGoogle, errorDeEntradaPendiente } from '../../lib/cuentas'
import { enlaceDeCorreo, emailResumido, esperaRestante, textoDeEspera } from '../../lib/entrarCuenta'
import { marca } from '../../lib/marca'
import { BotonHoja, EnlaceHoja, Hoja } from '../ui/Hoja'
import { PalabraJutrip } from '../ui/LogoJutrip'
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
 *   A1: arriba solo la palabra JUTRIP (Tanda 10, Marca JUTRIP 02 · 02: más pequeña, sin recuadro ni estrella), [Continuar con Google] y [Entrar con mi email], sobre el crema.
 *   A2: la hoja con el email. A3: «Te hemos enviado un enlace…», [Abrir mi correo] y «¿No te llega? Enviar otra vez» (no deja pedir otro hasta pasado un minuto).
 * `pasoInicial`/`emailInicial` solo los usan las capturas y la prueba.
 */
export function EntrarCuenta({ pasoInicial = 'inicio', emailInicial = '', aviso = null, paraUnirte = false }: { pasoInicial?: Paso; emailInicial?: string; aviso?: string | null; paraUnirte?: boolean }) {
  const [paso, setPaso] = useState<Paso>(pasoInicial)
  const [email, setEmail] = useState(emailInicial)
  const [mensaje, setMensaje] = useState<string | null>(aviso)
  const [ocupado, setOcupado] = useState(false)
  const [privacidad, setPrivacidad] = useState(false)
  const [codigo, setCodigo] = useState('')
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
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#FFFFFF', color: '#1C2230', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(150px, 18vh) 26px calc(44px + env(safe-area-inset-bottom))', gap: 14, textAlign: 'center', overflowY: 'auto' }}
    >
      <h1 data-nombre-app aria-label={marca.nombre} style={{ margin: 0, lineHeight: 1 }}>
        <PalabraJutrip tam={46} />
      </h1>
      <p style={{ margin: 0, font: "400 15px/1.45 'Geist'", color: 'rgba(28,34,48,.72)' }} data-entrar-para-unirte={paraUnirte ? "1" : undefined}>{paraUnirte ? "Entra o crea tu cuenta para unirte." : "Guarda tus viajes, tus fotos y tus logros."}</p>
      <span style={{ flex: 1, minHeight: 24 }} />
      {mensaje && paso === 'inicio' && (
        <p role="alert" data-mensaje-entrar style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
          {mensaje}
        </p>
      )}
      <button
        type="button"
        onClick={() => void alGoogle()}
        disabled={ocupado}
        data-entrar-google
        style={{ width: '100%', maxWidth: 420, height: 54, flex: 'none', borderRadius: 999, border: 'none', background: 'linear-gradient(180deg,#FBF3E2 0%,#EBD9AE 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8),0 8px 14px -8px rgba(111,78,55,.45)', color: '#6F4E37', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, font: "600 15px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}
      >
        <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: 'conic-gradient(#EA4335 0 25%,#FBBC05 0 50%,#34A853 0 75%,#4285F4 0)' }} />
        Continuar con Google
      </button>
      <button
        type="button"
        onClick={() => setPaso('email')}
        data-entrar-email
        style={{ width: '100%', maxWidth: 420, height: 54, flex: 'none', borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: '#FFFDF8', color: '#1C2230', font: "600 15px 'Geist'", cursor: 'pointer' }}
      >
        Entrar con mi email
      </button>
      <button type="button" onClick={() => setPrivacidad(true)} style={{ minHeight: 44, padding: '0 12px', border: 'none', background: 'transparent', color: 'rgba(28,34,48,.62)', font: "400 12px 'Geist'", textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
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
              <p role="alert" data-mensaje-entrar style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
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
            style={{ height: 54, flex: 'none', borderRadius: 999, ...botonChampan(), display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 15px 'Geist'", textDecoration: 'none' }}
          >
            Abrir mi correo
          </a>
          {mensaje && (
            <p role="alert" data-mensaje-entrar style={{ margin: 0, textAlign: 'center', font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
              {mensaje}
            </p>
          )}
          {/* Tanda 10G: si el enlace se abre en otro navegador (la app de Gmail, Safari con la app instalada), la sesión se queda allí: con el código del email se entra aquí mismo. */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setOcupado(true)
              setMensaje(null)
              const r = await entrarConCodigo(email, codigo)
              setOcupado(false)
              if (r.error) setMensaje(r.error)
            }}
            data-codigo-email
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <p style={{ margin: 0, font: "400 12.5px/1.45 'Geist'", color: 'rgba(28,34,48,.62)' }}>¿Se ha abierto el enlace en otro navegador? Escribe aquí el código de números del email.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-label="Código del email" style={{ flex: 1, height: 46, borderRadius: 14, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 14px', font: "500 16px 'Geist'", color: '#1C2230', background: '#FFFFFF', outline: 'none' }} />
              <button type="submit" disabled={ocupado || codigo.trim().length < 6} style={{ height: 46, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: '#FFFDF8', font: "600 14px 'Geist'", color: '#1C2230' }}>
                Entrar
              </button>
            </div>
          </form>
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
