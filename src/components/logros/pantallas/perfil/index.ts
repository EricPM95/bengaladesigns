/**
 * Lo del Perfil y la EXP a la vista (Tanda 8C2). Importa SIEMPRE con `import('…/pantallas/perfil')` (o desde un componente perezoso): no debe entrar en el paquete que baja al abrir la app.
 *
 *   ExpGanada      E1/E2: «+405 EXP» flotando abajo con nivel, rango y barra.   props { ganada, antes, despues, onFin?, inicial? }
 *   SubeDeNivel    E3: subir de nivel, pantalla completa.                       props { antes, despues, onFin?, inicial? }
 *   CambioDeRango  E4: cambio de rango con su marco nuevo, pantalla completa.   props { antes, despues, onFin?, inicial? }
 *   MarcoDeRango   el marco (10 imágenes) con la foto dentro y las estrellas del nivel.
 *   NivelYBarra    la barra de EXP del Perfil.
 * `antes` y `despues` son `ResumenDeExp` (lo que manda el servidor en `exp` de la respuesta de un Visto o una foto: `{ ganada, antes, despues, sube_de_nivel }`).
 */
export { ExpGanada, DURACION_EXP_GANADA } from './ExpGanada'
export { SubeDeNivel } from './SubeDeNivel'
export { CambioDeRango } from './CambioDeRango'
export { MarcoDeRango, InicialEnMarco, NUMERO_DE_RANGOS, urlDeMarco, urlDeHueco } from './MarcoDeRango'
export { NivelYBarra } from './NivelYBarra'
export { LINEA_DE_RANGO } from './api'
export type { ExpDeRespuesta, ExpDelPerfil, PerfilLogros, ResumenDeExp, TituloDeViajero } from './api'
