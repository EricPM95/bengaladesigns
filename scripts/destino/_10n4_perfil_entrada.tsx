// Entrada que empaqueta la prueba de la 10N4 (scripts/destino/pruebaTanda10N4_perfil.mjs): la pastilla «Tu parte · 31 €» / «por persona» del presupuesto.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EtiquetaPorPersona } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { formatoImporte } from '../../src/lib/dinero'

export { createElement, renderToStaticMarkup, EtiquetaPorPersona, formatoImporte }
