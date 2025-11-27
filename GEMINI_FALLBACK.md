# Gemini Model Fallback Mechanism

## Overview

The extension now includes an automatic fallback system for Gemini models. If one model fails, the system automatically tries the next available model.

## How It Works

### 1. Model Selection Priority

When generating content, the system follows this priority:

1. **User-specified model** - If a specific model is requested, it tries that first
2. **Fetched models** - Models retrieved from the Gemini API (sorted by capability)
3. **Fallback models** - Hardcoded list if API fetch fails

### 2. Fallback Model List

Default fallback models (in order of priority):

-   `gemini-2.0-flash-exp`
-   `gemini-1.5-flash`
-   `gemini-1.5-pro`
-   `gemini-2.5-flash-lite`
-   `gemini-2.5-pro`

### 3. Error Handling

-   Each model attempt is logged to the console
-   If a model fails, the system waits 1 second before trying the next
-   All errors are collected and reported if all models fail
-   Network errors are specifically identified

### 4. Logging

The system provides detailed console logs:

-   `Attempting to use Gemini model: {name} ({current}/{total})`
-   `Model {name} failed: {error}`
-   `Falling back to next model...`
-   `Successfully used fallback model: {name}`
-   Final error with all model failures if everything fails

## Example Flow

```
User requests summary
↓
Try gemini-2.0-flash-exp → FAILS (rate limit)
↓
Wait 1 second
↓
Try gemini-1.5-flash → SUCCESS
↓
Return result
```

## Benefits

-   **Reliability**: No single point of failure
-   **Transparency**: Clear logging of what's happening
-   **Flexibility**: Works with both fetched and hardcoded models
-   **User Experience**: Seamless fallback without user intervention
