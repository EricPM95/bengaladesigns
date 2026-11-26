/**
 * (V71 §1) Las marcas de «esto ya salió hoy» del juego de los emblemas ocultos, guardadas en el móvil (0 KB de red). Estaban en `AvisosDeCerca.tsx`; aquí para que también las lea el flujo de [He terminado]
 * (`VistoFlujo`) sin traerse toda la pantalla de HOY. Una marca por viaje, día, sitio y paso (`brilla`, `mas_cerca`, `llegada`): la hoja de llegada («¡Aquí se esconde un Emblema Oculto!») sale UNA vez por parada.
 */
const claveJuego = (tripId: string, fecha: string, sitio: string, nivel: string) => `trazo:hoy1:juego:${tripId}:${fecha}:${sitio}:${nivel}`
export const yaSalio = (tripId: string, fecha: string, sitio: string, nivel: string): boolean => {
  try {
    return window.localStorage.getItem(claveJuego(tripId, fecha, sitio, nivel)) === '1'
  } catch {
    return false
  }
}
export const anotarQueSalio = (tripId: string, fecha: string, sitio: string, nivel: string) => {
  try {
    window.localStorage.setItem(claveJuego(tripId, fecha, sitio, nivel), '1')
  } catch {
    /* sin almacenamiento: puede volver a salir */
  }
  // Al llegar (la hoja de llegada sale), la tarjeta «Algo brilla…» / «Más cerca…» que hubiera abierta se va.
  if (nivel === 'llegada' && typeof window !== 'undefined') window.dispatchEvent(new Event('trazo:hoy1-llegada'))
}
