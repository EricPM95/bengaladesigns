import type { DatosDeEjemploDelResumen } from '../momentos/ResumenViaje'

/**
 * (V35B) El viaje de EJEMPLO con el que el estudio de sonidos (/admin/sonidos) enseña «Resumen del viaje»: un viaje a Roma de 4 días con sus paradas, su medalla, dos colecciones, dos emblemas, logros de viajero
 * y sorpresas por reclamar. Sin fotos de la cuenta (la portada es la del destino). Solo lo usa el visor; el viajero real nunca ve estos datos.
 */
export function ejemploDelResumenDelViaje(): DatosDeEjemploDelResumen {
  const en = '2026-11-20T10:00:00.000Z'
  return {
    dias: 4,
    paradas: 17,
    km: 31,
    fotos: 12,
    estado: {
      ok: true,
      destino: 'roma',
      ciudad: 'Roma',
      sellos: [{ id: 'roma', nombre: 'Roma', grado: 'plata', nombre_grado: 'Roma te atrapa', linea: 'Cuatro imprescindibles vistos: ya eres de aquí.', n: 4, total: 8, siguiente: { grado: 'oro', faltan: 2, nombre: 'Roma es casi tuya' }, alcanzados: ['bronce', 'plata'] }],
      colecciones: [
        { id: 'miradores', nombre: 'Los miradores', n: 2, total: 3, completa: false, en_tu_ruta: true, nuevo_hoy: false, sitios: [{ sitio: 'janiculo', visto: true, nombre: 'El Janículo' }, { sitio: 'pincio', visto: true, nombre: 'El Pincio' }, { sitio: 'giardino_degli_aranci', visto: false, nombre: 'El Jardín de los Naranjos' }] },
        { id: 'cuatro_joyas', nombre: 'Las 4 joyas de Roma', n: 4, total: 4, completa: true, en_tu_ruta: true, nuevo_hoy: false, sitios: [{ sitio: 'coliseo', visto: true, nombre: 'El Coliseo' }, { sitio: 'panteon', visto: true, nombre: 'El Panteón' }, { sitio: 'fontana_de_trevi', visto: true, nombre: 'La Fontana de Trevi' }, { sitio: 'plaza_de_espana', visto: true, nombre: 'La Plaza de España' }] },
      ],
      secretos: {
        total: 12,
        encontrados: 2,
        texto: '',
        encontrados_lista: [
          { id: 'panteon', nombre: 'El Panteón', linea: 'Casi dos mil años con la puerta abierta.', en },
          { id: 'fontana_de_trevi', nombre: 'La Fontana de Trevi', linea: 'Una moneda para volver.', en },
        ],
      },
      pendiente: { sorpresas: 2, pedazos: 2, dias_para_reclamar: 20, plazo_pasado: false, texto: 'Te quedan 2 sorpresas por reclamar' },
      puntito: false,
      viaje: { id: 'ejemplo', inicio: '2026-11-17', fin: '2026-11-20', hoy: '2026-11-21' },
    },
    resumen: {
      ok: true,
      ganado: [
        { clave: 'ej|pedazo|miradores:janiculo', logro: 'pedazo', escalon: 'miradores:janiculo', destino: 'roma', en },
        { clave: 'ej|pedazo|miradores:pincio', logro: 'pedazo', escalon: 'miradores:pincio', destino: 'roma', en },
        { clave: 'ej|emblema|panteon', logro: 'emblema', escalon: 'panteon', destino: 'roma', en },
        { clave: 'ej|emblema|fontana_de_trevi', logro: 'emblema', escalon: 'fontana_de_trevi', destino: 'roma', en },
        { clave: 'ej|sello|roma:plata', logro: 'sello', escalon: 'roma:plata', destino: 'roma', en },
        { clave: 'ej|viajero:paises|1', logro: 'viajero:paises', escalon: '1', destino: '*', en },
      ],
      por_categoria: { pedazo: 2, emblema: 2, sello: 1 },
      pendiente: {
        sorpresas: 2,
        pedazos: 2,
        dias_para_reclamar: 20,
        plazo_pasado: false,
        texto: 'Te quedan 2 sorpresas por reclamar',
        pendientes: [
          { sitio: 'giardino_degli_aranci', nombre: 'El Jardín de los Naranjos', fecha: '2026-11-18', dia: 2, colecciones: ['miradores'], falta: ['pedazo'] },
          { sitio: 'castel_sant_angelo', nombre: 'El Castillo de Sant Angelo', fecha: '2026-11-19', dia: 3, colecciones: [], falta: ['pedazo'] },
        ],
      } as never,
      texto_viaje: '¡Wow! Tu viaje a Roma fue increíble. Echa un vistazo a todo lo que conseguiste.',
      texto_viaje_tipo: 'wow',
    },
    viajero: { ok: true, logros: [{ id: 'paises', grupo: 'viajero', nombre: 'Trotamundos', linea: 'Países distintos que has visitado con la app.', escalones: [{ n: 1, nombre: 'Primer país', ganado: true }] }] },
  }
}
