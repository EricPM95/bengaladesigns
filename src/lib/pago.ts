import { useSyncExternalStore } from 'react'
import { sinPasePruebaActivo, useSinPasePrueba } from '../store/useSinPasePrueba'

/**
 * El interruptor de pago (Tanda 6s): UN solo sitio para toda la app. Todo lo que es de pago va detrás de `pagoActivo()`; con él apagado no sale
 * nada de eso, ni candados ni avisos. De pago en la 6s: el bloque «Llegada y vuelta», la pregunta de la zona del alojamiento, el resumen de arriba y
 * lo de la barra de llegada y de vuelta de DÍAS («+ AÑADIR VUELO», el punto elegido en la ventana).
 *
 * Ahora va ENCENDIDO (`PAGO_ACTIVO`), para hacer las pruebas. Para ver la versión gratis sin tocar nada se añade `?version=gratis` a la dirección, y
 * `?version=completa` para volver; la elección se guarda mientras la pestaña esté abierta.
 */
export const PAGO_ACTIVO = true

const CLAVE = 'trazo:version'

function versionPedida(): 'gratis' | 'completa' | null {
  try {
    const param = new URLSearchParams(window.location.search).get('version')
    if (param === 'gratis' || param === 'completa') {
      window.sessionStorage.setItem(CLAVE, param)
      return param
    }
    const guardada = window.sessionStorage.getItem(CLAVE)
    return guardada === 'gratis' || guardada === 'completa' ? guardada : null
  } catch {
    return null
  }
}

/** ¿Está encendido lo de pago? La dirección manda (`?version=gratis` / `?version=completa`); si no dice nada, el dato de configuración. */
/**
 * EL DÍA DE PRUEBA (Tanda 10H): el día que el viajero sin pase tiene HOY entero, gratis, de 00:00 a 23:59 (hora del destino), HOY lo pinta todo como con el pase. `HoyView` lo enciende mientras enseña ese día y lo apaga al salir.
 */
let enDiaDePrueba = false
export const fijarDiaDePrueba = (activo: boolean): void => {
  enDiaDePrueba = activo
}

export function pagoActivo(): boolean {
  if (enDiaDePrueba) return true
  // «Verme como viajero sin pase» (Tanda 10B, solo pruebas del administrador; lo decide el servidor): lo de pago, cerrado.
  if (sinPasePruebaActivo()) return false
  const pedida = versionPedida()
  // (Tanda 10N5 §0.2) Mientras no se sabe si hay pase, lo de pago NO está abierto (y los candados no se pintan: `pagoPendiente()`); en cuanto llega la respuesta, todo se repinta solo.
  if (pedida === null && !paseSabido) return false
  // (Tanda 10N §3) Sin una versión pedida en la dirección, manda el pase de verdad: si el servidor dice «cobro encendido y esta cuenta sin pase», no hay pase (lo mismo que dice HOY).
  return pedida === null ? PAGO_ACTIVO && !servidorDiceSinPase : pedida === 'completa'
}

/**
 * (Tanda 10N5 §0.2) ¿Todavía no se sabe si hay pase? Verdadero solo mientras llega la respuesta del servidor (`/api/pase/estado`): entonces NI el candado cerrado NI lo abierto: sin pintar.
 * Nunca es verdadero con `?version=` pedida, en el día de prueba ni con el «verme sin pase» de las pruebas (esos casos ya lo saben).
 */
export function pagoPendiente(): boolean {
  if (enDiaDePrueba || sinPasePruebaActivo()) return false
  return versionPedida() === null && !paseSabido
}

/** (Tanda 10N5 §0.2) `pagoActivo()` avisa cuando cambia: quien pinta candados se suscribe (`usePagoActivo`) y se repinta solo al llegar la respuesta del pase. */
let paseSabido = true
let viajeSabido: string | null = null
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((f) => f())
export const suscribirPago = (f: () => void): (() => void) => {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}
/** El servidor aún no ha dicho nada de este viaje: todo lo del pase queda sin pintar. */
export const fijarPaseDesconocido = (tripId: string | null): void => {
  // (Ya se sabe lo de ESTE viaje —otro componente lo preguntó antes—: no se vuelve a borrar nada por cada pantalla que lo pregunta.)
  if (!paseSabido || (tripId != null && tripId === viajeSabido)) return
  paseSabido = false
  avisar()
}
/**
 * (Tanda 10N10 §3a) Lo último que se sabía del pase de este viaje (guardado en el móvil): se pinta al momento como si ya se supiera, SIN dar el viaje por «sabido»: el servidor lo confirma después
 * (`fijarServidorDiceSinPase`) y, si ha cambiado, se repinta.
 */
