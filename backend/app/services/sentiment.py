import re
from typing import Dict, Any

def analyze_message_sentiment(text: str) -> Dict[str, Any]:
    """Analyze customer message text for frustration and anger indices."""
    angry_patterns = [
        r"\b(broken|fail|worst|terrible|useless|crap|garbage|bad)\b",
        r"\b(timeout|error|failing|crashing)\b",
        r"\b(refund|dispute|cancel|money back|chargeback)\b",
        r"\b(angry|annoyed|frustrated|pissed|ridiculous)\b"
    ]
    
    joy_patterns = [
        r"\b(thanks|thank you|great|perfect|resolved|awesome|working|fixed)\b"
    ]
    
    # Calculate score base
    anger_score = 0.0
    text_lower = text.lower()
    
    # Simple rule-based calculator
    for pattern in angry_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            anger_score += 0.25 * len(matches)
            
    for pattern in joy_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            anger_score -= 0.20 * len(matches)
            
    # Normalize score between 0.0 and 1.0
    anger_score = max(0.0, min(1.0, 0.5 + anger_score))
    
    # Output detailed categories
    joy_score = max(0.0, 1.0 - anger_score)
    sadness_score = 0.2 if anger_score > 0.6 else 0.1
    
    return {
        "anger_score": anger_score,
        "emotion_scores": {
            "anger": anger_score,
            "joy": joy_score,
            "sadness": sadness_score
        }
    }
