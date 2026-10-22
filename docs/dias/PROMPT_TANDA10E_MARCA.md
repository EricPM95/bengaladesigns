Hola. TANDA 10E: LA MARCA NUEVA EN TODA LA APP (colores, botones, logo y apertura). No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10E_MARCA.md e inclúyelo en tu commit.
- **Design, nuevo:** Eric ha dejado en la carpeta del proyecto el zip «Trazo_App__diseño_de_rutas_personalizadas_9.zip». Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/`) e inclúyelo en tu commit.
- **La página que manda es Marca JUTRIP** (01 · Colores, 02 · Pantallas y 03 · La barra). Léela entera antes de tocar nada.

## 1. La regla de esta tanda
- **De las páginas App de Design (HOY v2, Reservas v4, Ruta y días, Explorar y fichas, Crear el viaje, Pase y cuenta) sacas cómo es cada pantalla; los colores, siempre de Marca JUTRIP.** Esas páginas App siguen pintadas con el frambuesa (`oklch(0.55 0.17 5)`) como color de la marca: **no lo copies**. Por eso RESERVAS sigue hoy en rojo en la app.
- **El frambuesa solo para dos cosas** (como dice Marca JUTRIP): lo que **falta** («Falta», «0 de 4 reservadas», el punto de Avisos) y **resaltar** (el corazón de «lo recomiendan» y las piezas de la colección principal). Todo lo demás que hoy es frambuesa pasa al oro y la tinta.
- **No cambian:** el verde de «Visto» y de lo reservado, el rojo de los avisos importantes, el lila de los barrios y los colores de cada día de la ruta (azul, naranja, verde).

## 2. Los colores nuevos (Marca JUTRIP 01)
| | Antes | Ahora |
|---|---|---|
| Oro claro (`--oro`): solo líneas, pines, iconos grandes, rutas de puntos y brillos | `#B58A2E` | **`#D8B98E`** |
| Oro oscuro (`--accent`) | `#8B6620` | **`#A67C52`** |
| Oro profundo (`--accent-hover`, `--accent-warm`) | `#6E5018` | **`#6F4E37`** |
| Oro pálido (sobre fondos oscuros) | `#E9C77A` | `#E9C77A` (igual) |
- Crema `#F6EFE0`, marfil `#FBF3E2`, tarjeta `#FFFDF8` y tinta `#1C2230`, igual. Vuelve a calcular `--border-accent` con el oro nuevo, y `--accent-soft` como Design (`#F1E3BF`; el champán de los botones, `#EBD9AE`).
- Los colores escritos a mano en las pantallas (por ejemplo, los `#8B6620`, `#8E6820` y `#6E5018` sueltos), pásalos a sus variables. **Los dibujos de medallas, sellos, emblemas y marcos no se tocan:** su oro es el del metal.

## 3. El oro y la lectura (esto lo decide Claude: cumple esto aunque Design haga otra cosa)
- El oro oscuro nuevo es más claro que el de antes: `#A67C52` sobre el crema da **3,26**, sobre la tarjeta 3,67 y el blanco sobre él 3,73. **No llega para el texto pequeño** (hace falta 4,5).
- **`#A67C52`, solo** en títulos de 18 px o más (como «día a día», «Roma», «2 de 4»), iconos, líneas, bordes y rellenos sin texto pequeño encima.
- **Todo el texto pequeño en oro, con el oro profundo `#6F4E37`** (6,5 sobre el crema): las etiquetas («ROMA · 28 – 31 OCT», «JUE 17 · CENTRO HISTÓRICO», «QUÉ VAS A VER»), «+ Añadir parada», los enlaces («Crea tu cuenta»), los números de las listas… **aunque Design los ponga en `#A67C52`**. No los oscurezcas a otro tono: usa el oro profundo.
- Nada de texto blanco pequeño sobre `#A67C52`: los botones principales van como en el punto 4.
- Pon al día las comprobaciones de contraste de `pruebaJutrip` con los colores nuevos.

