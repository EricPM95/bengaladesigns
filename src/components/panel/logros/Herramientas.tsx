import { useEffect, useState, type ReactNode } from 'react'
import { llamar } from '../../../lib/logros'
import { useSinPasePrueba } from '../../../store/useSinPasePrueba'
import { empezarDeCero, puedeEmpezarDeCero } from '../../../lib/empezarDeCero'
import { misPases, type PaseMio } from '../../../lib/pagoPase'
import { ROSA, ROSA_FONDO, tarjetaBlanca, titulo14, TINTA, ORO } from './comun'
import { ParaCode } from './ParaCode'
import { CuentasQueNoCuentan } from './CuentasQueNoCuentan'
import { BOTON_ORO } from '../../ui/botonesOro'

/**
 * (V35A, Design P7c / M7c) HERRAMIENTAS: «Dar Probador», «Mis pruebas» y, plegado al final, «Para Code».
 * «Mis pruebas» (solo la cuenta de quien pulsa: el servidor saca la cuenta de la sesión, nadie puede pasar otra):
 *   [Ver la app sin pase]    la app te trata como a quien no ha comprado el pase (solo tu cuenta; no toca el pase de verdad ni los cobros)
 *   [Empezar de cero]        deja TU cuenta como recién creada (con confirmación)
 *   [Reiniciar mis pruebas]  borra solo lo de pruebas de TU cuenta (con confirmación)
 * Debajo de cada botón de borrar, una línea que dice EXACTAMENTE qué borra (de `empezar_de_cero`, migración 0089, y `server/logros/reiniciar.js`).
 */

/** Lo que borra «Empezar de cero» (la función `empezar_de_cero` de la base de datos, migración 0089, y los archivos de fotos). Una frase, sin inventar nada. */
export const QUE_BORRA_EMPEZAR_DE_CERO =
  'Borra de tu cuenta: tus viajes (con sus reservas, gastos y fotos), tus logros y tu experiencia, tus pases, tus avisos y suscripciones de avisos, tus «me gusta» y las respuestas de la primera vez. La cuenta se queda, y también las pruebas gratis ya gastadas y los registros de cobros.'
/** Lo que borra «Reiniciar mis pruebas» (server/logros/reiniciar.js › TABLAS_DE_PRUEBAS). */
export const QUE_BORRA_REINICIAR =
  'Borra solo lo de pruebas de tu cuenta: el día de prueba de HOY, los logros ganados (y los hechos con que se calculan), la experiencia, los pases comprados con sus plazas y los avisos de los logros y de la campana. No toca tus viajes, tus fotos ni la cuenta.'

/**
 * (V35B) Pura: cuántos pases PAGADOS perdería quien pulsa «Empezar de cero». `empezar_de_cero` (migración 0089) borra los pases donde la cuenta es la compradora (`passes.comprador_id`); antes, `preparar_borrado` (0021)
 * pasa el pase a otra persona si alguien más lo usa o es su destinatario. El registro de cobros (`pagos_registro`) NO se borra: el dinero cobrado se queda en la contabilidad y no se devuelve.
 * Pagado = activo, comprado por esta cuenta y con cobro (`tiene_recibo`: lleva referencia de pago); no cuentan los regalados ni los de prueba.
 */
export function pasesPagadosQueSePierden(pases: PaseMio[]): number {
  return pases.filter((p) => p.es_mio && p.estado === 'activo' && p.tiene_recibo && !p.miembros.some((m) => !m.es_yo)).length
}

