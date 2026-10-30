import type { ReactNode } from 'react'
import { PiezaSegura } from '../PiezaSegura'
import type { NombreIcono } from '../../lib/iconos'
import { haceCuanto, type AvisoDeCuenta } from '../../lib/avisos'
import { Icono } from '../ui/Icono'
import { Avatar } from '../ajustes/Avatar'
import { AvisoDeGasto } from './AvisoDeGasto'
import { AvisoDeEntrada } from './AvisoDeEntrada'
import { ConSeleccion, FilaDeAviso, letraDeAviso, letraDeCuando, SIN_SELECCION, type SeleccionDeAvisos } from './FilaDeAviso'

const ICONO: Partial<Record<AvisoDeCuenta['tipo'], NombreIcono>> = { d10: 'avion', resumen: 'estrella', sorpresas: 'gema', sorteo: 'pase', amigo_viaje: 'compartido' }

/** La clave con la que «Seleccionar» elige un aviso de la cuenta. */
export const claveDeAviso = (id: string) => `c:${id}`

/**
 * LA LISTA DE AVISOS DE LA CUENTA (AV2 a AV5, cuentas parte 3; Tanda 10N4 §2 con el diseño `Piezas/Avisos Gestion`): lo nuevo en negrita con el puntito dorado, lo leído en gris. Cada aviso lleva la inicial de
 * quien lo hace (o el icono de la app, en los de fecha) y, si es una recomendación ya contestada, «Aceptada» o «No aceptada» (AV3). Tocar un aviso lo abre y lo da por leído. En «Seleccionar» se eligen con un circulito.
 */
export function ListaDeAvisos({
  avisos,
  resaltado = null,
  onTocar,
  ahora = Date.now(),
  fotoDe,
  seleccion = SIN_SELECCION,
  alLeer,
}: {
  avisos: AvisoDeCuenta[]
  resaltado?: string | null
  onTocar: (aviso: AvisoDeCuenta) => void
  ahora?: number
  fotoDe?: (aviso: AvisoDeCuenta) => string | null
  seleccion?: SeleccionDeAvisos
  /** Tocar el aviso con botones dentro (gasto, entrada) lo da por leído. */
  alLeer?: (aviso: AvisoDeCuenta) => void
}) {
  return (
    <div data-lista-avisos className="flex flex-col gap-2">
      {avisos.map((a) => (
        <PiezaSegura key={a.id} nombre="aviso de la campana">
          {((): ReactNode => {
        const clave = claveDeAviso(a.id)
        // (Tanda 10N, apartado 9) «Ana quiere añadir al presupuesto»: el gasto va dentro y [Rechazar] [Aceptar] en el mismo aviso.
        if (a.tipo === 'gasto_pendiente')
          return (
            <ConSeleccion key={a.id} clave={clave} seleccion={seleccion} onLeer={() => alLeer?.(a)}>
              <AvisoDeGasto aviso={a} ahora={ahora} foto={fotoDe?.(a) ?? null} resaltado={resaltado === a.id} />
            </ConSeleccion>
          )
        // (Tanda 10N3 §3) «Eric ha reservado el Coliseo…» y «Tu entrada no cuadra…»: los crea la base de datos; cada uno con sus botones.
        if (a.tipo === 'reserva_grupo')
          return (
            <ConSeleccion key={a.id} clave={clave} seleccion={seleccion} onLeer={() => alLeer?.(a)}>
              <AvisoDeEntrada aviso={a} ahora={ahora} foto={fotoDe?.(a) ?? null} resaltado={resaltado === a.id} />
            </ConSeleccion>
          )
        const leido = a.leido || Boolean(a.etiqueta)
        // (10P) El aviso del sorteo lleva el icono del billete en dorado (`Piezas/Sorteo Perfil`).
        const especial = a.tipo === 'sorteo'
        const icono = ICONO[a.tipo]
        const fondoEspecial = 'linear-gradient(145deg,#FFF6DC,#E9C77A 45%,#C99A44)'
        return (
          <FilaDeAviso
            key={a.id}
            clave={clave}
            leido={leido}
            seleccion={seleccion}
            onTocar={() => onTocar(a)}
            resaltado={resaltado === a.id}
            atributos={{ 'data-aviso': a.id, 'data-aviso-tipo': a.tipo }}
            icono={
              a.quien ? (
                <Avatar foto={fotoDe?.(a) ?? null} inicial={(a.quien[0] ?? '·').toUpperCase()} tam={42} radio={13} fondo={especial ? fondoEspecial : leido ? '#F1EADC' : '#F3E2B0'} color="#1C2230" />
              ) : icono ? (
                <span style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: especial ? fondoEspecial : undefined }}>
                  <Icono nombre={icono} size={20} />
                </span>
              ) : (
                '·'
              )
            }
          >
            <span data-aviso-texto style={letraDeAviso(leido)}>{a.texto}</span>
            {a.detalle && (
              <span data-aviso-detalle style={{ font: "500 12px/1.35 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                {a.detalle}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={letraDeCuando}>{haceCuanto(a.creado_en, ahora)}</span>
              {a.etiqueta && (
                <span data-etiqueta-aviso style={{ height: 20, padding: '0 8px', borderRadius: 999, background: a.etiqueta === 'Aceptada' ? 'oklch(0.96 0.035 150)' : '#EDE8DE', color: a.etiqueta === 'Aceptada' ? 'oklch(0.36 0.09 150)' : 'rgba(28,34,48,.6)', font: "600 10.5px/20px 'Geist'" }}>
                  {a.etiqueta}
                </span>
              )}
            </span>
          </FilaDeAviso>
        )
          })()}
        </PiezaSegura>
      ))}
    </div>
  )
}
