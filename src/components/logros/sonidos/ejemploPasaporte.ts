import type { RespuestaPasaporte } from '../pantallas/mundo/api'

/**
 * (V36C) UN PASAPORTE DE EJEMPLO para el estudio de sonidos: la hoja de Italia con el sello de un viaje a Roma que se estampa (`pagina: 'sello:estudio'`) y otro ya estampado de antes. No es de nadie: no se pide al servidor ni se apunta
 * ningún sello como estampado. La pieza que lo pinta es la de verdad (`PasaporteScreen`).
 */
export const VIAJE_DEL_SELLO_DE_EJEMPLO = 'estudio'
export const PASAPORTE_DE_EJEMPLO: RespuestaPasaporte = {
  ok: true,
  numeros: { paises: 1, ciudades: 2, dias_viajando: 9, sellos: 2 },
  paginas: [
    {
      pais: 'Italia',
      iso: 'it',
      continente: 'Europa',
      estado: 'visitado',
      entrada: '2026-11-10',
      sellos: [
        { trip_id: 'estudio-antes', destino: 'florencia', ciudad: 'Florencia', fecha: '2026-06-18', vacio: false },
        { trip_id: VIAJE_DEL_SELLO_DE_EJEMPLO, destino: 'roma', ciudad: 'Roma', fecha: '2026-11-14', vacio: false, nuevo: true },
      ],
    },
  ],
  viajes_sin_sello: [],
  viajes_por_hacer: [],
}
