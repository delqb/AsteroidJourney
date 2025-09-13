@ECHO off

ECHO.
ECHO Packaging deployment files.

if NOT EXIST "%out_directory%" (
    ECHO Creating absent "out" directory.
    mkdir "%out_directory%"
    ECHO Created "out" directory.
    ECHO.
)

if NOT EXIST "%public_directory%" (
    ECHO Creating absent "public" directory.
    mkdir "%public_directory%"
    ECHO Created "public" directory.
    ECHO.
)

:: Copy build files to public directory
ECHO Packaging build files.
xcopy "%build_directory%\*" "%public_directory%" /E /I /Y
if %errorlevel% neq 0 (
    ECHO Packaging build files failed!
    exit /b %errorlevel%
)

ECHO Packaged build files.
ECHO.
::

:: Copy assets to public directory
ECHO Packaging assets.
xcopy "%assets_directory%" "%public_assets_directory%" /E /I /Y
if %errorlevel% neq 0 (
    ECHO Packaging assets failed!
    exit /b %errorlevel%
)

ECHO Packaged assets.
ECHO.
::


::Copy index file to public directory
ECHO Packaging index file.
xcopy "%index_file%" "%public_directory%" /Y /Q
if %errorlevel% neq 0 (
    ECHO Packaging index file failed!
    exit /b %errorlevel%
)

ECHO Packaged index file.
ECHO.
::


ECHO.
ECHO Finished packaging.
ECHO.

exit /b 0