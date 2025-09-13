
@ECHO off
setlocal
cls

ECHO.
ECHO.

::
:: --- Required variables ---
::

:: Project root directory
set "ROOT=%~dp0"

:: Deployment directory.
SET "out_directory=%ROOT%\out"

:: Deployment public directory.
SET "public_directory=%out_directory%\public"

:: Deployment public assets directory.
SET "public_assets_directory=%public_directory%\assets"

:: Source directory.
SET "src_directory=%ROOT%\src"

:: Assets source directory.
SET "assets_directory=%src_directory%\assets"

:: Index file source path.
SET "index_file=%src_directory%\index.html"

:: Build output directory.
SET "build_directory=%ROOT%\dist"

:: Wrangler configuration file path.
SET "wrangler_config_file=%ROOT%\wrangler.jsonc"

::
::
::

:: Add scripts directory to session path
set "PATH=%PATH%;%ROOT%\scripts"

dir /b scripts
cd scripts

ECHO.
cmd /k

ECHO.
ECHO.