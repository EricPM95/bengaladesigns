import { guardarPrevios } from '../../components/logros/pantallas/mundo/api'
import { useLogrosPantallas } from '../../components/logros/pantallas/useLogrosPantallas'
import type { Escaparate } from '../escaparate'

/**
 * Escaparates de «¿Dónde has estado ya?» (J1, J2, J3) y del pasaporte (P2, P2l, P2v, P2i2, P2m, P2e), con el mismo nombre que en el diseño (Piezas/Logros J Donde has estado y Piezas/Perfil).
 * Los datos son los del demo (src/lib/logrosDemo_mundo.ts).
 */
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const cerrar = () => useLogrosPantallas.getState().cerrarTodo()
/** Los 11 países que marca el diseño en J1. */
const DEL_DISENO = ['España', 'Italia', 'Francia', 'Portugal', 'Reino Unido', 'Alemania', 'Grecia', 'Países Bajos', 'Suiza', 'Marruecos', 'Ciudad del Vaticano']
const buscar = (sel: string, texto?: string) => Array.from(document.querySelectorAll<HTMLElement>(sel)).find((e) => !texto || e.textContent?.trim().startsWith(texto))

const lista: Escaparate[] = [
  {
    id: 'J1',
    que: 'Marcar en el globo: el globo y la lista con 11 países marcados',
    abrir: async () => {
      await guardarPrevios(DEL_DISENO, 0)
      useLogrosPantallas.getState().abrir({ t: 'previos' })
      await esperar(4000)
    },
    cerrar,
  },
  {
    id: 'J2',
    que: 'Buscar los países pequeños: la búsqueda «san» sin globo',
    abrir: async () => {
      await guardarPrevios(DEL_DISENO, 0)
      useLogrosPantallas.getState().abrir({ t: 'previos' })
      await esperar(1200)
      const campo = document.querySelector<HTMLInputElement>('input[placeholder="Busca un país"]')
      if (campo) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(campo, 'san')
        campo.dispatchEvent(new Event('input', { bubbles: true }))
      }
      await esperar(300)
    },
    cerrar,
  },
  {
    id: 'J3',
    que: 'Lo que has ganado (animación: tu mundo, los países y el botón al final)',
    capturas: [300, 1500, 4600],
    abrir: async () => {
      await guardarPrevios(DEL_DISENO, 0)
      useLogrosPantallas.getState().abrir({ t: 'previos' })
      for (let i = 0; i < 40 && !buscar('button', 'Listo · '); i++) await esperar(150)
      await esperar(1500)
      buscar('button', 'Listo')?.click()
      await esperar(500)
    },
    cerrar,
  },
  {
    id: 'P2',
    que: 'El pasaporte abierto en Italia (primero la tapa, que sube, y luego la página)',
    capturas: [300, 3600],
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte' })
    },
    cerrar,
  },
  {
    id: 'P2l',
    que: 'La lista de países, abierta',
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'lista' })
      await esperar(4000)
    },
    cerrar,
  },
  {
    id: 'P2v',
    que: 'El Vaticano, elegido desde la lista',
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'Ciudad del Vaticano' })
      await esperar(4000)
    },
    cerrar,
  },
  {
    id: 'P2i2',
    que: 'Italia, segunda página de sellos',
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'Italia:2' })
      await esperar(4000)
    },
    cerrar,
  },
  {
    id: 'P2m',
    que: 'México: Cancún por conseguir',
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'México' })
      await esperar(4000)
    },
    cerrar,
  },
  {
    id: 'P2e',
    que: 'Al acabar el viaje: el sello se estampa (principio, mitad y final)',
    capturas: [0, 700, 1600],
    abrir: async () => {
      await guardarPrevios(['España', 'Portugal', 'Grecia', 'Países Bajos'], 0)
      useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'sello:demo-roma-2026' })
      await esperar(1000)
      // Se vuelve a pedir el golpe para que la captura «0» sea el principio de la caída.
      buscar('button', 'Repetir el golpe')?.click()
    },
    cerrar,
  },
]
export default lista
