/**
 * (Tanda 10N10, apartado 1) QUÉ HACE EL MÓVIL CUANDO OTRA PERSONA CAMBIA EL VIAJE. Antes, al llegar el cambio del viaje por Realtime (`trips`), 600 ms después —si el aviso con el nombre de quien lo hizo todavía no había
 * llegado por su propio canal (`avisos`)— salía la línea «Han cambiado el viaje» (con la «i») y SONABA; y el aviso de verdad, que llegaba justo después, se tiraba (misma clave) o salía sin sonido (el sonido ya se había gastado).
 * Eso era lo que se veía: el aviso «Ha cambiado el viaje» que pasaba a «Eric ha quitado el Free Tour», sin sonido.
 * Ahora: la línea solo sale si, pasado un plazo razonable (`esperaAvisoMs`) y habiendo vuelto a pedir la lista de avisos, NO ha salido ningún aviso nuevo. Si el aviso llega por Realtime o por la lista, sale él (con su franja y su sonido)
 * y la línea no sale nunca. Pura (sin React ni red): la usa CompartidoHost y la prueba de las dos cuentas reales.
 */
export type ResultadoDeRefresco = 'cambiado' | 'igual' | 'fuera' | 'sin_datos'

export interface OpcionesDelAnfitrion {
  /** Vuelve a pedir el viaje a la nube y dice qué pasó. */
  refrescar: () => Promise<ResultadoDeRefresco>
  /** Vuelve a pedir la lista de avisos (anuncia en la franja los nuevos). */
  cargarAvisos: () => Promise<void>
  /** Cuántos avisos nuevos se han anunciado en la franja en total (sube cada vez que sale uno). */
  anunciados: () => number
  /** Dice una línea sencilla de la propia app. */
  decir: (titulo: string, clave: string) => void
  /** Te han quitado del viaje. */
  alQuitado: () => void
  tripId: string
  /** Un momento para agrupar las ráfagas de Realtime antes de pedir el viaje (600 ms). */
  esperaMs?: number
  /** Cuánto se espera al aviso de verdad antes de decir la línea sencilla (3 s). */
  esperaAvisoMs?: number
}

export function crearAnfitrionDeCambios(o: OpcionesDelAnfitrion) {
  const espera = o.esperaMs ?? 600
  const esperaAviso = o.esperaAvisoMs ?? 3000
  let vivo = true
  let t1: ReturnType<typeof setTimeout> | undefined
  let t2: ReturnType<typeof setTimeout> | undefined
  let anunciadosAlCambio = 0
  let ultimoAviso = 0

  async function cuandoPasaElPlazo() {
    if (!vivo) return
    // Primero la lista (por si el aviso se perdió por el camino), luego se mira si salió alguno.
    await o.cargarAvisos()
    if (!vivo) return
    if (o.anunciados() === anunciadosAlCambio && Date.now() - ultimoAviso > 10_000) o.decir('Han cambiado el viaje', `cambiado:${o.tripId}`)
  }

  return {
    /** Llegó el cambio de la fila del viaje. */
    alViaje() {
      if (!t2) anunciadosAlCambio = o.anunciados()
      clearTimeout(t1)
      t1 = setTimeout(() => {
        void o.refrescar().then((r) => {
          if (!vivo) return
          if (r === 'fuera') {
            o.decir('Ya no formas parte del viaje', `quitado:${o.tripId}`)
            o.alQuitado()
            return
          }
          void o.cargarAvisos()
          if (r !== 'cambiado') return
          clearTimeout(t2)
          t2 = setTimeout(() => {
            t2 = undefined
            void cuandoPasaElPlazo()
          }, esperaAviso)
        })
      }, espera)
    },
    /** Llegó un aviso de cambio del viaje (el nuevo está en la lista: sale él, no la línea). */
    alAvisoDeCambio() {
      ultimoAviso = Date.now()
      void o.cargarAvisos()
      clearTimeout(t1)
      t1 = setTimeout(() => {
        void o.refrescar().then((r) => {
          if (!vivo) return
          if (r === 'fuera') {
            o.decir('Ya no formas parte del viaje', `quitado:${o.tripId}`)
            o.alQuitado()
          }
        })
      }, espera)
      // El aviso de verdad ya está aquí: la línea sencilla no hace falta.
      clearTimeout(t2)
      t2 = undefined
    },
    /** El sondeo de siempre (por si Realtime no está) encontró el viaje cambiado: se pide la lista y, si no sale ningún aviso nuevo, la línea sencilla. */
    async alSondeo() {
      const antes = o.anunciados()
      await o.cargarAvisos()
      if (vivo && o.anunciados() === antes && Date.now() - ultimoAviso > 10_000) o.decir('Han cambiado el viaje', `cambiado:${o.tripId}`)
    },
    parar() {
      vivo = false
      clearTimeout(t1)
      clearTimeout(t2)
    },
  }
}
