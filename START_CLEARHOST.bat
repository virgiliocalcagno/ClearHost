@echo off
title ClearHost Pro — Lanzador Unificado
color 0B
echo =======================================================
echo     CLEARHOST PRO — ARQUITECTURA DE PRECISION V2
echo =======================================================
echo.

echo [1/2] Levantando Backend (FastAPI en Puerto 8000)...
:: Abre una nueva ventana, activa el entorno virtual e inicia uvicorn
start "ClearHost Backend" cmd /k "cd functions && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo [2/2] Levantando Frontend (Vite en Puerto 5173)...
:: Abre una nueva ventana e inicia el servidor de desarrollo de Vite
start "ClearHost Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo   SISTEMA LISTO Y CORRIENDO EN LOCALHOST
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000/docs
echo =======================================================
echo.
echo No cierres las ventanas negras mientras trabajas.
echo.
pause
