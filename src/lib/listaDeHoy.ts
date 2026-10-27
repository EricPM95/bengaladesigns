import { LISTA_DEL_PASE, type ItemDeLista } from './listaAjustada'

/**
 * LO QUE HOY SIN PASE ENSEÑA EN «CON EL PASE TENDRÁS» (Tanda 10I): la parte de la lista del final de la película (`LISTA_DEL_PASE`, la misma de «Todo lo que incluye») que corresponde a HOY, sacada de ella
 * por el nombre de la fila, en el orden en que sale en la lista. Así los nombres, las líneas y los iconos nunca vuelven a ir cada uno por su lado: si Design cambia la lista, HOY cambia con ella.
 */
export const TITULOS_DE_HOY: readonly string[] = ['Tu siguiente parada', 'Cambia planes en un toque', 'Avisos que importan', 'La historia de cada sitio', 'Baños, fuentes y dónde comer']

export function filasDeHoy(lista = LISTA_DEL_PASE): ItemDeLista[] {
  const todas = lista.flatMap((g) => g.items)
  // En el orden de la lista del pase (no en el de TITULOS_DE_HOY).
  return todas.filter((i) => TITULOS_DE_HOY.includes(i.tituloDesign ?? i.titulo))
}
