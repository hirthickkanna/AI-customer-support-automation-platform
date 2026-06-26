import sys
import os
import json

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.core.config import settings
from app.services.rag import get_text_embedding, generate_ai_answer, stream_ai_answer

print("--- OpenRouter Integration Verification ---")
print(f"API Key present: {bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY != 'mock-key-if-no-env-present')}")
print(f"Chat Model: {settings.OPENROUTER_MODEL}")
print(f"Embedding Model: {settings.OPENROUTER_EMBEDDING_MODEL}")

if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY == "mock-key-if-no-env-present":
    print("\nWARNING: OpenRouter API key is not configured. Running offline fallbacks / mocks.")

# 1. Test Embeddings
print("\n1. Testing Embeddings...")
try:
    embedding = get_text_embedding("Hello world database query")
    print(f"SUCCESS: Embedding length: {len(embedding)}")
    print(f"First 5 dimensions: {embedding[:5]}")
except Exception as e:
    print(f"FAILED: Embeddings check: {e}")

# 2. Test Non-Streaming Chat Completion
print("\n2. Testing Chat Completion (Non-Streaming)...")
try:
    answer = generate_ai_answer("Say hello in exactly 5 words.", [])
    print(f"SUCCESS: Chat Answer: {answer.strip()}")
except Exception as e:
    print(f"FAILED: Chat completions check: {e}")

# 3. Test Streaming Chat Completion
print("\n3. Testing Chat Completion (Streaming)...")
try:
    print("Streaming start:")
    stream = stream_ai_answer("Say hello in exactly 5 words.", [])
    for chunk in stream:
        if chunk.startswith("data:"):
            try:
                data = json.loads(chunk[5:].strip())
                if data.get("text"):
                    print(data["text"], end="", flush=True)
                if data.get("done"):
                    print("\n[DONE]")
            except Exception as e:
                print(f"\nFailed to parse chunk: {chunk} - Error: {e}")
except Exception as e:
    print(f"\nFAILED: Streaming completions check: {e}")
