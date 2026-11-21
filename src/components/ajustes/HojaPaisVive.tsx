import { HojaOpciones, OpcionTarjeta } from '../ui/HojaOpciones'
import { FlagIcon } from '../ui/FlagIcon'
import { nombreDelPais, paisesOrdenados } from '../../lib/paisVive'

/**
 * (V35B) LA HOJA PARA ELEGIR EL PAÍS DONDE VIVES, en Ajustes. La lista de países en español, cada uno con su bandera; el elegido, marcado; arriba «Prefiero no decirlo» (lo quita). Tocar uno lo pone y cierra.
 * Es opcional: sirve para saber desde dónde viaja la gente; nunca se enseña a nadie.
 */
export function HojaPaisVive({ actual, onElegir, onCerrar, z = 90 }: { actual: string | null; onElegir: (iso: string | null) => void; onCerrar: () => void; z?: number }) {
  return (
    <HojaOpciones etiqueta="País donde vives" titulo="¿En qué país vives?" onCerrar={onCerrar} z={z} datos="pais-vive">
      <OpcionTarjeta tono="gris" titulo="Prefiero no decirlo" linea="Lo dejas sin contestar" elegida={actual === null} datos="pais-ninguno" onClick={() => onElegir(null)} />
      {paisesOrdenados(null).map((p) => (
        <OpcionTarjeta
          key={p}
          tono="arena"
          icono={
            <span className="flex items-center justify-center overflow-hidden" style={{ width: 30, height: 22, fontSize: 30, borderRadius: 3 }}>
              <FlagIcon countryCode={p.toLowerCase()} className="!block !h-full !w-full !rounded-none" />
            </span>
          }
          titulo={nombreDelPais(p)}
          elegida={p === actual}
          datos={`pais-${p}`}
          onClick={() => onElegir(p)}
        />
      ))}
    </HojaOpciones>
  )
}
