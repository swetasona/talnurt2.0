import sys
import json

# Create a simple JSON object
data = {
    "success": True,
    "name": "Test User",
    "email": "test@example.com",
    "technical_skills": ["JavaScript", "Python", "React"]
}

# Convert to JSON string
json_str = json.dumps(data)

# Option 1: Write directly to stdout
sys.stdout.buffer.write(json_str.encode('utf-8'))

# Option 2: Use print with encoding parameter
# print(json_str, end='', flush=True) 