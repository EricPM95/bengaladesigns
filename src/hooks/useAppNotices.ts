import { useEffect, useMemo, useState } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useNoticesStore, type NoticeKind } from '../store/useNoticesStore'
import { reservationOverlaps } from '../lib/reservationOverlaps'
import { reservasEnCierre } from '../lib/reservaEnCierre'
import { aplicarAvisoFueraDeDia, reservasFueraDeSuDia } from '../lib/reservaFueraDeDia'
import { useDatosDeHorario } from '../lib/horarioDeParada'
import { useDestinationExcursions } from '../lib/destinationExcursions'
import { avisosDeLluvia, diasAMirar } from '../lib/avisosDeLluvia'
import { todayIso } from '../lib/dateRange'
import { lluviaDePruebaActiva } from '../lib/lluviaDePrueba'
import { fetchHourlyRain, type HourlyRain } from '../lib/rainForecast'
import { usePruebasUi } from '../store/usePruebasUi'
import { textoDeDias, textoDeDuracion } from '../lib/duracionViaje'
import { useReservasFocusStore } from '../store/useReservasFocusStore'
import { elDia } from '../lib/nombreDeDia'
import { vueltaCambiada } from '../lib/datosDelViajero'
import { useAvisosVueloStore } from '../store/useAvisosVueloStore'
import { avisosParaLaCampana, bloqueDeReservasDelAviso, diaDelAviso } from '../lib/avisosDeVuelo'
import { pasarDiaARoma } from '../lib/pasarDiaARoma'
import { avisosDeFechaLeidos, fraseCampana } from '../lib/dateNotices'
import type { DateNotice } from '../lib/types'
import { useEntradasDelGrupo } from './useEntradasDelGrupo'
import { useReservasGrupoUi } from '../store/useReservasGrupoUi'
import { useAvisosStore } from '../store/useAvisosStore'
import { proponerCambioDeReserva } from '../lib/reservasGrupo'
import { etiquetaDelCambio } from '../lib/cambiarDiaPorReserva'
import { usePermisosDelViaje } from './usePermisosDelViaje'
import { diaDeLaReservaEnPalabras, entradasQueNoCuadran, sitioCorto } from '../lib/reservasGrupo'
import { textoDelAviso } from '../../shared/avisos/textos.js'

export interface AppNotice {
  id: string
  kind: NoticeKind
  title: string
  text: string
  /** Un botón dentro del aviso (el nombre de la acción que lo resuelve); la pantalla decide qué hace. */
  action?: 'open-dates' | 'open-reservas'
  actionLabel?: string
  /** Un botón que hace algo en el momento (Tanda 6y2: «Pasar al mié 15»): la campana lo ejecuta y se cierra. Sale con `actionLabel`. */
  run?: () => void
  /** Varios botones que hacen algo en el momento (Tanda 7: [Ver mi reserva] · [Pasar este día a Roma]): cada uno con su texto; la campana lo ejecuta y se cierra. */
  acciones?: { label: string; run: () => void }[]
  /** Leído = ya no cuenta. Los errores y los avisos de estado nunca están leídos: cuentan hasta que se arreglan. */
  read: boolean
  /** Se puede marcar como leído (info y amigos). */
  canMarkRead: boolean
  /** Tanda 10M: un aviso de fecha (la campana lo pinta con su icono y, al tocarlo, abre su tarjeta con `onOpen`). */
  fecha?: DateNotice
  onOpen?: () => void
  /** Lo que hace «marcar como leído» además de guardarlo (p. ej. el aviso de contexto se cierra en el viaje). */
  onRead?: () => void
}

