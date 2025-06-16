import requests
import json
import os

# Set the OpenRouter API token
api_key = "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"
os.environ["OPENROUTER_API_TOKEN"] = api_key

# Set up the API endpoint and headers
url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://recruitment-portal.com",
    "X-Title": "Recruitment Portal Test"
}

# Simple payload for testing
payload = {
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
        {"role": "user", "content": "Say hello world"}
    ],
    "temperature": 0.7,
    "max_tokens": 50
}

# Make the API call
print("Testing OpenRouter API...")
print(f"URL: {url}")
print(f"Model: {payload['model']}")

try:
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2) if response.status_code == 200 else response.text)
except Exception as e:
    print(f"Error: {e}") 