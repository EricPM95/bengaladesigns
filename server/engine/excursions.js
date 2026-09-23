// Se mudó a shared/routeEngine/excursions.js: el motor v3 es un módulo sin dependencias del servidor
// (lo usará también Modo Hoy). Este reexport mantiene intactos a quienes lo importaban de aquí.
export * from '../../shared/routeEngine/excursions.js'
