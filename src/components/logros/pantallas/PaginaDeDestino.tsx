import { useEffect, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { lineaDeSecretos } from '../momentos/textosResumen'
import { pedirDestino, type ColeccionDePagina, type PaginaDeDestinoDatos, type SelloDePagina } from './destino/api'
import { COLOR_DE_GRADO, FONDO_DE_DESTINO, FONDO_POR_DEFECTO, conDe } from './destino/formato'
import { BotonVolver, Esperando, FONDO_PAPEL, useCarga } from './destino/piezas'
import './destino/destino.css'
import { Capa } from './Capa'
import { useGanados } from './todos/api'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * LA PÁGINA DE UN DESTINO (8C2; G1, G2 y T3 de «Mi vitrina»): su cabecera con el sello principal, sus sellos de ciudad, sus colecciones y sus emblemas secretos.
 * Los emblemas que faltan salen como «?», nunca cuáles son. El Vaticano vive dentro de Roma: si se llega desde él (`resaltar: 'vaticano'`, o `destino: 'vaticano'`),
 * su sello sale marcado con «Estás aquí». Cada colección abre su álbum (`ColeccionPorDentro`).
 * Lo hecho sale del servidor (GET /api/logros/destino); nada de números escritos a mano.
 */
type Pagina = PantallaDe<'destino'> & { resaltar?: string }
/** El Vaticano no es un destino aparte: es un sello de Roma. */
const DESTINO_DE: Record<string, { destino: string; resaltar: string }> = { vaticano: { destino: 'roma', resaltar: 'vaticano' } }

export default function PaginaDeDestino({ pantalla }: { pantalla: Pagina }): ReactNode {
  const alias = DESTINO_DE[pantalla.destino]
  const destino = alias?.destino ?? pantalla.destino
  const resaltar = pantalla.resaltar ?? alias?.resaltar ?? null
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const datos = useCarga(() => pedirDestino(destino, tripId), [destino, tripId])
  const volver = () => useLogrosPantallas.getState().volver()
  return (
    <Capa etiqueta="Página de un destino" fondo={FONDO_PAPEL}>
      <div className="dst" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {!datos ? (
          <>
            <div style={{ padding: '6px 16px' }}><BotonVolver onClick={volver} etiqueta="Volver a Todos mis logros" /></div>
            <Esperando cargando={datos === null} />
          </>
        ) : (
          <Contenido datos={datos} resaltar={resaltar} volver={volver} />
        )}
      </div>
    </Capa>
  )
}

function Contenido({ datos, resaltar, volver }: { datos: PaginaDeDestinoDatos; resaltar: string | null; volver: () => void }): ReactNode {
  const abrirColeccion = (coleccion: string) => useLogrosPantallas.getState().abrir({ t: 'coleccion', destino: datos.destino, coleccion })
  const principal = datos.sellos.find((s) => s.principal) ?? datos.sellos[0] ?? null
  const grado = principal?.grado ?? null
  const color = grado ? COLOR_DE_GRADO[grado] : 'rgba(28,34,48,.45)'
  const n = datos.numeros
  const vitrina = useGanados((s) => s.datos?.vitrina)
  useEffect(() => void useGanados.getState().cargar(), [])
  const enVitrina = (clave: string): boolean | null => (vitrina ? [...(vitrina.pedestal ?? []), ...(vitrina.exclusivos ?? []), ...Object.values(vitrina.baldas ?? {}).flatMap((b) => b.huecos)].includes(clave) : null)
  const lineaSecretos = lineaDeSecretos(datos.ciudad, datos.emblemas.total, datos.emblemas.encontrados, !grado)
  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* La cabecera: el color del destino y el sello principal en una tarjeta que sube sobre él. */}
      <div style={{ position: 'relative', flex: 'none', height: 170, background: FONDO_DE_DESTINO[datos.destino] ?? FONDO_POR_DEFECTO }}>
        <div style={{ position: 'absolute', left: 8, top: 4 }}>
          <button type="button" onClick={volver} style={{ height: 44, padding: '0 14px 0 12px', border: 'none', borderRadius: 999, background: 'rgba(28,34,48,.55)', color: '#FFFDF8', display: 'flex', alignItems: 'center', gap: 6, font: "600 12px 'Geist'", cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Todos mis logros
          </button>
        </div>
      </div>
      <div style={{ margin: '-56px 16px 0', position: 'relative', borderRadius: 24, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 18px 30px -22px rgba(28,34,48,.6)' }}>
        {principal && <Sello id={principal.id} grado={(grado ?? 'bronce') as GradoDeSello} tam={84} apagado={!grado} animado={false} />}
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>{datos.ciudad}</span>
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.08em', color, textTransform: 'uppercase' }}>{grado ? `${grado} · ${principal?.nombre_grado ?? ''}` : 'Por conseguir'}</span>
          <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{`${n.colecciones_completas} de ${n.colecciones_total} colecciones${lineaSecretos ? ` · ${lineaSecretos}` : ''}`}</span>
          <div style={{ height: 5, borderRadius: 5, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.round(n.avance * 100)}%`, borderRadius: 5, background: grado ? color : 'rgba(28,34,48,.25)' }} /></div>
        </span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Titulo>Sellos de ciudad</Titulo>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {datos.sellos.map((s) => <TarjetaDeSello pin={s.grado ? enVitrina(`${datos.destino}|sello|${s.id}:${s.grado}`) : undefined} key={s.id} s={s} aqui={resaltar === s.id} />)}
        </div>

        <Titulo cuenta={`${n.colecciones_completas} de ${n.colecciones_total}`}>Colecciones</Titulo>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {datos.colecciones.map((c) => <TarjetaDeColeccion key={c.id} c={c} abrir={() => abrirColeccion(c.id)} pin={c.completa ? enVitrina(`${datos.destino}|coleccion|${c.id}`) : undefined} />)}
        </div>

        <Titulo>Emblemas secretos</Titulo>
        <div style={{ borderRadius: 24, background: '#1C2230', color: '#FFFDF8', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div role="list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, justifyItems: 'center' }}>
            {datos.emblemas.lista.map((e) => (
              <span key={e.id} role="listitem" aria-label={e.nombre} style={{ position: 'relative', width: 66, height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Emblema id={e.id} tam={58} />
                <PinDeVitrina puesto={enVitrina(`${datos.destino}|emblema|${e.id}`) === null ? null : Boolean(enVitrina(`${datos.destino}|emblema|${e.id}`) || (e.id === 'coliseo' && enVitrina('*|maravilla|coliseo')))} arriba={-4} derecha={-4} />
              </span>
            ))}
            {Array.from({ length: datos.emblemas.faltan }, (_, i) => (
              <span key={`f${i}`} role="listitem" aria-label="Un secreto por encontrar" style={{ width: 66, height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,253,248,.06)', border: '1.5px dashed rgba(243,213,154,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 22px/1 'Instrument Serif',serif", color: 'rgba(243,213,154,.6)' }}>?</span>
              </span>
            ))}
          </div>
          {lineaSecretos && <span style={{ font: "italic 400 16px 'Instrument Serif',serif", color: 'rgba(255,253,248,.72)', textAlign: 'center' }}>{lineaSecretos}</span>}
        </div>
      </div>
    </main>
  )
}

function Titulo({ children, cuenta }: { children: string; cuenta?: string }): ReactNode {
  return (
    <span style={{ padding: '6px 4px 0', font: "400 24px/1 'Instrument Serif',serif" }}>
      {children}
      {cuenta && <span style={{ marginLeft: 8, font: "500 13px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>{cuenta}</span>}
    </span>
  )
}

/**
 * El pin de la vitrina (de «Mi vitrina», Piezas/Mi Vitrina.dc.html): solo sale en lo que ya está ganado. Verde con ✓ si está en tu vitrina; dorado con «+» si aún no. Solo se ve (no se toca).
 * `puesto`: true (en la vitrina), false (ganado, fuera de ella), null/undefined (aún no se sabe o no está ganado: sin pin).
 */
function PinDeVitrina({ puesto, arriba = 6, derecha = 6 }: { puesto: boolean | null | undefined; arriba?: number; derecha?: number }): ReactNode {
  if (puesto == null) return null
  return (
    <span data-pin-de-vitrina={puesto ? 'puesto' : 'libre'} title={puesto ? 'En tu vitrina' : 'Añadir a tu vitrina'} style={{ position: 'absolute', top: arriba, right: derecha, width: 26, height: 26, borderRadius: '50%', background: puesto ? 'oklch(0.55 0.11 150)' : 'oklch(0.8 0.14 70)', color: puesto ? '#FFFFFF' : '#17120A', boxShadow: '0 0 0 2px #FFFDF8,0 4px 10px -4px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={puesto ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
      </svg>
    </span>
  )
}

function TarjetaDeSello({ s, aqui, pin }: { s: SelloDePagina; aqui: boolean; pin?: boolean | null }): ReactNode {
  const color = s.grado ? COLOR_DE_GRADO[s.grado] : 'rgba(28,34,48,.45)'
  return (
    <div style={{ position: 'relative', borderRadius: 20, background: '#FFFDF8', border: `1px solid ${aqui ? 'oklch(0.8 0.14 70)' : 'rgba(28,34,48,.07)'}`, boxShadow: aqui ? '0 0 0 3px oklch(0.8 0.14 70 / .35)' : 'none', padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      <Sello id={s.id} grado={(s.grado ?? 'bronce') as GradoDeSello} tam={72} apagado={!s.grado} animado={false} />
      <span style={{ font: "400 15px/1.1 'Instrument Serif',serif" }}>{`Sello ${conDe(s.nombre)}`}</span>
      <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.08em', color, textTransform: 'uppercase' }}>{s.grado ?? 'Por conseguir'}</span>
      {aqui && <span style={{ height: 22, padding: '0 9px', borderRadius: 999, background: '#F1E3BF', color: '#6F4E37', font: "700 10.5px/22px 'Geist'" }}>Estás aquí</span>}
      <PinDeVitrina puesto={pin} arriba={8} derecha={8} />
    </div>
  )
}

function TarjetaDeColeccion({ c, abrir, pin }: { c: ColeccionDePagina; abrir: () => void; pin?: boolean | null }): ReactNode {
  const hay = c.n > 0
  return (
    <button
      type="button"
      onClick={abrir}
      style={{ position: 'relative', minHeight: 44, borderRadius: 18, background: c.completa ? '#FFFDF8' : '#F8F3EA', border: '1px solid rgba(28,34,48,.07)', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center', cursor: 'pointer', color: 'inherit' }}
    >
      <span style={{ filter: hay ? 'none' : 'grayscale(1)', opacity: hay ? 1 : 0.45, display: 'flex' }}>
        <Insignia coleccion={c.id} ganados={c.sitios.filter((x) => x.visto).map((x) => x.sitio)} completa={c.completa} tam={72} />
      </span>
      <span style={{ font: "500 11px/1.2 'Geist'", textWrap: 'balance' }}>{c.nombre}</span>
      <span style={{ font: "600 10px 'Geist Mono',monospace", color: c.completa ? 'oklch(0.42 0.09 150)' : hay ? 'oklch(0.48 0.17 5)' : 'rgba(28,34,48,.45)' }}>{c.completa ? '✓ Completa' : hay ? `${c.n} de ${c.total}` : 'Sin empezar'}</span>
      <PinDeVitrina puesto={pin} />
    </button>
  )
}
