// (LG1) Marca los sitios de atardecer de Roma y Lanzarote (los pidió Eric, 4-nov) y los copia, con sus coordenadas, a src/data/sitiosDeAtardecer.json (pequeño: lo usa HOY, H13).
//   node scripts/destino/generarSitiosDeAtardecer.mjs
// Los ids son los de data/pipeline_v2/<destino>.json; `corto` es el nombre como se dice en la frase («Hoy ves el atardecer en El Golfo…»); `alias`, trozos del nombre de la parada (sin tildes, en minúsculas) para reconocerla en el día.
import fs from 'node:fs'
const LISTA = {
  roma: {
    mar: false,
    sitios: [
      { id: 'terraza_del_pincio', corto: 'el Pincio', alias: ['pincio'] },
      { id: 'mirador_del_janiculo', corto: 'el Janículo', alias: ['janiculo', 'gianicolo'] },
      { id: 'mirador_de_san_pietro_in_montorio', corto: 'San Pietro in Montorio', alias: ['san pietro in montorio'] },
      { id: 'castillo_de_santangelo', corto: 'el Castillo de Sant’Angelo', alias: ['castillo de sant', 'castel sant'] },
      { id: 'puente_santangelo', corto: 'el Puente Sant’Angelo', alias: ['puente sant', 'ponte sant'] },
      { id: 'ponte_sisto', corto: 'el Ponte Sisto', alias: ['ponte sisto'] },
    ],
  },
  lanzarote: {
    mar: true,
    sitios: [
      { id: 'el_golfo_y_el_charco_de_los_clicos', corto: 'El Golfo', alias: ['el golfo'] },
      { id: 'playa_blanca_y_el_faro_de_pechiguera', corto: 'el Faro de Pechiguera', alias: ['pechiguera', 'playa blanca'] },
      { id: 'caleta_de_famara_y_playa_de_famara', corto: 'Famara', alias: ['caleta de famara', 'playa de famara'] },
      { id: 'los_hervideros', corto: 'Los Hervideros', alias: ['hervideros'] },
      { id: 'salinas_de_janubio', corto: 'las Salinas de Janubio', alias: ['janubio'] },
      { id: 'playa_de_montana_bermeja', corto: 'Montaña Bermeja', alias: ['montana bermeja'] },
    ],
  },
}
const salida = {}
for (const [dest, d] of Object.entries(LISTA)) {
  const p = JSON.parse(fs.readFileSync(`data/pipeline_v2/${dest}.json`, 'utf8'))
  salida[dest] = {
    mar: d.mar,
    sitios: d.sitios.map((s) => {
      const lugar = p.places.find((x) => x.id === s.id)
      if (!lugar) throw new Error(`${dest}: no existe ${s.id}`)
      return { ...s, nombre: lugar.name, lat: lugar.coordinates[0], lng: lugar.coordinates[1] }
    }),
  }
}
fs.writeFileSync('src/data/sitiosDeAtardecer.json', JSON.stringify(salida, null, 1))
console.log('sitiosDeAtardecer.json:', Object.entries(salida).map(([k, v]) => `${k} ${v.sitios.length}`).join(' · '))
