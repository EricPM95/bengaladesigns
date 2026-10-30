// Vite sin vigilar ficheros (solo para las pruebas largas con otros agentes editando el mismo árbol): ningún cambio de otro recarga la página a mitad de una prueba. Para ver código nuevo, reiniciar este Vite.
// Tanda 10S: además, `warmup` le dice que compile al arrancar lo que SIEMPRE se pide primero (la entrada, el viaje de pruebas y su cadena de módulos), para que la primera página de la primera prueba no se
// tope con un Vite frío (esa compilación, con 2 Chrome a la vez, era la causa más probable de las esperas largas de __rutaPrueba).
import { mergeConfig } from 'vite'
import base from '../../vite.config.ts'
export default mergeConfig(base, {
  server: {
    watch: null,
    hmr: false,
    warmup: { clientFiles: ['./src/main.tsx', './src/App.tsx', './src/dev/rutaDePrueba.ts', './src/dev/escaparate.ts', './src/store/useRouteStore.ts'] },
  },
})
