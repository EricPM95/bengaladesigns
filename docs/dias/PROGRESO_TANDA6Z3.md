# Progreso de la Tanda 6z3

1. Barra de abajo con cinco pestañas (Hoy · Ruta · Días · Explorar · Reservas): hecho. Fija, no cambia ni se esconde; Reservas lleva el «!» cuando falta algo. Se quitan el selector de arriba (ModeSwitcher) y la barra vieja (Presupuesto · Perfil · Reservas).
2. Cabecera nueva: hecho. Destino y «13 – 16 oct · 2 personas» (sin fechas, «octubre · 2 personas»). A la derecha: Presupuesto (cartera), campana con punto y Perfil.
3. HOY según el momento: hecho. Antes (cuenta atrás, «Te falta por reservar», «Útil para el viaje», «El tiempo en {destino}»), sin fechas (con [Pon tus fechas]), durante en gratis (lista del día), durante en de pago (siguiente parada con mapa, Cómo llegar, ✓ Visto), después (recuerdos y nuevo viaje).
4. Una sola familia de iconos y el color frambuesa: hecho. Los iconos salen de `src/lib/iconos.ts`; la excursión lleva la mochila y el autobús queda para la llegada y la vuelta en autobús. La frambuesa está en los tokens de `src/index.css`.
5. Con fechas, sin «Día n»: hecho. Un solo sitio (`src/lib/nombreDeDia.ts`).
6. Fotos del viaje: hecho en el código. La migración `0018_fotos_viaje.sql` hay que aplicarla a mano en Supabase.
7. Respuestas a la 6z2: hecho (pulsar «Útil para el viaje» no cuenta como añadido; «¿Ya lo tienes? Añádelo» abre el precio; nota de monedas en la guía de destinos nuevos).
8. Pruebas: la nueva `pruebaTanda6z3.mjs`, `pruebaDiasFecha6z3.mjs` y `pruebaFotos6z3.mjs`, más todas las de siempre.
