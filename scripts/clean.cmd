@ECHO off

ECHO Cleaning "out" directory.

rmdir /s /q "%out_directory%"

if %errorlevel% neq 0 (
    ECHO Cleaning "out" directory failed!
    exit /b %errorlevel%
)
ECHO Cleaned "out" directory.
ECHO.