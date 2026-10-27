// Vite sin vigilar ficheros (solo para las pruebas largas con otros agentes editando el mismo árbol): ningún cambio de otro recarga la página a mitad de una prueba. Para ver código nuevo, reiniciar este Vite.
import { mergeConfig } from 'vite'
import base from '../../vite.config.ts'
export default mergeConfig(base, { server: { watch: null, hmr: false } })
