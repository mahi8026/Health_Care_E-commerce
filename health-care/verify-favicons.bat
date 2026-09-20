@echo off
echo ========================================
echo Favicon Files Verification
echo ========================================
echo.

set "PUBLIC_DIR=%~dp0public"
set "ICONS_DIR=%~dp0public\icons"

echo Checking favicon.ico...
if exist "%PUBLIC_DIR%\favicon.ico" (
    echo [OK] favicon.ico exists
) else (
    echo [MISSING] favicon.ico NOT FOUND
)
echo.

echo Checking icon files...
echo.

set "FILES=icon-72x72.png icon-96x96.png icon-128x128.png icon-144x144.png icon-152x152.png icon-180x180.png icon-192x192.png icon-384x384.png icon-512x512.png icon-192x192-maskable.png icon-512x512-maskable.png"

for %%f in (%FILES%) do (
    if exist "%ICONS_DIR%\%%f" (
        echo [OK] %%f exists
    ) else (
        echo [MISSING] %%f NOT FOUND
    )
)

echo.
echo ========================================
echo Verification Complete
echo ========================================
echo.
echo If any files are MISSING, generate them at:
echo https://realfavicongenerator.net/
echo.
pause
