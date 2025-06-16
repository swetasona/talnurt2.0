@echo off
echo Testing Python resume parser...

if "%~1"=="" (
  echo Usage: test_parser.bat path_to_resume_file.pdf
  exit /b 1
)

python "%~dp0resume_parser_transformer.py" "%~1"
echo.
echo Test complete!
pause 