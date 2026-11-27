import type { ReactNode } from 'react'
import { Hoja, BotonHoja, DosBotonesHoja } from '../../ui/Hoja'
import { Icono } from '../../ui/Icono'
import { DORADO } from '../../ui/botonesOro'
import type { NombreIcono } from '../../../lib/iconos'

/**
 * (V76; Design «Añadir una reserva» R5 y R11) LA HOJA DE «¿ES PARA…?»: la pregunta de ANTES DE GUARDAR un ferry, tren o autobús que cae el día de algo que la app ya tiene (una excursión; la llegada; la vuelta).
 * UNA SOLA PIEZA para los tres casos: el título (la pregunta), la tarjeta pequeña del billete debajo (icono dorado, «Ferry · Viernes 27 · 10:00», «Órzola → La Graciosa») y dos botones lado a lado: el dorado ([Sí, unirlo a …]) y el
 * blanco ([No, guardarlo aparte]). Es la hoja de siempre (`Hoja` + `DosBotonesHoja`): nada nuevo que diseñar. Quien la usa pone los textos y decide qué hace cada botón; la hoja no guarda nada.
 *   · Excursión (R5): título «¿Es para tu excursión a La Graciosa?», botones «Sí, unirlo a la excursión» / «No, guardarlo aparte».
 *   · Llegada: «¿Es para ir del aeropuerto a tu alojamiento?», «Sí, unirlo a mi llegada»; vuelta: «¿Es para ir al aeropuerto?», «Sí, unirlo a mi vuelta».
 * Sale por encima de la hoja del formulario (`z` 130). Consultas a Supabase: ninguna.
 */
export function HojaUnirReserva({
  titulo,
  billete,
  textoSi = 'Sí, unirlo a la excursión',
  textoNo = 'No, guardarlo aparte',
  onSi,
  onNo,
  onCerrar,
  datos = 'unir-reserva',
  extra,
}: {
  titulo: string
  billete: { icono: NombreIcono; titulo: string; sub?: string }
  textoSi?: string
  textoNo?: string
  onSi: () => void
  onNo: () => void
  onCerrar: () => void
  /** Para distinguir las hojas en las pruebas: `data-hoja="<datos>"`. */
  datos?: string
  /** Algo más debajo del billete (por si quien la usa lo necesita). */
  extra?: ReactNode
}) {
  return (
    <Hoja onCerrar={onCerrar} titulo={titulo} datos={datos} z={130}>
      <div className="flex flex-col gap-4" data-hoja-unir-reserva>
        <div data-unir-billete className="flex items-center gap-3 rounded-[18px] px-3 py-3" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: DORADO, color: '#4A3510' }}>
            <Icono nombre={billete.icono} size={20} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span data-unir-billete-titulo className="[overflow-wrap:anywhere]" style={{ font: "700 15px 'Geist'", color: '#1C2230' }}>
              {billete.titulo}
            </span>
            {billete.sub && (
              <span data-unir-billete-sub className="[overflow-wrap:anywhere]" style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                {billete.sub}
              </span>
            )}
          </span>
        </div>
        {extra}
        <DosBotonesHoja>
          <BotonHoja tipo="dorado" onClick={onSi} datos="unir-si">
            {textoSi}
          </BotonHoja>
          <BotonHoja tipo="secundario" onClick={onNo} datos="unir-no">
            {textoNo}
          </BotonHoja>
        </DosBotonesHoja>
      </div>
    </Hoja>
  )
}
