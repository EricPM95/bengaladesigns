Hola. TANDA 10J, pequeña: EMPEZAR DE CERO. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10J.md e inclúyelo en tu commit.

## 1. El botón
- En /?admin=logros → Mis pruebas, al lado de «Verme como viajero sin pase», un botón [Empezar de cero], solo para los emails de LOGROS_ADMIN_EMAILS y decidido por el servidor.
- Al tocarlo: «Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases. La cuenta se queda. ¿Seguro?» [Sí, empezar de cero] [Cancelar].
- Deja la cuenta como recién creada, como un viajero que entra por primera vez:
  - los viajes, con sus reservas, entradas, vuelos, alojamientos y fotos;
  - los logros, los sellos, las colecciones, los emblemas, la experiencia, el nivel y el marco;
  - el día de prueba, otra vez sin usar;
  - los pases comprados (solo los de mi cuenta, y sin tocar nada de Stripe);
  - que ya vi la película del pase;
  - y lo que guarda el móvil (lo que no está en el servidor).
- Al acabar, cierra la sesión y vuelve a la pantalla de inicio, como la primera vez que se abre la app.
- Que nunca pueda borrar nada de otra cuenta.

## 2. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva: con una cuenta de prueba con viajes, logros, pase y día de prueba usado, [Empezar de cero] lo deja todo vacío; otra cuenta queda igual; un email que no es de LOGROS_ADMIN_EMAILS no ve el botón ni puede usarlo.

## 3. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10J», con la lista de todo lo que borra.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
