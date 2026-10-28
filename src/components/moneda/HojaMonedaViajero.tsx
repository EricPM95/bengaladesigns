import { HojaOpciones, OpcionTarjeta } from '../ui/HojaOpciones'
import { nombreDeMoneda, simboloDe } from '../../lib/dinero'
import { cambiarMoneda, useMonedaViajero } from '../../lib/moneda'
import { useMonedas } from '../../lib/useMoneda'

/**
 * LA HOJA PARA ELEGIR LA MONEDA DEL VIAJERO (Tanda 10N7, 2b-5). La misma en «Moneda» del presupuesto y en Ajustes del perfil: las dos llaman a `cambiarMoneda`, así que cambiarla en una la cambia en la otra.
 * Cada moneda es una tarjeta (la elegida, con el estilo de elegir); tocar una la pone y cierra.
 */
export function HojaMonedaViajero({ etiqueta = 'Tu moneda', onCerrar, z = 100 }: { etiqueta?: string; onCerrar: () => void; z?: number }) {
  const { moneda } = useMonedaViajero()
  const { opciones } = useMonedas()
  const codigos = [...new Set([moneda, 'EUR', ...opciones.map((o) => o.codigo)])]
  return (
    <HojaOpciones etiqueta={etiqueta} titulo="Elige tu moneda" onCerrar={onCerrar} z={z} datos="moneda">
      {codigos.map((codigo) => (
        <OpcionTarjeta
          key={codigo}
          tono="arena"
          icono={<span style={{ font: "600 17px 'Geist Mono',monospace" }}>{simboloDe(codigo).slice(0, 4)}</span>}
          titulo={nombreDeMoneda(codigo)}
          linea={codigo === 'EUR' ? 'La de siempre; los precios del viaje se guardan tal cual' : `${codigo} · se enseña con el cambio del día`}
          elegida={codigo === moneda}
          datos={`moneda-${codigo}`}
          onClick={() => {
            void cambiarMoneda(codigo)
            onCerrar()
          }}
        />
      ))}
    </HojaOpciones>
  )
}
