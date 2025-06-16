@echo off
echo Testing Transformer-based Resume Parser...
echo.

REM Get path to resume file
if "%1"=="" (
    echo Usage: test_transformer_parser.bat [path_to_resume_file]
    echo Example: test_transformer_parser.bat sample_resume.pdf
    exit /b 1
)

REM Run the parser
python resume_parser_transformer.py "%1"

echo.
echo Done! 