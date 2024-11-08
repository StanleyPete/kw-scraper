@echo off

REM Sprawdzenie, czy istnieje folder node_modules
if exist "node_modules" (
    echo Dependencies already installed.
    REM Front-end launch
    echo Starting frontend...
    start cmd /k "npm start"

    REM Back-end launch
    echo Starting backend...
    start cmd /k "nodemon server.js"
) else (
    echo Installing backend dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Error during npm install. Exiting...
        pause
        exit /b
    )

    REM Front-end launch
    echo Starting frontend...
    start cmd /k "npm start"

    REM Back-end launch
    echo Starting backend...
    start cmd /k "nodemon server.js"


)

