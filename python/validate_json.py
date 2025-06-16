import json
import sys

# Check if a filename was provided
if len(sys.argv) < 2:
    print("Usage: python validate_json.py <json_file>")
    sys.exit(1)

filename = sys.argv[1]

# Try different encodings
encodings = ['utf-8', 'latin-1', 'utf-16', 'ascii']

for encoding in encodings:
    try:
        with open(filename, 'r', encoding=encoding) as f:
            text = f.read()
            data = json.loads(text)
            print(f"JSON is valid with {encoding} encoding! File size: {len(text)} chars")
            print(f"First 100 chars: {text[:100]}...")
            break
    except UnicodeDecodeError:
        print(f"Failed with {encoding} encoding, trying next...")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON with {encoding} encoding: {e}")
        # Try to print the problematic area
        if "position" in str(e):
            pos = int(str(e).split("position ")[1].split()[0])
            start = max(0, pos - 20)
            end = min(len(text), pos + 20)
            print(f"Context around position {pos}: {text[start:end]}")
        break
    except Exception as e:
        print(f"Error with {encoding} encoding: {e}")
        break
else:
    # Try binary mode as a last resort
    try:
        with open(filename, 'rb') as f:
            binary_data = f.read()
            # Try to decode as UTF-8 with error replacement
            text = binary_data.decode('utf-8', errors='replace')
            try:
                data = json.loads(text)
                print(f"JSON is valid with binary reading! File size: {len(binary_data)} bytes")
                print(f"First 100 chars: {text[:100]}...")
            except json.JSONDecodeError as e:
                print(f"Invalid JSON with binary reading: {e}")
                print(f"File starts with bytes: {binary_data[:20]}")
    except Exception as e:
        print(f"Error with binary reading: {e}") 