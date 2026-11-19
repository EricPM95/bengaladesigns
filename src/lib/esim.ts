import roaming from '../../data/esim/roaming.json'
import { reglaDeEsim, type NecesidadDeEsim } from './esimRegla'

export { idDeTarjetaEsim, paisDeSalida, type NecesidadDeEsim } from './esimRegla'

/**
 * (V22) ¿HACE FALTA eSIM? La regla está en `esimRegla.ts` y la lista de países del «roaming como en casa» (UE y EEE), en `data/esim/roaming.json`: se cambia allí, sin tocar el código.
 */
const COMO_EN_CASA = new Set((roaming.roaming_como_en_casa as string[]).map((c) => c.toLowerCase()))

export const esimNecesaria = (origen: string | null | undefined, destino: string | null | undefined): NecesidadDeEsim => reglaDeEsim(origen, destino, COMO_EN_CASA)
