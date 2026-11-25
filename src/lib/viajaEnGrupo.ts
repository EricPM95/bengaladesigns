import { modoDeCuentas } from './modoCuentas'

/**
 * (V56, 10) ¿Viaja con más gente? Lo decide `modoCuentas` (las personas UNIDAS al viaje), NO lo que se dijo en el formulario: si viaja solo, HOY habla en singular («¿Cómo vas?», «Tómate un respiro»);
 * con más personas unidas, en plural («¿Cómo vais?», «Tomaos un respiro»). Lectura síncrona, para los textos que se arman fuera de un componente.
 */
export const viajaEnGrupo = (): boolean => modoDeCuentas() !== 'solo'

/** El texto en plural si viajan varios; si no, el de una persona. */
export const segunGrupo = (plural: string, singular: string): string => (viajaEnGrupo() ? plural : singular)
