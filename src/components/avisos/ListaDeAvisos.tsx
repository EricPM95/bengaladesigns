import type { NombreIcono } from '../../lib/iconos'
import { haceCuanto, type AvisoDeCuenta } from '../../lib/avisos'
import { Icono } from '../ui/Icono'
import { Avatar } from '../ajustes/Avatar'

const ICONO: Partial<Record<AvisoDeCuenta['tipo'], NombreIcono>> = { d10: 'avion', resumen: 'estrella', sorpresas: 'gema' }

/**
 * LA LISTA DE AVISOS DE LA CUENTA (AV2 a AV5, cuentas parte 3): lo más nuevo arriba y lo no leído destacado (letra más fuerte, fondo dorado suave y un puntito). Cada aviso lleva la inicial de
 * quien lo hace (o el icono de la app, en los de fecha) y, si es una recomendación ya contestada, «Aceptada» o «No aceptada» (AV3). Las recomendaciones pendientes se pueden tocar (abren R2).
 */
export function ListaDeAvisos({ avisos, resaltado = null, onTocar, ahora = Date.now(), fotoDe }: { avisos: AvisoDeCuenta[]; resaltado?: string | null; onTocar: (aviso: AvisoDeCuenta) => void; ahora?: number; fotoDe?: (aviso: AvisoDeCuenta) => string | null }) {
  return (
    <div data-lista-avisos className="flex flex-col gap-1.5">
      {avisos.map((a) => {
        const sinLeer = !a.leido && !a.etiqueta
        const tocable = (a.tipo === 'recomendacion' && !a.etiqueta) || a.tipo === 'd10'
        const clase = a.tipo === 'recomendacion' || a.tipo === 'unido' ? 'dorado' : a.tipo === 'aceptada' || a.tipo === 'rechazada' ? 'oscuro' : 'claro'
        const fondoIcono = clase === 'dorado' ? '#F3D59A' : clase === 'oscuro' ? '#1C2230' : '#F1EADC'
        const colorIcono = clase === 'oscuro' ? '#FFFDF8' : '#1C2230'
        const icono = ICONO[a.tipo]
        return (
          <div
            key={a.id}
            role={tocable ? 'button' : undefined}
            tabIndex={tocable ? 0 : undefined}
            data-aviso={a.id}
            data-aviso-tipo={a.tipo}
            data-sin-leer={sinLeer ? '1' : undefined}
            onClick={tocable ? () => onTocar(a) : undefined}
            onKeyDown={tocable ? (e) => (e.key === 'Enter' || e.key === ' ') && onTocar(a) : undefined}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, minHeight: 44, background: sinLeer ? 'oklch(0.8 0.14 70 / .14)' : 'transparent', outline: resaltado === a.id ? '2px solid oklch(0.8 0.14 70)' : 'none', cursor: tocable ? 'pointer' : 'default' }}
          >
            {a.quien ? (
              <Avatar foto={fotoDe?.(a) ?? null} inicial={(a.quien[0] ?? '·').toUpperCase()} tam={38} radio={12} fondo={fondoIcono} color={colorIcono} />
            ) : (
              <span aria-hidden="true" style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, background: fondoIcono, color: colorIcono, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icono ? <Icono nombre={icono} size={18} /> : '·'}
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ font: sinLeer ? "600 14px/1.35 'Geist'" : "500 14px/1.35 'Geist'", textWrap: 'pretty' }}>{a.texto}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{haceCuanto(a.creado_en, ahora)}</span>
                {a.etiqueta && (
                  <span data-etiqueta-aviso style={{ height: 20, padding: '0 8px', borderRadius: 999, background: a.etiqueta === 'Aceptada' ? 'oklch(0.96 0.035 150)' : '#EDE8DE', color: a.etiqueta === 'Aceptada' ? 'oklch(0.36 0.09 150)' : 'rgba(28,34,48,.6)', font: "600 10.5px/20px 'Geist'" }}>
                    {a.etiqueta}
                  </span>
                )}
              </span>
            </span>
            {sinLeer && <span aria-label="Sin leer" style={{ width: 9, height: 9, flex: 'none', marginTop: 6, borderRadius: '50%', background: 'oklch(0.55 0.17 5)' }} />}
          </div>
        )
      })}
    </div>
  )
}
