import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Chapa } from '../dibujos'
import { IC_ESCALONES, IC_UNICOS } from '../dibujos/iconosDashboard'
import { pedirMiColeccion, type LogroDeColeccion, type MiColeccionDatos } from './destino/api'
import { COLOR_DE_GRUPO, ICONO_DE_LOGRO, NOMBRE_DE_FAMILIA, paginasDe } from './destino/formato'
import { BotonVolver, Esperando, FONDO_PAPEL, useCarga } from './destino/piezas'
import './destino/destino.css'
import { Capa } from './Capa'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'

/**
 * «MI COLECCIÓN» (8C2; M1 y M2 de «Mi vitrina»): los logros de viajero, página a página (un grupo por página, con 9 huecos de 3 × 3; un grupo con más logros sigue en otra página).
 * Lo que ya tienes sale con su chapa del Dashboard y sus puntitos de avance; lo que falta, como un hueco con su icono. Tocar uno que ya tienes abre su ficha;
 * tocar un hueco dice cómo conseguirlo (solo la línea `como` de data/logros/viajero.json). El aro de arriba es lo conseguido sobre todo lo que se ve hoy.
 * Solo salen los logros encendidos de la Versión 1: el servidor ya los filtra (GET /api/logros/mi-coleccion).
 */
/** ¿Tiene algo que enseñar en su chapa (ganado, o avanzado a poco a poco como los 12 meses)? */
const conAvance = (l: LogroDeColeccion): boolean => l.ganado || (l.avance != null && l.avance.n > 0)

export default function MiColeccion({ pantalla }: { pantalla: PantallaDe<'mi_coleccion'> }): ReactNode {
  const datos = useCarga(pedirMiColeccion, [], 'pantalla:mi_coleccion')
  const volver = () => useLogrosPantallas.getState().volver()
  const [abierto, setAbierto] = useState<LogroDeColeccion | null>(null)
  return (
    <Capa etiqueta="Mi colección" fondo={FONDO_PAPEL}>
      <div className="dst" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '4px 16px 10px' }}>
          <BotonVolver onClick={volver} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: "400 28px/1 'Instrument Serif',serif" }}>Mi colección</span>
            <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Desliza para pasar de página</span>
          </span>
          {datos && <Aro avance={datos.numeros.avance} texto={`${datos.numeros.ganados} de ${datos.numeros.total}`} />}
        </div>
        {!datos ? <Esperando cargando={datos === null} /> : <Paginas datos={datos} grupo={pantalla.grupo} abrir={(l) => (l.ganado && l.clave ? useLogrosPantallas.getState().abrir({ t: 'ficha', clave: l.clave }) : setAbierto(l))} />}
        {abierto && <ComoConseguirlo logro={abierto} grupo={datos ? (datos.grupos.find((g) => g.id === abierto.grupo)?.nombre ?? '') : ''} cerrar={() => setAbierto(null)} />}
      </div>
    </Capa>
  )
}

function Aro({ avance, texto }: { avance: number; texto: string }): ReactNode {
  return (
    <span role="img" aria-label={texto} style={{ position: 'relative', width: 46, height: 46, flex: 'none' }}>
      <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(28,34,48,.1)" strokeWidth="4.5" />
        <circle cx="23" cy="23" r="19" fill="none" stroke="#B8964F" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset={(119.4 * (1 - Math.max(0, Math.min(1, avance)))).toFixed(1)} />
      </svg>
    </span>
  )
}

