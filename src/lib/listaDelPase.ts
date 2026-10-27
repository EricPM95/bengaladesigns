// GENERADO por scripts/destino/generarPelicula.mjs desde la lista del final de «Pase Pelicula» (Design) — no editar a mano.
// UNA sola lista para el final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY: los mismos nombres, las mismas líneas, los mismos iconos y el mismo orden.
export interface NodoIcono {
  t: string
  a?: Record<string, string>
  c?: (NodoIcono | string)[]
}
export interface ItemDeLista {
  titulo: string
  linea: string
  /** El dibujo (un svg de Design); null si la fila no lleva icono. */
  icono: NodoIcono | null
}
export interface GrupoDeLista {
  titulo: string
  items: ItemDeLista[]
}
export const LISTA_DEL_PASE: GrupoDeLista[] = [
 {
  "titulo": "ANTES DEL VIAJE",
  "items": [
   {
    "titulo": "Tu vuelo ordena los días",
    "linea": "Llegas tarde o te vas pronto: el día se ajusta solo.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Adaptamos tu ruta a tu alojamiento",
    "linea": "El primer día, y como mucho el último, según tu zona.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M3 11l9-7 9 7v9H3zM9 20v-6h6v6"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Tus reservas, a la vista",
    "linea": "Lo que ya tienes reservado y lo que te falta.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM10 6v12"
       },
       "c": []
      }
     ]
    }
   }
  ]
 },
 {
  "titulo": "DURANTE EL VIAJE · TU COMPAÑERO",
  "items": [
   {
    "titulo": "Tu siguiente parada",
    "linea": "Cuántos minutos te quedan y cómo llegar.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M5 12h14M13 6l6 6-6 6"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Marca lo que ves",
    "linea": "Cada sitio visto suma en tus logros.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M5 12.5l4.5 4.5L19 7"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Cambia planes en un toque",
    "linea": "Mueve una parada, cámbiala o déjala para otro día.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Avisos que importan",
    "linea": "Si algo cierra, la hora de tus entradas, si va a llover.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "«¿Qué hago ahora?»",
    "linea": "Tócalo y te propone lo mejor para ese momento.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 17v.01M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "La historia de cada sitio",
    "linea": "Como una audioguía, en tu móvil.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Baños, fuentes y dónde comer",
    "linea": "Los más cercanos, en el mapa.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M9 3a2 2 0 1 0 0 .01M15 3a2 2 0 1 0 0 .01M7 8h4l-1 6v7M13 8h4l-1 6v7"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "La puesta de sol y lo de mañana",
    "linea": "A qué hora cae el sol y qué te espera mañana.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M3 18h18M7 18a5 5 0 0 1 10 0M12 6v3M5 10l2 2M19 10l-2 2"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "«Estoy aquí»",
    "linea": "¿Estás en un sitio que no tocaba hoy? Márcalo igual.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v4M12 18v4M2 12h4M18 12h4"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Modo «a mi aire»",
    "linea": "Sin horario: ves las paradas y vas a tu ritmo.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9l-2 5-5 1 2-5z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Funciona sin internet",
    "linea": "También en el Vaticano o en las catacumbas.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19v.01M3 3l18 18"
       },
       "c": []
      }
     ]
    }
   }
  ]
 },
 {
  "titulo": "JUEGA MIENTRAS VIAJAS",
  "items": [
   {
    "titulo": "Secretos escondidos",
    "linea": "Emblemas que solo encuentras allí.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Colecciones",
    "linea": "Cada sitio que ves completa una colección.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 3v18M4 7.5l8 4.5 8-4.5"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Sellos y medallas",
    "linea": "Los ganas en cada destino.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5L7 21l5-3 5 3-1.5-7.5"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Logros de viajero",
    "linea": "Las maravillas del mundo y muchos más.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M3 20h18M5 20V10M9 20V10M15 20V10M19 20V10M3 9l9-5 9 5z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Tu pasaporte y tu mapa",
    "linea": "Todos tus países, pintados.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M6 3h12v18H6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Experiencia y niveles",
    "linea": "Sube de nivel y entra en el sorteo de cada año.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "El reto del día",
    "linea": "Cada mañana, uno nuevo.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
       },
       "c": []
      }
     ]
    }
   }
  ]
 },
 {
  "titulo": "TUS RECUERDOS",
  "items": [
   {
    "titulo": "Tus fotos de cada sitio",
    "linea": "Guardadas en cada parada de tu viaje.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "El resumen del día y del viaje",
    "linea": "Listo para compartir.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M6 3h9l4 4v14H6zM9 12h6M9 16h4"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Mi vitrina",
    "linea": "Tus mejores logros, para enseñarlos.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M5 3h14v18H5zM5 9h14M5 15h14"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "¡Y mucho más!",
    "linea": "",
    "icono": null
   }
  ]
 },
 {
  "titulo": "CON LOS TUYOS",
  "items": [
   {
    "titulo": "En pareja o en grupo",
    "linea": "Cada uno en su móvil, y más barato por persona.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8"
       },
       "c": []
      }
     ]
    }
   },
   {
    "titulo": "Invita a un amigo",
    "linea": "Y gana experiencia.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M16 11h6"
       },
       "c": []
      }
     ]
    }
   }
  ]
 },
 {
  "titulo": "Y DESPUÉS",
  "items": [
   {
    "titulo": "Si vuelves, tu pase sigue",
    "linea": "No caduca: tus logros y tu compañero te esperan.",
    "icono": {
     "t": "svg",
     "a": {
      "width": "22",
      "height": "22",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "#4A3510",
      "strokeWidth": "1.7",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "style": "flex:none"
     },
     "c": [
      {
       "t": "path",
       "a": {
        "d": "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"
       },
       "c": []
      }
     ]
    }
   }
  ]
 }
]
