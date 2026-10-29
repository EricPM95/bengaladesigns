// GENERADO por scripts/destino/generarPaseLista.mjs desde docs/diseno/proyecto/Piezas/Pase Lista.dc.html — no editar a mano.
// Los dibujos y los textos son los de Design, tal cual (donde dice «Roma» / «Pase Roma» se pone el destino al pintar).
export interface PuntoDeLista { icono: string; titulo: string; linea: string }
export interface SeccionDeLista { titulo: string; filas: PuntoDeLista[] }
export const SECCIONES_DE_LA_LISTA: SeccionDeLista[] = [
 {
  "titulo": "I · ANTES DEL VIAJE",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"translate(8 16) scale(.82)\" d=\"M2 14l20-8V-4a3 3 0 0 1 6 0V6l20 8v4L28 14v10l4 3v3l-7-2-7 2v-3l4-3V14L2 18z\"/><circle cx=\"46\" cy=\"44\" r=\"13\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M46 37v7l5 3\"/><circle cx=\"46\" cy=\"44\" r=\"13\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.4\" stroke-dasharray=\"1 3.5\"/></svg>",
    "titulo": "Tu ruta se adapta a tu vuelo",
    "linea": "Pon tu vuelo o tu tren y el primer y el último día se ajustan a tus horas."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"8\" y=\"12\" width=\"48\" height=\"42\" rx=\"7\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8 24h48M20 8v8M44 8v8\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 36h22M33 31l5 5-5 5\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M48 46H26M31 41l-5 5 5 5\" transform=\"translate(0 -2)\"/></svg>",
    "titulo": "Los días, en el mejor orden",
    "linea": "Ordenamos tus días según cuándo llegas y cuándo te vas."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 50V22M6 42h40a8 8 0 0 1 8 8M6 50h52\"/><rect x=\"10\" y=\"30\" width=\"16\" height=\"12\" rx=\"5\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M26 42v-8h18a8 8 0 0 1 8 8z\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M48 24c-6-6-9-9-9-13a9 9 0 0 1 18 0c0 4-3 7-9 13z\" transform=\"translate(-1 -3) scale(.9)\"/><circle cx=\"47\" cy=\"12\" r=\"3\" fill=\"#FFFDF8\" stroke=\"#B58A2E\" stroke-width=\"1.5\"/></svg>",
    "titulo": "Tu ruta empieza donde duermes",
    "linea": "Dinos tu zona y tu primer y último día salen desde tu alojamiento, con cómo llegar."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"10\" y=\"6\" width=\"44\" height=\"52\" rx=\"7\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 19l4 4 7-8\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M34 20h14\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 32l4 4 7-8\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M34 33h14\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 45h6\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M34 46h14\"/><circle cx=\"21\" cy=\"45\" r=\"3.5\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\"/></svg>",
    "titulo": "Todas tus reservas, de un vistazo",
    "linea": "Lo que llevas hecho y lo que te falta."
   }
  ]
 },
 {
  "titulo": "II · DURANTE EL VIAJE: HOY",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"16\" y=\"4\" width=\"32\" height=\"56\" rx=\"7\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M27 9h10\"/><circle cx=\"24\" cy=\"48\" r=\"3\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"1.6\"/><path d=\"M24 44c0-12 16-6 16-18\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"2.2\" stroke-dasharray=\"1 4.5\" stroke-linecap=\"round\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M33 26l7-8 7 8z\"/></svg>",
    "titulo": "HOY, todos los días de tu viaje",
    "linea": "Tu día paso a paso: la siguiente parada en grande, los minutos andando y cómo llegar."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M10 38V30a22 22 0 0 1 44 0v8\"/><rect x=\"8\" y=\"34\" width=\"12\" height=\"20\" rx=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"44\" y=\"34\" width=\"12\" height=\"20\" rx=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M26 22q6-6 12 0M24 14q8-8 16 0\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg>",
    "titulo": "Todas las historias, sin límite",
    "linea": "Escucha la historia de cada sitio, como una audioguía en tu móvil."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M32 62C18 44 10 36 10 26a22 22 0 0 1 44 0c0 10-8 18-22 36z\" transform=\"translate(0 -4)\"/><circle cx=\"32\" cy=\"22\" r=\"15\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M23 26a3 3 0 1 0 0-.01M26 31v6M20 31v6\" opacity=\"0\"/><circle cx=\"21\" cy=\"21\" r=\"2\" fill=\"#1C2230\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19 24h4l-1 6v3M24 24h-4\" transform=\"translate(0 -1) scale(.9)\"/><path d=\"M32 15c3 4 5 5 5 8a5 5 0 0 1-10 0c0-3 2-4 5-8z\" fill=\"#BFE0F2\" stroke=\"#2F6FA6\" stroke-width=\"1.6\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M45 15v10M43 15v4a2 2 0 0 0 4 0v-4M45 25v4\" transform=\"translate(-1 -1)\"/></svg>",
    "titulo": "Cerca de ti",
    "linea": "Los baños, las fuentes de agua y dónde comer más cercanos, estés donde estés."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 36a10 10 0 0 1 2-19 14 14 0 0 1 27 2 9 9 0 0 1-1 17z\" transform=\"translate(0 -2)\"/><path d=\"M20 42l-3 8M30 42l-3 8M40 42l-3 8\" fill=\"none\" stroke=\"#2F6FA6\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M46 40a12 12 0 0 1 12 12H34a12 12 0 0 1 12-12zM46 52v8a3 3 0 0 0 6 0\" transform=\"translate(0 -4) scale(.85) translate(8 6)\"/></svg>",
    "titulo": "Los avisos del día",
    "linea": "Si llueve, te damos una alternativa."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 16h52v10a6 6 0 0 0 0 12v10H6V38a6 6 0 0 0 0-12z\" transform=\"translate(0 2)\"/><path d=\"M42 18v28\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-dasharray=\"3 4\"/><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"translate(12 22) scale(.5)\" d=\"M2 14l20-8V-4a3 3 0 0 1 6 0V6l20 8v4L28 14v10l4 3v3l-7-2-7 2v-3l4-3V14L2 18z\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 40h20M48 26h6M48 32h6\"/></svg>",
    "titulo": "Tu billete, siempre a mano",
    "linea": "El de llegada y el de vuelta, en el día que toca."
   }
  ]
 },
 {
  "titulo": "III · TUS RECUERDOS",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"4\" y=\"22\" width=\"40\" height=\"30\" rx=\"7\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 22l3-6h14l3 6\"/><circle cx=\"24\" cy=\"37\" r=\"9\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"24\" cy=\"37\" r=\"3.5\" fill=\"#FFFDF8\" stroke=\"#B58A2E\" stroke-width=\"1.4\"/><rect x=\"42\" y=\"10\" width=\"18\" height=\"22\" rx=\"3\" transform=\"rotate(10 51 21)\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"45\" y=\"13\" width=\"12\" height=\"11\" rx=\"1\" transform=\"rotate(10 51 21)\" fill=\"#F3E3B2\"/><rect x=\"40\" y=\"30\" width=\"18\" height=\"22\" rx=\"3\" transform=\"rotate(-8 49 41)\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"43\" y=\"33\" width=\"12\" height=\"11\" rx=\"1\" transform=\"rotate(-8 49 41)\" fill=\"#CFE5D2\"/></svg>",
    "titulo": "Todas las fotos que quieras",
    "linea": "En cada sitio y en tu álbum, sin límite."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 42a10 10 0 0 1 1-20 15 15 0 0 1 29 3 9 9 0 0 1 0 17z\" transform=\"translate(0 -4)\"/><rect x=\"22\" y=\"22\" width=\"22\" height=\"18\" rx=\"3\" fill=\"#F3E3B2\" stroke=\"#B58A2E\" stroke-width=\"1.8\"/><path d=\"M24 36l6-7 5 5 3-3 5 5\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M32 50v10M27 55l5 5 5-5\"/></svg>",
    "titulo": "Tus fotos, guardadas en la nube",
    "linea": "Y descárgalas a tu galería cuando quieras."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"6\" y=\"12\" width=\"52\" height=\"40\" rx=\"5\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"11\" y=\"17\" width=\"26\" height=\"30\" rx=\"2\" fill=\"#F3E3B2\" stroke=\"#B58A2E\" stroke-width=\"1.6\"/><path d=\"M13 42l8-10 6 6 4-5 6 9z\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><circle cx=\"31\" cy=\"26\" r=\"3\" fill=\"#FFFDF8\" stroke=\"#B58A2E\" stroke-width=\"1.4\"/><rect x=\"45\" y=\"17\" width=\"9\" height=\"11\" rx=\"1.5\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-dasharray=\"2 2\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M41 36h13M41 42h10\"/></svg>",
    "titulo": "El resumen de cada día y de tu viaje",
    "linea": "Con una imagen bonita para compartir."
   }
  ]
 },
 {
  "titulo": "IV · TUS LOGROS",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M24 8h16v14a8 8 0 0 0 8 10H16a8 8 0 0 0 8-10z\"/><rect x=\"12\" y=\"34\" width=\"40\" height=\"8\" rx=\"3\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"32\" cy=\"54\" r=\"0\"/><path d=\"M10 56h44\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"52\" r=\"0\"/><ellipse cx=\"32\" cy=\"50\" rx=\"19\" ry=\"5\" fill=\"none\" stroke=\"#8E2A3A\" stroke-width=\"1.8\" opacity=\".85\" stroke-dasharray=\"6 2.5\"/></svg>",
    "titulo": "Los sellos de Roma y del Vaticano",
    "linea": "Consigue el sello de cada sitio que visitas."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4 12q14-5 28 2v42q-14-7-28-2z\"/><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M60 12q-14-5-28 2v42q14-7 28-2z\"/><circle cx=\"18\" cy=\"30\" r=\"8\" fill=\"none\" stroke=\"#8E2A3A\" stroke-width=\"1.8\" opacity=\".85\"/><path d=\"M14 30h8M18 26v8\" stroke=\"#8E2A3A\" stroke-width=\"1.4\" opacity=\".8\"/><rect x=\"11\" y=\"42\" width=\"14\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"#2F6FA6\" stroke-width=\"1.8\" transform=\"rotate(-6 18 46)\"/><path d=\"M40 22h14M40 28h10\" stroke=\"#1C2230\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"47\" cy=\"42\" rx=\"8\" ry=\"6\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\" transform=\"rotate(8 47 42)\"/></svg>",
    "titulo": "Tu pasaporte de viajero",
    "linea": "Se va llenando de sellos con cada viaje."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"26\" fill=\"#E9F0F6\" stroke=\"#1C2230\" stroke-width=\"2.2\"/><path d=\"M12 24c4-4 9-6 13-4l3 4-4 5-8 1zM30 16l9-3 7 4-4 6-8 1zM34 34l9-1 6 7-5 10-8-3z M18 38l7 1 3 7-6 6z\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M6 32h52M32 6c10 12 10 40 0 52M32 6c-10 12-10 40 0 52\" fill=\"none\" stroke=\"#1C2230\" stroke-width=\"1.1\" opacity=\".35\"/><circle cx=\"32\" cy=\"32\" r=\"26\" fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\"/></svg>",
    "titulo": "Tu mapa del mundo",
    "linea": "Píntalo con los países y destinos que visitas."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8 28a24 18 0 0 1 48 0v26H8z\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8 38h48\"/><rect x=\"26\" y=\"34\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M32 16l3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L23 23l6-1z\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"1.5\" stroke-linejoin=\"round\" transform=\"translate(0 -6)\"/><path d=\"M32 4v4M46 10l-3 3M18 10l3 3\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>",
    "titulo": "11 colecciones y 12 emblemas secretos",
    "linea": "¿Los encontrarás todos?"
   }
  ]
 },
 {
  "titulo": "V · DESPUÉS DEL VIAJE",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"8\" y=\"20\" width=\"48\" height=\"36\" rx=\"8\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M24 20v-5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5M8 36h48\"/><path d=\"M32 52c-8-6-12-9-12-13a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 4-4 7-12 13z\" fill=\"#E7A0AA\" stroke=\"#B3394F\" stroke-width=\"1.8\" stroke-linejoin=\"round\" transform=\"translate(0 -8) scale(.95) translate(1.7 1)\"/></svg>",
    "titulo": "Vuelve a Roma cuando quieras",
    "linea": "Tus logros, HOY y las historias siguen contigo."
   },
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path d=\"M8 52C22 52 18 12 32 12s10 40 24 40\" fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-dasharray=\"1 5\" stroke-linecap=\"round\"/><path d=\"M8 12c14 0 10 40 24 40s10-40 24-40\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><circle cx=\"8\" cy=\"52\" r=\"5\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"8\" cy=\"12\" r=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"56\" cy=\"52\" r=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"56\" cy=\"12\" r=\"5\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"32\" cy=\"32\" r=\"5\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2\"/></svg>",
    "titulo": "Tu segundo viaje, a tu manera",
    "linea": "La ruta de siempre, con lo que ya viste marcado, o empieza desde cero."
   }
  ]
 },
 {
  "titulo": "VI · PARA COMPARTIR",
  "filas": [
   {
    "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><rect x=\"4\" y=\"26\" width=\"24\" height=\"30\" rx=\"6\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 26v-4h8v4M4 40h24\"/><rect x=\"22\" y=\"14\" width=\"22\" height=\"30\" rx=\"6\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"translate(0 4)\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M29 18v-4h8v4M22 32h22\" transform=\"translate(0 4)\"/><rect x=\"38\" y=\"24\" width=\"22\" height=\"32\" rx=\"6\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M45 24v-4h8v4M38 38h22\"/><circle cx=\"49\" cy=\"46\" r=\"3\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"1.4\"/></svg>",
    "titulo": "Viaja en pareja o en grupo",
    "linea": "Un pase para todos: tú pagas y tus acompañantes entran sin pagar."
   }
  ]
 }
]
export const TARJETAS_DE_HOY: PuntoDeLista[] = [
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M32 62C18 44 10 36 10 26a22 22 0 0 1 44 0c0 10-8 18-22 36z\" transform=\"translate(0 -4)\"/><circle cx=\"32\" cy=\"21\" r=\"8\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 54c8 4 14 0 20 4\" fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2\" stroke-dasharray=\"1 5\" stroke-linecap=\"round\"/></svg>",
  "titulo": "Tu siguiente parada, en grande",
  "linea": "Con los minutos andando y cómo llegar."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M10 38V30a22 22 0 0 1 44 0v8\"/><rect x=\"8\" y=\"34\" width=\"12\" height=\"20\" rx=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"44\" y=\"34\" width=\"12\" height=\"20\" rx=\"5\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M26 22q6-6 12 0M24 14q8-8 16 0\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg>",
  "titulo": "Escucha la historia de cada sitio",
  "linea": "Como una audioguía, en tu móvil."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 54h36M10 54V30M18 54V30M26 54V30M34 54V30M6 30h36L24 14z\" transform=\"translate(0 0)\"/><circle cx=\"44\" cy=\"34\" r=\"12\" fill=\"rgba(243,227,178,.55)\" stroke=\"#1C2230\" stroke-width=\"2.4\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M53 43l9 11\" stroke-width=\"4\"/><path d=\"M39 33a6 6 0 0 1 5-4\" fill=\"none\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>",
  "titulo": "Sobre este lugar",
  "linea": "Lo que tienes que saber, justo cuando estás allí."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M32 62C18 44 10 36 10 26a22 22 0 0 1 44 0c0 10-8 18-22 36z\" transform=\"translate(0 -4)\"/><circle cx=\"32\" cy=\"22\" r=\"15\" fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M23 26a3 3 0 1 0 0-.01M26 31v6M20 31v6\" opacity=\"0\"/><circle cx=\"21\" cy=\"21\" r=\"2\" fill=\"#1C2230\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19 24h4l-1 6v3M24 24h-4\" transform=\"translate(0 -1) scale(.9)\"/><path d=\"M32 15c3 4 5 5 5 8a5 5 0 0 1-10 0c0-3 2-4 5-8z\" fill=\"#BFE0F2\" stroke=\"#2F6FA6\" stroke-width=\"1.6\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M45 15v10M43 15v4a2 2 0 0 0 4 0v-4M45 25v4\" transform=\"translate(-1 -1)\"/></svg>",
  "titulo": "Cerca de ti",
  "linea": "Baños, fuentes de agua y dónde comer, los más cercanos."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><circle cx=\"20\" cy=\"20\" r=\"13\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20 13v14M13 20h14\" stroke=\"#1C2230\" stroke-width=\"3\" stroke-linecap=\"round\"/><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M24 56h36M28 56V40M36 56V40M44 56V40M52 56V40M24 40h36L42 26z\"/></svg>",
  "titulo": "Más visitas, si te sobra tiempo",
  "linea": "Sitios cerca de donde estás para seguir."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 36a10 10 0 0 1 2-19 14 14 0 0 1 27 2 9 9 0 0 1-1 17z\" transform=\"translate(0 -2)\"/><path d=\"M20 42l-3 8M30 42l-3 8M40 42l-3 8\" fill=\"none\" stroke=\"#2F6FA6\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><path fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M46 40a12 12 0 0 1 12 12H34a12 12 0 0 1 12-12zM46 52v8a3 3 0 0 0 6 0\" transform=\"translate(0 -4) scale(.85) translate(8 6)\"/></svg>",
  "titulo": "Los avisos del día",
  "linea": "Si llueve, te damos una alternativa."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 16h52v10a6 6 0 0 0 0 12v10H6V38a6 6 0 0 0 0-12z\" transform=\"translate(0 2)\"/><path d=\"M42 18v28\" stroke=\"#B58A2E\" stroke-width=\"1.8\" stroke-dasharray=\"3 4\"/><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"translate(12 22) scale(.5)\" d=\"M2 14l20-8V-4a3 3 0 0 1 6 0V6l20 8v4L28 14v10l4 3v3l-7-2-7 2v-3l4-3V14L2 18z\"/><path fill=\"none\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 40h20M48 26h6M48 32h6\"/></svg>",
  "titulo": "Tu billete, el día que toca",
  "linea": "El de llegada y el de vuelta."
 },
 {
  "icono": "<svg width=\"42\" height=\"42\" viewBox=\"0 0 64 64\"><path fill=\"#FFFDF8\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M24 8h16v14a8 8 0 0 0 8 10H16a8 8 0 0 0 8-10z\"/><rect x=\"12\" y=\"34\" width=\"40\" height=\"8\" rx=\"3\" fill=\"#E9C77A\" stroke=\"#B58A2E\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"32\" cy=\"54\" r=\"0\"/><path d=\"M10 56h44\" stroke=\"#1C2230\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"52\" r=\"0\"/><ellipse cx=\"32\" cy=\"50\" rx=\"19\" ry=\"5\" fill=\"none\" stroke=\"#8E2A3A\" stroke-width=\"1.8\" opacity=\".85\" stroke-dasharray=\"6 2.5\"/></svg>",
  "titulo": "Tus logros, mientras viajas",
  "linea": "Sellos, colecciones y emblemas secretos."
 }
]
export const CABECERA_DE_HOY = "Cuando estés en Roma, HOY te lleva de la mano, parada a parada."
export const CAJA_PRUEBA_SIN_USAR = {"titulo":"Tienes un día de prueba con HOY completo, gratis.","linea":"Lo usamos el día que llegas, si es antes de las 10:00; si no, el día siguiente."}
export const CAJA_PRUEBA_USADA = {"titulo":"Ya has usado tu día de prueba.","linea":"Con el Pase Roma, tienes HOY todos los días de tu viaje."}
