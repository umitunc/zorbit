@echo off
setlocal
node "%~dp0scripts\release.mjs" %*
exit /b %ERRORLEVEL%

