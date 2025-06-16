# DeepSeek Resume Parser: Migration to OpenRouter

This document describes the migration of the DeepSeek Resume Parser from using the official DeepSeek API to using the OpenRouter API service.

## Background

The DeepSeek resume parser initially used the official DeepSeek API, which requires credits and a valid account. To eliminate the cost and make the parser more accessible, we've migrated to using OpenRouter's free tier, which provides access to DeepSeek models without requiring payment.

## Changes Made

1. **API Integration**:
   - Modified the Python script to use OpenRouter's API endpoint: `https://openrouter.ai/api/v1/chat/completions`
   - Updated token handling to use `OPENROUTER_API_TOKEN` environment variable (with fallback to DeepSeek tokens)
   - Added interactive API key prompting when running from command line

2. **Token Management**:
   - Created `set-openrouter-token.bat` for setting up the OpenRouter API token
   - Added proper error handling for OpenRouter authentication issues
   - Implemented rate limit detection and handling

3. **Model Selection**:
   - Configured to use `deepseek/deepseek-chat-v3-0324:free`, which is the free tier of DeepSeek V3 on OpenRouter
   - This model provides high-quality parsing without requiring credits

4. **Frontend Updates**:
   - Updated error handling in the UI to show OpenRouter-specific messages
   - Modified token notice to guide users to OpenRouter instead of DeepSeek platform

5. **Documentation**:
   - Created `OPENROUTER_README.md` with detailed setup instructions
   - Updated existing documentation to reference OpenRouter

## Benefits

1. **Cost**: Free tier access to DeepSeek models with no credit card required
2. **Simplicity**: Easier setup process for new users
3. **Reliability**: OpenRouter handles model hosting and scaling
4. **Future-proof**: Can easily switch to other models if needed

## Getting Started

To use the updated parser:

1. Create an OpenRouter account at https://openrouter.ai
2. Generate an API key at https://openrouter.ai/keys
3. Run `set-openrouter-token.bat` and enter your key
4. The parser is now ready to use

## Testing

The integration has been tested with sample resumes and provides the same high-quality parsing results as the official DeepSeek API version.

## Limitations

- Free tier has rate limits (but sufficient for normal usage)
- Requires internet connection (same as before)
- May occasionally experience higher latency during peak hours

## Conclusion

This migration provides a more accessible version of the DeepSeek Resume Parser without sacrificing quality, making it easier for users to get started without worrying about API credits. 