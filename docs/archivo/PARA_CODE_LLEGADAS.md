# Llegadas y vueltas de Roma: repaso de LLEGADAS_ROMA.html

He revisado todos los datos. Los precios principales están bien, pero hay textos genéricos que no cuadran con cada llegada.

Comprobado y correcto:
- Leonardo Express: 14 €, 32 min; primer tren desde Termini a las 4:50.
- Taxi con tarifa fija: 55 € a Fiumicino y 40 € a Ciampino, dentro de las murallas (vigente desde julio de 2024).
- FL1: 8 €.
- Ciampino Airlink: 2,70 € (trenitalia.com).
- BIT: 1,50 €, 100 min.
- Lanzadera del puerto de Civitavecchia: gratis. Portlink: 6 €.

Commit por parte y push al final, si las pruebas salen bien.

## 1. El aviso del DNI caduca

«Ahora mismo los dos países han vuelto a controlar sus fronteras aéreas por unas semanas…»: Italia lo prorrogó el 15 de septiembre por 15 días más (ANSA), así que acaba sobre el 30 de septiembre. Tal como está, dentro de unos días será falso.

- Parte fija, que es verdad siempre: «Lleva el DNI o el pasaporte: la aerolínea te lo pide para embarcar».
- La parte de los controles, con fecha de fin (`hasta`) y fuente. Que deje de salir sola cuando pase esa fecha, y `verificar` para renovarla si se prorroga.
- A INVARIANTES: ningún tip dice «ahora mismo» sin fecha de fin.

## 2. Tiburtina (tren y autobús) sale con los textos de Termini

- **Resumen de la llegada a Tiburtina:** dice «Casi todos los trenes de larga distancia llegan a Roma Termini». Tiene que hablar de Tiburtina.
- **«Del centro a Roma Tiburtina» y «Del centro a Autostazione Tiburtina»:** dice «Metro B… a Termini», al revés. Es el metro B hasta Tiburtina FS.
- **Consigna y tips:** en Tiburtina salen la consigna de Termini, «Mira el andén en la pantalla, en Termini» y «Tu última hora» junto a Termini (Santa María la Mayor, Mercato Centrale). Cada punto de llegada tiene que llevar lo suyo; si no hay dato propio, que no salga.
- Revisa lo mismo en todos los puntos: ningún texto de un punto aparece en otro si no es verdad allí.

## 3. Civitavecchia: falta el precio del tren

El regional de Civitavecchia a Roma es de tarifa fija: 4,60 € según bluekeys.it. Compruébalo en trenitalia.com y pon el precio en lugar de «compruébalo en trenitalia.com», con su fuente.

## 4. Datos que conviene volver a mirar en la web oficial

- **Leonardo Express:** el último tren desde Fiumicino (los datos dicen 23:23 y otra fuente 23:27).
- **KiPoint Termini:** el horario (7:00-21:00) y el «desde 6 €», en kipoint.it.
- **Terravision y Rome Airport Bus:** los precios «desde» de Fiumicino y de Ciampino.
- **Bus ATRAL a Anagnina:** 1,20 €.
- **ZTL de Trastevere:** «En agosto, sin ZTL de noche», en romamobilita.it.

Si algo no coincide, corrígelo con su fuente y fecha. Si no se puede comprobar, quita el precio antes que dejar uno dudoso.

## 5. Pendiente, como ya sabes

El traslado privado de Fiumicino (45 €, GetYourGuide) sigue sin enlace de afiliado. De momento que no salga a la venta si no hay enlace.

**Informe corto:** lo cambiado, con su antes y después, y las fuentes.
