import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Chapa } from '../../dibujos'
import { agruparViajes } from '../../../perfil/agruparViajes'
import { Icono } from '../../../ui/Icono'
import { useEliminarViaje } from '../../../../lib/eliminarViaje'
import { guardarPerfil, leerPerfilGuardado, mismoPerfil, uidDeLaSesion } from '../../../../lib/perfilEnCache'
import { nombreVisible } from '../../../../lib/nombrePersona'
import { usePerfilUi } from '../../../../store/usePerfilUi'
import { BotonEditarViajes } from '../../../perfil/BotonEditarViajes'
import { PerfilEsqueleto } from '../../../perfil/PerfilEsqueleto'
import { plural, cifrasDelPerfil, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { logrosActivos } from '../../../../lib/logros'
import { Avatar } from '../../../ajustes/Avatar'
import { BilleteDelSorteo } from '../sorteo/Billete'
import { TarjetaPasaporte } from './TarjetaPasaporte'
import { useLogrosPantallas } from '../useLogrosPantallas'
import { elegirTitulo, pedirPerfil, type PerfilLogros } from './api'
import { ElegirTitulo } from './ElegirTitulo'
import { InicialEnMarco, MarcoDeRango } from './MarcoDeRango'
import { ExpEnPequeno } from './NivelYBarra'
import { PiezaDeVitrina } from './PiezaDeVitrina'
import { TarjetaDeViaje, type EtiquetaDeViaje } from './TarjetaDeViaje'
import { ListaDeViajes } from './ListaDeViajes'
import { textoDeNivel } from './util'
import { inicialDeNombre } from '../../../../lib/miPerfil'
import { useMiNombreYFoto } from '../../../../store/useMiPerfil'
import { useAjustesUi } from '../../../../store/useAjustesUi'

const DORADO = '#F3D59A'

/**
 * EL PERFIL (Tanda 10N5, apartado 4: el orden nuevo, `Piezas/Perfil Orden` y `Piezas/Mis Viajes Tarjeta` de Design, exactamente igual). De arriba abajo:
 *   1. UNA sola cabecera: la foto en su moneda con el marco de nivel, «Hola, {nombre}», «Nivel 1 · Soñador» y, debajo, la EXP en pequeño (la barra y «0 / 500 · Te faltan 500 para el nivel 2»).
 *      Los ajustes y la ✕ van arriba a la derecha (los pinta PerfilSheet); ya no hay palabra «PERFIL».
 *   2. «Mis viajes» en fila para deslizar de lado (el en curso o el próximo, primero; el siguiente asoma), «Ver todos (N)» a la derecha del título y los de antes de la app («Antes de la app · 3 países») como una tarjeta más, al final.
 *   3. «Mi vitrina» y «Mi pasaporte», sin tocar.   4. El billete del sorteo, abajo del todo.
 * El [+] flotante lo pinta PerfilSheet. Sin los logros: la misma cabecera sin EXP, sus viajes y su pasaporte de este móvil (ni vitrina, ni sorteo).
 * Se abre AL MOMENTO: lo último que se vio del Perfil se guarda en el móvil (`perfilEnCache`) y sale al instante; los datos nuevos llegan por detrás y solo cambian lo que cambie.
 * Tanda 10N4: es el ÚNICO Perfil de la app; sin logros no pide NADA de logros al servidor.
 */
export interface PropsCuerpoConLogros {
  viajes: ResumenViaje[]
  fotos: Map<string, number> | null
  rutaAbiertaId: string | null
  onAbrirAlbum: (id: string) => void
  onAbrirViaje: (viaje: ResumenViaje) => void
  /** Los datos de prueba (el escaparate, la prueba): si vienen, no se llama al servidor ni se usa lo guardado. */
  perfilInicial?: PerfilLogros | null
}

/** Pide el perfil al servidor y lo deja guardado en el móvil (para que la próxima vez salga al instante). Se llama en reposo, antes de que nadie abra el Perfil. */
export async function precalentarPerfil(): Promise<void> {
  if (!logrosActivos()) return
  const p = await pedirPerfil()
  if (p) guardarPerfil(await uidDeLaSesion(), p)
}

const CHEVRON = 'M9 5l7 7-7 7'

export default function CuerpoConLogros({ viajes, fotos, onAbrirAlbum, onAbrirViaje, perfilInicial = null }: PropsCuerpoConLogros): ReactNode {
  // (Tanda 10N4) UN solo Perfil: con los logros apagados es este mismo, sin lo de los logros y sin pedir NADA de logros al servidor.
  const conLogros = logrosActivos()
  // (Tanda 10N5) Lo último que se vio, al instante (si no hay datos de prueba): el `uid` se confirma justo después.
  const [guardado] = useState(() => (perfilInicial || !conLogros ? null : leerPerfilGuardado()))
  const [perfil, setPerfil] = useState<PerfilLogros | null>(perfilInicial ?? guardado?.perfil ?? null)
  const [eligiendo, setEligiendo] = useState(false)
  const [verTodos, setVerTodos] = useState(false)
  const editando = usePerfilUi((s) => s.editando)
  const pedirEliminar = useEliminarViaje((s) => s.pedir)
  const pantallas = useLogrosPantallas((s) => s.pila.length)
  const abrir = useLogrosPantallas.getState().abrir
  // Mi nombre y mi foto (cuentas parte 3): «Hola, {nombre}» y la foto en el marco; tocar el círculo los cambia.
  const yo = useMiNombreYFoto()
  const editarPerfil = useAjustesUi((s) => s.editarPerfil)
  const nombre = nombreVisible(yo.nombre) || yo.nombre

  // Al abrir el Perfil y cada vez que se vuelve de una pantalla de logros (por si ha cambiado el título o la vitrina): los datos nuevos llegan por detrás y SOLO cambian lo que cambie.
  useEffect(() => {
    if (!conLogros || perfilInicial || pantallas > 0) return
    let vivo = true
    void (async () => {
      const [p, uid] = await Promise.all([pedirPerfil(), uidDeLaSesion()])
      if (!vivo) return
      // Lo guardado era de otra cuenta: fuera.
      if (guardado && uid && guardado.uid !== uid) setPerfil((prev) => (prev === guardado.perfil ? null : prev))
      if (!p) return
      guardarPerfil(uid, p)
      setPerfil((prev) => (mismoPerfil(prev, p) ? prev : p))
    })()
    return () => {
      vivo = false
    }
  }, [conLogros, pantallas, perfilInicial, guardado])

  // El pasaporte de este móvil (sin logros): lo que cuentan los viajes guardados; no abre el pasaporte por dentro, que es de los logros.
  const pasaporteLocal = useMemo(() => {
    const c = cifrasDelPerfil(viajes)
    return { paises: c.paises, ciudades: c.lugares, sellos: 0, paises_iso: [...new Set(viajes.flatMap((v) => v.paises))] }
  }, [viajes])

  const grupos = useMemo(() => agruparViajes(viajes), [viajes])
  // La fila de Mis viajes: el en curso, luego los próximos y al final los ya hechos (con su etiqueta).
  const enFila = useMemo(() => grupos.flatMap((g) => g.viajes.map((v) => ({ viaje: v, etiqueta: g.clave as EtiquetaDeViaje }))), [grupos])
  const elegir = useCallback(
    async (clave: string | null) => {
      setEligiendo(false)
      if (!perfil) return
      const nuevo = clave ? (perfil.titulos.find((t) => t.clave === clave) ?? null) : null
      setPerfil({ ...perfil, titulo: nuevo })
      if (!(await elegirTitulo(clave))) setPerfil(perfil)
    },
    [perfil],
  )

  const antes = conLogros ? (perfil?.previos.paises ?? 0) : 0
  // (Tanda 10N8 §1) Con una sola tarjeta, a todo el ancho; con más, el 60 % para que se vea la siguiente y se entienda que se desliza.
  const anchoDeTarjeta = enFila.length + (antes > 0 ? 1 : 0) <= 1 ? '100%' : '60%'
  const eliminar = (viaje: ResumenViaje) => pedirEliminar(viaje, fotos ? (fotos.get(viaje.id) ?? 0) : null)
  const abrirDentro = (viaje: ResumenViaje) => (conLogros ? abrir({ t: 'viaje', tripId: viaje.id }) : onAbrirAlbum(viaje.id))

  // «Mis viajes»: sale igual con y sin los datos del servidor.
  const misViajes = (
    <section data-mis-viajes style={{ marginTop: 38 }}>
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <h3 style={{ margin: 0, font: "400 34px/1 'Instrument Serif',serif" }}>Mis viajes</h3>
          {viajes.length > 0 && <BotonEditarViajes />}
        </span>
        {viajes.length > 0 && (
          <button className="zona-toque" type="button" onClick={() => setVerTodos(true)} data-ver-todos style={{ font: "600 14px 'Geist'", color: '#6F4E37', display: 'flex', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', minHeight: 36, flex: 'none' }}>
            <span data-numero-de-viajes>Ver todos ({viajes.length})</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F4E37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d={CHEVRON} />
            </svg>
          </button>
        )}
      </div>
      {viajes.length === 0 && antes === 0 && <p style={{ margin: '12px 20px 0', font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Aún no tienes viajes guardados en este dispositivo.</p>}
      {(viajes.length > 0 || antes > 0) && (
        <div data-fila-de-viajes data-ancho-tarjeta={anchoDeTarjeta} className="trazo-noscroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 20, padding: '12px 20px 6px 20px', scrollbarWidth: 'none' }}>
          {enFila.map(({ viaje, etiqueta }) => (
            <TarjetaDeViaje key={viaje.id} viaje={viaje} etiqueta={etiqueta} onAbrir={() => abrirDentro(viaje)} onAbrirViaje={() => onAbrirViaje(viaje)} editando={editando} onEliminar={() => eliminar(viaje)} ancho={anchoDeTarjeta} />
          ))}
          {antes > 0 && (
            <button type="button" onClick={() => abrir({ t: 'previos' })} data-viajes-de-antes style={{ flex: 'none', width: anchoDeTarjeta, minHeight: 190, scrollSnapAlign: 'start', borderRadius: 26, background: '#F1E8D6', border: '1.5px dashed rgba(28,34,48,.25)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, boxSizing: 'border-box', textAlign: 'left', color: '#1C2230', cursor: 'pointer' }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E5018' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                  <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                </svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ font: "400 26px/1.05 'Instrument Serif',serif" }}>Antes de la app</span>
                <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{plural(antes, 'país', 'países')}</span>
              </span>
            </button>
          )}
          <span aria-hidden="true" style={{ flex: 'none', width: 8 }} />
        </div>
      )}
    </section>
  )

  const lista = verTodos && (
    <ListaDeViajes
      grupos={grupos}
      antesDeLaApp={antes}
      onVolver={() => setVerTodos(false)}
      onAbrirViaje={(v, etiqueta) => (etiqueta === 'hecho' ? abrirDentro(v) : onAbrirViaje(v))}
      onAbrirAntes={() => abrir({ t: 'previos' })}
      editando={editando}
      onEliminar={eliminar}
    />
  )

  // Sin logros (Tanda 10N4): el mismo Perfil, sin EXP, vitrina, título ni billete. Su foto con el nombre, sus viajes y su pasaporte de este móvil.
  if (!conLogros) {
    return (
      <>
        <div style={{ padding: '0 20px' }} data-cabecera-sin-logros>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <button type="button" onClick={() => editarPerfil(true)} aria-label="Cambiar mi foto y mi nombre" data-editar-perfil className="flex-none rounded-full" style={{ boxShadow: '0 0 0 3px rgb(var(--bg)),0 0 0 4.5px rgb(var(--accent))' }}>
              <Avatar foto={yo.foto} inicial={inicialDeNombre(yo.tieneNombre ? yo.nombre : null)} tam={118} encuadre={yo.encuadre} />
            </button>
            <h2 style={{ margin: 0, minWidth: 0, flex: 1, font: "400 34px/1 'Instrument Serif',serif", overflowWrap: 'anywhere' }}>
              Hola, <em>{nombre}</em>
            </h2>
          </div>
        </div>
        {misViajes}
        <div style={{ margin: '20px 20px 0' }}>
          <TarjetaPasaporte pasaporte={pasaporteLocal} />
        </div>
        {lista}
      </>
    )
  }

  // Sin nada guardado y mientras llegan los datos: el perfil nuevo vacío y, debajo, los viajes de este móvil.
  if (!perfil) {
    return (
      <>
        <PerfilEsqueleto nombre={yo.tieneNombre ? nombre : null} titulo={false} />
        {misViajes}
        {lista}
      </>
    )
  }
  const { exp } = perfil
  return (
    <>
      <div style={{ padding: '0 20px' }} data-cabecera-con-marco>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <button type="button" onClick={() => editarPerfil(true)} aria-label="Cambiar mi foto y mi nombre" data-editar-perfil className="flex-none rounded-full">
            <MarcoDeRango rango={exp.rango_ix} estrellas={exp.estrellas} leyenda={exp.leyenda_estrellas} tam={118} etiqueta={`Marco ${exp.rango}, nivel ${exp.estrellas} de 5`}>
              <InicialEnMarco letra={inicialDeNombre(yo.tieneNombre ? yo.nombre : null)} tam={118} foto={yo.foto} encuadre={yo.encuadre} />
            </MarcoDeRango>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, font: "400 34px/1 'Instrument Serif',serif", overflowWrap: 'anywhere' }}>
              Hola, <em>{nombre}</em>
            </h2>
            <span data-nivel-y-rango style={{ font: "600 14px 'Geist'", color: 'rgba(28,34,48,.75)' }}>
              {textoDeNivel(exp)}
            </span>
            {perfil.titulos.length > 0 && (
              <button type="button" onClick={() => setEligiendo(true)} data-titulo-del-perfil className="-my-1.5 flex min-h-[44px] items-center self-start">
                <span className="flex h-[30px] items-center gap-1.5 rounded-full border border-text/10 bg-white py-0 pl-1 pr-2.5 text-[13px] font-medium text-text">
                  {perfil.titulo ? <Chapa logro={perfil.titulo.id} escalon={perfil.titulo.escalon ?? undefined} tam={22} /> : <span className="w-2" />}
                  {perfil.titulo ? perfil.titulo.nombre : 'Elige tu título'}
                  <Icono nombre="abajo" size={12} className="text-text/55" />
                </span>
              </button>
            )}
          </div>
        </div>
        <ExpEnPequeno exp={exp} />
      </div>

      {misViajes}

      <div style={{ margin: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section className="relative flex flex-none flex-col overflow-hidden rounded-[26px] px-[18px] py-3.5 text-[#FFFDF8]" style={{ background: 'radial-gradient(circle at 50% 0%,#1E2648 0%,#0B0E1C 70%)', minHeight: 200 }} aria-label="Mi vitrina" data-vitrina-del-perfil>
          <span className="flex items-baseline justify-between">
            <span className="font-display text-[26px] leading-none">Mi vitrina</span>
            <button type="button" onClick={() => abrir({ t: 'todos', pestana: 'vitrina' })} data-abrir-vitrina className="-my-2 flex h-11 flex-none items-center gap-1 whitespace-nowrap rounded-full px-1 text-[12px] font-semibold" style={{ color: DORADO }}>
              <span className="flex h-[30px] items-center gap-1 rounded-full border pl-3 pr-2" style={{ borderColor: 'rgba(243,213,154,.45)', background: 'rgba(243,213,154,.12)' }}>
                {plural(perfil.vitrina.logros, 'logro', 'logros')}
                <Icono nombre="adelante" size={15} grosor={2.4} />
              </span>
            </button>
          </span>
          <div className="relative grid flex-1 grid-cols-3 items-end px-1 pb-3 pt-2">
            {perfil.vitrina.recientes.map((p) => (
              <div key={p.clave} className="relative flex flex-col items-center">
                <span aria-hidden="true" className="absolute left-1/2 -top-[22px] -ml-12 h-[130px] w-24" style={{ background: 'radial-gradient(ellipse 50% 90% at 50% 0%,rgba(255,226,170,.36),transparent 72%)', clipPath: 'polygon(36% 0,64% 0,100% 100%,0 100%)' }} />
                <span className="relative flex h-[92px] items-end">
                  <PiezaDeVitrina pieza={p} tam={74} />
                </span>
                <span aria-hidden="true" className="mt-[3px] h-2 w-[58px] rounded-[50%] bg-black/50" />
              </div>
            ))}
            {perfil.vitrina.recientes.length === 0 && <p className="col-span-3 m-0 self-center pb-4 text-center font-display text-[18px] italic text-white/60">Tu primer logro irá aquí</p>}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 h-0.5 rounded-sm" style={{ background: 'linear-gradient(90deg,transparent,rgba(220,230,255,.55),transparent)' }} />
          </div>
        </section>

        {/* (10P, 1.8) Un solo «Mi pasaporte»: lo visitado, con su mapa en el círculo. */}
        <TarjetaPasaporte pasaporte={perfil.pasaporte} onAbrir={() => abrir({ t: 'pasaporte' })} />

        {/* El billete del sorteo, abajo del todo. */}
        {perfil.sorteo && <BilleteDelSorteo sorteo={perfil.sorteo} onAbrir={() => abrir({ t: 'sorteo' })} />}
      </div>

      {eligiendo && <ElegirTitulo titulos={perfil.titulos} elegido={perfil.titulo?.clave ?? null} onElegir={(c) => void elegir(c)} onCerrar={() => setEligiendo(false)} />}
      {lista}
    </>
  )
}