const botonRosa ={ minHeight: 48, padding: '0 20px', borderRadius: 14, background: ROSA_FONDO, border: '1.5px solid oklch(0.58 0.19 5 / .4)', color: ROSA, font: "700 14px 'Geist'", cursor: 'pointer' } as const
const lineaQueBorra = { margin: 0, font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' } as const

export function Herramientas({ movil }: { movil: boolean }): ReactNode {
  return (
    <>
      <Probador movil={movil} />
      <MisPruebas movil={movil} />
      <CuentasQueNoCuentan movil={movil} />
      <ParaCode movil={movil} />
    </>
  )
}

function Probador({ movil }: { movil: boolean }): ReactNode {
  const [email, setEmail] = useState('')
  const [resultado, setResultado] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const dar = async () => {
    setOcupado(true)
    const r = await llamar<{ ok: boolean; error?: string }>('/api/admin/logros/probador', { cuerpo: { email } })
    setOcupado(false)
    setResultado(r?.ok ? 'Probador dado.' : 'No se ha podido (¿existe esa cuenta?).')
  }
  return (
    <section data-herramienta="probador" style={tarjetaBlanca}>
      <span style={titulo14}>Dar «Probador»</span>
      <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>El correo de la cuenta que va a probar la app.</span>
      <div style={{ display: 'flex', gap: 10, flexDirection: movil ? 'column' : 'row' }}>
        <input type="email" aria-label="Correo de la cuenta" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@example.com" style={{ flex: 1, minHeight: 48, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.16)', padding: '0 16px', font: "400 14px 'Geist'", minWidth: 0 }} />
        <button type="button" data-probador-dar disabled={ocupado || !email.trim()} onClick={() => void dar()} style={{ minHeight: 48, padding: '0 22px', borderRadius: 14, border: 'none', ...BOTON_ORO, font: "700 14px 'Geist'", cursor: 'pointer', opacity: ocupado || !email.trim() ? 0.6 : 1 }}>Dar insignia Probador</button>
      </div>
      {resultado && <p role="status" style={{ margin: 0, font: "500 13.5px 'Geist'" }}>{resultado}</p>}
    </section>
  )
}

function MisPruebas({ movil }: { movil: boolean }): ReactNode {
  const [sinPase, setSinPase] = useState<boolean | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const poner = useSinPasePrueba((s) => s.poner)
  const [puedeCero, setPuedeCero] = useState(false)
  const [confirmando, setConfirmando] = useState<'cero' | 'reinicio' | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void llamar<{ ok: boolean; activo: boolean }>('/api/pase/sin-pase').then((r) => vivo && setSinPase(Boolean(r?.ok && r.activo)))
    void puedeEmpezarDeCero().then((p) => vivo && setPuedeCero(p))
    return () => {
      vivo = false
    }
  }, [])
  // (V35B) Al abrir la confirmación de «Empezar de cero», se miran los pases PAGADOS que se perderían (activos, comprados por esta cuenta y que nadie más usa: si otra persona lo usa, el pase pasa a ella).
  const [pagados, setPagados] = useState(0)
  useEffect(() => {
    if (confirmando !== 'cero') return undefined
    let vivo = true
    void misPases().then((lista) => vivo && setPagados(pasesPagadosQueSePierden(lista)))
    return () => {
      vivo = false
    }
  }, [confirmando])
  const cambiarSinPase = async () => {
    const nuevo = !sinPase
    const r = await llamar<{ ok: boolean; activo?: boolean }>('/api/admin/logros/sin-pase', { cuerpo: { activo: nuevo } })
    if (r?.ok) {
      setSinPase(nuevo)
      poner(nuevo)
      setAviso(nuevo ? 'Encendido: la app te trata como a quien no ha comprado el pase. Vuelve a la app (verás la etiqueta «Sin pase (prueba)»).' : 'Apagado: vuelves a tener tu pase.')
    } else setAviso('No se ha podido guardar (¿está aplicada la migración 0030?). Todo queda como estaba.')
  }
  const borrarTodo = async () => {
    setOcupado(true)
    setError(null)
    const fallo = await empezarDeCero()
    if (fallo) {
      setOcupado(false)
      setConfirmando(null)
      setError(fallo)
    }
  }
  const reiniciar = async () => {
    setOcupado(true)
    const r = await llamar<{ ok: boolean; borrados?: Record<string, number>; error?: string }>('/api/admin/logros/reiniciar-mis-pruebas', { cuerpo: { confirmar: true } })
    setOcupado(false)
    setConfirmando(null)
    setResultado(r?.ok ? 'Hecho: tu día de prueba, tus logros, tu EXP, tus pases de prueba y tus avisos están a cero. Cierra la app y vuelve a abrirla.' : 'No se ha podido reiniciar. Vuelve a probar.')
  }
  const caja = { display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: '#FFFBF0', border: '1.5px solid #D8BE84', flexWrap: 'wrap' } as const
  const si = { minHeight: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: 'oklch(0.55 0.19 5)', color: '#fff', font: "700 13px 'Geist'", cursor: 'pointer' } as const
  const no = { minHeight: 44, padding: '0 16px', borderRadius: 12, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.18)', font: "700 13px 'Geist'", cursor: 'pointer' } as const
  return (
    <section data-herramienta="mis-pruebas" style={tarjetaBlanca}>
      <span style={titulo14}>Mis pruebas</span>
      <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Solo afectan a tu cuenta (la de ahora): nadie más se toca.</span>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 14, alignItems: 'start' }}>
        <div data-ver-sin-pase style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" data-ver-sin-pase-boton aria-pressed={Boolean(sinPase)} disabled={sinPase === null} onClick={() => void cambiarSinPase()} style={{ minHeight: 48, padding: '0 20px', borderRadius: 14, border: 'none', background: TINTA, color: ORO, font: "700 14px 'Geist'", cursor: 'pointer', opacity: sinPase === null ? 0.6 : 1 }}>{sinPase ? 'Volver a ver la app con pase' : 'Ver la app sin pase'}</button>
          <p style={lineaQueBorra}>No borra nada: la app te trata como a alguien que no ha comprado el pase (lo de pago, cerrado). No toca el pase de verdad ni los cobros. {sinPase ? 'Ahora está encendido.' : 'Ahora está apagado.'}</p>
        </div>
        {puedeCero && (
          <div data-empezar-de-cero style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" data-empezar-de-cero-boton onClick={() => setConfirmando('cero')} style={botonRosa}>Empezar de cero</button>
            <p data-que-borra="cero" style={lineaQueBorra}>{QUE_BORRA_EMPEZAR_DE_CERO}</p>
          </div>
        )}
        <div data-reiniciar-pruebas style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" data-reiniciar-boton onClick={() => setConfirmando('reinicio')} style={botonRosa}>Reiniciar mis pruebas</button>
          <p data-que-borra="reinicio" style={lineaQueBorra}>{QUE_BORRA_REINICIAR}</p>
        </div>
      </div>
      {confirmando === 'cero' && (
        <div data-empezar-de-cero-dialogo role="alertdialog" aria-label="Empezar de cero" style={caja}>
          <span style={{ flex: 1, minWidth: 220, font: "500 13.5px/1.4 'Geist'" }}>
            {pagados > 0 && (
              <b data-aviso-pases-pagados style={{ display: 'block', margin: '0 0 6px', color: ROSA }}>
                Tienes {pagados} {pagados === 1 ? 'pase pagado' : 'pases pagados'}: se {pagados === 1 ? 'borrará' : 'borrarán'} con todo lo demás y no se devuelve el dinero.
              </b>
            )}
            Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia y los pases. La cuenta se queda. Las pruebas gratis que ya has usado no vuelven. ¿Seguro?
          </span>
          <button type="button" data-empezar-de-cero-no disabled={ocupado} onClick={() => setConfirmando(null)} style={no}>Cancelar</button>
          <button type="button" data-empezar-de-cero-si disabled={ocupado} onClick={() => void borrarTodo()} style={si}>Sí, empezar de cero</button>
        </div>
      )}
      {confirmando === 'reinicio' && (
        <div data-reiniciar-dialogo role="alertdialog" aria-label="Reiniciar mis pruebas" style={caja}>
          <span style={{ flex: 1, minWidth: 220, font: "500 13.5px/1.4 'Geist'" }}>¿Seguro? «Reiniciar mis pruebas» borra lo de pruebas de esta cuenta y no se puede deshacer.</span>
          <button type="button" data-reiniciar-no disabled={ocupado} onClick={() => setConfirmando(null)} style={no}>Cancelar</button>
          <button type="button" data-reiniciar-si disabled={ocupado} onClick={() => void reiniciar()} style={si}>Sí, reiniciar</button>
        </div>
      )}
      {aviso && <p role="status" style={{ margin: 0, font: "500 13.5px 'Geist'" }}>{aviso}</p>}
      {error && <p role="alert" style={{ margin: 0, font: "500 13.5px 'Geist'", color: ROSA }}>{error}</p>}
      {resultado && <p role="status" style={{ margin: 0, font: "500 13.5px 'Geist'" }}>{resultado}</p>}
    </section>
  )
}
