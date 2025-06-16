#!/usr/bin/env python3
import os
import sys
import time
import importlib.util
import platform

def check_module(module_name):
    """Check if a module can be imported."""
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is None:
            return False
        return True
    except ImportError:
        return False

def print_status(message, success):
    """Print a status message with color."""
    if success:
        print(f"✅ {message}")
    else:
        print(f"❌ {message}")

def main():
    print("\n=== Python Resume Parser Dependency Check ===\n")
    
    # Check Python version
    python_version = platform.python_version()
    print_status(f"Python version: {python_version}", True)
    
    # Check for required modules
    required_modules = [
        "torch", 
        "transformers", 
        "pdfplumber", 
        "docx",
        "numpy",
        "Pillow"
    ]
    
    missing_modules = []
    
    print("\nChecking required modules:")
    for module in required_modules:
        has_module = check_module(module)
        print_status(f"{module}", has_module)
        if not has_module:
            missing_modules.append(module)
    
    if missing_modules:
        print("\n⚠️ Missing modules:")
        for module in missing_modules:
            print(f"  - {module}")
        
        print("\nInstall missing modules with:")
        print(f"pip install {' '.join(missing_modules)}")
    else:
        print("\nAll required modules are installed! 🎉")
    
    # Check for model cache directory
    print("\nChecking for model cache directory:")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cache_dir = os.path.join(script_dir, "model_cache")
    
    if os.path.exists(cache_dir):
        print_status(f"Cache directory exists at: {cache_dir}", True)
    else:
        os.makedirs(cache_dir, exist_ok=True)
        print_status(f"Created cache directory at: {cache_dir}", True)
    
    # Try to load models
    if "torch" in missing_modules or "transformers" in missing_modules:
        print("\n⚠️ Cannot test model loading because required modules are missing.")
    else:
        try:
            print("\nTesting NER model loading (this may take a minute)...")
            start_time = time.time()
            
            from transformers import AutoTokenizer, AutoModelForTokenClassification
            tokenizer = AutoTokenizer.from_pretrained("dslim/bert-base-NER")
            model = AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")
            
            elapsed = time.time() - start_time
            print_status(f"Loaded NER model in {elapsed:.2f} seconds", True)
            
            # Save to cache for future use
            ner_cache_dir = os.path.join(cache_dir, "ner_model")
            if not os.path.exists(ner_cache_dir):
                print("Saving NER model to cache...")
                tokenizer.save_pretrained(ner_cache_dir)
                model.save_pretrained(ner_cache_dir)
                print_status("Saved NER model to cache", True)
            
        except Exception as e:
            print_status("Failed to load NER model", False)
            print(f"Error: {str(e)}")
    
    print("\n=== Check completed ===")

if __name__ == "__main__":
    main() 