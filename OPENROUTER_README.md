# Using DeepSeek with OpenRouter API

This guide explains how to use OpenRouter to access DeepSeek models for the resume parser.

## What is OpenRouter?

OpenRouter is a service that provides unified access to hundreds of AI models, including DeepSeek, through a single API. The main advantages are:

1. Free tier access to powerful models
2. No credit card required for basic usage
3. Simple API similar to OpenAI's format
4. Fallback options for higher reliability

## Setting Up OpenRouter

### Step 1: Create an OpenRouter Account

1. Visit [OpenRouter.ai](https://openrouter.ai) and sign up for an account
2. No credit card is required for the free tier

### Step 2: Get an API Key

1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key (it starts with "sk-or-...")

### Step 3: Configure the Resume Parser

1. Run `set-openrouter-token.bat` in the project root
2. Enter the OpenRouter API key when prompted
3. Restart any running applications or terminals

## Troubleshooting

### Authentication Errors

If you see "Authentication failed" or "Invalid API token" errors:

1. Make sure your OpenRouter API key starts with "sk-or-..."
2. Check that you've set the environment variable correctly
3. Try running `set-openrouter-token.bat` again

### Rate Limiting

The free tier has rate limits. If you exceed them:

1. Wait a few minutes and try again
2. Consider upgrading to a paid plan if you need higher limits

## Models Available

The parser is configured to use `deepseek/deepseek-chat-v3-0324:free`, which is a free version of DeepSeek V3 available through OpenRouter.

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Model List](https://openrouter.ai/models)