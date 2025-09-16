@ECHO OFF

ECHO.
ECHO Committing changes to deployment branch.
ECHO.

PUSHD %ROOT%

robocopy "%out_directory%" "%temp_out_directory%" /MIR
@REM CALL :check-error "Failed to mirror copy output directory to deployment staging directory."
ECHO.

git checkout %deploy_branch%
CALL :check-error "Failed to checkout deployment branch."

robocopy "%temp_out_directory%" "%out_directory%" /MIR
@REM CALL :check-error "Failed to mirror copy staging directory to deployment directory."
ECHO.

git add out/
CALL :check-error "Failed to stage changes."

git commit -m "Deployment at %DATE% %TIME%"
CALL :check-error "Failed to commit changes."

git push origin %deploy_branch%
CALL :check-error "Failed to push changes."

POPD

git checkout main


ECHO.
ECHO Updated deployment branch.
ECHO.



GOTO :EOF
::
:: Usage: 
::      CALL :check-error "Error message."
::

:check-error
if %errorlevel% neq 0 (
    POPD

    ECHO.
    ECHO.
    ECHO An error occurred during deployment:
    ECHO %1
    ECHO Error code: %errorlevel%
    ECHO.
    ECHO.

    git checkout main

    EXIT %errorlevel%
)
EXIT /b 0
GOTO :EOF