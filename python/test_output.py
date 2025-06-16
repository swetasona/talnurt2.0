import json
import sys

# Create a simple JSON object
data = {
    "success": True,
    "name": "Test User",
    "email": "test@example.com",
    "technical_skills": ["JavaScript", "Python", "React"]
}

# Write directly to stdout
sys.stdout.buffer.write(json.dumps(data, ensure_ascii=True).encode('utf-8')) 