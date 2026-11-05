import { useState } from 'react'
import marca from '../../../../../data/marca.json'
import { cerrarTarjetaDeAvisos, debeEnseñarTarjetaDeAvisos, pasosParaInstalar, plataformaDe, tarjetaDeAvisosCerrada, yaEstaInstalada } from '../../../../lib/instalar'
import { Icono } from '../../../ui/Icono'
import { AvisoDeHoy, CruzDeAviso } from './AvisosHoy'

/**
 * HOY3: «Añade JUTRIP a tu pantalla de inicio para recibir los avisos del viaje». Solo el primer día del viaje, en iPhone, con la web sin instalar (ahí los avisos con el móvil bloqueado solo llegan desde la pantalla de inicio),
 * con pase o en el día de prueba. Lleva los pasos de `pasosParaInstalar` (los mismos del aviso de instalar) y la X: cerrada, no vuelve. Prioridad 4 en la zona de avisos de HOY (después de lo que corre peligro y del tiempo).
 */
export function TarjetaInstalarAvisos({ dateIso, inicioDelViaje, conPase }: { dateIso: string; inicioDelViaje: string | null | undefined; conPase: boolean }) {
  const [cerrada, setCerrada] = useState(() => tarjetaDeAvisosCerrada())
  const plataforma = plataformaDe(typeof navigator === 'undefined' ? '' : navigator.userAgent, typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints)
  if (!debeEnseñarTarjetaDeAvisos({ plataforma, instalada: yaEstaInstalada(), esPrimerDia: Boolean(inicioDelViaje) && dateIso === inicioDelViaje, conPase, cerrada })) return null
  const pasos = pasosParaInstalar('ios', marca.nombre, false)
  return (
    <AvisoDeHoy id="instalar-avisos" prio={4}>
      <div data-hoy-instalar-avisos className="flex flex-none flex-col gap-2 rounded-[18px] py-3 pl-3 pr-2.5" style={{ background: '#FFFDF8', border: '1px solid rgba(166,124,82,.3)' }}>
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F1EADC] text-[#1C2230]">
            <Icono nombre="avisos" size={16} grosor={1.8} />
          </span>
          <span className="min-w-0 flex-1 pt-1 text-[13.5px] font-semibold leading-[1.35] text-[#1C2230]">{`Añade ${marca.nombre} a tu pantalla de inicio para recibir los avisos del viaje`}</span>
          <CruzDeAviso
            onClick={() => {
              cerrarTarjetaDeAvisos()
              setCerrada(true)
            }}
          />
        </div>
        <ol className="m-0 flex list-decimal flex-col gap-0.5 pl-[58px] pr-2 text-[12.5px] leading-[1.4] text-[#1C2230]/70">
          {pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>
    </AvisoDeHoy>
  )
}
