@ECHO OFF

ECHO.
ECHO Beginning automated deployment.
ECHO.

PUSHD %ROOT%

robocopy "%out_directory%" "%temp_out_directory%" /MIR
ECHO.

git checkout %deploy_branch%
CALL :check-error "Failed to checkout deployment branch."

robocopy "%temp_out_directory%" "%out_directory%" /MIR
ECHO.

git add out/
CALL :check-error "Failed to stage changes in deployment branch."

git commit -m "Deployed at %DATE% %TIME%"
CALL :check-error "Failed to commit changes to deployment branch."

git push origin %deploy_branch%
CALL :check-error "Failed to push changes to deployment remote branch."

POPD

git checkout main


ECHO.
ECHO.
ECHO Deployment complete.
ECHO Deployed at %DATE% %TIME%
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