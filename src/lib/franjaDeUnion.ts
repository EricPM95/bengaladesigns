import { nombreVisible } from './nombrePersona'

/** LA FRANJA DE «TE HAS UNIDO AL VIAJE A ROMA DE ERIC» (Tanda 10N5, `Piezas/Unirse Codigo` 03): lo que se guarda al unirse para enseñarla en el viaje recién abierto. Sin dependencias de la cuenta. */
export const CLAVE_FRANJA_UNION = 'trazo:union:franja'
export const EVENTO_FRANJA_UNION = 'trazo:franja-union'

/** Lo que enseña la franja de «Te has unido…» (se guarda en la pestaña por si la app se recarga al abrir el viaje). */
export interface FranjaDeUnion {
  destino: string | null
  invitador: string | null
  yaEstaba: boolean
}
export function guardarFranjaDeUnion(f: FranjaDeUnion): void {
  try {
    window.sessionStorage.setItem(CLAVE_FRANJA_UNION, JSON.stringify(f))
  } catch {
    /* sin almacenamiento: no se enseña */
  }
  try {
    window.dispatchEvent(new Event(EVENTO_FRANJA_UNION))
  } catch {
    /* sin ventana */
  }
}
export function leerFranjaDeUnion(): FranjaDeUnion | null {
  try {
    const t = window.sessionStorage.getItem(CLAVE_FRANJA_UNION)
    return t ? (JSON.parse(t) as FranjaDeUnion) : null
  } catch {
    return null
  }
}
export function olvidarFranjaDeUnion(): void {
  try {
    window.sessionStorage.removeItem(CLAVE_FRANJA_UNION)
  } catch {
    /* nada que quitar */
  }
}

/** Pura: los dos textos de la franja (Design 03): «Te has unido al viaje a Roma de Eric» y «Ahora lo ves igual que él». */
export function textosDeLaFranja(f: FranjaDeUnion): { titulo: string; linea: string; inicial: string } {
  const quien = f.invitador?.trim() ? nombreVisible(f.invitador) : null
  const donde = f.destino?.trim() ? ` a ${f.destino.trim()}` : ''
  const inicial = (quien ?? 'V').charAt(0).toUpperCase()
  if (f.yaEstaba) return { titulo: `Ya estabas en el viaje${donde}${quien ? ` de ${quien}` : ''}`, linea: 'Lo hemos abierto', inicial }
  return { titulo: `Te has unido al viaje${donde}${quien ? ` de ${quien}` : ''}`, linea: quien ? 'Ahora lo ves igual que él' : 'Ahora lo ves igual que quien lo organiza', inicial }
}

