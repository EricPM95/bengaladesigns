import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import { TARJETAS_DE_HOY, type PuntoDeLista } from './disenoLista'

/**
 * (HOY2, apartado 1; Eric 5-nov) LA LISTA DE LO QUE TRAE HOY, la de «HOY sin pase» (`HoySinPase`): lo que HOY hace ahora, no lo de la 10N11.
 * Los dibujos son los de la lista de Design (`TARJETAS_DE_HOY`, generada de la pieza `Pase Lista`); los textos son nuestros. Ocho tarjetas, en este orden:
 *   tu día paso a paso · «Cambiar plan» · los avisos del tiempo · «Cerca de ti» · la cámara y los logros · las historias · tus entradas sin internet · los avisos en el móvil bloqueado.
 * En Lanzarote (coche): minutos en coche y dónde aparcar, gasolineras y aparcamientos, lluvia, nubes y viento.
 */
const dibujo = (titulo: string): string => TARJETAS_DE_HOY.find((t) => t.titulo === titulo)?.icono ?? TARJETAS_DE_HOY[0].icono

/** La campana (los avisos en el móvil bloqueado), con el trazo de los demás dibujos de la lista. */
const CAMPANA =
  '<svg width="42" height="42" viewBox="0 0 64 64"><path fill="#FFFDF8" stroke="#1C2230" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M32 8a14 14 0 0 0-14 14v11l-6 10h40l-6-10V22A14 14 0 0 0 32 8z" transform="translate(0 2)"/><path fill="#E9C77A" stroke="#B58A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M26 52a6 6 0 0 0 12 0z" transform="translate(0 2)"/></svg>'

export function tarjetasDeHoy2(destino: string | null | undefined): PuntoDeLista[] {
  const coche = esDestinoDeCoche(destino)
  return [
    { icono: dibujo('Tu siguiente parada, en grande'), titulo: 'Tu día, paso a paso', linea: coche ? 'Cuándo salir, cómo llegar en coche y «Ya estás aquí».' : 'Cuándo salir, cómo llegar y «Ya estás aquí».' },
    { icono: dibujo('Más visitas, si te sobra tiempo'), titulo: 'Cambiar plan', linea: 'Sin mover nada sin tu permiso.' },
    { icono: dibujo('Los avisos del día'), titulo: 'Los avisos del tiempo', linea: coche ? 'Lluvia, nubes y viento, con su alternativa.' : 'Si llueve, te damos una alternativa.' },
    { icono: dibujo('Cerca de ti'), titulo: 'Cerca de ti', linea: coche ? 'Gasolineras, aparcamientos y dónde comer, los más cercanos.' : 'Baños, fuentes de agua y dónde comer, los más cercanos.' },
    { icono: dibujo('Tus logros, mientras viajas'), titulo: 'La cámara y los logros', linea: 'Sellos, colecciones y emblemas secretos.' },
    { icono: dibujo('Escucha la historia de cada sitio'), titulo: 'Las historias, para escuchar', linea: 'Como una audioguía, en tu móvil.' },
    { icono: dibujo('Tu billete, el día que toca'), titulo: 'Tus entradas, sin internet', linea: 'Lo de hoy, guardado en tu móvil.' },
    { icono: CAMPANA, titulo: 'Avisos en el móvil bloqueado', linea: 'Te avisamos a tiempo, sin abrir la app.' },
  ]
}
