# Cambia el ancho de una foto (JPEG) manteniendo la proporción: redimensionar.ps1 <origen> <destino> <ancho máximo>
# Solo reduce (nunca agranda). Usa System.Drawing, que viene con Windows.
param([string]$Origen, [string]$Destino, [int]$Ancho)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))
try {
  $w = [Math]::Min($Ancho, $img.Width)
  $h = [int][Math]::Round($img.Height * $w / $img.Width)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $w, $h)
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
  $dest = Join-Path (Resolve-Path (Split-Path $Destino -Parent)) (Split-Path $Destino -Leaf)
  $bmp.Save($dest, $codec, $params)
  $g.Dispose(); $bmp.Dispose()
} finally { $img.Dispose() }
