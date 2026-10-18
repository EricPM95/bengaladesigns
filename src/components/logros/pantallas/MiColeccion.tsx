import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Chapa } from '../dibujos'
import { IC_ESCALONES, IC_UNICOS } from '../dibujos/iconosDashboard'
import { pedirMiColeccion, type LogroDeColeccion, type MiColeccionDatos } from './destino/api'
import { COLOR_DE_GRUPO, ICONO_DE_LOGRO, NOMBRE_DE_FAMILIA, paginasDe } from './destino/formato'
import { BotonVolver, Esperando, FONDO_PAPEL, useCarga } from './destino/piezas'
import './destino/destino.css'
import { Capa } from './Capa'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * «MI COLECCIÓN» (8C2; M1 y M2 de «Mi vitrina»): los logros de viajero, página a página (un grupo por página, con 9 huecos de 3 × 3; un grupo con más logros sigue en otra página).
 * Lo que ya tienes sale con su chapa del Dashboard y sus puntitos de avance; lo que falta, como un hueco con su icono. Tocar uno que ya tienes abre su ficha;
 * tocar un hueco dice cómo conseguirlo (solo la línea `como` de data/logros/viajero.json). El aro de arriba es lo conseguido sobre todo lo que se ve hoy.
 * Solo salen los logros encendidos de la Versión 1: el servidor ya los filtra (GET /api/logros/mi-coleccion).
 */
/** ¿Tiene algo que enseñar en su chapa (ganado, o avanzado a poco a poco como los 12 meses)? */
const conAvance = (l: LogroDeColeccion): boolean => l.ganado || (l.avance != null && l.avance.n > 0)

export default function MiColeccion({ pantalla }: { pantalla: PantallaDe<'mi_coleccion'> }): ReactNode {
  const datos = useCarga(pedirMiColeccion, [])
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
    <div ref={lista} style={{ flex: 1, minHeight: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
      {paginas.map((p, i) => (
        <div key={`${p.grupo}-${i}`} style={{ flex: 'none', width: '100%', scrollSnapAlign: 'start', padding: '4px 16px calc(env(safe-area-inset-bottom,0px) + 24px)', display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ flex: 1, borderRadius: 24, background: 'linear-gradient(160deg,#5A2230,#3A121C)', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.25),0 20px 40px -24px rgba(0,0,0,.6)', padding: '16px 14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#F3D59A' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_DE_GRUPO[p.grupo] ?? '#F3D59A' }} />
              {p.nombre}
              <span style={{ marginLeft: 'auto', font: "500 10px 'Geist Mono',monospace", color: 'rgba(243,213,154,.6)' }}>{`${i + 1} / ${paginas.length}`}</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', alignContent: 'start', gap: '14px 8px', padding: '6px 2px', borderRadius: 18, background: 'repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 2px,transparent 2px 5px),#2E0E16' }}>
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
  return <Chapa logro={l.id} escalon={l.escalones.length ? (l.escalon_actual ?? l.escalones[0]?.n) : undefined} tam={tam} bloqueado={bloqueada} progreso={progreso} />
}

function Hueco({ l, abrir }: { l: LogroDeColeccion; abrir: () => void }): ReactNode {
  const hay = conAvance(l)
  const pasos = l.avance && l.n_total === 1 ? l.avance.total : l.n_total
  const hechos = l.avance && l.n_total === 1 ? l.avance.n : l.n_ganados
  const nombre = hay ? (l.nombre ?? l.nombre_logro ?? NOMBRE_DE_FAMILIA[l.id] ?? '') : 'Por conseguir'
  return (
    <button type="button" onClick={abrir} style={{ minHeight: 44, border: 'none', background: 'transparent', padding: '6px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span style={{ position: 'relative', width: 78, height: 78, borderRadius: '50%', background: 'radial-gradient(circle at 50% 60%,#1E070C,#2A0C14 70%)', boxShadow: 'inset 0 5px 10px rgba(0,0,0,.75),inset 0 -2px 3px rgba(243,213,154,.12),0 1px 0 rgba(243,213,154,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hay ? (
          <span style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.6))', display: 'flex' }}><ChapaDe l={l} tam={66} /></span>
        ) : (
          <span style={{ width: 58, height: 58, borderRadius: '50%', border: '1.5px dashed rgba(243,213,154,.28)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(243,213,154,.32)' }}>
            <IconoDeHueco id={l.id} />
          </span>
        )}
      </span>
      {pasos > 1 && (
        <span aria-hidden="true" style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 84 }}>
          {Array.from({ length: pasos }, (_, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: k < hechos ? '#F3D59A' : 'rgba(243,213,154,.22)' }} />)}
        </span>
      )}
      <span style={{ font: "500 11px/1.2 'Geist'", color: hay ? '#FFF3D6' : 'rgba(243,213,154,.45)', textWrap: 'balance', textAlign: 'center' }}>{nombre}</span>
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
      <div className="dst-fondo" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(28,34,48,.45)' }} />
      <div role="dialog" aria-modal="true" aria-label={nombre} className="dst-hoja" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 34px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 6, top: 6, width: 48, height: 48, border: 'none', background: 'transparent', cursor: 'pointer', color: '#1C2230' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <span style={{ marginTop: 8, display: 'flex', filter: hay ? 'none' : 'grayscale(1)', opacity: hay ? 1 : 0.45 }}><ChapaDe l={logro} tam={130} /></span>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: COLOR_DE_GRUPO[logro.grupo] ?? 'rgba(28,34,48,.55)' }}>{grupo}</span>
        <span style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>{nombre}</span>
        {logro.como && <span style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.68)' }}>{logro.como}</span>}
        {logro.avance && logro.avance.n > 0 && <span style={{ font: "600 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`${logro.avance.n} de ${logro.avance.total}`}</span>}
      </div>
    </>
  )
}
