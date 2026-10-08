# Progreso de la Tanda 6j

1. **Villa Borghese (D4):** primero la Galería, después el parque; turnos de la Galería cada hora (9:00 y 10:00 → lista de las 9:00, 11:00 normal, 12:00 y 13:00 sin lista, de 14:00 en adelante el día al revés); Capuchinos a las 10:00. Hecho. TABLA_RESERVAS regenerada.
2. **D1:** el Gesù al final de la tarde (después de Navona), también en la lista del Coliseo a mediodía. Hecho.
3. **Horarios y precios de la auditoría (✅ y 🟡):** 23 sitios en `roma.json`; el motor aprende rangos de cierre (`08-10..08-24`, `2027-01-13..2027-02-10`), el 2.º domingo del mes (`nth_sunday`) y el 1.er domingo cerrado (`closed_nth_sunday`). Los ❓ no se tocan. Hecho.
4. **Experiencias:** vuelve el Free Tour (segundo, «Recomendado»), fuera «¿Cómo son tus días?», Mercadillos con su texto nuevo. Hecho.
5. **DÍAS:** fuera los puntitos de las tarjetas cerradas. Hecho.
6. **Fotos:** Gesù (solo por dentro) y Santa Maria in Trastevere. Hecho.
7. **Coordenadas:** Reloj de agua, Museos Capitolinos, Foro desde la terraza. Hecho.
8. **Varita por destino:** hecha (copia única filtrada por destino, prueba propia en `pruebaVarita.mjs`).
9. **Reservas:** una reserva grande con otra fecha mueve el día entero (el motor ordena los demás con ese día fijo), hoja de confirmación con el porqué, fuera el aviso «A las {hora} no tenemos escrito…», texto de «la pasamos a tu Día n» en color normal, tarjeta con una sola etiqueta «✓ Reservada · hora», fuera la línea «Entrada a las…». Hecho.
9b. **Free Tour en RESERVAS solo si está en el viaje, Coliseo en invierno («Reserva obligatoria en estas fechas»), mejor hora para reservar.** Hecho.
10. **Pruebas:** `pruebaTanda6j.mjs`, 6g/6h/6i, `pruebaListas` de una de cada 5 fechas en 4 procesos. Hecho.

TERMINADO