/**
 * Todos los avisos de la app en un solo sitio (la campana de la cabecera): errores, avisos del viaje y, más adelante, los de amigos.
 * Hoy se reúnen aquí:
 *  1. «Cambios sin guardar» (error de guardado en la nube): cuenta mientras no se guarde.
 *  2. «Tu viaje es de N días y ahora tienes M» (antes, una línea bajo «+ Añadir día»): cuenta mientras haya más días que fechas.
 *  2a. Reservas contra los vuelos (Tanda 7, de pago): «no llegas a tiempo», «no te da tiempo», la excursión que no cuadra, con [Ver mi reserva] y [Pasar este día a Roma]. Los dan los motores (`/api/avisos-de-vuelo`, `useAvisosDeVuelo`); se quedan hasta que se arreglan.
 *  2b. «Dos reservas coinciden» (Tanda 6v): cuenta mientras se pisen; se va solo cuando se arregla.
 *  2b2. «Tu entrada al Coliseo es el mié 15, pero en tu ruta el Coliseo está el mar 14.» (Tanda 6y2; solo ruta a mano): una por reserva fuera de su día, con su botón; no mueve nada hasta que se pulsa.
 *  2c. «Mañana llueve en Roma por la tarde» / «Hoy llueve en Roma por la tarde» (Tanda 6z6e; gratis y de pago): uno por día del viaje, con la previsión de nuestro servidor; sin previsión, ninguno.
 *  3. El aviso de contexto de la ruta (por qué es como es: invierno, pocos días…): se marca como leído (antes se cerraba con la ×).
 *  4. Los que empujen otras partes (`useNoticesStore.push`), p. ej. los de amigos.
 */