function Paginas({ datos, grupo, abrir }: { datos: MiColeccionDatos; grupo?: string; abrir: (l: LogroDeColeccion) => void }): ReactNode {
  const paginas = paginasDe(datos)
  const lista = useRef<HTMLDivElement>(null)
  const inicio = Math.max(0, paginas.findIndex((p) => p.grupo === grupo))
  useEffect(() => {
    const el = lista.current
    if (el && inicio > 0) el.scrollLeft = el.clientWidth * inicio
  }, [inicio])
  return (
    <div ref={lista} style={{ flex: 1, minHeight: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', overscrollBehaviorX: 'contain', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
      {paginas.map((p, i) => (
        <div key={`${p.grupo}-${i}`} style={{ flex: 'none', width: '100%', scrollSnapAlign: 'start', padding: '4px 16px calc(env(safe-area-inset-bottom,0px) + 24px)', display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div data-pagina-de-coleccion={p.grupo} style={{ flex: 1, borderRadius: 28, background: 'radial-gradient(ellipse 120% 60% at 50% 0%,#232B52 0%,#141A3A 50%,#0C1024 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.18),0 20px 40px -24px rgba(10,13,28,.7)', padding: '16px 12px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', font: "600 11px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#F3D59A' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLOR_DE_GRUPO[p.grupo] ?? '#F3D59A' }} />
              {p.nombre}
              <span data-pagina-n style={{ marginLeft: 'auto', font: "500 11px 'Geist Mono',monospace", color: 'rgba(243,213,154,.7)' }}>{`${i + 1} / ${paginas.length}`}</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', alignContent: 'start', gap: 10 }}>
              {p.logros.map((l) => <Hueco key={l.id} l={l} abrir={() => abrir(l)} />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** La chapa de un logro con lo que lleva (el escalón más alto, o lo avanzado poco a poco). */
function ChapaDe({ l, tam, bloqueada = false }: { l: LogroDeColeccion; tam: number; bloqueada?: boolean }): ReactNode {
  const progreso = l.id === 'doce_meses' ? (l.avance?.meses ?? []).join(',') : l.id === 'cuatro_estaciones' ? l.avance?.n : undefined
  return <Chapa logro={l.id} escalon={l.escalones.length ? (l.escalon_actual ?? l.escalones[0]?.n) : undefined} tam={tam} bloqueado={bloqueada} progreso={progreso} igual />
}

function Hueco({ l, abrir }: { l: LogroDeColeccion; abrir: () => void }): ReactNode {
  const hay = conAvance(l)
  const pasos = l.avance && l.n_total === 1 ? l.avance.total : l.n_total
  const hechos = l.avance && l.n_total === 1 ? l.avance.n : l.n_ganados
  const nombre = hay ? (l.nombre ?? l.nombre_logro ?? NOMBRE_DE_FAMILIA[l.id] ?? '') : (l.nombre_logro ?? NOMBRE_DE_FAMILIA[l.id] ?? 'Por conseguir')
  // (V82 N3) Cada logro en su hueco hundido, la medalla grande, su nombre y «1 de 4» con la barrita (la misma de «Todos mis logros»). Completo: «Conseguido»; sin nada: «Por conseguir».
  const conPasos = pasos > 1 && hechos < pasos
  const pct = pasos > 0 ? Math.round((Math.min(hechos, pasos) / pasos) * 100) : 0
  return (
    <button type="button" data-hueco-de-coleccion={l.id} data-con-barrita={conPasos ? '1' : '0'} onClick={abrir} style={{ minHeight: 190, border: '1px solid rgba(243,213,154,.16)', borderRadius: 22, background: hay ? 'linear-gradient(180deg,rgba(255,253,248,.08),rgba(255,253,248,.025))' : 'rgba(0,0,0,.18)', padding: '12px 6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'inherit' }}>
      <span style={{ position: 'relative', width: 116, height: 116, borderRadius: '50%', background: 'radial-gradient(circle at 50% 60%,#080B1A,#12183A 70%)', boxShadow: 'inset 0 5px 10px rgba(0,0,0,.75),0 1px 0 rgba(243,213,154,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hay ? (
          <span style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.6))', display: 'flex' }}><ChapaDe l={l} tam={104} /></span>
        ) : (
          <span style={{ width: 92, height: 92, borderRadius: '50%', border: '1.5px dashed rgba(243,213,154,.3)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(243,213,154,.4)' }}>
            <IconoDeHueco id={l.id} />
          </span>
        )}
      </span>
      <span style={{ font: "400 17px/1.08 'Instrument Serif',serif", color: hay ? '#FFF3D6' : 'rgba(243,213,154,.55)', textWrap: 'balance', textAlign: 'center', padding: '0 4px' }}>{nombre}</span>
      {conPasos && hay ? (
        <>
          <span aria-hidden data-barrita-de-coleccion style={{ width: '62%', height: 4, borderRadius: 4, background: 'rgba(255,253,248,.14)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: '#F3D59A' }} />
          </span>
          <span data-avance-de-coleccion style={{ font: "600 10px 'Geist Mono',monospace", color: 'rgba(243,213,154,.85)' }}>{`${hechos} de ${pasos}`}</span>
        </>
      ) : (
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: hay ? '#F3D59A' : 'rgba(243,213,154,.45)' }}>{hay ? 'Conseguido' : 'Por conseguir'}</span>
      )}
    </button>
  )
}

function IconoDeHueco({ id }: { id: string }): ReactNode {
  const ic = ICONO_DE_LOGRO[id]
  const d = (ic?.escalones ? IC_ESCALONES[ic.escalones] : ic?.unico ? IC_UNICOS[ic.unico] : null) ?? IC_ESCALONES.grid
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  )
}

/** La hoja de un hueco que aún no tienes: su chapa apagada, el grupo, el nombre y solo la línea de «cómo conseguirlo». */
function ComoConseguirlo({ logro, grupo, cerrar }: { logro: LogroDeColeccion; grupo: string; cerrar: () => void }): ReactNode {
  const hay = conAvance(logro)
  const nombre = logro.nombre_logro ?? NOMBRE_DE_FAMILIA[logro.id] ?? ''
  return (
    <>
      <div className="dst-fondo" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 40, background: FONDO_DE_HOJA }} />
      <div role="dialog" aria-modal="true" aria-label={nombre} className="dst-hoja" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, borderRadius: '32px 32px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 34px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <CruzDeHoja onCerrar={cerrar} />
        <TiradorDeHoja />
        <span style={{ marginTop: 8, display: 'flex', filter: hay ? 'none' : 'grayscale(1)', opacity: hay ? 1 : 0.45 }}><ChapaDe l={logro} tam={130} /></span>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: COLOR_DE_GRUPO[logro.grupo] ?? 'rgba(28,34,48,.55)' }}>{grupo}</span>
        <span style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>{nombre}</span>
        {logro.como && <span style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.68)' }}>{logro.como}</span>}
        {logro.avance && logro.avance.n > 0 && <span style={{ font: "600 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`${logro.avance.n} de ${logro.avance.total}`}</span>}
      </div>
    </>
  )
}
