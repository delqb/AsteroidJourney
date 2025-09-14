@echo off

echo Building project.
PUSHD "%ROOT%"

npm run cbuild

if %errorlevel% neq 0 (
    echo Project build failed!
    exit /b %errorlevel%
)

POPD
echo Project build completed!
echo.