export function useAppNotices(): { items: AppNotice[]; unreadCount: number } {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const dismissContextBanner = useRouteStore((state) => state.dismissContextBanner)
  // Los nombres cortos de las reservas (datos del destino) para el aviso «coinciden».
  const nombresCortos = useDestinationExcursions(route?.destination).nombresCortos
  // Tanda 10N §8: las entradas que el dueño compra para varias personas (y la propia del invitado que no cuadra con la ruta) llegan a la campana de quien mira el viaje.
  const grupo = useEntradasDelGrupo()
  const { rol } = usePermisosDelViaje()
  // (Tanda 10N3 §3: si la base de datos ya creó el aviso de esa entrada —está en la lista de la cuenta—, el móvil no lo calcula otra vez.)
  const avisosDelServidor = useAvisosStore((state) => state.avisos)
  const datosDeHorario = useDatosDeHorario(route?.destination)
  const syncStatus = useSyncStore((state) => state.status)
  const avisosVuelo = useAvisosVueloStore((state) => state.avisos)
  const readIds = useNoticesStore((state) => state.readIds)
  const pushed = useNoticesStore((state) => state.pushed)
  // La lluvia: se mira solo hoy y mañana (el día y su víspera). `repintado` y la lluvia de prueba son del panel de pruebas (solo local y vistas previas).
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const repintado = usePruebasUi((state) => state.version)
  const hoyIso = simulada ?? todayIso()
  const lluviaDePrueba = lluviaDePruebaActiva()
  const aMirar = useMemo(() => (route ? diasAMirar(route, hoyIso) : []), [route, hoyIso])
  const claveAMirar = aMirar.map((dia) => `${dia.dateIso}@${dia.coordenadas.lat},${dia.coordenadas.lng}`).join('|')
  const [lluvias, setLluvias] = useState<Record<string, HourlyRain | null>>({})
  useEffect(() => {
    let vivo = true
    setLluvias({})
    void Promise.all(aMirar.map(async (dia) => [dia.dateIso, await fetchHourlyRain(dia.coordenadas, dia.dateIso)] as const)).then((pares) => {
      if (vivo) setLluvias(Object.fromEntries(pares))
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveAMirar, lluviaDePrueba, repintado])

  return useMemo(() => {
    const items: AppNotice[] = []

    if (syncStatus === 'error') {
      items.push({ id: 'sync-error', kind: 'error', title: 'Cambios sin guardar', text: 'No se ha podido guardar tu viaje. Revisa tu conexión: lo volvemos a intentar solos.', read: false, canMarkRead: false })
    }

    if (route) {
      const tripDays = route.answers.days ?? route.days.length
      if (route.days.length > tripDays) {
        items.push({
          id: 'days-over-dates',
          kind: 'warning',
          title: 'Tienes más días que fechas',
          text: `Tu viaje es de ${textoDeDuracion(tripDays)} y ahora tienes ${textoDeDias(route.days.length)}. Añade un día más a tu viaje o elimina el que menos te convenga.`,
          action: 'open-dates',
          actionLabel: 'Añadir un día a mis fechas',
          read: false,
          canMarkRead: false,
        })
      }
      // Tanda 7 (de pago): las fechas del viaje cambiaron y la vuelta tenía hora. Se queda en la campana hasta que el viajero abre su vuelta o la cambia (`marcarVueltaVista`); la app no cambia la vuelta.
      // (Tanda 10G: gratis, como guardar el vuelo.)
      if (vueltaCambiada(route)) {
        const diaDeVuelta = route.days.at(-1)?.dayNumber ?? route.days.length
        items.push({
          id: 'vuelta-fechas',
          kind: 'warning',
          title: 'Revisa tu vuelta',
          text: `Has cambiado los días del viaje: revisa que tu vuelta sigue siendo ${elDia(route, diaDeVuelta)}.`,
          actionLabel: 'Ver mi vuelta',
          run: () => {
            useRouteStore.getState().setMode('bookings')
            useReservasFocusStore.getState().pedir('llegada', 'departure')
          },
          read: false,
          canMarkRead: false,
        })
      }
      // Tanda 7 (de pago): las reservas que no cuadran con la hora de llegada o de vuelta (lo dan los motores). Se quedan hasta que el viajero lo arregla y se van solos; nada se cambia sin que él lo pulse.
      // (Tanda 10G: gratis; en la gratis nada se cambia solo, igual que antes: el aviso solo cuenta.)
      {
        for (const vuelo of avisosParaLaCampana(avisosVuelo, route)) {
          const acciones: { label: string; run: () => void }[] = []
          for (const boton of vuelo.botones) {
            if (boton.id === 'ver_reserva' || boton.id === 'ver_mis_reservas') {
              acciones.push({
                label: boton.texto,
                run: () => {
                  useRouteStore.getState().setMode('bookings')
                  useReservasFocusStore.getState().pedir(bloqueDeReservasDelAviso(vuelo.aviso))
                },
              })
            } else if (boton.id === 'pasar_a_roma') {
              const dia = diaDelAviso(vuelo.aviso, vuelo.mitad)
              if (dia !== null) acciones.push({ label: boton.texto, run: () => void pasarDiaARoma(dia) })
            }
          }
          items.push({ id: vuelo.id, kind: 'warning', title: vuelo.titulo, text: vuelo.texto, acciones, read: false, canMarkRead: false })
        }
      }
      for (const solape of reservationOverlaps(route, reservations, nombresCortos)) {
        items.push({ id: solape.id, kind: 'warning', title: solape.kind === 'justo' ? 'Vas justo entre dos reservas' : 'Dos reservas coinciden', text: solape.text, action: 'open-reservas', actionLabel: 'Ver mis reservas', read: false, canMarkRead: false })
      }
      for (const cierre of reservasEnCierre(route, reservations, datosDeHorario, nombresCortos)) {
        items.push({ id: cierre.id, kind: 'warning', title: 'Tu reserva cae con el sitio cerrado', text: cierre.text, action: 'open-reservas', actionLabel: 'Ver mi reserva', read: false, canMarkRead: false })
      }
      // Ruta a mano (Tanda 6y2): una reserva cuyo sitio no está en el día de su fecha. Avisa y ofrece el botón; no mueve nada sola.
      for (const fuera of reservasFueraDeSuDia(route, reservations, nombresCortos)) {
        items.push({ id: fuera.id, kind: 'warning', title: 'Tu reserva no está en su día', text: fuera.text, run: () => void aplicarAvisoFueraDeDia(fuera), actionLabel: fuera.actionLabel, read: false, canMarkRead: false })
      }
      // Tanda 10M: cada fecha con avisos entra en la campana con su frase corta; al tocarla se abre su tarjeta. Leído = ya abierto (o visto en la ventana al abrir la ruta): deja de contar pero se queda siempre en la lista.
      {
        const leidos = avisosDeFechaLeidos(route)
        for (const aviso of route.dateNotices ?? []) {
          items.push({
            id: `fecha:${aviso.id}`,
            kind: 'info',
            title: fraseCampana(aviso),
            text: '',
            fecha: aviso,
            onOpen: () => {
              const store = useRouteStore.getState()
              store.markDateNoticeRead(aviso.id)
              store.setOpenDateNoticeId(aviso.id)
            },
            read: leidos.has(aviso.id),
            canMarkRead: false,
          })
        }
      }
      // Tanda 10N §8 · «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.» (incluido) / «…el jueves 26 a las 8:00.» con [Reservar la mía a la misma hora] y [Ya la tengo]. Leído = deja de contar y se queda en la lista.
      if (grupo.esInvitado && grupo.compartido) {
        for (const reserva of reservations) {
          if (reserva.kind !== 'entrada' || !reserva.paraQuien) continue
          if (avisosDelServidor.some((a) => a.tipo === 'reserva_grupo' && (a.payload as { reserva_id?: string }).reserva_id === reserva.id && (a.payload as { caso?: string }).caso !== 'no_cuadra')) continue
          const incluido = grupo.meIncluye(reserva)
          const id = `reserva-grupo:${reserva.id}`
          const propia = grupo.mias.some((mia) => mia.kind === reserva.kind && mia.refId === reserva.refId)
          const abrir = (accion: 'misma-hora' | 'ya-la-tengo') => () => {
            useNoticesStore.getState().markRead(id)
            useRouteStore.getState().setMode('bookings')
            useReservasFocusStore.getState().pedir('entradas')
            useReservasGrupoUi.getState().pedir({ accion, reservaId: reserva.id })
          }
          items.push({
            id,
            kind: 'info',
            title: textoDelAviso({ tipo: 'reserva_grupo', payload: { quien: grupo.nombreAdmin, sitio: sitioCorto(reserva, nombresCortos), dia: diaDeLaReservaEnPalabras(route, reserva), hora: reserva.time, incluido } }),
            text: '',
            acciones: incluido || propia ? undefined : [{ label: 'Reservar la mía a la misma hora', run: abrir('misma-hora') }, { label: 'Ya la tengo', run: abrir('ya-la-tengo') }],
            read: readIds.includes(id),
            canMarkRead: true,
          })
        }
        // «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»: cuenta mientras no cuadre.
        for (const aviso of entradasQueNoCuadran(route, grupo.mias, nombresCortos)) {
          if (avisosDelServidor.some((a) => a.tipo === 'reserva_grupo' && (a.payload as { reserva_id?: string; caso?: string }).reserva_id === aviso.cambio.reservaId && (a.payload as { caso?: string }).caso === 'no_cuadra')) continue
          items.push({
            id: aviso.id,
            kind: 'warning',
            title: 'Tu entrada no cuadra con la ruta',
            text: aviso.texto,
            acciones: [
              { label: 'Ver mi reserva', run: () => { useRouteStore.getState().setMode('bookings'); useReservasFocusStore.getState().pedir('entradas') } },
              { label: etiquetaDelCambio(rol, aviso.cambio.aDia), run: () => void proponerCambioDeReserva({ reservaId: aviso.cambio.reservaId, sitio: aviso.cambio.sitio, diaDeLaReserva: aviso.cambio.aDia, diaDeLaRuta: aviso.cambio.deDia }) },
            ],
            read: false,
            canMarkRead: false,
          })
        }
      }
      if (route.contextBanner) {
        items.push({
          id: `context:${route.createdAt}`,
          kind: 'info',
          title: 'Sobre tu ruta',
          text: route.contextBanner,
          read: Boolean(route.contextBannerDismissed),
          canMarkRead: true,
          onRead: dismissContextBanner,
        })
      }
    }

    for (const aviso of avisosDeLluvia(aMirar, lluvias)) {
      items.push({ id: aviso.id, kind: 'info', title: aviso.titulo, text: aviso.texto, read: readIds.includes(aviso.id), canMarkRead: true })
    }

    for (const notice of pushed) {
      const persistent = notice.kind === 'error' || notice.kind === 'warning'
      items.push({ id: notice.id, kind: notice.kind, title: notice.title, text: notice.text, read: !persistent && readIds.includes(notice.id), canMarkRead: !persistent })
    }

    // Primero los errores, luego los avisos del viaje, luego lo demás; dentro de cada grupo, los sin leer antes.
    const order: Record<NoticeKind, number> = { error: 0, warning: 1, friend: 2, info: 3 }
    items.sort((a, b) => Number(a.read) - Number(b.read) || order[a.kind] - order[b.kind])
    return { items, unreadCount: items.filter((item) => !item.read).length }
  }, [route, reservations, grupo.esInvitado, grupo.compartido, grupo.mias, grupo.gente, grupo.yoId, grupo.nombreAdmin, rol, avisosDelServidor, nombresCortos, datosDeHorario, syncStatus, readIds, pushed, dismissContextBanner, aMirar, lluvias, avisosVuelo])
}
