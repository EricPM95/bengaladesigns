import type { ReactNode } from 'react'

/**
 * EL TIRADOR de toda hoja que sube desde abajo (Noche 24-25 nov, «una sola forma»; el de `HojaOpciones` / `HojaDia` de Design): una barrita de 44 × 4 px, centrada arriba. Solo se ve: quien arrastra es la hoja (o `Hoja`, que
 * le pone su zona de agarre). Nunca se escribe a mano otra barrita (antes había una de 42 px y otra de 44, con dos grises). `oscura` es para las hojas de fondo oscuro.
 */
export function TiradorDeHoja({ oscura = false }: { oscura?: boolean }): ReactNode {
  return <span aria-hidden="true" data-tirador-de-hoja style={{ display: 'block', alignSelf: 'center', flex: 'none', width: 44, height: 4, borderRadius: 2, margin: '0 auto', background: oscura ? 'rgba(255,253,248,.25)' : 'rgba(28,34,48,.25)' }} />
}
