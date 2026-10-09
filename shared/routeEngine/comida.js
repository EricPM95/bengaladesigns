/**
 * El límite de la comida (regla 6 de los días escritos, decidido el 9-oct-2026): la comida no debería empezar después de las 15:00 (antes, las 14:30). Es el único sitio donde está esa hora:
 * el motor de listas (su valor por defecto de `franjas.comida_hasta`), el acordeón «Hora de comer» de DÍAS y la franja de comida de HOY la leen de aquí. Vale para todos los destinos.
 */
export const COMIDA_HASTA = '15:00'
export const COMIDA_HASTA_MIN = 15 * 60
