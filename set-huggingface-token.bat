@echo off
echo Setting up Hugging Face API token for DeepSeek Resume Parser

rem Set the API token directly
set HUGGINGFACE_API_TOKEN=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

echo.
echo Setting environment variables...
setx HUGGINGFACE_API_TOKEN "%HUGGINGFACE_API_TOKEN%"
setx HF_API_TOKEN "%HUGGINGFACE_API_TOKEN%"

echo.
echo Saving token for current session...
set HUGGINGFACE_API_TOKEN=%HUGGINGFACE_API_TOKEN%
set HF_API_TOKEN=%HUGGINGFACE_API_TOKEN%

echo.
echo Done! The Hugging Face API token has been set.
echo Both HUGGINGFACE_API_TOKEN and HF_API_TOKEN variables have been set for compatibility.
echo You may need to restart your application or terminal for the changes to take effect.
echo.

pause 
