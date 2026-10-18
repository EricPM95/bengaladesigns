/**
 * LOS DIBUJOS DE LOS LOGROS (Tanda 8B). Todos salen de «Logros · Modelos» (docs/diseno/proyecto/Logros Modelos.dc.html y sus Piezas/), dibujados con código (SVG y CSS),
 * sin vídeos ni GIF. La única excepción es la medalla de las 7 maravillas, que usa las imágenes de `public/medalla/` (WebP, 64 KB en total).
 *
 * Este archivo es el CONTRATO: las pantallas de HOY, del Visto y de los momentos importan de aquí. Los dibujos de verdad están en `dibujos/*.tsx` (una familia por archivo)
 * y las piezas portadas tal cual del diseño en `dibujos/piezas/`.
 * Cada familia se importa donde se use; las piezas pesadas (chapas, emblema del Coliseo, medalla) se cargan perezosamente al dibujarse.
 */
import type { ReactNode } from 'react'
import { Insignia as InsigniaPerezosa } from './InsigniaPerezosa'
import { Sello as SelloDibujo } from './Sello'
import type { GradoDeSello } from './Sello'
import { EmblemaDibujo } from './Emblema'
import { ChapaDibujo } from './Chapa'
import { MedallaDibujo } from './Medalla'
import { MedallaSiete } from './MedallaSiete'

export { IDS_MARAVILLAS } from './MedallaSiete'

export type { GradoDeSello }

/** El sello coleccionable de una ciudad (sin fondo, solo su figura). `id`: 'roma' | 'vaticano' (ids de `data/logros/roma.json › sellos`). Opcional: `apagado` (el «por conseguir»), `animado` (por defecto sí) y `etiqueta` (el nombre de la ciudad escrito en el sello; por defecto sí, los sellos pequeños van sin ella). */
export function Sello({ id, grado, tam = 96, apagado = false, animado = true, etiqueta = true }: { id: string; grado: GradoDeSello; tam?: number; apagado?: boolean; animado?: boolean; etiqueta?: boolean }): ReactNode {
  return <SelloDibujo id={id} grado={grado} tam={tam} apagado={apagado} animado={animado} etiqueta={etiqueta} />
}

/** La insignia de una colección con sus pedazos. `coleccion`: id de `data/logros/roma.json › colecciones`; `ganados`: ids de los sitios ya vistos (los pedazos de color); sin `ganados` sale en gris. `completa` la enseña entera. Opcional: `animada`. */
export function Insignia({ coleccion, ganados = [], completa = false, tam = 120, animada = false }: { coleccion: string; ganados?: string[]; completa?: boolean; tam?: number; animada?: boolean }): ReactNode {
  return <InsigniaPerezosa coleccion={coleccion} ganados={ganados} completa={completa} tam={tam} animada={animada} />
}

/** El emblema oculto. `id`: id de `data/logros/roma.json › emblemas` (coliseo, foro_romano, … madrugador, nocturno). `animado`: la animación en bucle de «encontrado»; sin ella, estático. `silueta`: el «?» de los que faltan. Pensado para fondo oscuro. `fecha` (AAAA-MM-DD): el día en que se encontró; solo la moneda de oro del Coliseo la enseña (sin ella, la de hoy). */
export function Emblema({ id, animado = false, silueta = false, tam = 120, fecha = null }: { id: string; animado?: boolean; silueta?: boolean; tam?: number; fecha?: string | null }): ReactNode {
  return <EmblemaDibujo id={id} animado={animado} silueta={silueta} tam={tam} fecha={fecha} />
}

/** La chapa de un logro de viajero. `logro`: id de `data/logros/viajero.json › logros`; `escalon`: el `n` del escalón (o nada si no tiene escalones). Opcional: `bloqueado` (gris), `animada`, `progreso` (continentes: 'eu,na,sa'; pequeños gigantes y cuatro estaciones: número). */
export function Chapa({ logro, escalon, tam = 88, bloqueado = false, animada = false, progreso }: { logro: string; escalon?: string | number | null; tam?: number; bloqueado?: boolean; animada?: boolean; progreso?: number | string }): ReactNode {
  return <ChapaDibujo logro={logro} escalon={escalon} tam={tam} bloqueado={bloqueado} animada={animada} progreso={progreso} />
}

/** La medalla de las 7 maravillas. `encendidas`: ids de las maravillas vistas (coliseo, gran_muralla, petra, …); las demás, apagadas. `tam` es el ancho; el alto es 1,16 veces el ancho. */
export function MedallaMaravillas({ encendidas = [], tam = 220, animada = true, destello = null }: { encendidas?: string[]; tam?: number; animada?: boolean; destello?: string | null }): ReactNode {
  return <MedallaDibujo encendidas={encendidas} tam={tam} animada={animada} destello={destello} />
}

/** (8B5) La medalla NUEVA de las 7 maravillas («Medalla Siete» de Design), QUIETA: un disco dorado con las 7 monedas alrededor; en oro las que el viajero tiene (`encendidas`: ids como coliseo, petra…), en plata las que le faltan, y en el centro cuántas lleva. `tam` es el ancho; el alto es 1,18 veces. Es la que sale en «Y además…», en Logros y en la vitrina; `MedallaMaravillas` (la de antes, con las 7 juntas) solo queda en «El final de las 7 maravillas», como en Design. */
export function MedallaDeSiete({ encendidas = [], tam = 112 }: { encendidas?: string[]; tam?: number }): ReactNode {
  return <MedallaSiete encendidas={encendidas} tam={tam} />
}
