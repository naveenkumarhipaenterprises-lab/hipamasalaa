# Process all 8 products and 4 pack sizes from Downloads
Add-Type -AssemblyName System.Drawing;

$rootDest = "C:\Users\Admin\Desktop\e commerce hipa site\assets\images\products";

$tasks = @(
  @{
    Slug = "sambar";
    Folder = "sambar";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\sambar powder-20261007T080930Z-1-001\sambar powder\100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\sambar powder-20261007T080930Z-1-001\sambar powder\200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\sambar powder-20261007T080930Z-1-001\sambar powder\500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\sambar powder-20261007T080930Z-1-001\sambar powder\1 kg.png" }
    )
  },
  @{
    Slug = "rasam";
    Folder = "rasam";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Rasam powder-20261007T081546Z-1-001\Rasam powder\Rasam powder 100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Rasam powder-20261007T081546Z-1-001\Rasam powder\Rasam powder 200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Rasam powder-20261007T081546Z-1-001\Rasam powder\Rasam powder 500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Rasam powder-20261007T081546Z-1-001\Rasam powder\Rasam powder 1kg.png" }
    )
  },
  @{
    Slug = "turmeric";
    Folder = "turmeric";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Turmeric powder-20261007T080929Z-1-001\Turmeric powder\100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Turmeric powder-20261007T080929Z-1-001\Turmeric powder\200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Turmeric powder-20261007T080929Z-1-001\Turmeric powder\500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Turmeric powder-20261007T080929Z-1-001\Turmeric powder\1kg.png" }
    )
  },
  @{
    Slug = "red-chilli";
    Folder = "red-chilli";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Red chilli powder-20261007T080931Z-1-001\Red chilli powder\100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Red chilli powder-20261007T080931Z-1-001\Red chilli powder\200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Red chilli powder-20261007T080931Z-1-001\Red chilli powder\500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Red chilli powder-20261007T080931Z-1-001\Red chilli powder\1 kg.png" }
    )
  },
  @{
    Slug = "coriander";
    Folder = "coriander";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Coriander powder-20261007T081601Z-1-001\Coriander powder\Coriander powder 100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Coriander powder-20261007T081601Z-1-001\Coriander powder\Coriander powder 200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Coriander powder-20261007T081601Z-1-001\Coriander powder\Coriander powder 500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Coriander powder-20261007T081601Z-1-001\Coriander powder\Coriander powder 1 kg.png" }
    )
  },
  @{
    Slug = "cumin";
    Folder = "cumin";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\cumin powder-20261007T081551Z-1-001\cumin powder\100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\cumin powder-20261007T081551Z-1-001\cumin powder\200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\cumin powder-20261007T081551Z-1-001\cumin powder\500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\cumin powder-20261007T081551Z-1-001\cumin powder\1kg.png" }
    )
  },
  @{
    Slug = "pepper";
    Folder = "pepper";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Pepper powder-20261007T080934Z-1-001\Pepper powder\100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Pepper powder-20261007T080934Z-1-001\Pepper powder\200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Pepper powder-20261007T080934Z-1-001\Pepper powder\500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Pepper powder-20261007T080934Z-1-001\Pepper powder\1 kg.png" }
    )
  },
  @{
    Slug = "garam-masala";
    Folder = "garam-masala";
    Sizes = @(
      @{ Size = "100g"; File = "C:\Users\Admin\Downloads\Garam masala powder-20261007T080935Z-1-001\Garam masala powder\Garam masala powder 100g.png" },
      @{ Size = "200g"; File = "C:\Users\Admin\Downloads\Garam masala powder-20261007T080935Z-1-001\Garam masala powder\Garam masala powder 200g.png" },
      @{ Size = "500g"; File = "C:\Users\Admin\Downloads\Garam masala powder-20261007T080935Z-1-001\Garam masala powder\Garam masala powder 500g.png" },
      @{ Size = "1kg";  File = "C:\Users\Admin\Downloads\Garam masala powder-20261007T080935Z-1-001\Garam masala powder\Garam masala powder 1kg.png" }
    )
  }
);

function CropAndSave($orig, $srcRect, $targetW, $destPath) {
  $targetH = [int]($targetW * ($srcRect.Height / $srcRect.Width));
  $bmp = New-Object System.Drawing.Bitmap $targetW, $targetH;
  $g = [System.Drawing.Graphics]::FromImage($bmp);
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
  $destRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH;
  $g.DrawImage($orig, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel);
  $g.Dispose();
  $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png);
  $bmp.Dispose();
}

