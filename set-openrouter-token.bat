@echo off
echo ===============================================
echo    Setting up OpenRouter API Token
echo ===============================================
echo.
echo This script will set up your OpenRouter API token.
echo You can get a token from https://openrouter.ai/keys
echo.
echo Please enter your OpenRouter API token (starts with sk-or-...):
set /p OPENROUTER_TOKEN=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

if "%OPENROUTER_TOKEN%"=="" (
  echo Error: No token provided.
  goto :end
)

echo.
echo Setting OpenRouter API token as a user environment variable...

setx OPENROUTER_API_TOKEN "%OPENROUTER_TOKEN%"

echo.
echo Token set successfully as environment variable: OPENROUTER_API_TOKEN
echo This token will be available in newly opened command prompts.
echo.
echo For the changes to take effect, please close and reopen your terminal.
echo.

:end
pause 