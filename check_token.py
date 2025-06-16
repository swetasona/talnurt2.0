import os

token = os.environ.get('HUGGINGFACE_API_TOKEN')
if token:
    # Only show part of the token for security
    if len(token) > 8:
        print(f'HUGGINGFACE_API_TOKEN is set: {token[:4]}...{token[-4:]}')
    else:
        print(f'HUGGINGFACE_API_TOKEN is set but seems too short')
else:
    print('HUGGINGFACE_API_TOKEN is not set')

# Also check for the old environment variable name
old_token = os.environ.get('HF_API_TOKEN')
if old_token:
    print('Note: HF_API_TOKEN is set, but the application now uses HUGGINGFACE_API_TOKEN')

print("Done checking environment variables.") 