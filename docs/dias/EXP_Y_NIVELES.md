# EXP, niveles, invitaciones y sorteo (Eric y Claude, 18-oct-2026)

Decidido por Eric. En la versión 1 solo cuentan los logros con la etiqueta VERSIÓN 1 del Dashboard de Design. Quedan para más adelante: La vuelta al mundo, Continentes, Los pequeños gigantes, Al otro lado del ecuador y Todos los secretos de {ciudad}. Los que estén apagados no dan EXP.

- **Escalones nuevos del Dashboard:** siguen la misma escalera.
  - Destinos 25 y 30: 350 y 450.
  - Patrimonios 1, 5, 10, 15 y 25: 25, 75, 175, 250 y 350.
  - Viajes 1, 5, 10, 15, 20, 25 y 30: 25, 125, 250, 350, 450, 600 y 750.
- **Las cuatro estaciones y Los 12 meses:** el avance se ve, pero la EXP (500 y 1.000) se da al completarlos.
- **Los puntos para la tienda:** más adelante. Cuando abra la tienda, cada viajero recibe 1 punto por cada EXP que tenga.

## La idea
- Una sola EXP. Nunca baja.
- Al subir de nivel, la barra vuelve a 0.
- El nivel abre cosas de la tienda, más exclusivas cuanto más alto.
- El perfil es para presumir toda la vida, como en un videojuego.

## Los niveles
- **50 niveles en 10 rangos de 5:**
  - Soñador 1–5;
  - Explorador 6–10;
  - Viajero 11–15;
  - Trotamundos 16–20;
  - Aventurero 21–25;
  - Nómada 26–30;
  - Cartógrafo 31–35;
  - Embajador 36–40;
  - Navegante 41–45;
  - Leyenda 46–50.

  Los nombres son una propuesta. Se puede guiñar a Phileas Fogg o a «La vuelta al mundo», pero nunca usar «Willy Fog», que tiene dueño.
- **Cada rango tiene su marco**, y cada nivel le añade una estrella (de 1 a 5) y lleva su número.
- **Después del 50:** Leyenda ★1, ★2…, una estrella cada 3.000 EXP, sin final.
- **Lo que cuesta cada nivel:** 500, 700, 900… (200 más cada vez) hasta el nivel 11. Desde ahí, todos piden 2.500.
- **Así sale:**
  - un viaje normal a Roma, nivel 3;
  - Roma al 100 %, nivel 4;
  - 10 viajes, nivel 10;
  - 20 viajes, nivel 15;
  - 40 viajes, nivel 26;
  - unos 85 viajes, nivel 50.

## Lo que da EXP
| Lo que consigues | EXP |
|---|---|
| Parada vista (con ubicación o foto) | 5 (máx. 50 al día) |
| Pedazo nuevo | 5 |
| Colección completa (premio extra, aparte de sus pedazos) | 10 por pedazo de la colección |
| Emblema Oculto | 25 |
| Maravilla del mundo | 150 |
| Sello de ciudad: bronce / plata / oro / diamante | 50 / 75 / 125 / 200 |
| Sello del Vaticano: plata / oro / diamante | 50 / 75 / 125 |
| País nuevo | 50 |
| Destino nuevo | 75 |
| Continente nuevo (para más adelante) | 150 |
| Patrimonio nuevo | 40 |
| Viaje acabado (5 paradas vistas o más) | 100 |
| Amigo invitado que acaba su viaje con la app | 100 (máx. 10 al año) |
| Viaje de antes de la app | 0 |

Roma al 100 %: unos 2.870 EXP en la versión 1 (sin el continente ni «Todos los secretos»), nivel 4.

## Los logros de viajero
- **Escalera de los escalones:** 25, 50, 75, 125, 175, 250, 350, 450, 600.
- **Los que tienen escalones:**
  - Países (1, 3, 5, 8, 10, 15, 20, 25, 30): toda la escalera;
  - Destinos (1, 3, 5, 10, 15, 20): de 25 a 250;
  - Capitales (5, 10, 15, 25): 75, 125, 175, 250;
  - Maravillas 1 a 6: de 25 a 250; Las siete maravillas, 1.000;
  - Patrimonios (1, 10, 15): 25, 175, 250;
  - Viajes (1, 5, 10): 25, 125, 250;
  - Con quién viajas (1, 3, 5, 10): 25, 75, 125, 250;
  - Conocedor (25, 50): 175, 350;
  - Cazador de emblemas y Coleccionista (5, 10, 15): 75, 175, 250.
- **Los que no tienen escalones:**
  - 25: Escapada;
  - 50: Dos países en un día;
  - 75: Viajero nacional, Día perfecto, El fotógrafo, Nunca es la última vez;
  - 100: Gran viaje, Navidad fuera de casa, Nochevieja fuera de casa, De sol a sol, {Ciudad} al completo, Todos los secretos de {ciudad};
  - 150: Tres viajes en un año, Al otro lado del ecuador, Imparable, Diamante a la primera;
  - 250: Viaje perfecto, Alondra, Búho, Tres ciudades de oro;
  - 500: Las cuatro estaciones, Los pequeños gigantes, Tres ciudades de diamante;
  - 750: Un destino, cuatro estaciones;
  - 1.000: Los 12 meses.
- **Los exclusivos:** Fundador, Pionero y Probador, 100 cada uno; {Ciudad} {año}, 50. Dan poco a propósito, por el sorteo.
- «Nuevo continente» es lo mismo que «Continente nuevo»: da EXP una sola vez.

## Contra las trampas
- Solo da EXP lo comprobado (ubicación o foto).
- Lo cuenta el servidor.
- La EXP no se vende nunca.
- Sin tabla de clasificación.
- La EXP sale de sumar lo ya conseguido (`logro_hechos`). Por eso la tabla se puede afinar más adelante y recalcular, pero nunca bajando el nivel de nadie.
- **Por decidir:** si un logro se añade más tarde (por ejemplo, Continente), ¿da su EXP también a quien ya lo cumplía antes?

## El sorteo (cada año)
- **Para entrar:** nivel 3 o más y haber acabado al menos un viaje con la app ese año.
- **Antes de lanzarlo:** el gestor (las bases legales, la retención del IRPF en premios de más de 300 €, y si pedir el pase está permitido) y las normas de Apple y Google (el sorteo lo organiza la app, con normas oficiales, y Apple no lo patrocina).

## Para Design
- Los 10 marcos de rango, con la estrella de cada nivel.
- La barra de nivel en el Perfil.
- La pantalla de subir de nivel y la de cambiar de rango.
- La tienda (las cosas por rango).
- La página del sorteo.
- Dónde se ve la EXP ganada: en el resumen del día y en el del viaje.
