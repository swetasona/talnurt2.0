#!/usr/bin/env python

"""
Test script for the Hugging Face integration of the DeepSeek Resume Parser
"""

import os
import sys
import json

# Set a sample API token (this is a dummy token for testing only)
os.environ["HF_API_TOKEN"] = "hf_dummy_token_for_testing_only"

# Add the python directory to the path
sys.path.append('python')

# Import the deepseek_resume_parser module
import deepseek_resume_parser

def test_parser():
    """Test the parser with a sample resume"""
    print("Testing DeepSeek Resume Parser with Hugging Face API integration")
    print("-" * 80)
    print("Sample resume: python/sample_resume.txt")
    print("API Token: [Set to dummy value for testing]")
    print("-" * 80)
    
    # The API call will fail with a dummy token, but we'll see if our code handles it correctly
    try:
        result = deepseek_resume_parser.parse_resume("python/sample_resume.txt")
        print("Parser returned:")
        print(json.dumps(result, indent=2))
        
        if not result.get("success", False):
            error = result.get("error", "Unknown error")
            if "API request failed" in error or "Hugging Face API" in error:
                print("\n✅ Parser correctly handled invalid API token")
                print("👉 To use this parser, get a valid token from https://huggingface.co/settings/tokens")
            else:
                print(f"\n❌ Unexpected error: {error}")
        else:
            print("\n✅ Parser successfully processed the resume!")
    
    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")
        raise

if __name__ == "__main__":
    test_parser() 