## 4. Los botones principales, champán (Marca JUTRIP 02)
- Como «Continuar» (02 · Entrar), «Comprar · 10,99 €» (08) y «Cómo llegar» (09): degradado del marfil `#FBF3E2` al champán `#EBD9AE`, texto en el oro profundo `#6F4E37`, con su brillo de arriba y su sombra, como en Design.
- Sobre los paneles oscuros (tinta), como «Cómo llegar» en 03 · HOY: con borde y texto en oro pálido.
- «Visto», verde, igual. Lo elegido (pestaña o pastilla seleccionada), en tinta.
- Todos los botones principales de la app, con este mismo estilo (también [Elegir mi pase], [Ver el Pase de Roma], [Guardar]…).

## 5. RESERVAS, como Marca JUTRIP 02 · 06
- «0 de 3 listo», en oro (en cursiva, como ahora); los círculos de «Llegada y vuelta», «Alojamiento» y «Entradas 0/4», en oro.
- Los cuadros de los iconos (avión, cama, entrada), en champán con el icono en oro, no en frambuesa claro.
- «Falta» y «0 de 4 reservadas», en frambuesa (es lo que falta).
- «Útil para el viaje» (seguro, eSIM…): los cuadros de los iconos como en Design, en champán y oro (hoy uno es marrón y otro azul verdoso).
- Lo mismo dentro de cada acordeón y en las hojas que se abren desde RESERVAS (la ficha de la entrada, el presupuesto, añadir reserva…).

## 6. El repaso de toda la app
- Pantalla por pantalla: la apertura, Entrar, la primera pantalla, Crear el viaje (todos sus pasos), RUTA, DÍAS, HOY (antes y durante el viaje), EXPLORAR, las fichas de las paradas, RESERVAS, Logros, Perfil, el pase y sus hojas, los avisos y las hojas de abajo.
- Busca **cada frambuesa que quede** fuera de sus dos usos y pásalo al oro o a la tinta. En el informe, la lista de lo que has cambiado y la de los frambuesas que se quedan (solo deben quedar los de «falta» y «resaltar»).

## 7. El logo y la pantalla de apertura (Marca JUTRIP 02 · 01 · Apertura)
- **El logo nuevo:** `Piezas/Logo JUTRIP` (la palabra JUTRIP en Italiana, con el degradado de oro, las letras que entran una a una y la estrella que salta sobre la I). Úsalo donde hoy sale la palabra del logo P4 (la apertura, Entrar…). La letra Italiana, solo para el logo. **El icono de la app (el del móvil) no se toca en esta tanda:** dime en el informe dónde más salía el logo P4 y qué has puesto.
- **La apertura, como en Design:** el fondo de marfil con su luz, el brillo detrás, el logo que entra de borroso a nítido, el destello que lo cruza, las chispas, la línea debajo que se escribe letra a letra y la ruta de puntos de abajo, con su pin.
- **El texto de la línea es el nuestro: «De viajeros, para viajeros»** (no «TU APP DE VIAJES»), en mayúsculas espaciadas como en Design.
- **Una sola vez** (en Design se repite para enseñarla): todo acaba en unos **2,5 segundos** y entra en la app. La frase es más larga que la de Design: acelera el letra a letra para que quepa en ese tiempo. Con las animaciones reducidas del móvil, la pantalla quieta, con el logo y la frase.

## 8. La barra (Marca JUTRIP 03 y Piezas/Barra JUTRIP)
- La barra A (tinta), con los colores nuevos de la pieza: el icono elegido de la barra tinta, en `#A67C52` sobre su pastilla marfil; en la marfil, en `#6F4E37`.

## 9. La prueba
- La batería rápida y `pruebaJutrip` (con el contraste nuevo).
- Capturas en `docs/dias/capturas_jutrip/`: la apertura (tres momentos: logo entrando, logo con la frase a medias y el final), Entrar, HOY, RUTA, DÍAS con un día abierto, EXPLORAR, RESERVAS (cerrada y con un acordeón abierto), la ficha de una parada, Logros, la hoja del pase y el primer paso de Crear el viaje.
- Y una página `docs/dias/MARCA_COMPARA.html` con cada captura al lado de su pantalla de Marca JUTRIP (cuando la haya), para que Eric las compare.

## 10. El informe (docs/dias/INFORME_TANDA10E.md)
En español sencillo: qué has cambiado en cada pantalla, la lista de los frambuesas que se quedan y por qué, dónde Design ponía texto pequeño en `#A67C52` y lo has pasado a `#6F4E37`, y lo que no has podido dejar como Design y por qué.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
