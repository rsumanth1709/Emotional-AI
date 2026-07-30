"""
MindCare AI — Language Translator
Uses Google Translate Web API for lightweight, free translation 
to support all languages in the world, including transliterated/hybrid 
languages (like Tenglish, Hinglish, Benglish, etc.) without requiring premium keys.
"""
import urllib.parse
import urllib.request
import json
import re
from typing import Dict, Tuple
from app.utils.logger import logger

def detect_and_translate(text: str) -> Tuple[str, str]:
    """
    Detects the language of the input text and translates it to English.
    Handles hybrid languages (like Tenglish, Hinglish, Spanglish) which are 
    written in the Latin/English script but use foreign vocabulary.
    
    Returns:
        Tuple of (translated_text_en, detected_language_code)
    """
    if not text or len(text.strip()) < 2:
        return text, "en"

    # Keywords matching Telugu (Tenglish) common words
    tenglish_words = {
        "ela", "vunnav", "unnaru", "emi", "chestunav", "chestunnaru", "naku", "chala", "bagundi", "baguunanu",
        "bagunnanu", "ledu", "kuda", "enti", "vishayam", "mosapoyanu", "mosam", "chesaru", "undhi", "avu",
        "telugu", "avunu", "cheppandi", "cheppu", "eroju", "erooju", "ninna", "repu", "avuna", "nijama",
        "kadhane", "ledhu", "cheppana", "cheppava", "emti", "sare", "sarei", "nenu", "neenu", "naa", "na",
        "baga", "rayaledhu", "rayaledu", "valu", "valla", "avuthundhi", "avuthundi"
    }
    
    # Keywords matching Hindi (Hinglish) common words
    hinglish_words = {
        "kya", "kar", "rahe", "ho", "aaj", "bohot", "bahut", "mujhe", "hai", "thik", "theek", "yaar",
        "kaise", "batao", "bataiye", "hua", "dhoka", "gaya", "nhi", "nahi", "haan", "acha", "accha",
        "suno", "samajh", "yaar", "chal", "rha", "rhi", "gayi", "gya"
    }

    text_lower = text.lower().strip()
    words = set(re.findall(r'\b\w+\b', text_lower))

    # Pre-emptively label language code if hybrid vocab is matched
    manual_lang = None
    if words.intersection(tenglish_words):
        manual_lang = "transliterated"
    elif words.intersection(hinglish_words):
        manual_lang = "transliterated"

    try:
        # Use Google Translate free API endpoint
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + urllib.parse.quote(text)
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            # Google Translate format: [[["translated_text", "original_text", ...]], ..., "detected_lang"]
            translated_chunks = []
            if data and isinstance(data, list) and data[0]:
                for chunk in data[0]:
                    if chunk and isinstance(chunk, list) and chunk[0]:
                        translated_chunks.append(chunk[0])
            
            translated_text = "".join(translated_chunks).strip()
            
            # Detect language code (usually at index 2 or 8 in the response array)
            detected_lang = "en"
            if len(data) > 2 and isinstance(data[2], str):
                detected_lang = data[2]
            elif len(data) > 8 and isinstance(data[8], list) and data[8][0] and isinstance(data[8][0], list):
                detected_lang = data[8][0][0]
                
            # If translation made a substantial difference or detected non-en, it's a hybrid language
            if manual_lang:
                detected_lang = manual_lang
            elif translated_text.lower() != text.lower().strip() and detected_lang == "en":
                detected_lang = "transliterated"
                
            logger.info(f"Language auto-detected: {detected_lang} -> Translated: '{translated_text}'")
            return translated_text or text, detected_lang
            
    except Exception as e:
        logger.warning(f"Translation/Language detection failed: {e}. Falling back to original text.")
        return text, manual_lang or "en"


def translate_to_language(text: str, target_lang: str) -> str:
    """
    Translates English text into target_lang (e.g. 'es', 'hi', 'fr', 'de', 'zh', 'ar', 'ta', 'te', 'ja')
    to ensure responses are strictly delivered in the user's spoken/requested language.
    """
    if not text or not target_lang or target_lang in ("en", "en-US", "auto", "transliterated"):
        return text

    # Extract short 2-letter language code (e.g. 'es-ES' -> 'es', 'hi-IN' -> 'hi')
    lang_code = target_lang.split("-")[0].lower()
    if lang_code == "en":
        return text

    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={lang_code}&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            translated_chunks = []
            if data and isinstance(data, list) and data[0]:
                for chunk in data[0]:
                    if chunk and isinstance(chunk, list) and chunk[0]:
                        translated_chunks.append(chunk[0])
            translated_text = "".join(translated_chunks).strip()
            logger.info(f"Response translated to '{lang_code}': '{translated_text[:60]}...'")
            return translated_text or text
    except Exception as e:
        logger.warning(f"Translation to {target_lang} failed: {e}")
        return text
