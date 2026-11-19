# Las pruebas que seguían fallando: ¿ya fallaban antes de la cola? (19-nov)

Se pasaron las 12 con la versión de **antes de la cola** (`2d4a09ac`, el último commit antes de la V16; ojo: `c03a1e1` ya ES la V16), en una carpeta aparte (un `git worktree`, sin tocar `main`), y con la de ahora.

| Prueba | Antes de la cola | Por qué | Ahora |
|---|---|---|---|
| `pruebaTanda6g` | 7 fallos | Dato/motor: con Free Tour en diciembre y enero, el día D4 lleva la nocturna «Plaza de España (noche)» y ese mismo día ya se ve Plaza de España. Es un fallo real del motor, no de la prueba. **Sin arreglar** (hay que decidir qué manda: la nocturna o el Free Tour). | 7 (igual) |
| `pruebaTanda10M_app` | 3 | Las tarjetas especiales llevan ahora una cruz de cerrar (un botón sin texto); la prueba contaba un solo botón. Prueba vieja. | **0** |
| `pruebaTanda6z6b` | 5 | Prueba vieja: (a) desde que no se sube dos veces la misma foto, su base de datos falsa ignoraba los filtros y rechazaba todas; (b) el Perfil ya no lleva la etiqueta «Hecho» (V8). | **0** |
| `pruebaFase6y_manual` | 56 | Horas de apertura de sitios que salen en la pantalla de «ruta a mano» con un formato que la prueba no reconoce («8:30–17:00»). Estaba así antes. **Sin arreglar** (hay que decidir el formato). | 56 (igual) |
| `pruebaFase6y10_ficha` | 3 | Datos: los restaurantes de `roma.json` y `listas.json` no coinciden con lo que da el script con su semilla. **Sin arreglar** (hay que regenerar los datos, y eso lo decide Eric). | 3 (igual) |
| `pruebaV1b` | **0** | **Falló por la cola** y la app estaba bien: V19 añadió `cobroSoloAdmins` al `import` de los avisos y V17 añadió el cuarto sitio donde se abre un viaje (el Perfil). Prueba puesta al día. | **0** |
| `pruebaFase6y3_reservas` | 1 | Prueba vieja: la 10S7c puso a propósito el botón «Pasarlo a otro día» y la prueba prohibía esa palabra en todo el código. | **0** |
| `pruebaFase6y2_reservas` | 1 | Prueba vieja: el «Añádela» del Free Tour cambió de forma en la 10N (con el dueño de la entrada). | **0** |
| `pruebaTanda6v` | 1 | Prueba vieja: «Tu zona» pasó a la hoja «Tu alojamiento». | **0** |
| `pruebaTanda10S5_K` | 4 | Prueba vieja: la cabecera de Entradas hay que tocarla para abrirla; y la hoja vieja «Propón un sitio» ya no existe (es la U2b de Cuéntanos, que la misma prueba ya comprueba). | **0** |
| `pruebaTanda10S4_I` | 4 | **Fallo de la app**: tres botones por debajo de 44 px (los «Ahora» de la campana, «Recuerdos del viaje» y «Poner un logro en mi vitrina» del Perfil). Arreglado con `zona-toque`. | **0** |
| `pruebaTanda6z3` | 6 | **Fallos de la app**: 5 iconos con el trazo copiado (en vez de leerlo de `src/lib/iconos.ts`) y un color `oklch` suelto en «Reto del día». Arreglado. | **0** |

Resumen: **ninguna de las 12 fallaba por la cola excepto `pruebaV1b`** (cambios que pedimos a propósito en V17 y V19). Quedan 3 que ya fallaban y no se arreglan rápido: `6g` (motor), `6y_manual` (formato de horas) y `6y10` (datos).
