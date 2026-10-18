import { datosDePrueba, type EstadoLogros } from '../../components/logros/momentos/api'
import { useMomentosUI } from '../../components/logros/momentos/useMomentosUI'
import { espera } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'
import ultimo from './datos/hoja_ultimo.json'

/** Escaparates de Compartir (8C2): C1 un logro y C2 el viaje, con el pie nuevo (marco de rango, título y hueco del logo vacío). */
const cerrar = () => {
  useMomentosUI.getState().cerrarCompartir()
  datosDePrueba.estado = null
}
/** Espera a que la imagen esté hecha (la primera vez baja el trozo de Compartir y la fuente). */
const hastaLaImagen = async () => {
  for (let i = 0; i < 80; i++) {
    if (document.querySelector('img[alt="La imagen para compartir"]')) break
    await espera(250)
  }
  await espera(400)
}
const lista: Escaparate[] = [
  {
    id: 'C1',
    que: 'Compartir un logro (Coliseo, sello de Roma en oro)',
    abrir: async () => {
      useMomentosUI.getState().abrirCompartir({ tipo: 'logro', momento: { tipo: 'sello', sello: 'roma', grado: 'oro', nombre: 'Roma en el corazón', linea: '6 de 8 imprescindibles.', primera_vez: true } })
      await hastaLaImagen()
    },
    cerrar,
  },
  {
    id: 'C2',
    que: 'Compartir el viaje',
    abrir: async () => {
      datosDePrueba.estado = ultimo as unknown as EstadoLogros
      useMomentosUI.getState().abrirCompartir({ tipo: 'viaje' })
      await hastaLaImagen()
    },
    cerrar,
  },
]
export default lista
