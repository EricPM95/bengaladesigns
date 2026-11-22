import { useState } from 'react'
import { HojaOpciones, OpcionTarjeta } from '../ui/HojaOpciones'
import { BuscadorSueno } from '../primeraVez/BuscadorSueno'
import type { Sueno } from '../../lib/suenos'

/**
 * (V39) LA HOJA DE «EL VIAJE DE TUS SUEÑOS», en Ajustes: el mismo buscador de la primera vez (país o destino, con bandera y etiqueta «País» / «Destino»). Elegir uno lo guarda y cierra; «Cambiar» vuelve al buscador;
 * «Quitar mi viaje soñado» lo deja vacío. Es opcional; no se enseña a nadie.
 */
export function HojaSueno({ actual, onElegir, onCerrar, z = 90 }: { actual: Sueno | null; onElegir: (s: Sueno | null) => void; onCerrar: () => void; z?: number }) {
  // «Cambiar» solo vuelve al buscador (no guarda nada hasta que se elige otro).
  const [valor, setValor] = useState<Sueno | null>(actual)
  return (
    <HojaOpciones etiqueta="Ajustes" titulo="El viaje de tus sueños" onCerrar={onCerrar} z={z} datos="sueno">
      <p className="m-0 text-[14px] leading-[1.35] text-text/60">Un país o una ciudad que te encantaría visitar.</p>
      <BuscadorSueno
        valor={valor}
        onElegir={(s) => {
          if (s) onElegir(s)
          else setValor(null)
        }}
      />
      {actual && <OpcionTarjeta tono="gris" titulo="Quitar mi viaje soñado" linea="Lo dejas sin contestar" datos="sueno-quitar" onClick={() => onElegir(null)} />}
    </HojaOpciones>
  )
}
