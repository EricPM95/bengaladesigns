# La «huella» de cada foto de una carpeta (dHash de 64 bits: 9x8 píxeles en gris, cada bit = si un píxel es más claro que el de su derecha).
# Dos fotos parecidas tienen huellas parecidas. Salida: JSON { "archivo.jpg": "hex de 16 cifras" }.  Uso: huellas.ps1 <carpeta> <salida.json>
param([string]$Carpeta, [string]$Salida)
Add-Type -AssemblyName System.Drawing
$result = [ordered]@{}
foreach ($file in Get-ChildItem -LiteralPath $Carpeta -Filter *.jpg) {
  try {
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $bmp = New-Object System.Drawing.Bitmap(9, 8)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, 9, 8)
    $bits = ''
    for ($y = 0; $y -lt 8; $y++) {
      for ($x = 0; $x -lt 8; $x++) {
        $a = $bmp.GetPixel($x, $y); $b = $bmp.GetPixel($x + 1, $y)
        $la = 0.299 * $a.R + 0.587 * $a.G + 0.114 * $a.B
        $lb = 0.299 * $b.R + 0.587 * $b.G + 0.114 * $b.B
        if ($la -gt $lb) { $bits += '1' } else { $bits += '0' }
      }
    }
    $result[$file.Name] = $bits
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  } catch { }
}
$result | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath $Salida
