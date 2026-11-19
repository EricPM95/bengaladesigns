import { abrirCuentanos } from './useCuentanosStore'

/**
 * (10S5, V20) «Propón un sitio»: desde la V20 es la pantalla U2b de «Cuéntanos» («Añadir un lugar») con el nombre ya escrito: un solo camino. Todo lo que abría la hoja vieja llama a
 * `abrirProponerSitio({ nombre, origen })` (fuera de React) o a `useProponerSitio()`; ahora abren U2b.
 */
export interface AperturaProponerSitio {
  nombre?: string
  origen?: string
}

/** Abre «Añadir un lugar» (U2b) con el nombre ya escrito, desde donde sea. */
export function abrirProponerSitio(apertura?: AperturaProponerSitio): void {
  abrirCuentanos({ tipo: 'lugar', nombre: apertura?.nombre, origen: apertura?.origen })
}

/** El gancho global: `const proponerSitio = useProponerSitio(); proponerSitio({ nombre: 'Torre Eiffel', origen: 'reservas' })`. */
export function useProponerSitio(): (apertura?: AperturaProponerSitio) => void {
  return abrirProponerSitio
}
