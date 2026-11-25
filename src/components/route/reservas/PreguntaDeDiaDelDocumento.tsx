import { useState, type ReactNode } from 'react'
import { lugarCon } from '../../../lib/articulos'
import { corregirConElDocumento, diaDistintoDelDocumento } from '../../../lib/corregirConElDocumento'
import { dayOnDate, type Reservation } from '../../../lib/bookings'
import { displayStopName } from '../../../lib/format'
import type { Propuesta } from '../../../lib/hoyCambiarPlan'
import { cuadradoDelDia, nombreDelDia } from '../../../lib/tarjetasDePropuesta'
import type { Excursion } from '../../../lib/types'
import { segunGrupo } from '../../../lib/viajaEnGrupo'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaPropuesta } from '../hoy/v2/CambiarPlan'

/**
 * (V66, 3.1; Eric, 26-nov) UNA ENTRADA O UNA RESERVA CUYO DOCUMENTO TRAE OTRO DÍA DEL VIAJE: se PREGUNTA antes de moverla (antes, V50, se movía sola). La hoja es la de las propuestas de HOY (`HojaPropuesta`, sin inventar diseño):
 * «Tu entrada del Coliseo dice jueves 26, pero la tenías el martes 24. ¿La pasamos al jueves?», la tarjeta del sitio con «Al jueves 26» y su cuadrado de fecha, [Pasarla al jueves] (dorado) y [Dejarla el martes] (blanco con borde), lado a lado.
 * Al pasarla sale el aviso de abajo con [Deshacer] (el de siempre de `withUndo`); si la deja, no cambia nada (tampoco la hora del documento). Una fecha FUERA del viaje no pregunta: la línea naranja de siempre (`corregirConElDocumento`).
 * Se usa con un hook: `const { preguntar, hoja } = usePreguntaDeDia()`, se pinta `{hoja}` y se llama a `preguntar(...)` al leer el documento; `continuar` recibe la reserva como queda y si se usa lo que trae el documento (si no, quien llama quita su fecha y su hora).
 * Sin ninguna consulta a Supabase (todo en el móvil). Vale igual en Roma que en Lanzarote (excursiones, entradas, Free Tour).
 */
type Doc = { fecha: string | null; hora: string | null }
type Continuar = (existing: Reservation, usarDocumento: boolean) => void
interface Pendiente {
  reserva: Reservation
  doc: Doc
  nombre: 'entrada' | 'reserva'
  excursion: Excursion | null
  iso: string
  dayNumber: number
  continuar: Continuar
}

const SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const semanaDe = (iso: string) => SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()]

export function usePreguntaDeDia(): { preguntar: (reserva: Reservation, doc: Doc, nombre: 'entrada' | 'reserva', excursion: Excursion | null, continuar: Continuar) => void; hoja: ReactNode } {
  const [p, setP] = useState<Pendiente | null>(null)
  const route = useRouteStore((s) => s.route)

  const preguntar = (reserva: Reservation, doc: Doc, nombre: 'entrada' | 'reserva', excursion: Excursion | null, continuar: Continuar) => {
    const otro = diaDistintoDelDocumento(reserva, doc.fecha)
    if (!otro) return continuar(corregirConElDocumento(reserva, doc, nombre, excursion), true)
    setP({ reserva, doc, nombre, excursion, iso: otro.iso, dayNumber: otro.dayNumber, continuar })
  }

  // Solo en desarrollo: las capturas y las pruebas la llaman sin subir un documento de verdad.
  if (import.meta.env.DEV) (window as unknown as { __preguntarDia?: unknown }).__preguntarDia = preguntar

  let hoja: ReactNode = null
  if (p && route) {
    const diaNuevo = dayOnDate(route, p.iso)
    const diaViejo = (p.reserva.dateIso ? dayOnDate(route, p.reserva.dateIso) : null) ?? route.days.find((d) => d.dayNumber === p.reserva.dayNumber) ?? null
    const nuevoTxt = diaNuevo ? nombreDelDia(route, diaNuevo) : semanaDe(p.iso)
    const viejoTxt = diaViejo ? nombreDelDia(route, diaViejo) : 'el día de antes'
    const semNueva = semanaDe(p.iso)
    const semVieja = p.reserva.dateIso ? semanaDe(p.reserva.dateIso) : viejoTxt
    const nombreDelSitio = displayStopName(p.reserva.name)
    const parada = diaViejo?.stops.find((s) => s.name === p.reserva.name || s.id === p.reserva.refId) ?? null
    const cuadrado = diaNuevo ? cuadradoDelDia(route, diaNuevo) : { semanaCorta: 'DÍA', numero: String(p.dayNumber) }
    const propuesta: Propuesta = {
      id: `dia-del-documento-${p.reserva.id}`,
      tipo: 'otro_dia',
      intro: `Tu ${p.nombre} ${lugarCon('de', nombreDelSitio)} dice ${nuevoTxt}, pero ${segunGrupo('la teníais', 'la tenías')} el ${viejoTxt}. ¿La pasamos al ${semNueva}?`,
      cambia: { titulo: `${nombreDelSitio} pasa al ${nuevoTxt}`, detalle: 'Lo que dice tu documento.' },
      mantiene: { titulo: 'el resto de tu viaje', detalle: 'Sin cambios.' },
      boton: `Pasarla al ${semNueva}`,
      franja: 'Sigue igual: el resto de tu viaje',
      tarjetaDia: { nombre: nombreDelSitio, fotoUrl: parada?.photoUrl || parada?.fixedPhotoUrl || '', cuando: `Al ${nuevoTxt}`, semanaCorta: cuadrado.semanaCorta, numero: cuadrado.numero, destino: nuevoTxt, diaDeHoy: viejoTxt, ...(parada ? { parada, ciudad: diaViejo?.city ?? '' } : {}) },
      ops: [],
      quitadas: [],
      corridas: 0,
      intactas: [],
    }
    const cerrar = () => setP(null)
    hoja = (
      <HojaPropuesta
        titulo={`El día de tu ${p.nombre}`}
        propuestas={[propuesta]}
        indice={0}
        onOtra={() => undefined}
        etiquetaDejar={`Dejarla el ${semVieja}`}
        onAplicar={() => {
          // Pasarla: se mueve (con el aviso de abajo y su [Deshacer]) y se sigue con la hoja de «Revisa los datos».
          const nueva = corregirConElDocumento(p.reserva, p.doc, p.nombre, p.excursion, true)
          cerrar()
          p.continuar(nueva, true)
        }}
        onCerrar={() => {
          // Dejarla (el botón blanco, la X o tocar fuera): no cambia nada, y la hoja de «Revisa los datos» no trae la fecha ni la hora del documento.
          cerrar()
          p.continuar(p.reserva, false)
        }}
      />
    )
  }
  return { preguntar, hoja }
}
