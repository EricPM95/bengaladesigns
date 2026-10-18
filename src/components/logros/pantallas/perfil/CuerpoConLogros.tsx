import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Chapa } from '../../dibujos'
import { MapaMisViajes } from '../../../perfil/MapaMisViajes'
import { agruparViajes } from '../../../perfil/agruparViajes'
import { Icono } from '../../../ui/Icono'
import { plural, type Chincheta, type CifrasDelPerfil, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { useLogrosPantallas } from '../useLogrosPantallas'
import { elegirTitulo, pedirPerfil, type PerfilLogros } from './api'
import { ElegirTitulo } from './ElegirTitulo'
import { InicialEnMarco, MarcoDeRango } from './MarcoDeRango'
import { NivelYBarra } from './NivelYBarra'
import { PiezaDeVitrina } from './PiezaDeVitrina'
import { TarjetaDeViaje } from './TarjetaDeViaje'
import { textoDeNivel } from './util'
import { inicialDeNombre } from '../../../../lib/miPerfil'
import { useMiNombreYFoto } from '../../../../store/useMiPerfil'
import { useAjustesUi } from '../../../../store/useAjustesUi'

const ETIQUETA_DE_GRUPO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em' } as const
const DORADO = '#F3D59A'

/**
 * EL PERFIL CON SUS LOGROS (P1 y P1b de Design): lo que sustituye al «Hola, viajero» de siempre y a la lista de viajes cuando los logros están encendidos Y hay datos del servidor. De arriba abajo:
 * el marco de rango con la foto (la inicial, si no hay foto), «Hola, viajero», «Nivel 8 · Explorador» y el título que se elige al tocarlo; la barra de EXP; Mi vitrina; Mi pasaporte; el mapa de mis viajes;
 * Mis viajes (en curso, próximo, ya hechos y los de antes de la app) y «Añadir un viaje que ya hiciste».
 * Mientras llegan los datos —o si no hay cuenta, o no hay servidor— se enseña `cuerpoDeSiempre`: el Perfil EXACTAMENTE como era. Este archivo se baja solo cuando el Perfil se abre con los logros encendidos.
 */
export interface PropsCuerpoConLogros {
  cuerpoDeSiempre: ReactNode
  viajes: ResumenViaje[]
  chinchetas: Chincheta[]
  cifras: CifrasDelPerfil
  fotos: Map<string, number> | null
  rutaAbiertaId: string | null
  onAbrirAlbum: (id: string) => void
  onAbrirViaje: (viaje: ResumenViaje) => void
  /** Los datos de prueba (el escaparate, la prueba): si vienen, no se llama al servidor. */
  perfilInicial?: PerfilLogros | null
}

export default function CuerpoConLogros({ cuerpoDeSiempre, viajes, chinchetas, cifras, fotos, rutaAbiertaId, onAbrirAlbum, onAbrirViaje, perfilInicial = null }: PropsCuerpoConLogros): ReactNode {
  const [perfil, setPerfil] = useState<PerfilLogros | null>(perfilInicial)
  const [eligiendo, setEligiendo] = useState(false)
  const pantallas = useLogrosPantallas((s) => s.pila.length)
  const abrir = useLogrosPantallas.getState().abrir
  // Mi nombre y mi foto (cuentas parte 3): «Hola, {nombre}» y la foto en el marco; tocar el círculo los cambia.
  const yo = useMiNombreYFoto()
  const abrirAjustes = useAjustesUi((s) => s.abrir)
  const editarPerfil = useAjustesUi((s) => s.editarPerfil)

  // Al abrir el Perfil y cada vez que se vuelve de una pantalla de logros (por si ha cambiado el título o la vitrina).
  useEffect(() => {
    if (perfilInicial || pantallas > 0) return
    let vivo = true
    void pedirPerfil().then((p) => vivo && p && setPerfil(p))
    return () => {
      vivo = false
    }
  }, [pantallas, perfilInicial])

  const grupos = useMemo(() => agruparViajes(viajes), [viajes])
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

  if (!perfil) return cuerpoDeSiempre
  const { exp } = perfil
  return (
    <>
      <div className="relative flex items-center gap-3.5 px-1" data-cabecera-con-marco>
        <button type="button" onClick={() => editarPerfil(true)} aria-label="Cambiar mi foto y mi nombre" data-editar-perfil className="flex-none rounded-full">
        <MarcoDeRango rango={exp.rango_ix} estrellas={exp.estrellas} leyenda={exp.leyenda_estrellas} tam={104} etiqueta={`Marco ${exp.rango}, nivel ${exp.estrellas} de 5`}>
          <InicialEnMarco letra={inicialDeNombre(yo.tieneNombre ? yo.nombre : null)} tam={104} foto={yo.foto} />
        </MarcoDeRango>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="m-0 font-display text-[34px] leading-none tracking-[-.01em] text-text">
            Hola, <em>{yo.nombre}</em>
          </h2>
          <span className="text-[13px] font-semibold text-text" data-nivel-y-rango>
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
        <button type="button" aria-label="Ajustes" data-ajustes onClick={() => abrirAjustes()} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-text/70">
          <Icono nombre="ajustes" size={22} />
        </button>
      </div>

      <NivelYBarra exp={exp} />

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

      <button type="button" onClick={() => abrir({ t: 'pasaporte' })} data-abrir-pasaporte className="flex min-h-[64px] flex-none items-center gap-3 rounded-[20px] px-3.5 py-3 text-left" style={{ background: 'linear-gradient(150deg,#6E1C2E,#3E0E18)', color: DORADO, boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.3)' }}>
        <Icono nombre="mapa" size={28} grosor={1.4} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-[20px] leading-none">Mi pasaporte</span>
          <span data-numeros-pasaporte style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgba(243,213,154,.7)' }}>
            {plural(perfil.pasaporte.paises, 'país', 'países')} · {plural(perfil.pasaporte.ciudades, 'ciudad', 'ciudades')}
          </span>
        </span>
        <span className="flex h-[30px] flex-none items-center gap-1 whitespace-nowrap rounded-full border pl-3 pr-2 text-[12px] font-semibold" style={{ borderColor: 'rgba(243,213,154,.45)', background: 'rgba(243,213,154,.12)' }}>
          Abrir
          <Icono nombre="adelante" size={15} grosor={2.4} />
        </span>
      </button>

      <MapaMisViajes chinchetas={chinchetas} cifras={cifras} onElegir={onAbrirAlbum} />

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="m-0 font-display text-[24px] leading-none text-text">Mis viajes</h3>
          <span className="text-text/45" style={{ font: "500 11px 'Geist Mono',monospace" }} data-numero-de-viajes>
            {viajes.length}
          </span>
        </div>
        {viajes.length === 0 && perfil.previos.paises === 0 && <p className="px-1 text-[13px] text-text/60">Aún no tienes viajes guardados en este dispositivo.</p>}
        {grupos.map((g) => (
          <div key={g.clave} className="flex flex-col gap-1.5" data-grupo-de-viajes={g.clave}>
            <span className="px-1.5 pt-1.5 uppercase text-text/55" style={{ ...ETIQUETA_DE_GRUPO, color: g.clave === 'en_curso' ? 'oklch(0.5 0.17 5)' : undefined }}>
              {g.titulo}
            </span>
            {g.viajes.map((viaje) => (
              <TarjetaDeViaje key={viaje.id} viaje={viaje} fotos={fotos ? (fotos.get(viaje.id) ?? 0) : null} enCurso={g.clave === 'en_curso'} abierto={viaje.id === rutaAbiertaId} onAbrir={() => abrir({ t: 'viaje', tripId: viaje.id })} onAbrirViaje={() => onAbrirViaje(viaje)} />
            ))}
          </div>
        ))}
        {perfil.previos.paises > 0 && (
          <div className="flex flex-col gap-1.5" data-grupo-de-viajes="antes">
            <span className="px-1.5 pt-1.5 uppercase text-text/55" style={ETIQUETA_DE_GRUPO}>
              Antes de la app
            </span>
            <button type="button" onClick={() => abrir({ t: 'previos' })} data-viajes-de-antes className="relative h-[132px] w-full flex-none overflow-hidden rounded-[22px] text-left text-[#FFFDF8]" style={{ background: 'linear-gradient(160deg,#D6E4EA,#7EA6B8 55%,#3A5866)' }}>
              <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,12,20,.1) 20%,rgba(10,12,20,.72))' }} />
              <span className="absolute bottom-3 left-3.5 flex flex-col gap-[3px]">
                <span className="font-display text-[24px] leading-none">{plural(perfil.previos.paises, 'país', 'países')}</span>
                <span className="font-display text-[13px] italic text-[#FFFDF8]/80">Viaje de antes de usar la app</span>
              </span>
            </button>
          </div>
        )}
        <button type="button" onClick={() => abrir({ t: 'previos' })} data-anadir-viaje-previo className="mt-1 flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-text/25 bg-transparent text-[14px] font-semibold text-text">
          <Icono nombre="anadir" size={15} grosor={2.2} />
          Añadir un viaje que ya hiciste
        </button>
      </div>

      {eligiendo && <ElegirTitulo titulos={perfil.titulos} elegido={perfil.titulo?.clave ?? null} onElegir={(c) => void elegir(c)} onCerrar={() => setEligiendo(false)} />}
    </>
  )
}

