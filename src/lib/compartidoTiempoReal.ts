/**
 * EL TIEMPO REAL DEL VIAJE COMPARTIDO (Tanda 10N §10): se engancha a Realtime de Supabase y avisa de tres cosas, para el viaje abierto y la cuenta que lo mira:
 *   · `alViaje`   — la fila del viaje cambió (el dueño o quien puede editar la guardó);
 *   · `alGente`   — alguien entró, salió, o le cambiaron el permiso (`trip_members`);
 *   · `alAviso`   — me llegó un aviso nuevo a la campana (`avisos` con mi `user_id`): «ha cambiado el viaje», «te han quitado», «tu permiso»…
 * Sin dependencias de la app: el cliente de Supabase entra por parámetro, así la prueba lo cambia por uno de mentira. Necesita la migración 0036 (pone las tres tablas en la publicación de Realtime);
 * sin ella el canal se conecta igual pero no llega nada, y la app sigue con el refresco al volver y cada poco.
 */
import { textoDelAviso } from '../../shared/avisos/textos.js'
/* eslint-disable @typescript-eslint/no-explicit-any -- el canal de Supabase tiene muchas sobrecargas; aquí solo se usa `postgres_changes` y la prueba lo cambia por uno de mentira */
export interface ClienteTiempoReal {
  channel(nombre: string): any
  removeChannel(canal: any): unknown
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface EscuchasDelViaje {
  alViaje: () => void
  alGente: () => void
  alAviso: (aviso: { tipo: string; payload: Record<string, unknown> }) => void
  alEstado?: (estado: string) => void
}

/** Se engancha; devuelve la función para soltarse. */
export function conectarViaje(nube: ClienteTiempoReal, tripId: string, uid: string | null, escuchas: EscuchasDelViaje): () => void {
  let canal = nube
    .channel(`viaje:${tripId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, () => escuchas.alViaje())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => escuchas.alGente())
  if (uid) {
    canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: 'avisos', filter: `user_id=eq.${uid}` }, (carga: { new?: Record<string, unknown> }) => {
      const fila = carga.new ?? {}
      escuchas.alAviso({ tipo: String(fila.tipo ?? ''), payload: (fila.payload ?? {}) as Record<string, unknown> })
    })
  }
  canal.subscribe(escuchas.alEstado)
  return () => {
    void nube.removeChannel(canal)
  }
}

export type AccionPorAviso = { accion: 'refrescar'; linea: string } | { accion: 'quitado'; linea: string } | { accion: 'gente'; linea: null } | { accion: 'ninguna'; linea: null }

/**
 * Pura: qué hacer cuando llega un aviso nuevo con el viaje `tripId` abierto.
 *   · `viaje_cambiado` de ese viaje → volver a pedir la ruta y decir «Eric ha cambiado el viaje.» arriba;
 *   · `quitado` de ese viaje → dejar de enseñarlo y decir «Ya no formas parte del viaje a Roma.»;
 *   · `permiso` de ese viaje → volver a pedir quién está y con qué permiso.
 */
export function accionPorAviso(aviso: { tipo: string; payload: Record<string, unknown> }, tripId: string | null): AccionPorAviso {
  const p = aviso.payload
  if (!tripId || String(p.trip_id ?? '') !== tripId) return { accion: 'ninguna', linea: null }
  if (aviso.tipo === 'viaje_cambiado') {
    // (10N5) La línea de arriba dice lo que ha pasado, igual que la campana: «Eric ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.»
    return { accion: 'refrescar', linea: textoDelAviso({ tipo: 'viaje_cambiado', payload: p }) }
  }
  if (aviso.tipo === 'quitado') return { accion: 'quitado', linea: `Ya no formas parte del viaje a ${String(p.destino ?? '')}.`.replace(' a .', '.') }
  if (aviso.tipo === 'permiso') return { accion: 'gente', linea: null }
  // (10N7) «Eric ha cambiado las cuentas a cuenta conjunta.»: se vuelve a pedir el viaje (lleva el modo) y se dice arriba.
  if (aviso.tipo === 'cuentas_modo') return { accion: 'refrescar', linea: textoDelAviso({ tipo: 'cuentas_modo', payload: p }) }
  return { accion: 'ninguna', linea: null }
}
