# Estado de la tanda 10N8

**Última actualización: 28/10/26, 7:58**
(Se actualiza cada ~30 min mientras Claude está activo y se sube a la rama `estado` de GitHub. Si esta hora es de hace más de 40-50 minutos, Claude no está trabajando.)

## Qué está haciendo
Cuatro agentes trabajando en paralelo con UN solo servidor (API 8787, Vite 5173) y una cola de un solo Chrome a la vez, todo a prioridad baja. N1: Free Tour como una parada más, hoja de elegir día, confirmaciones, parada con entrada, Cambiar parada. N2: perfil, Ajustes, unirse, avisos que no llegan, sonido, botones flotantes, pastilla del pase. N3: película del pase, EXPLORAR, aviso del pase, ficha de un sitio, botones sobre el mapa. N4: RESERVAS, vuelos, gastos, cuentas, moneda por precio, comprar la entrada a la misma hora. Ningún agente ha entregado todavía.

## Qué falta
Integrar, typecheck, docs/REGLAS_DE_LA_APP.md, pruebas y batería (sin wrappers), triaje, repaso, informe, commit y push a main, cerrar procesos y apagar el PC.

## Procesos abiertos ahora mismo
- node: 10
- esbuild: 1
- Chrome de prueba (con remote-debugging-port): 2
