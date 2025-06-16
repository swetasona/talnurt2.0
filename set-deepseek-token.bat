@echo off
echo Setting up DeepSeek API token for Resume Parser

rem Set the API token directly
set DEEPSEEK_API_TOKEN=sk-10600485b9094e82ab027d449072a930

echo.
echo Setting environment variables...
setx DEEPSEEK_API_TOKEN "%DEEPSEEK_API_TOKEN%"

echo.
echo Saving token for current session...
set DEEPSEEK_API_TOKEN=%DEEPSEEK_API_TOKEN%

echo.
echo Done! The DeepSeek API token has been set.
echo You may need to restart your application or terminal for the changes to take effect.
echo.
echo To get a DeepSeek API token, please visit: https://platform.deepseek.com/
echo.

pause 