foreach ($task in $tasks) {
  $targetDir = Join-Path $rootDest $task.Folder;
  if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null;
  }

  foreach ($s in $task.Sizes) {
    $srcFile = $s.File;
    $sizeName = $s.Size;
    if (-not (Test-Path $srcFile)) {
      Write-Host "WARNING: File not found: $srcFile" -ForegroundColor Yellow;
      continue;
    }

    Write-Host "Processing $($task.Slug) $sizeName from $([System.IO.Path]::GetFileName($srcFile))...";
    $orig = [System.Drawing.Bitmap]::FromFile($srcFile);
    $w = $orig.Width;
    $h = $orig.Height;
    $halfW = [int]($w / 2);

    # Find bbox for left (front)
    $minX1 = $halfW; $maxX1 = 0; $minY1 = $h; $maxY1 = 0;
    for ($y = 0; $y -lt $h; $y += 30) {
      for ($x = 0; $x -lt $halfW; $x += 30) {
        if ($orig.GetPixel($x, $y).A -gt 15) {
          if ($x -lt $minX1) { $minX1 = $x }
          if ($x -gt $maxX1) { $maxX1 = $x }
          if ($y -lt $minY1) { $minY1 = $y }
          if ($y -gt $maxY1) { $maxY1 = $y }
        }
      }
    }

    # Find bbox for right (back)
    $minX2 = $w; $maxX2 = $halfW; $minY2 = $h; $maxY2 = 0;
    for ($y = 0; $y -lt $h; $y += 30) {
      for ($x = $halfW; $x -lt $w; $x += 30) {
        if ($orig.GetPixel($x, $y).A -gt 15) {
          if ($x -lt $minX2) { $minX2 = $x }
          if ($x -gt $maxX2) { $maxX2 = $x }
          if ($y -lt $minY2) { $minY2 = $y }
          if ($y -gt $maxY2) { $maxY2 = $y }
        }
      }
    }

    # Add 2.5% margin
    $margin1X = [int](($maxX1 - $minX1) * 0.025);
    $margin1Y = [int](($maxY1 - $minY1) * 0.025);
    $cropX1 = [Math]::Max(0, $minX1 - $margin1X);
    $cropY1 = [Math]::Max(0, $minY1 - $margin1Y);
    $cropW1 = [Math]::Min($halfW - $cropX1, ($maxX1 - $minX1) + 2 * $margin1X);
    $cropH1 = [Math]::Min($h - $cropY1, ($maxY1 - $minY1) + 2 * $margin1Y);

    $margin2X = [int](($maxX2 - $minX2) * 0.025);
    $margin2Y = [int](($maxY2 - $minY2) * 0.025);
    $cropX2 = [Math]::Max($halfW, $minX2 - $margin2X);
    $cropY2 = [Math]::Max(0, $minY2 - $margin2Y);
    $cropW2 = [Math]::Min($w - $cropX2, ($maxX2 - $minX2) + 2 * $margin2X);
    $cropH2 = [Math]::Min($h - $cropY2, ($maxY2 - $minY2) + 2 * $margin2Y);

    $rectFront = New-Object System.Drawing.Rectangle $cropX1, $cropY1, $cropW1, $cropH1;
    $rectBack = New-Object System.Drawing.Rectangle $cropX2, $cropY2, $cropW2, $cropH2;

    $baseName = "$($task.Slug)-$sizeName";
    $pFrontFull = Join-Path $targetDir "$baseName-front.png";
    $pFrontWeb  = Join-Path $targetDir "$baseName-front-web.png";
    $pBackFull  = Join-Path $targetDir "$baseName-back.png";
    $pBackWeb   = Join-Path $targetDir "$baseName-back-web.png";

    # Render Front
    CropAndSave $orig $rectFront 1500 $pFrontFull;
    CropAndSave $orig $rectFront 1000 $pFrontWeb;

    # Render Back
    CropAndSave $orig $rectBack 1500 $pBackFull;
    CropAndSave $orig $rectBack 1000 $pBackWeb;

    $orig.Dispose();
    Write-Host "Done: $baseName front & back (web + full)";
  }
}

Write-Host "ALL 32 MOCKUPS PROCESSED SUCCESSFULLY!";
