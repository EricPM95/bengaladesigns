# Notas tras la 8C3 (Claude, 18-oct-2026)

Para la próxima tanda de Code:

- **Los sellos del pasaporte (Eric: sí).**
  - Un sello por cada ciudad de cada viaje, cada uno con su fecha.
  - Ejemplos:
    - Roma y Florencia en el mismo viaje, 2 sellos;
    - dos viajes a Roma, 2 sellos de Roma;
    - Roma entrando al Vaticano, 2 (Roma y Vaticano).
  - El Perfil cuenta lo distinto, igual que la cabecera del pasaporte: «N países · N ciudades». Volver a Roma suma sello, pero no ciudad.
  - Que el Perfil y el pasaporte lean la misma cuenta del servidor.
  - El sello de ciudad de los logros (bronce → diamante) no cambia: uno por ciudad.
- **El botón flotante de logros en HOY v2** tapa un poco [No me da tiempo] (captura 1a-hoy de la 8C3). Que no tape ningún botón de la tarjeta.

Para la lista de antes del lanzamiento:

- **Encender los interruptores en producción:** HOY v2 (`VITE_HOY_V2`), los logros (`LOGROS_ACTIVOS` / `VITE_LOGROS_ACTIVOS`), el cobro del pase (`PASES_COBRO_ACTIVO`) cuando toque, y el aviso en el móvil (`PUSH_ACTIVO`).
  - Hoy, sin HOY v2, la gente vería el HOY de antes, con el mapa grande.
- **Las migraciones 0020 → 0021 → 0023 → 0024 → 0025** en Supabase, al probar las cuentas.
