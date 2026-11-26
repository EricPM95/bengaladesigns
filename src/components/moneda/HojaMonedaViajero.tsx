import { useMemo, useState } from 'react'
import { HojaOpciones, OpcionTarjeta } from '../ui/HojaOpciones'
import { CampoDeBusqueda, coincideConBusqueda } from '../ui/CampoDeBusqueda'
import { monedaDelPais } from '../../lib/monedaDelPais'
import { nombreDelPais, paisesOrdenados } from '../../lib/paisVive'
import { nombreDeMoneda, simboloDe } from '../../lib/dinero'
import { cambiarMoneda, useMonedaViajero } from '../../lib/moneda'
import { useMonedas } from '../../lib/useMoneda'

/**
 * LA HOJA PARA ELEGIR LA MONEDA DEL VIAJERO (Tanda 10N7, 2b-5). La misma en «Moneda» del presupuesto y en Ajustes del perfil: las dos llaman a `cambiarMoneda`, así que cambiarla en una la cambia en la otra.
 * Cada moneda es una tarjeta (la elegida, con el estilo de elegir); tocar una la pone y cierra.
 * (V70, 1b) Debajo del título, el buscador de «Dónde has estado» (`CampoDeBusqueda`): sin tildes ni mayúsculas, por el nombre de la moneda, su código («COP») o su país («Colombia» encuentra el peso colombiano). Sin resultados: No encontramos nada con "…".
 */
export function HojaMonedaViajero({ etiqueta = 'Tu moneda', onCerrar, z = 100 }: { etiqueta?: string; onCerrar: () => void; z?: number }) {
  const { moneda } = useMonedaViajero()
  const { opciones } = useMonedas()
  const [q, setQ] = useState('')
  const todos = [...new Set([moneda, 'EUR', ...opciones.map((o) => o.codigo)])]
  const paisesDe = useMemo(() => {
    const r: Record<string, string[]> = {}
    for (const p of paisesOrdenados(null)) (r[monedaDelPais(p)] ??= []).push(nombreDelPais(p))
    return r
  }, [])
  const codigos = todos.filter((c) => coincideConBusqueda([nombreDeMoneda(c), c, ...(paisesDe[c] ?? [])], q))
  return (
    <HojaOpciones etiqueta={etiqueta} titulo="Elige tu moneda" onCerrar={onCerrar} z={z} datos="moneda" cabecera={<CampoDeBusqueda valor={q} onCambio={setQ} placeholder="Busca tu moneda" datos="moneda" />}>
      {codigos.length === 0 && <span data-busqueda-vacia="1" className="px-1 py-3 text-[14.5px] font-medium leading-[1.4]">{`No encontramos nada con "${q.trim()}"`}</span>}
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
