import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useCuentanosStore } from '../../store/useCuentanosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { fetchDestinationPlaces } from '../../lib/destinationPlacesApi'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import {
  CUANDOS,
  FALLOS,
  ICONOS_CUENTANOS,
  PRECIOS,
  TEXTO_LEGAL_NO_FUNCIONA,
  TEXTO_PERMISO_FOTO,
  TIPOS,
  avisoValido,
  datosDelAviso,
  metaDe,
  textosDeGracias,
  type Borrador,
  type TipoAviso,
} from '../../lib/cuentanos/tipos'
import { capturarPantalla, contextoDelAviso, enviarAviso, erroresRecientes, hayCuentaDeVerdad, reducirFoto } from '../../lib/cuentanos/envio'
import { MapaDelAviso, direccionDe } from './MapaDelAviso'
import { FONDO_DE_HOJA } from '../ui/fondoDeHoja'
import { BOTON_ORO } from '../ui/botonesOro'

/**
 * (V20) «CUÉNTANOS» (Design «Cuentanos Boton», U1 a U4): el menú de 8 botones, los formularios, «Buscar en el mapa» (U2h) y el gracias (U3). Un solo componente montado una vez en App.
 * Lo que se manda solo y la cola sin red están en `src/lib/cuentanos/envio.ts`.
 */
const SANS = "'Geist',sans-serif"
const SERIE = "'Instrument Serif',serif"

function Trazo({ d, tam = 20, color = 'currentColor', grosor = 1.9 }: { d: string; tam?: number; color?: string; grosor?: number }): ReactNode {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}

/** La hoja de abajo de Design: fondo que oscurece, asa, cabecera con el icono del tipo y la equis de 44 px. */
function Hoja({ titulo, tipo, onCerrar, children, dato }: { titulo: string; tipo?: TipoAviso; onCerrar: () => void; children: ReactNode; dato: string }): ReactNode {
  const meta = tipo ? metaDe(tipo) : null
  return createPortal(
    <div data-cuentanos="hoja" data-hoja-cuentanos={dato} role="dialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-[97]">
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: FONDO_DE_HOJA }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92dvh', overflowY: 'auto', borderRadius: '30px 30px 0 0', background: '#FFFDF8', padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 20px)', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 40px -20px rgba(28,34,48,.5)', fontFamily: SANS, color: '#1C2230' }}>
        <span style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, background: 'rgba(28,34,48,.18)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {meta && (
              <span style={{ flex: 'none', width: 38, height: 38, borderRadius: 12, background: meta.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trazo d={meta.icono} color={meta.trazo} />
              </span>
            )}
            <span data-titulo-cuentanos style={{ font: `400 27px/1.05 ${SERIE}` }}>{titulo}</span>
          </span>
          <button type="button" aria-label="Cerrar" onClick={onCerrar} style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#F1EADC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ───────── Piezas de formulario ───────── */
const caja = { borderRadius: 14, background: '#fff', border: '1px solid rgba(28,34,48,.14)', font: `400 14px ${SANS}`, color: '#1C2230' } as const

function Campo({ etiqueta, opcional = false, children }: { etiqueta: string; opcional?: boolean; children: ReactNode }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ font: `600 13px ${SANS}`, color: '#1C2A52' }}>
        {etiqueta}
        {opcional && <span style={{ fontWeight: 400, color: 'rgba(28,34,48,.45)' }}> · opcional</span>}
      </span>
      {children}
    </div>
  )
}
const Linea = ({ valor, onCambia, ph, dato }: { valor: string; onCambia: (v: string) => void; ph: string; dato: string }) => (
  <input autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" data-campo={dato} value={valor} onChange={(e) => onCambia(e.target.value)} placeholder={ph} maxLength={160} style={{ ...caja, height: 46, padding: '0 14px', width: '100%', boxSizing: 'border-box' }} />
)
const Area = ({ valor, onCambia, ph, alto, dato }: { valor: string; onCambia: (v: string) => void; ph: string; alto: number; dato: string }) => (
  <textarea data-campo={dato} value={valor} onChange={(e) => onCambia(e.target.value)} placeholder={ph} maxLength={1000} style={{ ...caja, height: alto, padding: '12px 14px', width: '100%', boxSizing: 'border-box', lineHeight: 1.35, resize: 'none' }} />
)
function Fichas<T extends string>({ opciones, valor, onElige, ancho = 0, dato }: { opciones: readonly { id: T; texto: string }[]; valor: T | null; onElige: (id: T) => void; ancho?: number; dato: string }): ReactNode {
  return (
    <div data-fichas={dato} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((o) => {
        const on = o.id === valor
        return (
          <button key={o.id} type="button" data-ficha={o.id} aria-pressed={on} onClick={() => onElige(o.id)} style={{ height: 44, minWidth: ancho, padding: '0 14px', borderRadius: 13, cursor: 'pointer', background: on ? '#1C2230' : '#FFFFFF', color: on ? '#F3D88F' : '#1C2230', border: `1px solid ${on ? '#1C2230' : 'rgba(28,34,48,.18)'}`, font: `600 13.5px ${SANS}` }}>
            {o.texto}
          </button>
        )
      })}
    </div>
  )
}

