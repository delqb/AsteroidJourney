@ECHO OFF

ECHO.
ECHO. Preparing deployment.
ECHO.
ECHO.

CALL clean
CALL build
CALL pack

ECHO.
ECHO.
ECHO Finished deployment preparation.
ECHO.