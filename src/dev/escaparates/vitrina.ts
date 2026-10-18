import { useLogrosPantallas } from '../../components/logros/pantallas/useLogrosPantallas'
import { guardarTitulo, useGanados, useHojasDeLogros } from '../../components/logros/pantallas/todos/api'
import { ponerEscenario, type EscenarioGanados } from '../../lib/logrosDemo_ganados'
import type { Escaparate } from '../escaparate'

/**
 * Escaparates de «Mi vitrina» y «Todos mis logros» (8C2), con el nombre que tienen en el diseño (Piezas/Mi Vitrina.dc.html):
 *   V1 la vitrina llena · V2 sin maravilla y con baldas casi vacías · V3 elegir hueco · T1 y T2 Todos mis logros · T4 la ficha de un logro.
 * Y las variantes que enseña el diseño (V1b: una pieza abierta, V2b: nada ganado, T4b: un logro que aún no se tiene, T4c: el que ya es tu título).
 */
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function esperarA(selector: string, ms = 6000): Promise<Element | null> {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const e = document.querySelector(selector)
    if (e) return e
    await espera(60)
  }
  return null
}

async function abrirTodos(escenario: EscenarioGanados, pestana: 'vitrina' | 'todos'): Promise<void> {
  useLogrosPantallas.getState().cerrarTodo()
  useHojasDeLogros.getState().limpiar()
  ponerEscenario(escenario)
  useGanados.setState({ datos: null, estado: 'sin_pedir' })
  useLogrosPantallas.getState().abrir({ t: 'todos', pestana })
  await esperarA(pestana === 'vitrina' ? '[data-vitrina]' : '[data-todos]')
  await espera(350)
}
async function bajar(px: number): Promise<void> {
  const e = (await esperarA('[data-todos]')) as HTMLElement | null
  if (e) e.scrollTop = px
}
async function elegirVista(vista: 'Destinos' | 'Países'): Promise<void> {
  const b = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((x) => x.textContent === vista)
  b?.click()
  await espera(150)
}

const cerrar = () => {
  useLogrosPantallas.getState().cerrarTodo()
  useHojasDeLogros.getState().limpiar()
}

const lista: Escaparate[] = [
  { id: 'V1', que: 'La vitrina llena: el pedestal de las 7 maravillas, los exclusivos y cuatro baldas', abrir: () => abrirTodos('lleno', 'vitrina'), cerrar },
  {
    id: 'V1b',
    que: 'V1 tocando una colección: pantalla grande con [Compartir] y [Quitar de mi vitrina]',
    capturas: [1200],
    abrir: async () => {
      await abrirTodos('lleno', 'vitrina')
      ;(document.querySelector('[data-balda="colecciones"] button') as HTMLElement | null)?.click()
      await espera(300)
    },
    cerrar,
  },
  {
    id: 'V1c',
    que: 'V1 después de quitar una pieza: «… vuelve a Todos mis logros»',
    capturas: [900],
    abrir: async () => {
      await abrirTodos('lleno', 'vitrina')
      ;(document.querySelector('[data-balda="sellos"] button') as HTMLElement | null)?.click()
      await esperarA('[data-pieza-abierta]')
      await espera(900)
      const q = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pieza-abierta] button')).find((x) => x.textContent === 'Quitar de mi vitrina')
      q?.click()
      await espera(500)
    },
    cerrar,
  },
  { id: 'V2', que: 'Sin maravilla y con las baldas casi vacías', abrir: () => abrirTodos('poco', 'vitrina'), cerrar },
  { id: 'V2b', que: 'Nada ganado todavía: las cuatro baldas vacías', abrir: () => abrirTodos('vacio', 'vitrina'), cerrar },
  {
    id: 'V3',
    que: 'Elegir un hueco para una colección: «Llevar a mi vitrina» → «elige un hueco» → [Colocar aquí] (el hueco lleno avisa de lo que vuelve)',
    capturas: [1000],
    abrir: async () => {
      await abrirTodos('lleno', 'vitrina')
      useHojasDeLogros.getState().abrirFicha('roma|coleccion|roma_antigua')
      useHojasDeLogros.getState().abrirHueco('roma|coleccion|roma_antigua', 1)
      await esperarA('[data-elegir-hueco]')
      await espera(500)
    },
    cerrar,
  },
  { id: 'T1', que: 'Todos mis logros, arriba: el resumen, Por destino (Destinos) y los logros de viajero', abrir: () => abrirTodos('lleno', 'todos'), cerrar },
  {
    id: 'T2',
    que: 'Todos mis logros, bajando: Por destino en la vista Países, los grupos de viajero con «Ver todo»',
    abrir: async () => {
      await abrirTodos('lleno', 'todos')
      await elegirVista('Países')
      await bajar(560)
      await espera(200)
    },
    cerrar,
  },
  {
    id: 'T2b',
    que: 'Todos mis logros, abajo del todo: Las 7 maravillas y los Exclusivos',
    abrir: async () => {
      await abrirTodos('lleno', 'todos')
      await bajar(5000)
      await espera(200)
    },
    cerrar,
  },
  {
    id: 'T4',
    que: 'La ficha de un logro de viajero (Países): [Compartir], [Volver a ver] y [Usar como mi título]',
    capturas: [1000],
    abrir: async () => {
      await abrirTodos('lleno', 'todos')
      useHojasDeLogros.getState().abrirFicha('*|viajero:paises|1')
      await esperarA('[data-ficha]')
      await espera(500)
    },
    cerrar,
  },
  {
    id: 'T4b',
    que: 'La ficha de un logro que aún no se tiene: en gris y con cómo conseguirlo',
    capturas: [1000],
    abrir: async () => {
      await abrirTodos('lleno', 'todos')
      useHojasDeLogros.getState().abrirFicha('pendiente:con_quien_solo')
      await esperarA('[data-ficha]')
      await espera(500)
    },
    cerrar,
  },
  {
    id: 'T4c',
    que: 'La ficha de un logro que ya es tu título: «✓ Es tu título»',
    capturas: [1000],
    abrir: async () => {
      await abrirTodos('lleno', 'todos')
      // El título se pone en el servidor de ejemplo y se vuelve a pedir lo ganado.
      await guardarTitulo('*|viajero:paises|1')
      await useGanados.getState().cargar(true)
      useHojasDeLogros.getState().abrirFicha('*|viajero:paises|1')
      await esperarA('[data-ficha]')
      await espera(500)
    },
    cerrar,
  },
]
export default lista
