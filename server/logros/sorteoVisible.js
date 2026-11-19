/**
 * (V25, decisión de Eric, 19-nov) EL SORTEO ANUAL, ESCONDIDO hasta que la app salga en las tiendas (App Store y Google Play): hace falta mirarlo antes con el gestor. No se ha borrado nada (código, tablas y datos siguen):
 * este interruptor lo apaga. `SORTEO_VISIBLE=true` en el entorno del servidor (y `VITE_SORTEO_VISIBLE=true` en el móvil) lo vuelve a encender. Apagado (lo normal): el servidor no crea el aviso «¡Ya estás en el sorteo de 2027!»,
 * no da el billete en el Perfil ni la página del sorteo, y no enseña los avisos del sorteo que ya hubiera en la campana.
 */
export function sorteoVisible(env = process.env) {
  return String(env?.SORTEO_VISIBLE ?? '').trim().toLowerCase() === 'true'
}
