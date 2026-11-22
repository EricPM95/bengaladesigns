import type { CSSProperties, ReactNode } from 'react'
import { ETIQUETA_COMPANIA, euros, type UsuarioFicha } from '../api'
import { SERIE } from '../estilo'
import { Bandera } from '../banderas'
import { Avatar, MONO, diaCorto, fechaLarga, rangoLargo, ultimoAcceso } from './piezas'

/**
 * (V35A, Design P6c / M8) LA FICHA DE UNA PERSONA: a la izquierda su tarjeta oscura (nivel, alta, último acceso, viajes, gastado, pase, vive en, primera vez) y a la derecha sus viajes (próximos y hechos, con con quién y si
 * son suyos o compartidos), sus pases (solo fecha y precio), sus logros (medallas, colecciones, emblemas y pasaporte) y los reportes que ha mandado. «Pase» y «Gastado» salen de la MISMA cuenta que «Sus pases» y que la lista.
 * Solo lectura; sin datos de tarjeta.
 */
const BLOQUE: CSSProperties = { borderRadius: 20, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }
const MINI: CSSProperties = { font: `600 10px ${MONO}`, letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }
const pastilla = (texto: string, fondo: string, color: string): ReactNode => <span style={{ flex: 'none', height: 22, padding: '0 9px', borderRadius: 999, background: fondo, color, display: 'flex', alignItems: 'center', font: "600 11px 'Geist'" }}>{texto}</span>

const COLOR_MEDALLA: Record<string, [string, string]> = { oro: ['#FBEFC8', '#8A6210'], bronce: ['#F3E4D4', '#8A4A1C'], plata: ['#ECEEF2', '#4A5160'], diamante: ['#DDEBFA', '#1F5CA8'] }

/** Pura: «viaja 2 o 3 veces al año · en pareja · nacida en 1991» de lo que contestó (o «sin contestar»). */
export function frasePrimeraVez(p: UsuarioFicha['usuario']['primera_vez']): string {
  if (!p) return 'Primera vez: todavía no ha contestado.'
  const frec: Record<string, string> = { una_vez_al_anio: 'viaja una vez al año', dos_o_tres: 'viaja 2 o 3 veces al año', cuatro_o_mas: 'viaja 4 o más veces al año' }
  const trozos = [p.frecuencia ? frec[p.frecuencia] : null, p.compania ? (ETIQUETA_COMPANIA[p.compania] ?? '').toLowerCase() : null, p.anio_nacimiento ? `nacida en ${p.anio_nacimiento}` : null].filter(Boolean)
  return trozos.length ? `Primera vez: ${trozos.join(' · ')}` : 'Primera vez: todavía no ha contestado.'
}

function ViajeTarjeta({ v, destacado }: { v: UsuarioFicha['viajes'][number]; destacado: boolean }): ReactNode {
  const quien = v.suyo ? 'Suyo' : `Compartido · se unió al de ${v.de ?? '—'}`
  const fg = destacado ? '#FFFDF8' : '#1C2230'
  return (
    <div data-ficha-viaje={v.destino} data-destacado={destacado ? '1' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 14, background: destacado ? '#1C2230' : '#F7F1E4', border: `1.5px solid ${destacado ? '#D8BE84' : 'transparent'}` }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: `400 ${destacado ? 26 : 20}px/1.1 ${SERIE}`, color: fg }}>{v.destino}</span>
        <span style={{ font: "500 12.5px 'Geist'", color: destacado ? 'rgba(255,253,248,.75)' : 'rgba(28,34,48,.55)' }}>{rangoLargo(v.inicio, v.fin)}</span>
      </span>
      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {destacado ? pastilla(v.con_quien, 'rgba(243,216,143,.18)', '#F3D88F') : pastilla(v.con_quien, '#FCE3EC', '#A02A5A')}
        {destacado ? pastilla(quien, 'rgba(243,216,143,.18)', '#F3D88F') : pastilla(quien, v.suyo ? '#F1EADC' : '#DDEBFA', v.suyo ? 'rgba(28,34,48,.6)' : '#1F5CA8')}
      </span>
    </div>
  )
}

