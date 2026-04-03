@echo off
echo ============================================
echo  FIX GIT PUSH - Limpieza de Secretos
echo ============================================
echo.

cd /d "c:\Users\virgi\ClearHos"

echo [1/7] Removiendo archivos sensibles del tracking de Git...
git rm --cached "mobile/google-services.json" 2>nul
git rm --cached "mobile/GoogleService-Info.plist" 2>nul
git rm --cached "functions/firebase-credentials.json" 2>nul
git rm --cached "functions/google-vision-key.json" 2>nul
echo    Archivos sensibles removidos del tracking.
echo.

echo [2/7] Verificando estado actual...
git status --short
echo.

echo [3/7] Haciendo stage de .gitignore y firebase.js actualizados...
git add .gitignore
git add "mobile/src/services/firebase.js"
echo.

echo [4/7] Haciendo soft reset al ultimo commit seguro (antes de 2ca2161)...
git reset --soft 1636dd9
echo    Reset completado.
echo.

echo [5/7] Agregando todos los cambios limpios al stage...
git add -A
echo    Stage listo.
echo.

echo [6/7] Verificando que NO haya archivos sensibles en el stage...
echo    Buscando google-services.json...
git diff --cached --name-only | findstr "google-services.json"
if %ERRORLEVEL%==0 (
    echo    ADVERTENCIA: google-services.json sigue en el stage!
    git rm --cached "mobile/google-services.json" 2>nul
)
echo    Buscando GoogleService-Info.plist...
git diff --cached --name-only | findstr "GoogleService-Info.plist"
if %ERRORLEVEL%==0 (
    echo    ADVERTENCIA: GoogleService-Info.plist sigue en el stage!
    git rm --cached "mobile/GoogleService-Info.plist" 2>nul
)
echo    Buscando firebase-credentials.json...
git diff --cached --name-only | findstr "firebase-credentials.json"
if %ERRORLEVEL%==0 (
    echo    ADVERTENCIA: firebase-credentials.json sigue en el stage!
    git rm --cached "functions/firebase-credentials.json" 2>nul
)
echo    Buscando google-vision-key.json...
git diff --cached --name-only | findstr "google-vision-key.json"
if %ERRORLEVEL%==0 (
    echo    ADVERTENCIA: google-vision-key.json sigue en el stage!
    git rm --cached "functions/google-vision-key.json" 2>nul
)
echo    Verificacion completada.
echo.

echo [7/7] Creando commit consolidado y pusheando...
git commit -m "feat: Propiedades V2, Corrección de Roles y Limpieza Profunda de Seguridad"
echo.

echo Pusheando a GitHub (con force para limpiar historial)...
git push origin v2-properties-checkpoint --force
echo.

echo ============================================
if %ERRORLEVEL%==0 (
    echo  PUSH EXITOSO!
) else (
    echo  Hubo un error. Revisa los mensajes arriba.
)
echo ============================================
pause