export const fijarPaseDeLaCache = (sinPase: boolean): void => {
  const igual = servidorDiceSinPase === sinPase && paseSabido
  servidorDiceSinPase = sinPase
  paseSabido = true
  if (!igual) avisar()
}
/** El estado del pase como texto (`con` | `sin` | `pendiente`): cambia cuando cambia cualquier cosa de la que depende `pagoActivo()`. */
export function estadoDelPaseParaPintar(): 'con' | 'sin' | 'pendiente' {
  return pagoPendiente() ? 'pendiente' : pagoActivo() ? 'con' : 'sin'
}
const suscribirTodo = (f: () => void): (() => void) => {
  const a = suscribirPago(f)
  const b = useSinPasePrueba.subscribe(f)
  return () => {
    a()
    b()
  }
}
/** El hook de lo que se pinta según el pase: devuelve `pagoActivo()` y repinta al cambiar el pase. */
export function usePagoActivo(): boolean {
  return useSyncExternalStore(suscribirTodo, pagoActivo, pagoActivo)
}
/** El hook de lo que decide entre «cerrado» y «abierto»: `'pendiente'` = sin pintar ni una cosa ni la otra. */
export function usePasePintable(): 'con' | 'sin' | 'pendiente' {
  return useSyncExternalStore(suscribirTodo, estadoDelPaseParaPintar, estadoDelPaseParaPintar)
}

/** (Tanda 10N §3) Lo que dijo el servidor del pase (`usePaseEstado`): verdadero si el cobro está encendido y la cuenta no tiene pase. RUTA, HOY y todos los candados leen lo mismo a través de `pagoActivo()`. */
let servidorDiceSinPase = false
export const fijarServidorDiceSinPase = (sinPase: boolean, tripId: string | null = null): void => {
  viajeSabido = tripId
  const igual = servidorDiceSinPase === sinPase && paseSabido
  servidorDiceSinPase = sinPase
  paseSabido = true
  if (!igual) avisar()
}

/** Quita un parámetro de la dirección sin recargar (si no, `?version=gratis` mandaría siempre sobre lo que se elige en el panel de pruebas). */
export function quitarParametroDeLaDireccion(nombre: string): void {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(nombre)) return
    url.searchParams.delete(nombre)
    window.history.replaceState(null, '', url)
  } catch {
    /* sin dirección (pruebas en el servidor): nada que quitar */
  }
}

/** El panel de pruebas elige la versión (lo mismo que `?version=gratis` / `?version=completa`): se guarda mientras la pestaña esté abierta. */
export function fijarVersion(version: 'gratis' | 'completa'): void {
  try {
    window.sessionStorage.setItem(CLAVE, version)
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
  quitarParametroDeLaDireccion('version')
}

/**
 * Lo que pasa al tocar algo con candado en la gratis («Escuchar historia»): avisa de que el viajero quiere la versión completa. Es el UNICO sitio de ese aviso;
 * cuando exista la pantalla de pago, solo tiene que escuchar este evento (`trazo:pagar`). Hasta entonces la barra con candado dice que es de la versión completa.
 */
export const EVENTO_PAGAR = 'trazo:pagar'
/**
 * ABRIR EL PASE (Tanda 10G): la UNA función que usan todos los candados, la pastilla «Pase Roma» de RUTA y todos los [Ver el Pase Roma]: abre la hoja de compra («¿Cuántos sois?»). Cuando llegue la película del pase
 * (Design la está haciendo), solo hay que cambiar ESTA función para que abra primero la película. `pedirPago` es el mismo nombre de antes (no se rompe nada de lo que ya lo llamaba).
 */
export function abrirPase(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_PAGAR))
  } catch {
    /* sin ventana (pruebas en el servidor): nada que avisar */
  }
}
export const pedirPago = abrirPase
