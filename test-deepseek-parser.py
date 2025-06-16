#!/usr/bin/env python

"""
Test script for the DeepSeek API integration of the Resume Parser
"""

import os
import sys
import json

# Explicitly set the API token
os.environ["DEEPSEEK_API_TOKEN"] = "sk-10600485b9094e82ab027d449072a930"
print(f"Setting DEEPSEEK_API_TOKEN in environment to: {os.environ['DEEPSEEK_API_TOKEN']}")

# Add the python directory to the path
sys.path.append('python')

# Import the deepseek_resume_parser module
import deepseek_resume_parser

def test_parser():
    """Test the parser with a sample resume"""
    print("Testing DeepSeek Resume Parser with Official DeepSeek API integration")
    print("-" * 80)
    print("Sample resume: python/sample_resume.txt")
    print(f"API Token: {os.environ.get('DEEPSEEK_API_TOKEN')[:5]}...")
    print("-" * 80)
    
    try:
        # Force a fresh API call by removing any existing cache
        cache_key = deepseek_resume_parser.get_cache_key("python/sample_resume.txt")
        cache_file = os.path.join(deepseek_resume_parser.CACHE_DIR, f"{cache_key}.pkl")
        if os.path.exists(cache_file):
            os.remove(cache_file)
            print(f"Removed existing cache: {cache_file}")
        
        result = deepseek_resume_parser.parse_resume("python/sample_resume.txt")
        print("Parser returned:")
        print(json.dumps(result, indent=2))
        
        if not result.get("success", False):
            error = result.get("error", "Unknown error")
            if "API request failed" in error or "DeepSeek API" in error or "Authentication" in error:
                print("\n❌ API authentication error")
                print("👉 The token may not be valid or the API endpoint might be incorrect")
            else:
                print(f"\n❌ Unexpected error: {error}")
        else:
            print("\n✅ Parser successfully processed the resume!")
    
    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")
        raise

if __name__ == "__main__":
    test_parser() 