
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

:: Deployment branch name.
SET "deploy_branch=deploy"


:: Temp directory.
SET "temp_directory=%ROOT%\temp"

:: Runtime temporary script directory
set "temp_scripts=%temp_directory%\console_scripts"

:: Deployment directory.
SET "out_directory=%ROOT%\out"

:: Deployment temporary staging directory
SET "temp_out_directory=%temp_directory%\out"

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

:: Manifest file source path.
SET "manifest_file=%src_directory%\manifest.json"

:: Build output directory.
SET "build_directory=%ROOT%\dist"

:: Wrangler configuration file path.
SET "wrangler_config_file=%ROOT%\wrangler.jsonc"

:: Deployment assets directory; additional assets to be deployed alongside build files.
SET "deployment_assets_directory=%ROOT%\deploy"

::
::
::

:: Mirror copy the scripts to the temp location
robocopy "%ROOT%\scripts" "%temp_scripts%" /MIR > nul

:: Add scripts directory to session path
set "PATH=%PATH%;%temp_scripts%"

dir /b "%temp_scripts%"
cd "%temp_scripts%"

ECHO.
cmd /k

ECHO.
ECHO.