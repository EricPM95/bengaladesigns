// Vite sin vigilar ficheros (solo para las pruebas largas con otros agentes editando el mismo árbol): ningún cambio de otro recarga la página a mitad de una prueba. Para ver código nuevo, reiniciar este Vite.
// Tanda 10S: además, `warmup` le dice que compile al arrancar lo que SIEMPRE se pide primero (la entrada, el viaje de pruebas y su cadena de módulos), para que la primera página de la primera prueba no se
// tope con un Vite frío (esa compilación, con 2 Chrome a la vez, era la causa más probable de las esperas largas de __rutaPrueba).
import { mergeConfig } from 'vite'
import base from '../../vite.config.ts'
// (15-nov, limpieza de cuentas de prueba) Las pruebas NUNCA crean cuentas ni viajes en el Supabase de producción: este Vite arranca sin las claves de Supabase y la app corre «en memoria» (sin nube), como ya sabe hacer.
// La app recibe un Supabase de MENTIRA (una dirección que no existe y que el Chrome de pruebas bloquea): hay cliente (las pruebas de «sin servidor» lo necesitan) pero nada llega a la nube. Las pruebas que de verdad necesitan
// el Supabase real (`*_real`) solo corren con PERMITIR_SUPABASE_REAL=1, a mano. Las variables VITE_* del entorno mandan sobre `.env.local`.
if (process.env.PERMITIR_SUPABASE_REAL !== '1') {
  process.env.VITE_SUPABASE_URL = 'https://sin-nube-de-pruebas.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'clave-de-mentira-para-las-pruebas'
}
export default mergeConfig(base, {
  server: {
    watch: null,
    hmr: false,
    warmup: { clientFiles: ['./src/main.tsx', './src/App.tsx', './src/dev/rutaDePrueba.ts', './src/dev/escaparate.ts', './src/store/useRouteStore.ts'] },
  },
})
