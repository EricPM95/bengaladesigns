Hola. TANDA V56: ARREGLOS PEQUEÑOS DEL CHECKLIST DE LA NOCHE (decididos por Eric el 25-nov). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V55 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v56.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**Son 10 cosas pequeñas.** El número entre paréntesis es el del CHECKLIST. En el REPASO, **una línea por cada una con ✅ hecho o ❌ no hecho y por qué**: que no se quede ninguna sin decir.

## 1. El panel no pesa a nadie (1)
El panel ya vive en `/admin`, solo para administradores. Se queda ahí. Lo que hay que conseguir: **ningún viajero se descarga nada del panel ni del estudio de sonidos** al abrir la app. Solo se baja cuando entra un administrador. Dime cuánto pesa el arranque antes y después (los topes eran 340 KB y 1 MB).

## 2. Los sitios del atardecer (2)
Contar desde **la ubicación real si hay GPS**. Si no hay, desde **la última parada hecha**. Es el arreglo de `HoyDuranteV2.tsx` de DECISIONES_NOCHE_PRUEBAS §2. En Lanzarote tienen que salir 2 o 3.

## 3. Los «me gusta» de los restaurantes (3)
Pon el corte en 22: salen Taverna Trilussa y Sgarro Bistrot.

## 4. La moneda según el país (4)
- **Al contestar «¿En qué país vives?»** (primera vez o Ajustes, `paisVive.ts`), la moneda del viajero pasa a ser la de ese país (México → pesos mexicanos). Zona euro o sin contestar: euros.
- En Ajustes sale ya esa moneda, y se puede cambiar.
- **Manda lo último que dice el viajero:**
  - si después cambia la moneda (Ajustes o presupuesto), manda esa;
  - si más tarde cambia el país, pasa a la moneda del país nuevo.
- **Los precios «desde» de las actividades** se enseñan como el resto de precios de la app, con `formatearPrecio` («≈ 2.150 MXN · 100 €»). Una sola forma.
- Se paga siempre en euros: no cambies nada del pago.

## 5. Fuera las páginas viejas de revisión de rutas (5)
Quita:
- `docs/dias/RUTAS_REVISION.html`, `RUTAS_REVISION.json`, `RUTAS_REVISION_LARGOS.html` y `RUTAS_REVISION_LARGOS.json`;
- las pruebas que solo servían para ellas (`pruebaRevisionLargos`, `pruebaRevisionRutas`). Si alguna mira algo más, ponla al día en vez de quitarla.

## 6. «Hoy vuelves a casa» (7)
El último día en blanco de un viaje hecho a mano se llama «Día de viaje». Ese día de vuelta sin paradas pasa a llamarse **«Hoy vuelves a casa»** (`tituloDelDia.ts`). El día de llegada sin paradas sigue como está.

## 7. «100 Presepi in Vaticano» (11)
Mira en la web oficial si ya están las fechas de 2026-27:
- si están, ponlas;
- si no, deja apuntado en el dato «revisar en diciembre» y dímelo.

Nunca fechas de memoria.

## 8. «Hoy ya no da tiempo a todo», nunca desde las 20:00 (29)
- Hoy sale hasta las 22:40.
- **A partir de las 20:00, no sale**: es la hora de cenar.
- Lo demás, igual: una vez al día, con más de 1 h de retraso o al abrir HOY con la mañana pasada y nada hecho.

## 9. Pueblos, ciudades, islas, barrios, plazas y calles nunca cierran (31)
- **Regla nueva para CLAUDE.md, para todos los destinos:** estos sitios no llevan horario. Nunca salen «Cerrado» ni van a «Ya ha cerrado». Lo que cierra son sus atracciones, que siempre son una parada aparte (el mercado de Teguise, solo los domingos por la mañana, es su propia parada).
- Quita el horario a Haría, Teguise y a todo lo de ese tipo en los datos de Roma y Lanzarote.
- Dime cuáles has tocado.

## 10. «¿Cómo vas?» o «¿Cómo vais?» (33)
- «¿Cómo vas?» si viaja solo.
- «¿Cómo vais?» si hay más personas **unidas** al viaje (`modoCuentas`, no lo que dijo en el formulario).
- Revisa los otros textos de HOY que usan «vosotros».

## 11. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO, corto:
  - la lista de las 10 con ✅/❌;
  - captura en modo iPhone del 2, 4 (Ajustes y una actividad con otra moneda), 6, 9 (un pueblo de Lanzarote) y 10.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
