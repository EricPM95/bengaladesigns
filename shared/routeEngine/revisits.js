/**
 * Revisitas: volver a un sitio a otra hora, en los días que ya no tienen contenido nuevo.
 *
 * Todo destino tiene un número natural de días de contenido sólido (`core_days`). A partir de ahí,
 * empeñarse en que cada día sean lugares nuevos produce días de relleno de tercera con los que
 * nadie disfruta. Roma es el caso claro: fuera del reparto curado le quedan DIEZ lugares repartidos
 * en cinco zonas, así que los días 5-7 salen con cinco paradas mientras los primeros tienen doce.
 *
 * Volver no es un defecto, es lo que hace la gente: la Fontana de noche no es la Fontana de las
 * once de la mañana, y una plaza que cruzaste con prisa el día 2 es otra cosa el día 6 sin prisa.
 *
 * Reglas (Prompt 9, Parte 13):
 *   - solo en días marcados `allowsRepetition` (por encima de `core_days`)
 *   - máximo 3 por día: más nuevos que repetidos
 *   - solo exteriores y espacios abiertos, NUNCA museos ni interiores de pago — volver a pagar una
 *     entrada para ver lo mismo no es una sugerencia, es una tomadura de pelo
 *   - a una FRANJA distinta de la original: repetir el Coliseo a la misma hora no aporta nada
 *   - los miradores siempre valen: la misma vista con otra luz es otra vista
 */

/** Más de tres y el día deja de ser un día nuevo para ser un repaso. */
const MAX_REVISITS_PER_DAY = 3

/**
 * A cuántas paradas aspira un día de repetición. Menos que un día normal a propósito: a estas
 * alturas del viaje ya conoces la ciudad y no hace falta correr (Prompt 9, Parte 13).
 *
 * Es un TECHO para las revisitas, no un objetivo que rellenar: un día que ya llega solo no recibe
 * ninguna. Sin esto, el día 6 pasaba de nueve paradas a doce — justo lo contrario de relajado.
 */
const RELAXED_DAY_TARGET_STOPS = 6

/**
 * Por qué merece la pena volver. Sin inventar: si el lugar no tiene nada real que decir, se usa una
 * línea corta que sea CIERTA para su tipo, no un relleno entusiasta.
 */
function revisitReasonFor(unit) {
  const place = unit.places[0] ?? {}
  if (typeof place.revisit_tip === 'string' && place.revisit_tip.trim()) return place.revisit_tip
  if (typeof place.best_time === 'string' && place.best_time.trim()) return `Mejor ${place.best_time}`
  const tags = unit.tags ?? []
  if (tags.includes('mirador')) return 'La misma vista con otra luz'
  if (tags.includes('plaza')) return 'A esta hora la plaza es otra cosa'
  if (tags.includes('fuente')) return 'Sin la cola del mediodía'
  if (tags.includes('barrio') || tags.includes('calle')) return 'Otra vez, pero sin prisa'
  if (tags.includes('parque')) return 'Con tiempo para sentarse'
  return 'Vuelve a pasar: a esta hora es distinto'
}

/**
 * ¿Se puede volver a este sitio?
 *
 * Un grupo no: repetir "Coliseo + Foro + Arco" entero no es volver a pasar, son tres horas otra vez.
 * Un interior de pago tampoco. Lo que queda son plazas, calles, fuentes, miradores y parques, que
 * es exactamente lo que se disfruta dos veces.
 */
function canRevisit(unit) {
  if (unit.isFreeTour || unit.isLong) return false
  // En un viaje solo se repite el nivel 1 (decisión del 2026-09-25): un nivel 2 o 3 no vuelve ni como
  // revisita, ni de noche ni como mirador.
  if (unit.level !== 1) return false
  if (unit.places.length > 1) return false
  if (unit.requiresTicket) return false
  return true
}

/**
 * Añade revisitas a los días que lo permiten y se han quedado cortos.
 *
 * Muta `plan`: las revisitas entran como unidades normales de su franja (consumen presupuesto y se
 * ordenan con el resto), marcadas con `isRevisit` para que el constructor las pinte distinto y para
 * que el deduplicado entre días no las confunda con un error.
 *
 * @param {object} plan          salida de buildDaySkeleton ya rellena por la cascada
 * @param {Map<string,number>} placedDay      unidad -> día en que está
 * @param {Map<string,string>} placedSlot     unidad -> franja en que está
 * @param {(unit:object, slot:object)=>number} costOf
 */
export function planRevisits(plan, units, placedDay, placedSlot, costOf, sameOrAdjacentZone = () => true) {
  const candidatos = units.filter((unit) => canRevisit(unit) && placedDay.has(unit.id))
  // Una revisita se usa UNA vez en todo el viaje. Sin esto el Barrio Judío salía los días 5, 6 y 7:
  // repetir la repetición es peor que no repetir nada.
  const yaRevisitadas = new Set()

  for (const day of plan.days) {
    if (!day.allowsRepetition || day.isBlank) continue

    const paradasDelDia = () =>
      ['morning', 'afternoon'].reduce((n, s) => n + day.slots[s].units.reduce((m, u) => m + u.places.length, 0), 0)

    let añadidas = 0
    for (const slotName of ['morning', 'afternoon']) {
      const slot = day.slots[slotName]
      for (const unit of candidatos) {
        if (añadidas >= MAX_REVISITS_PER_DAY) break
        // El día ya llega por sí solo: no se le añade nada.
        if (paradasDelDia() >= RELAXED_DAY_TARGET_STOPS) break
        if (yaRevisitadas.has(unit.id)) continue
        // De un día anterior, nunca del mismo: repetir algo que has visto hace dos horas es un error
        // del motor, no una sugerencia.
        if (placedDay.get(unit.id) >= day.dayNumber) continue
        // A otra franja de la que fue la original.
        if (placedSlot.get(unit.id) === slotName) continue
        // Que no esté ya puesta hoy (ni como revisita ni como parada nueva).
        if (['morning', 'afternoon'].some((s) => day.slots[s].units.some((u) => u.id === unit.id))) continue
        // Y en la zona de la franja o una vecina. Una revisita es un "ya que pasas por aquí", no un
        // viaje: sin esto, el día 7 metía Borgo Pio (Vaticano) entre el Cementerio Protestante y el
        // Mercado de Testaccio, cruzando Roma dos veces para volver a ver una calle.
        if (!sameOrAdjacentZone(slot.zone, unit.zone)) continue

        const coste = costOf(unit, slot)
        if (slot.used + coste > slot.budget) continue

        slot.units.push({ ...unit, isRevisit: true, revisitReason: revisitReasonFor(unit) })
        slot.used += coste
        yaRevisitadas.add(unit.id)
        añadidas++
      }
    }
  }
}

export { MAX_REVISITS_PER_DAY, RELAXED_DAY_TARGET_STOPS, canRevisit, revisitReasonFor }
