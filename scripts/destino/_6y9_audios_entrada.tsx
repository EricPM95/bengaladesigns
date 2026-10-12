// Entrada que empaqueta la prueba de la Tanda 6y9 (scripts/destino/pruebaFase6y9_audios.mjs): la barra «Escuchar historia» con y sin audio guardado.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Escuchar } from '../../src/components/route/hoy/Escuchar'
import { crearEscuchaSegunFuente } from '../../src/lib/useEscuchar'
import { crearEscuchaAudio, pedirAudioDeHistoria, audioEnMemoria } from '../../src/lib/escucharAudio'

export { createElement, renderToStaticMarkup, Escuchar, crearEscuchaSegunFuente, crearEscuchaAudio, pedirAudioDeHistoria, audioEnMemoria }
