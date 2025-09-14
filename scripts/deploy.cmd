@ECHO OFF

ECHO.
ECHO Committing changes to deployment branch.
ECHO.

PUSHD %ROOT%

git checkout %deploy_branch%

git add out/
git commit -m "Deployment at %DATE% %TIME%"
git push origin %deploy_branch%

POPD

ECHO.
ECHO Updated deployment branch.
ECHO.