export function Ficha({ f, movil, volver }: { f: UsuarioFicha; movil: boolean; volver: () => void }): ReactNode {
  const u = f.usuario
  const proximos = f.viajes.filter((v) => !v.hecho)
  const hechos = f.viajes.filter((v) => v.hecho)
  const L = f.logros
  const sinLogros = L.medallas.length + L.colecciones.length + L.emblemas.length === 0 && !L.pasaporte.texto
  const dato = (l: string, v: string, d: string) => <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ color: 'rgba(255,253,248,.5)' }}>{l}</span><b data-ficha-dato={d} style={{ fontSize: 14 }}>{v}</b></span>
  const grupo = (titulo: string, items: { texto: string; fondo: string; color: string }[]) => (
    <div data-logros={titulo} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={MINI}>{titulo}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((x, i) => <span key={`${x.texto}${i}`} data-logro style={{ minHeight: 30, padding: '0 12px', borderRadius: 999, background: x.fondo, color: x.color, display: 'flex', alignItems: 'center', font: "600 12px 'Geist'" }}>{x.texto}</span>)}
      </div>
    </div>
  )
  return (
    <div data-ficha={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button type="button" data-volver onClick={volver} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "600 13.5px 'Geist'", cursor: 'pointer', color: '#1C2230' }}>‹ Volver a la lista</button>
      <div style={{ display: 'flex', flexDirection: movil ? 'column' : 'row', gap: 16 }}>
        <div style={{ width: movil ? 'auto' : 300, flex: 'none', borderRadius: 22, background: '#1C2230', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, color: '#FFFDF8', boxSizing: 'border-box' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar id={u.id} nombre={u.nombre} tam={56} />
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span data-ficha-nombre style={{ font: `400 26px/1.05 ${SERIE}` }}>{u.nombre}{u.prueba && <span data-etiqueta-prueba style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#E3E8F4', color: '#2A4A94', font: "700 10.5px 'Geist'", letterSpacing: '.04em' }}>Prueba</span>}</span>
              <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(255,253,248,.6)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
            </span>
          </span>
          <span data-ficha-nivel style={{ height: 26, padding: '0 12px', borderRadius: 999, background: 'rgba(243,216,143,.16)', color: '#F3D88F', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'" }}>Nivel {u.nivel} · {u.rango}</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, font: "400 12.5px 'Geist'" }}>
            {dato('Alta', fechaLarga(u.alta), 'alta')}
            {dato('Último acceso', ultimoAcceso(u.ultimo_acceso, f.hoy), 'acceso')}
            {dato('Viajes', `${u.viajes.creados} · ${u.viajes.hechos} ${u.viajes.hechos === 1 ? 'hecho' : 'hechos'}`, 'viajes')}
            {dato('Gastado', euros(u.gastado_cent, u.moneda), 'gastado')}
            {dato('Pase', f.pase_texto, 'pase')}
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: 'rgba(255,253,248,.5)' }}>Vive en</span>
              <b data-ficha-dato="vive" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                {f.vive_en && <Bandera iso={f.vive_en.iso} tam={16} />}
                {f.vive_en ? f.vive_en.nombre : '—'}
                {f.vive_en?.fuente === 'origen' && <span data-vive-fuente="origen" style={{ fontWeight: 400, fontSize: 11, color: 'rgba(255,253,248,.5)' }}>(por el origen de su viaje)</span>}
              </b>
            </span>
          </div>
          <div style={{ marginTop: 'auto', padding: 12, borderRadius: 14, background: 'rgba(255,253,248,.07)', font: "400 12px/1.4 'Geist'", color: 'rgba(255,253,248,.6)' }}>{frasePrimeraVez(u.primera_vez)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
          <div data-ficha-bloque="viajes" style={BLOQUE}>
            <span style={{ font: "600 13.5px 'Geist'" }}>Sus viajes</span>
            {f.viajes.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía no tiene viajes.</span>}
            {proximos.length > 0 && <span style={MINI}>PRÓXIMOS</span>}
            {proximos.map((v, i) => <ViajeTarjeta key={v.id} v={v} destacado={i === 0} />)}
            {hechos.length > 0 && <span style={MINI}>HECHOS</span>}
            {hechos.map((v) => <ViajeTarjeta key={v.id} v={v} destacado={false} />)}
          </div>
          <div data-ficha-bloque="pases" style={BLOQUE}>
            <span style={{ font: "600 13.5px 'Geist'" }}>Sus pases · solo fecha y precio</span>
            {f.pases.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Sin pases.</span>}
            {f.pases.map((p, i) => (
              <div key={i} data-ficha-pase data-importe={p.importe_cent} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)', font: "400 13px 'Geist'" }}>
                <span style={{ width: 52, color: 'rgba(28,34,48,.5)' }}>{p.fecha ? diaCorto(p.fecha) : '—'}</span>
                <span data-pase-nombre style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{p.destino}{p.origen === 'regalado' ? ' · Regalado' : p.origen === 'compartido' ? ` (de ${p.de ?? '—'})` : ''}</span>
                {pastilla(p.plan, '#F3EBD8', '#1C2230')}
                <span style={{ width: 62, textAlign: 'right', fontWeight: 700 }}>{euros(p.importe_cent, p.moneda)}</span>
              </div>
            ))}
          </div>
          <div data-ficha-bloque="logros" style={{ ...BLOQUE, gap: 10 }}>
            <span style={{ font: "600 13.5px 'Geist'" }}>Logros</span>
            {sinLogros && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía sin logros.</span>}
            {L.medallas.length > 0 && grupo('MEDALLAS', L.medallas.map((m) => ({ texto: m.texto, fondo: (COLOR_MEDALLA[m.grado] ?? ['#F1EADC', '#1C2230'])[0], color: (COLOR_MEDALLA[m.grado] ?? ['#F1EADC', '#1C2230'])[1] })))}
            {L.colecciones.length > 0 && grupo('COLECCIONES', L.colecciones.map((c) => ({ texto: c.texto, fondo: '#F1EADC', color: '#1C2230' })))}
            {L.emblemas.length > 0 && grupo('EMBLEMAS Y LOGROS ESPECIALES', L.emblemas.map((e) => (e.tipo === 'viajero' ? { texto: e.texto, fondo: '#DCEBDD', color: '#2F6B43' } : { texto: e.texto, fondo: '#DDEBFA', color: '#1F5CA8' })))}
            {L.pasaporte.texto && grupo('PASAPORTE', [{ texto: L.pasaporte.texto, fondo: '#F7F1E4', color: '#1C2230' }])}
          </div>
          <div data-ficha-bloque="reportes" style={BLOQUE}>
            <span style={{ font: "600 13.5px 'Geist'" }}>Reportes que ha mandado</span>
            {f.reportes.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Ninguno.</span>}
            {f.reportes.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 14, background: '#F7F1E4' }}>
                <span style={{ flex: 1, font: "500 13px 'Geist'" }}>{r.titulo}</span>
                {r.estado === 'hecho' ? pastilla('Hecho', '#DCEBDD', '#2F6B43') : pastilla(r.estado === 'nuevo' ? 'Nuevo' : r.estado === 'visto' ? 'Visto' : r.estado === 'descartado' ? 'Descartado' : r.estado, '#F1EADC', 'rgba(28,34,48,.6)')}
              </div>
            ))}
          </div>
        </div>
      </div>
      <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Sin datos de tarjeta, nunca.</span>
    </div>
  )
}
