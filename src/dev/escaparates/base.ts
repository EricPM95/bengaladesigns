import { useLogrosPantallas } from '../../components/logros/pantallas/useLogrosPantallas'
import type { Escaparate } from '../escaparate'

/** Escaparate de comprobación de la base de las pantallas (8C2): abre la pantalla provisional de «Todos mis logros». */
const lista: Escaparate[] = [
  {
    id: 'base',
    que: 'La pila de pantallas funciona (pantalla provisional)',
    abrir: () => useLogrosPantallas.getState().abrir({ t: 'todos' }),
    cerrar: () => useLogrosPantallas.getState().cerrarTodo(),
  },
]
export default lista
