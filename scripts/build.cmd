@echo off

echo Building project.

npm run cbuild

if %errorlevel% neq 0 (
    echo Project build failed!
    exit /b %errorlevel%
)

echo Project build completed!
echo.