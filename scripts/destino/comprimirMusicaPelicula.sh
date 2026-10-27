#!/bin/sh
# Tanda 10N6 §1i: comprime la música de la película del pase (la pone Eric en public/sonidos/pelicula_pase.mp3) a ~96 kbps, mono-estéreo normal, para que pese menos de 1 MB.
# Uso: sh scripts/destino/comprimirMusicaPelicula.sh [origen.mp3]   (por defecto, el propio public/sonidos/pelicula_pase.mp3, que se sustituye)
set -e
DEST="public/sonidos/pelicula_pase.mp3"
ORIGEN="${1:-$DEST}"
if ! command -v ffmpeg >/dev/null 2>&1; then echo "No hay ffmpeg: instálalo (https://ffmpeg.org) o comprime el mp3 a 96 kbps con otro programa."; exit 1; fi
[ -f "$ORIGEN" ] || { echo "No existe $ORIGEN (lo pone Eric)."; exit 1; }
TMP="$(mktemp -u).mp3"
# fundidos de entrada/salida ya vienen del reproductor; aquí solo se recodifica
ffmpeg -y -i "$ORIGEN" -vn -c:a libmp3lame -b:a 96k -ar 44100 "$TMP"
mv "$TMP" "$DEST"
ls -l "$DEST"
