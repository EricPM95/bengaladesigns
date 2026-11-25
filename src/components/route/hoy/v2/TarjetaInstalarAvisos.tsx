import { useState } from 'react'
import marca from '../../../../../data/marca.json'
import { avisoInstalarVisible, cerrarTarjetaDeAvisos, debeEnseñarTarjetaDeAvisos, pasosParaInstalar, plataformaDe, tarjetaDeAvisosCerrada, yaEstaInstalada } from '../../../../lib/instalar'
import { BOTON_CLARO } from '../../../ui/botonesOro'
import { AvisoDeHoy, D_AVISO, FilaDeAviso } from './AvisosHoy'
import { HojaV2 } from './HojasV2'
import { Titulo } from './CambiarPlan'

/**
 * HOY3: «Añade JUTRIP a tu pantalla de inicio para recibir los avisos del viaje». Solo el primer día del viaje, en iPhone, con la web sin instalar (ahí los avisos con el móvil bloqueado solo llegan desde la pantalla de inicio),
 * con pase o en el día de prueba. (V66, 14) Ahora es una fila de aviso (`FilaDeAviso`, como los demás avisos de arriba) con [Cómo]: los pasos de `pasosParaInstalar` (los mismos del aviso de instalar) salen en una hoja.
 * Se va deslizándola hacia arriba: cerrada, no vuelve. Prioridad 4 en la zona de avisos de HOY (después de lo que corre peligro y del tiempo).
 */
export function TarjetaInstalarAvisos({ dateIso, inicioDelViaje, conPase }: { dateIso: string; inicioDelViaje: string | null | undefined; conPase: boolean }) {
  const [cerrada, setCerrada] = useState(() => tarjetaDeAvisosCerrada())
  const [hoja, setHoja] = useState(false)
  const plataforma = plataformaDe(typeof navigator === 'undefined' ? '' : navigator.userAgent, typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints)
  if (!avisoInstalarVisible() || !debeEnseñarTarjetaDeAvisos({ plataforma, instalada: yaEstaInstalada(), esPrimerDia: Boolean(inicioDelViaje) && dateIso === inicioDelViaje, conPase, cerrada })) return null
  const pasos = pasosParaInstalar('ios', marca.nombre, false)
  const irse = () => {
    cerrarTarjetaDeAvisos()
    setCerrada(true)
  }
  return (
    <AvisoDeHoy id="instalar-avisos" prio={4}>
      <FilaDeAviso tono="amarillo" icono={D_AVISO.pin} titulo={`Añade ${marca.nombre} a tu pantalla de inicio`} sub="Así recibes los avisos del viaje." boton={{ texto: 'Cómo', onClick: () => setHoja(true), datos: { 'data-instalar-avisos-como': '1' } }} onIrse={irse} datos={{ 'data-hoy-instalar-avisos': '1' }} />
      {hoja && (
        <HojaV2 onCerrar={() => setHoja(false)} etiqueta="Añadir a la pantalla de inicio" fondo="#FBF3E2">
          <div data-hoy-instalar-avisos-pasos className="flex flex-col gap-3">
            <Titulo texto={`Añade ${marca.nombre} a tu pantalla de inicio`} onCerrar={() => setHoja(false)} />
            <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-[14px] leading-[1.45] text-[#1C2230]/80">
              {pasos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <button type="button" onClick={() => setHoja(false)} className="flex h-[50px] items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_CLARO}>
              Entendido
            </button>
          </div>
        </HojaV2>
      )}
    </AvisoDeHoy>
  )
}
