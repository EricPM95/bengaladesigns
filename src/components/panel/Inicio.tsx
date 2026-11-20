import { useEffect, useState, type ReactNode } from 'react'
import { euros, hace, pedir, type Inicio as DatosInicio, type TotalesDeUsuarios } from './api'
import { Barras, Cifra, Pastilla, SERIE, tarjeta } from './estilo'

/**
 * (V33, Design P1/M1) INICIO: lo que necesita atención de un vistazo: reportes sin mirar, fotos por aprobar, pases vendidos hoy y este mes con sus ingresos, usuarios nuevos hoy y esta semana, los pases de los últimos
 * 14 días y lo último que ha llegado. Más los totales de lo que contestaron en las preguntas de la primera vez.
 */
const COLORES: Record<string, [string, string, string]> = { reporte: ['#FBEFC8', '#8A6210', 'Reporte'], foto: ['#FCE3EC', '#A02A5A', 'Foto'], venta: ['#DCEBDD', '#2F6B43', 'Venta'], fallo: ['#FADCDC', '#A32A2A', 'Fallo'] }

export function Inicio({ ir, movil }: { ir: (seccion: string) => void; movil: boolean }): ReactNode {
  const [d, setD] = useState<DatosInicio | null>(null)
  const [t, setT] = useState<TotalesDeUsuarios | null>(null)
  useEffect(() => {
    void pedir<DatosInicio>('/api/admin/inicio').then(setD)
    void pedir<TotalesDeUsuarios>('/api/admin/usuarios/totales').then(setT)
  }, [])
  if (!d) return <p>Cargando…</p>
  const conViaje = d.usuarios.total > 0 ? Math.round((d.usuarios.con_viaje / d.usuarios.total) * 100) : 0
  const fallos = d.atencion.filter((a) => a.tipo === 'fallo')
  return (
    <div data-seccion="inicio" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {fallos.length > 0 && (
        <div data-alerta-atencion style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'oklch(0.97 0.03 5)', border: '1px solid oklch(0.58 0.19 5 / .35)' }}>
          <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: 'oklch(0.58 0.19 5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 16px 'Geist'" }}>!</span>
          <span style={{ flex: 1, font: "500 14px/1.35 'Geist'" }}>{fallos[0].titulo}{fallos.length > 1 ? ` (y ${fallos.length - 1} más)` : ''}</span>
          <button type="button" onClick={() => ir('reportes')} style={{ background: 'none', border: 'none', font: "700 13px 'Geist'", color: 'oklch(0.5 0.19 5)', cursor: 'pointer' }}>Ver ›</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        <Cifra etiqueta="Reportes nuevos" valor={d.reportes_nuevos} pie="Sin mirar" destacada={d.reportes_nuevos > 0} chica={movil} />
        <Cifra etiqueta="Fotos por aprobar" valor={d.fotos_por_aprobar} pie="Esperando" chica={movil} />
        <Cifra etiqueta="Pases hoy" valor={d.pases.hoy} pie={`${d.pases.mes} este mes`} chica={movil} />
        <Cifra etiqueta="Ingresos hoy" valor={euros(d.ingresos.hoy_cent, d.ingresos.moneda)} pie={`${euros(d.ingresos.mes_cent, d.ingresos.moneda)} este mes`} chica={movil} />
        <Cifra etiqueta="Usuarios hoy" valor={d.usuarios.hoy} pie={`${d.usuarios.semana} esta semana`} chica={movil} />
        <Cifra etiqueta="Con viaje" valor={`${conViaje} %`} pie="Del total de usuarios" chica={movil} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.3fr 1fr', gap: 14 }}>
        <div style={tarjeta}>
          <span style={{ font: "600 14px 'Geist'" }}>Pases vendidos · últimos 14 días</span>
          <Barras valores={d.serie14.map((x) => x.pases)} etiquetas={d.serie14.map((x) => x.dia)} alto={movil ? 90 : 150} />
        </div>
        <div style={tarjeta}>
          <span style={{ font: "600 14px 'Geist'" }}>Lo último que ha llegado</span>
          {d.atencion.length === 0 && <p style={{ margin: 0, color: 'rgba(28,34,48,.55)' }}>Nada nuevo.</p>}
          {d.atencion.slice(0, 6).map((a, i) => {
            const [fondo, color, texto] = COLORES[a.tipo] ?? COLORES.reporte
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(28,34,48,.06)' }}>
                <Pastilla fondo={fondo} color={color}>{texto}</Pastilla>
                <span style={{ flex: 1, minWidth: 0, font: "400 13px/1.3 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</span>
                <span style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.45)' }}>{hace(a.en)}</span>
              </div>
            )
          })}
        </div>
      </div>
      {!d.correo.activo && <p data-aviso-sin-correo style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: '#8A6210' }}>Los correos están apagados (falta RESEND_API_KEY en Vercel): el panel funciona igual, pero no manda correos.</p>}
      {t && <RespuestasDeLaPrimeraVez t={t} />}
    </div>
  )
}

/** Los totales de las preguntas de la primera vez, en porcentajes. */
export function RespuestasDeLaPrimeraVez({ t }: { t: TotalesDeUsuarios }): ReactNode {
  const bloques = [
    { t: '¿Cada cuánto viajan?', r: t.respuestas.frecuencia },
    { t: '¿Con quién viajan?', r: t.respuestas.compania },
    { t: 'Edad por tramos', r: t.respuestas.edad },
  ]
  return (
    <div data-respuestas-primera-vez style={tarjeta}>
      <span style={{ font: `400 22px ${SERIE}` }}>Lo que contestaron en la primera vez <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.5)' }}>({t.contestaron} personas)</span></span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        {bloques.map((b) => (
          <div key={b.t} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: "600 13px 'Geist'" }}>{b.t}</span>
            {b.r.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Sin respuestas todavía</span>}
            {b.r.map((x) => (
              <div key={x.valor ?? x.tramo} data-reparto style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: '0 0 120px', font: "400 12.5px 'Geist'" }}>{ETIQUETAS[x.valor ?? ''] ?? x.valor ?? x.tramo}</span>
                <span style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${x.pct}%`, background: 'linear-gradient(90deg,#C99A44,#F3D88F)' }} /></span>
                <span style={{ flex: '0 0 40px', textAlign: 'right', font: "600 12px 'Geist Mono',monospace" }}>{x.pct} %</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
const ETIQUETAS: Record<string, string> = { una_vez_al_anio: 'Una vez al año', dos_o_tres: '2 o 3 veces al año', cuatro_o_mas: '4 o más', a_mi_aire: 'A mi aire', pareja: 'En pareja', familia: 'En familia', amigos: 'Con amigos' }
