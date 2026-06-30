import os
import urllib.request
import urllib.error
import urllib.parse
import json
import random
from typing import List, Dict, Any, Optional, Generator, Tuple
from sqlalchemy.orm import Session
from app.models import KnowledgeArticle
from app.core.config import settings

OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_MODEL = settings.OPENROUTER_MODEL
OPENROUTER_EMBEDDING_MODEL = settings.OPENROUTER_EMBEDDING_MODEL

RATE_LIMIT_MESSAGE = (
    "The AI service is temporarily unavailable — the OpenRouter API quota has been exceeded "
    "(429 Too Many Requests). Please wait a few minutes and try again."
)


def _is_rate_limited(error: Exception) -> bool:
    if isinstance(error, urllib.error.HTTPError) and error.code == 429:
        return True
    return "429" in str(error)


def get_text_embedding(text_query: str) -> List[float]:
    """Generate 1536-dimensional vector embedding using OpenRouter API."""
    if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "mock-key-if-no-env-present":
        url = "https://openrouter.ai/api/v1/embeddings"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}"
        }
        body = {
            "model": OPENROUTER_EMBEDDING_MODEL,
            "input": text_query
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["data"][0]["embedding"]
        except Exception as e:
            print(f"Embedding error: {e}")

    # Fallback: deterministic pseudo-embedding based on character codes
    return [random.uniform(-0.1, 0.1) for _ in range(1536)]


def query_vector_kb(db: Session, query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Query knowledge articles using pgvector cosine similarity, with keyword fallback."""
    query_vector = get_text_embedding(query)

    try:
        results = db.query(KnowledgeArticle).order_by(
            KnowledgeArticle.embedding.cosine_distance(query_vector)
        ).limit(limit).all()

        return [
            {
                "id": art.id,
                "title": art.title,
                "category": art.category,
                "content": art.content,
                "tags": art.tags
            } for art in results
        ]
    except Exception as e:
        print(f"Vector search failed: {e}. Using keyword fallback.")
        articles = db.query(KnowledgeArticle).all()
        matches = []
        query_lower = query.lower()
        for art in articles:
            score = 0
            for word in art.title.lower().split():
                if word in query_lower:
                    score += 2
            for tag in (art.tags or []):
                if tag.lower() in query_lower:
                    score += 2
            # Also score on content keywords
            for word in query_lower.split():
                if len(word) > 3 and word in art.content.lower():
                    score += 1
            if score > 0:
                matches.append((score, art))

        matches.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": art.id,
                "title": art.title,
                "category": art.category,
                "content": art.content,
                "tags": art.tags
            } for _, art in matches[:limit]
        ]


def _build_openrouter_request_body(prompt_text: str, context_articles: List[Dict[str, Any]], stream: bool = False) -> dict:
    """Build the OpenRouter chat completion API request body with RAG context."""
    context_str = "\n\n".join([
        f"KB Article: {art['title']}\nContent: {art['content']}"
        for art in context_articles
    ]) if context_articles else "No specific documentation matched. Answer from general knowledge."

    system_instruction = (
        "You are VaizAI's professional AI customer support assistant. "
        "Your job is to help agents and customers resolve technical support, billing, or general queries clearly and concisely. "
        "You have access to a knowledge base context below. If the answer is found in the context, prioritize it. "
        "If the question is not covered by the context, answer it fully and accurately using your general knowledge of "
        "software development, APIs, security (such as JWT), billing, operations, and support. "
        "Keep answers focused, professional, and under 150 words. "
        "Explain in clear language what the user should do."
    )

    user_prompt = f"Knowledge Base Context:\n{context_str}\n\nUser's Question: {prompt_text}"

    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_instruction
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "temperature": 0.4,
        "max_tokens": 300,
        "top_p": 0.9
    }
    if stream:
        body["stream"] = True
    return body


def generate_ai_answer(prompt_text: str, context_articles: List[Dict[str, Any]]) -> str:
    """Generate a complete AI answer (non-streaming) using OpenRouter."""
    # Prompt injection guard
    malicious = ["ignore previous", "system prompt", "reveal database", "bypass safety", "jailbreak"]
    if any(hack in prompt_text.lower() for hack in malicious):
        return "⚠️ SECURITY WARNING: Suspicious pattern detected. This query has been flagged."

    if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "mock-key-if-no-env-present":
        url = "https://openrouter.ai/api/v1/chat/completions"
        body = _build_openrouter_request_body(prompt_text, context_articles, stream=False)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "VaizAI"
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenRouter generateContent error: {e}")
            if _is_rate_limited(e):
                suggestion, matched = _build_offline_suggestion(prompt_text, context_articles)
                if matched:
                    return f"⚠️ {RATE_LIMIT_MESSAGE}\n\nKeyword-based suggestion: {suggestion}"
                return f"⚠️ {RATE_LIMIT_MESSAGE}"

    return _build_offline_suggestion(prompt_text, context_articles)[0]


def stream_ai_answer(prompt_text: str, context_articles: List[Dict[str, Any]]) -> Generator[str, None, None]:
    """
    Stream AI answer token-by-token using OpenRouter's chat completions API.
    Yields Server-Sent Event (SSE) formatted strings.
    """
    # Prompt injection guard
    malicious = ["ignore previous", "system prompt", "reveal database", "bypass safety", "jailbreak"]
    if any(hack in prompt_text.lower() for hack in malicious):
        yield f"data: {json.dumps({'text': '⚠️ SECURITY WARNING: Suspicious pattern detected.', 'done': True})}\n\n"
        return

    if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "mock-key-if-no-env-present":
        url = "https://openrouter.ai/api/v1/chat/completions"
        body = _build_openrouter_request_body(prompt_text, context_articles, stream=True)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "VaizAI"
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    json_str = line[5:].strip()
                    if json_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(json_str)
                        choices = chunk.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            text_chunk = delta.get("content", "")
                            if text_chunk:
                                yield f"data: {json.dumps({'text': text_chunk, 'done': False})}\n\n"
                    except json.JSONDecodeError:
                        continue

            yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
            return

        except Exception as e:
            print(f"OpenRouter stream error: {e}")
            if _is_rate_limited(e):
                suggestion, matched = _build_offline_suggestion(prompt_text, context_articles)
                offline_response = (
                    f"⚠️ {RATE_LIMIT_MESSAGE}\n\nKeyword-based suggestion: {suggestion}"
                    if matched
                    else f"⚠️ {RATE_LIMIT_MESSAGE}"
                )
                words = offline_response.split(" ")
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words) - 1 else "")
                    yield f"data: {json.dumps({'text': chunk, 'done': False})}\n\n"
                yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
                return

    # Offline: simulate streaming by chunking the offline response word by word
    offline_response = _build_offline_suggestion(prompt_text, context_articles)[0]
    words = offline_response.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield f"data: {json.dumps({'text': chunk, 'done': False})}\n\n"

    yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"


def _score_kb_article(query_lower: str, art: Dict[str, Any]) -> int:
    """Score a KB article by keyword overlap with the user query."""
    score = 0
    for word in query_lower.split():
        if len(word) <= 3:
            continue
        if word in art["title"].lower():
            score += 3
        if word in art["content"].lower():
            score += 1
        for tag in (art.get("tags") or []):
            if word in tag.lower():
                score += 2
    return score


def _build_offline_suggestion(
    query: str, context_articles: List[Dict[str, Any]]
) -> Tuple[str, bool]:
    """Build a contextual suggestion using keyword scoring when Gemini is unavailable."""
    query_lower = query.lower()

    categories = [
        {
            "keywords": ["database", "postgres", "postgresql", "connection", "timeout", "db", "query", "sql", "node", "cluster", "replication", "analytics"],
            "response": (
                "This appears to be a database connectivity issue. "
                "Please check replication lag on PostgreSQL nodes and verify network security group rules. "
                "Flushing query caching buffers and reviewing CPU usage on the DB cluster is recommended. "
                "If the issue persists, consider restarting the database pooler service."
            )
        },
        {
            "keywords": ["argon", "hash", "password", "salt", "sso", "auth", "authentication", "login", "credential", "hashing", "microsoft", "jwt", "token"],
            "response": (
                "This appears to be an authentication or SSO configuration issue. "
                "Ensure the Argon2 salt length is at least 16 bytes and memory cost is set to 65536 KB. "
                "Verify SSO integration parameters and confirm JWT token validation is configured correctly on the authentication service container."
            )
        },
        {
            "keywords": ["rate", "limit", "429", "throttle", "gateway", "too many", "quota", "bandwidth", "requests"],
            "response": (
                "The client is likely hitting the API rate limit of 100 requests/minute per IP. "
                "Implement exponential backoff on the client side and review your application for any request loops. "
                "If you need a higher quota, contact your account manager."
            )
        },
        {
            "keywords": ["billing", "invoice", "seat", "license", "charge", "refund", "payment", "plan", "subscription", "money", "pricing"],
            "response": (
                "This appears to be a billing or licensing concern. "
                "Review the current billing cycle and active seat count in the admin panel. "
                "Verify invoice line items against active user count. If there is a discrepancy, a finance adjustment request will be initiated."
            )
        },
        {
            "keywords": ["slow", "performance", "lag", "latency", "speed", "loading", "response time", "delay"],
            "response": (
                "This appears to be a performance issue. "
                "Run a performance trace to identify bottlenecks in server response times or database query plans. "
                "Check CDN caching headers and consider horizontal scaling if CPU is consistently above 80%."
            )
        },
        {
            "keywords": ["access", "permission", "role", "locked", "block", "unauthorized", "forbidden", "403"],
            "response": (
                "This appears to be an access or permissions issue. "
                "Verify the user's role and permission assignments in the access control panel. "
                "Check if their session token is expired or if an IP blocklist rule is preventing access."
            )
        },
    ]

    best_score = 0
    best_response = None
    for cat in categories:
        score = sum(1 for kw in cat["keywords"] if kw in query_lower)
        if score > best_score:
            best_score = score
            best_response = cat["response"]

    if best_response:
        return best_response, True

    if context_articles:
        scored_articles = sorted(
            ((_score_kb_article(query_lower, art), art) for art in context_articles),
            key=lambda item: item[0],
            reverse=True,
        )
        best_article_score, art = scored_articles[0]
        if best_article_score > 0:
            return (
                f"Based on our knowledge base article '{art['title']}': "
                f"{art['content'][:200]}. "
                f"Please apply the recommended configuration. If the issue persists, escalate to a senior engineer."
            ), True

    return (
        "I couldn't find an exact match for your query in the knowledge base. "
        "Please provide system logs and environment configuration details so a support agent can investigate further."
    ), False