/** Buscador de un sitio del destino (U2d, U2e, U2j): busca en los sitios del catálogo; si no está, vale lo que escriba. */
function BuscadorDeSitio({ valor, onElige, ph = 'Busca un sitio' }: { valor: { nombre: string; id?: string } | null; onElige: (s: { nombre: string; id?: string } | null) => void; ph?: string }): ReactNode {
  const destino = useRouteStore((s) => s.route?.destination ?? '')
  const [texto, setTexto] = useState(valor?.nombre ?? '')
  const [nombres, setNombres] = useState<string[]>([])
  useEffect(() => {
    let vivo = true
    if (destino) void fetchDestinationPlaces(destino).then((c) => vivo && setNombres(c.places.filter((p) => p.kind === 'place' || p.kind === 'restaurant').map((p) => p.name))).catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [destino])
  const norma = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const coincidencias = useMemo(() => {
    const q = norma(texto.trim())
    return q.length < 2 || valor?.nombre === texto ? [] : [...new Set(nombres)].filter((n) => norma(n).includes(q)).slice(0, 6)
  }, [texto, nombres, valor])
  return (
    <div style={{ position: 'relative' }}>
      <input autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" data-campo="sitio" value={texto} onChange={(e) => { setTexto(e.target.value); onElige(e.target.value.trim() ? { nombre: e.target.value } : null) }} placeholder={ph} style={{ ...caja, height: 46, padding: '0 14px', width: '100%', boxSizing: 'border-box' }} />
      {coincidencias.length > 0 && (
        <div data-resultados-sitio style={{ marginTop: 6, borderRadius: 14, background: '#fff', border: '1px solid rgba(28,34,48,.14)', overflow: 'hidden' }}>
          {coincidencias.map((n) => (
            <button key={n} type="button" onClick={() => { setTexto(n); onElige({ nombre: n, id: n }) }} style={{ display: 'block', width: '100%', minHeight: 44, textAlign: 'left', padding: '0 14px', border: 'none', background: 'transparent', cursor: 'pointer', font: `500 14px ${SANS}` }}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Buscador de destinos (ciudades y países) con Mapbox; si no sale, vale lo que escriba. */
function BuscadorDeDestino({ valor, onCambia }: { valor: string; onCambia: (v: string) => void }): ReactNode {
  const [opciones, setOpciones] = useState<string[]>([])
  const [elegido, setElegido] = useState('')
  useEffect(() => {
    if (valor.trim().length < 2 || valor === elegido) return setOpciones([])
    const c = new AbortController()
    const t = window.setTimeout(() => void searchPlaces(valor, c.signal).then((r) => setOpciones(r.slice(0, 5).map((p) => p.fullName))).catch(() => setOpciones([])), 250)
    return () => {
      window.clearTimeout(t)
      c.abort()
    }
  }, [valor, elegido])
  return (
    <div>
      <Linea valor={valor} onCambia={(v) => { setElegido(''); onCambia(v) }} ph="Ej.: Lisboa" dato="destino" />
      {opciones.length > 0 && (
        <div data-resultados-destino style={{ marginTop: 6, borderRadius: 14, background: '#fff', border: '1px solid rgba(28,34,48,.14)', overflow: 'hidden' }}>
          {opciones.map((o) => (
            <button key={o} type="button" onClick={() => { setElegido(o); onCambia(o); setOpciones([]) }} style={{ display: 'block', width: '100%', minHeight: 44, textAlign: 'left', padding: '0 14px', border: 'none', background: 'transparent', cursor: 'pointer', font: `500 14px ${SANS}` }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Un botón para elegir una o varias fotos; devuelve los archivos tal cual (se reducen al enviar, salvo en «Comparte tu foto»). */
function SelectorDeFoto({ archivos, onCambia, grande = false, max = 3 }: { archivos: File[]; onCambia: (f: File[]) => void; grande?: boolean; max?: number }): ReactNode {
  const entrada = useRef<HTMLInputElement>(null)
  const urls = useMemo(() => archivos.map((f) => URL.createObjectURL(f)), [archivos])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input ref={entrada} data-campo="foto" type="file" accept="image/*" hidden multiple={!grande} onChange={(e) => { const nuevos = Array.from(e.target.files ?? []); onCambia(grande ? nuevos.slice(0, 1) : [...archivos, ...nuevos].slice(0, max)); e.target.value = '' }} />
      {urls.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {urls.map((u, i) => (
            <span key={u} style={{ position: 'relative', width: grande ? '100%' : 72, height: grande ? 190 : 72, borderRadius: grande ? 18 : 12, overflow: 'hidden', background: `url(${u}) center/cover` }}>
              <button type="button" aria-label="Quitar la foto" data-quitar-foto onClick={() => onCambia(archivos.filter((_, k) => k !== i))} style={{ position: 'absolute', right: 6, top: 6, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(28,34,48,.7)', color: '#fff', cursor: 'pointer' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {(grande ? urls.length === 0 : urls.length < max) && (
        <button type="button" data-anadir-foto onClick={() => entrada.current?.click()} style={{ height: grande ? 120 : 46, borderRadius: grande ? 18 : 14, border: '1.5px dashed rgba(28,34,48,.25)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: grande ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 9, font: `600 13.5px ${SANS}`, color: '#7A5A1E' }}>
          <Trazo d={ICONOS_CUENTANOS.cam} tam={grande ? 26 : 18} />
          {grande ? 'Elegir foto' : 'Añadir foto'}
        </button>
      )}
    </div>
  )
}

/** «¿Dónde está?»: [Estoy aquí] (la ubicación del móvil) o [Buscar en el mapa] (U2h). */
function DondeEsta({ tipo }: { tipo: TipoAviso }): ReactNode {
  const b = useCuentanosStore((s) => s.borrador)
  const ir = useCuentanosStore((s) => s.ir)
  const ponerPunto = useCuentanosStore((s) => s.ponerPunto)
  const [buscando, setBuscando] = useState(false)
  const estoyAqui = () => {
    if (!navigator.geolocation) return ir({ t: 'mapa', tipo })
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const punto = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        ponerPunto({ ...punto, direccion: (await direccionDe(punto.lat, punto.lng)) ?? undefined })
        setBuscando(false)
      },
      // Sin permiso o sin señal: se abre el mapa.
      () => {
        setBuscando(false)
        ir({ t: 'mapa', tipo })
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  return (
    <Campo etiqueta="¿Dónde está?">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'aqui', texto: buscando ? 'Buscando…' : 'Estoy aquí', on: Boolean(b.punto) && b.punto?.direccion !== 'mapa', f: estoyAqui },
          { id: 'mapa', texto: 'Buscar en el mapa', on: false, f: () => ir({ t: 'mapa', tipo }) },
        ].map((o) => (
          <button key={o.id} type="button" data-donde={o.id} onClick={o.f} style={{ height: 44, minWidth: 150, padding: '0 14px', borderRadius: 13, cursor: 'pointer', background: o.on ? '#1C2230' : '#fff', color: o.on ? '#F3D88F' : '#1C2230', border: `1px solid ${o.on ? '#1C2230' : 'rgba(28,34,48,.18)'}`, font: `600 13.5px ${SANS}` }}>
            {o.texto}
          </button>
        ))}
      </div>
      {b.punto && (
        <span data-punto-elegido style={{ font: `500 12.5px ${SANS}`, color: 'rgba(28,34,48,.6)' }}>
          {b.punto.direccion ?? `${b.punto.lat.toFixed(4)}, ${b.punto.lng.toFixed(4)}`}
        </span>
      )}
    </Campo>
  )
}

/* ───────── U1: el menú ───────── */
function Menu(): ReactNode {
  const ir = useCuentanosStore((s) => s.ir)
  const cerrar = useCuentanosStore((s) => s.cerrar)
  return (
    <Hoja titulo="¿Qué quieres contarnos?" onCerrar={cerrar} dato="menu">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TIPOS.map((t) => (
          <button key={t.id} type="button" data-tipo-cuentanos={t.id} onClick={() => ir({ t: 'form', tipo: t.id })} style={{ height: 112, borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.1)', boxShadow: '0 10px 20px -16px rgba(28,34,48,.4)', padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ width: 46, height: 46, borderRadius: 15, background: t.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trazo d={t.icono} tam={25} color={t.trazo} grosor={1.8} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ font: `600 14px/1.15 ${SANS}` }}>{t.boton}</span>
              <span style={{ font: `400 11px/1.2 ${SANS}`, color: 'rgba(28,34,48,.5)' }}>{t.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </Hoja>
  )
}

/* ───────── Los formularios (U2a a U2j) ───────── */
function Formulario({ tipo }: { tipo: TipoAviso }): ReactNode {
  const b = useCuentanosStore((s) => s.borrador)
  const cambiar = useCuentanosStore((s) => s.cambiar)
  const cerrar = useCuentanosStore((s) => s.cerrar)
  const ir = useCuentanosStore((s) => s.ir)
  const apertura = useCuentanosStore((s) => s.apertura)
  const meta = metaDe(tipo)
  const fotos = useCuentanosStore((s) => s.fotos)
  const setFotos = useCuentanosStore((s) => s.setFotos)
  const [captura, setCaptura] = useState<Blob | null>(null)
  const [urlCaptura, setUrlCaptura] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cuenta, setCuenta] = useState(false)
  useEffect(() => {
    void hayCuentaDeVerdad().then(setCuenta)
  }, [])
  // U2f: la captura de la pantalla en la que estaba, ya puesta (con su × para quitarla).
  useEffect(() => {
    if (tipo !== 'no_funciona') return undefined
    let vivo = true
    void capturarPantalla().then((c) => {
      if (vivo && c) {
        setCaptura(c)
        setUrlCaptura(URL.createObjectURL(c))
      }
    })
    return () => {
      vivo = false
    }
  }, [tipo])
  useEffect(() => () => { if (urlCaptura) URL.revokeObjectURL(urlCaptura) }, [urlCaptura])

  const valido = avisoValido(tipo, b, fotos.length)
  const enviar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setError(null)
    const contexto = contextoDelAviso({ parada: apertura.parada ?? null, dia: apertura.dia ?? null })
    const entera = tipo === 'foto'
    const archivos = entera ? fotos : await Promise.all(fotos.map((f) => reducirFoto(f)))
    const r = await enviarAviso(
      { tipo, datos: datosDelAviso(tipo, b), contexto: { ...contexto, ...(apertura.origen ? { pestana: contexto.pestana || apertura.origen } : {}) }, punto: b.punto, avisame: tipo === 'foto' ? true : b.avisame, errores: tipo === 'no_funciona' ? erroresRecientes() : undefined },
      { fotos: archivos, fotosEnteras: entera, captura: tipo === 'no_funciona' ? captura : null },
    )
    setEnviando(false)
    if (r.estado === 'rechazado') return setError(r.error)
    ir({ t: 'gracias', tipo, enCola: r.estado === 'en_cola' })
  }

  const cuerpo = (): ReactNode => {
    switch (tipo) {
      case 'restaurante':
        return (
          <>
            <Campo etiqueta="Nombre"><Linea valor={b.nombre} onCambia={(v) => cambiar({ nombre: v })} ph="Ej.: Trattoria da Enzo" dato="nombre" /></Campo>
            <DondeEsta tipo={tipo} />
            <Campo etiqueta="Precio"><Fichas opciones={PRECIOS.map((p) => ({ id: p, texto: p }))} valor={b.precio} onElige={(p) => cambiar({ precio: p })} ancho={64} dato="precio" /></Campo>
            <Campo etiqueta="¿Qué tiene de bueno?" opcional><Area valor={b.bueno} onCambia={(v) => cambiar({ bueno: v })} ph="Cuéntanos qué pedirías" alto={64} dato="bueno" /></Campo>
            <Campo etiqueta="Foto" opcional><SelectorDeFoto archivos={fotos} onCambia={setFotos} /></Campo>
          </>
        )
      case 'lugar':
        return (
          <>
            <Campo etiqueta="Nombre"><Linea valor={b.nombre} onCambia={(v) => cambiar({ nombre: v })} ph="Ej.: Mirador del Gianicolo" dato="nombre" /></Campo>
            <DondeEsta tipo={tipo} />
            <Campo etiqueta="¿Por qué merece la pena?" opcional><Area valor={b.porque} onCambia={(v) => cambiar({ porque: v })} ph="Cuéntanos qué lo hace especial" alto={64} dato="porque" /></Campo>
            <Campo etiqueta="Foto" opcional><SelectorDeFoto archivos={fotos} onCambia={setFotos} /></Campo>
          </>
        )
      case 'dato_mal':
        return (
          <>
            <Campo etiqueta="¿De qué sitio?">
              {apertura.sitio ? (
                <div data-sitio-puesto style={{ height: 46, borderRadius: 14, background: '#F7F1E4', border: '1px solid rgba(28,34,48,.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', font: `600 14px ${SANS}` }}>
                  <Trazo d={ICONOS_CUENTANOS.pin} tam={16} color="#7A5A1E" />
                  {apertura.sitio.nombre}
                </div>
              ) : (
                <BuscadorDeSitio valor={b.sitio} onElige={(s) => cambiar({ sitio: s })} />
              )}
            </Campo>
            <Campo etiqueta="¿Qué falla?"><Fichas opciones={FALLOS} valor={b.falla} onElige={(f) => cambiar({ falla: f })} dato="falla" /></Campo>
            <Campo etiqueta="Cuéntanos más" opcional><Area valor={b.mas} onCambia={(v) => cambiar({ mas: v })} ph="Ej.: Ahora cierra a las 18:00" alto={64} dato="mas" /></Campo>
            <Campo etiqueta="Foto" opcional><SelectorDeFoto archivos={fotos} onCambia={setFotos} /></Campo>
          </>
        )
      case 'consejo':
        return (
          <>
            <Campo etiqueta="¿De qué sitio?">
              {apertura.sitio ? (
                <div data-sitio-puesto style={{ height: 46, borderRadius: 14, background: '#F7F1E4', border: '1px solid rgba(28,34,48,.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', font: `600 14px ${SANS}` }}>
                  <Trazo d={ICONOS_CUENTANOS.pin} tam={16} color="#7A5A1E" />
                  {apertura.sitio.nombre}
                </div>
              ) : (
                <BuscadorDeSitio valor={b.sitio} onElige={(s) => cambiar({ sitio: s })} />
              )}
            </Campo>
            <Campo etiqueta="Tu consejo"><Area valor={b.consejo} onCambia={(v) => cambiar({ consejo: v })} ph="Ej.: Llega antes de las 9, después hay cola" alto={96} dato="consejo" /></Campo>
          </>
        )
      case 'no_funciona':
        return (
          <>
            <Campo etiqueta="¿Qué tocaste y qué pasó?"><Area valor={b.que} onCambia={(v) => cambiar({ que: v })} ph="Cuéntanos qué hacías y qué ha pasado" alto={96} dato="que" /></Campo>
            <Campo etiqueta="Captura" opcional>
              {urlCaptura ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span data-captura style={{ position: 'relative', width: 62, height: 92, borderRadius: 12, background: `url(${urlCaptura}) center/cover`, border: '1px solid rgba(28,34,48,.14)', boxShadow: '0 8px 14px -8px rgba(28,34,48,.4)' }}>
                    <button type="button" aria-label="Quitar la captura" data-quitar-captura onClick={() => { setCaptura(null); setUrlCaptura(null) }} style={{ position: 'absolute', right: -8, top: -8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#1C2230', color: '#fff', cursor: 'pointer' }}>×</button>
                  </span>
                  <span style={{ font: `400 12.5px/1.35 ${SANS}`, color: 'rgba(28,34,48,.6)' }}>La pantalla en la que estabas. Si no quieres mandarla, quítala.</span>
                </div>
              ) : (
                <span style={{ font: `400 12.5px ${SANS}`, color: 'rgba(28,34,48,.5)' }}>Sin captura.</span>
              )}
            </Campo>
          </>
        )
      case 'idea':
        return <Campo etiqueta="Tu idea"><Area valor={b.texto} onCambia={(v) => cambiar({ texto: v })} ph="Cuéntanos qué mejorarías" alto={120} dato="texto" /></Campo>
      case 'destino':
        return (
          <>
            <Campo etiqueta="¿Qué destino?"><BuscadorDeDestino valor={b.destino} onCambia={(v) => cambiar({ destino: v })} /></Campo>
            <Campo etiqueta="¿Cuándo te gustaría ir?"><Fichas opciones={CUANDOS} valor={b.cuando} onElige={(c) => cambiar({ cuando: c })} dato="cuando" /></Campo>
            <Campo etiqueta="¿Algo más?" opcional><Area valor={b.mas} onCambia={(v) => cambiar({ mas: v })} ph="Cuéntanos qué te atrae" alto={64} dato="mas" /></Campo>
          </>
        )
      case 'foto':
        return (
          <>
            <Campo etiqueta="¿De qué sitio?">
              {apertura.sitio ? (
                <div data-sitio-puesto style={{ height: 46, borderRadius: 14, background: '#F7F1E4', border: '1px solid rgba(28,34,48,.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', font: `600 14px ${SANS}` }}>
                  <Trazo d={ICONOS_CUENTANOS.pin} tam={16} color="#7A5A1E" />
                  {apertura.sitio.nombre}
                </div>
              ) : (
                <BuscadorDeSitio valor={b.sitio} onElige={(s) => cambiar({ sitio: s })} />
              )}
            </Campo>
            <Campo etiqueta="Tu foto"><SelectorDeFoto archivos={fotos} onCambia={setFotos} grande /></Campo>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input data-casilla-permiso type="checkbox" checked={b.acepta} onChange={(e) => cambiar({ acepta: e.target.checked })} style={{ flex: 'none', width: 26, height: 26, accentColor: '#1C2230' }} />
              <span style={{ font: `400 13.5px/1.4 ${SANS}` }}>{TEXTO_PERMISO_FOTO}</span>
            </label>
            <Campo etiqueta="Tu nombre en la foto"><Linea valor={b.nombreEnFoto} onCambia={(v) => cambiar({ nombreEnFoto: v })} ph="Foto: Laura G." dato="nombre_en_foto" /></Campo>
          </>
        )
    }
  }

  const textoAvisame = tipo === 'destino' ? 'Avísame cuando esté' : 'Avísame cuando lo revisemos'
  return (
    <Hoja titulo={meta.titulo} tipo={tipo} onCerrar={cerrar} dato={tipo}>
      {cuerpo()}
      {tipo !== 'foto' && (
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '2px 2px 0', cursor: 'pointer' }}>
          <span style={{ font: `500 14px ${SANS}` }}>{textoAvisame}</span>
          <input data-avisame type="checkbox" role="switch" checked={b.avisame} onChange={(e) => cambiar({ avisame: e.target.checked })} style={{ flex: 'none', width: 46, height: 28, accentColor: '#1C2230' }} />
        </label>
      )}
      {error && <span data-error-cuentanos style={{ font: `500 12.5px ${SANS}`, color: 'rgb(var(--accent-red))' }}>{error}</span>}
      <button type="button" data-enviar-cuentanos disabled={!valido || enviando} onClick={() => void enviar()} style={{ height: 52, borderRadius: 16, border: 'none', cursor: valido && !enviando ? 'pointer' : 'default', opacity: valido ? 1 : 0.45, ...BOTON_ORO, font: `700 15.5px ${SANS}` }}>
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
      {tipo === 'no_funciona' && <span style={{ textAlign: 'center', font: `400 11.5px/1.35 ${SANS}`, color: 'rgba(28,34,48,.5)', textWrap: 'balance' }}>{TEXTO_LEGAL_NO_FUNCIONA}</span>}
      {!cuenta && b.avisame && tipo !== 'foto' && <span data-sin-cuenta style={{ textAlign: 'center', font: `400 11.5px/1.35 ${SANS}`, color: 'rgba(28,34,48,.5)' }}>Para avisarte en la campana necesitas tu cuenta; sin ella lo mandamos igual, sin tus datos.</span>}
    </Hoja>
  )
}

/* ───────── U3: el gracias ───────── */
function Gracias({ tipo, enCola }: { tipo: TipoAviso; enCola: boolean }): ReactNode {
  const cerrar = useCuentanosStore((s) => s.cerrar)
  const b = useCuentanosStore((s) => s.borrador)
  const [cuenta, setCuenta] = useState(false)
  useEffect(() => {
    void hayCuentaDeVerdad().then(setCuenta)
  }, [])
  const t = textosDeGracias(tipo, b.avisame, cuenta, b.destino)
  return (
    <Hoja titulo="" onCerrar={cerrar} dato="gracias">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '10px 12px 14px', textAlign: 'center' }}>
        <span style={{ width: 74, height: 74, borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%,#FFFFFF,#F0DEB0)', border: '1.5px solid #C9A45A', boxShadow: '0 14px 24px -12px rgba(90,64,16,.55),inset 0 0 0 5px rgba(255,253,246,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trazo d={ICONOS_CUENTANOS.check} tam={34} color="#7A5A1E" grosor={2.6} />
        </span>
        <span data-gracias style={{ font: `400 28px/1.1 ${SERIE}`, textWrap: 'balance' }}>{t.titulo}</span>
        {(t.sub || enCola) && <span style={{ font: `italic 400 17px ${SERIE}`, color: '#8E6820' }}>{enCola ? 'Lo mandamos en cuanto vuelva la conexión.' : t.sub}</span>}
      </div>
      <button type="button" onClick={cerrar} data-cerrar-gracias style={{ height: 50, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#1C2230', color: '#F3EEE4', font: `700 15px ${SANS}` }}>Cerrar</button>
    </Hoja>
  )
}

/* ───────── El anfitrión ───────── */
export function CuentanosHost(): ReactNode {
  const abierto = useCuentanosStore((s) => s.abierto)
  const pantalla = useCuentanosStore((s) => s.pantalla)
  const ir = useCuentanosStore((s) => s.ir)
  const ponerPunto = useCuentanosStore((s) => s.ponerPunto)
  const punto = useCuentanosStore((s) => s.borrador.punto)
  if (!abierto) return null
  if (pantalla.t === 'menu') return <Menu />
  if (pantalla.t === 'form') return <Formulario key={pantalla.tipo} tipo={pantalla.tipo} />
  if (pantalla.t === 'mapa')
    return (
      <MapaDelAviso
        inicial={punto}
        onVolver={() => ir({ t: 'form', tipo: pantalla.tipo })}
        onElegido={(p) => {
          ponerPunto(p)
          ir({ t: 'form', tipo: pantalla.tipo })
        }}
      />
    )
  return <Gracias tipo={pantalla.tipo} enCola={pantalla.enCola} />
}

export type { Borrador }
