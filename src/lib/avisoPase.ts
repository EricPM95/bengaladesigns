import { pagoActivo } from './pago'

/**
 * EL AVISO PEQUEÑO DEL PASE (Tanda 10N6 §1g): lo que sale cuando alguien SIN pase toca algo bloqueado por el pase.
 * Una sola función para toda la app: `abrirAvisoPase('segunda_foto')`. Los textos viven en `avisoPaseTextos.ts`.
 * Con pase (comprado o con plaza de grupo), no hace nada. El componente (`AvisoPaseHost`, montado en App.tsx) escucha este evento.
 */
export const EVENTO_AVISO_PASE = 'trazo:aviso-pase'

export interface DetalleAvisoPase {
  clave: string
  destino?: string
}

export function abrirAvisoPase(clave: string, opciones?: { destino?: string }): void {
  if (pagoActivo()) return
  try {
    window.dispatchEvent(new CustomEvent<DetalleAvisoPase>(EVENTO_AVISO_PASE, { detail: { clave, destino: opciones?.destino } }))
  } catch {
    /* sin ventana (pruebas en el servidor): nada que avisar */
  }
}
