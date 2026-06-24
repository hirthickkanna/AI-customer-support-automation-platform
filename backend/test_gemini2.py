import urllib.request
import urllib.error
import json
import os

# Try to load env variables from backend/.env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

KEY = os.environ.get("GEMINI_API_KEY", "mock-key-if-no-env-present")
MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-pro"]

body = {
    "contents": [{"role": "user", "parts": [{"text": "Say hello in 5 words"}]}],
    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 20}
}

for model in MODELS:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"SUCCESS [{model}]: {text.strip()}")
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8")
        print(f"HTTP {e.code} [{model}]: {body_err[:300]}")
    except Exception as e:
        print(f"ERROR [{model}]: {e}")

# Also test the streaming endpoint
print("\n--- Testing streamGenerateContent ---")
url_stream = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={KEY}"
try:
    req2 = urllib.request.Request(
        url_stream,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req2, timeout=12) as resp:
        lines = []
        for raw in resp:
            line = raw.decode("utf-8").strip()
            if line.startswith("data:"):
                lines.append(line[:100])
            if len(lines) >= 3:
                break
        print(f"Stream OK — first 3 SSE lines:")
        for l in lines:
            print(f"  {l}")
except urllib.error.HTTPError as e:
    print(f"Stream HTTP {e.code}: {e.read().decode('utf-8')[:300]}")
except Exception as e:
    print(f"Stream ERROR: {e}")
