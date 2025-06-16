import json
import sys

# Check if a filename was provided
if len(sys.argv) < 2:
    print("Usage: python validate_binary.py <json_file>")
    sys.exit(1)

filename = sys.argv[1]

# Read as binary
try:
    with open(filename, 'rb') as f:
        binary_data = f.read()
    
    print(f"File size: {len(binary_data)} bytes")
    print(f"First 20 bytes: {binary_data[:20]}")
    
    # Try to decode as UTF-8
    try:
        utf8_text = binary_data.decode('utf-8')
        print("Successfully decoded as UTF-8")
        
        # Try to parse as JSON
        try:
            data = json.loads(utf8_text)
            print("Successfully parsed as JSON!")
            print(f"First 100 chars of JSON: {utf8_text[:100]}...")
        except json.JSONDecodeError as e:
            print(f"Failed to parse as JSON: {e}")
            print(f"First 100 chars of decoded text: {utf8_text[:100]}...")
    except UnicodeDecodeError:
        print("Failed to decode as UTF-8")
        
        # Try UTF-16
        try:
            utf16_text = binary_data.decode('utf-16')
            print("Successfully decoded as UTF-16")
            
            # Try to parse as JSON
            try:
                data = json.loads(utf16_text)
                print("Successfully parsed as JSON!")
                print(f"First 100 chars of JSON: {utf16_text[:100]}...")
            except json.JSONDecodeError as e:
                print(f"Failed to parse as JSON: {e}")
                print(f"First 100 chars of decoded text: {utf16_text[:100]}...")
        except UnicodeDecodeError:
            print("Failed to decode as UTF-16")
except Exception as e:
    print(f"Error: {e}") 