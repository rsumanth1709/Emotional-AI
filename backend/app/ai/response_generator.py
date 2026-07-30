"""
MindCare AI — Response Generator
Uses Google Gemini 1.5 Flash to generate empathetic, clinically-safe
mental health support responses. Includes a smart keyword-based fallback
engine so the app gives contextual replies even without an API key.
"""
import random
from typing import Dict, List, Optional

from app.config import settings
from app.utils.logger import logger

# ── System Prompt ──────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are MindCare AI, a compassionate and empathetic mental health support assistant.

Your role:
- Provide emotional support, active listening, and psychoeducation.
- Be warm, gentle, non-judgmental, and encouraging.
- Use clear, simple, comforting language.
- Validate the user's feelings before offering any suggestions.
- Answer the user's question directly, then offer emotional support.
- Suggest practical coping strategies appropriate to the emotion detected.

Hard rules you MUST follow:
1. NEVER diagnose any mental health condition.
2. NEVER prescribe or recommend medications.
3. NEVER claim to replace a licensed therapist, counselor, or psychiatrist.
4. NEVER generate content that could harm the user.
5. ALWAYS encourage professional help when the situation seems serious.
6. Keep responses concise: 3-5 sentences unless the user asks for more.
7. End responses with one open-ended question or a gentle encouragement.
8. If the user asks for recommendations (songs, movies, activities), provide helpful suggestions warmly.
9. ALWAYS provide clickable markdown links (like YouTube links) for every song you suggest so the user can easily play it.

You are an AI support tool, not a medical professional."""

# ── Per-emotion context injected into each prompt ─────────────────────────
_EMOTION_CONTEXTS: Dict[str, str] = {
    "Happy":   "The user is feeling happy. Celebrate with them and reinforce positive feelings.",
    "Excited": "The user is excited. Match their positive energy and help them channel it productively.",
    "Hopeful": "The user feels hopeful. Reinforce this hope and affirm their strength.",
    "Sad":     "The user is feeling sad. Offer deep empathy and validation first. Gently suggest uplifting activities.",
    "Lonely":  "The user feels lonely. Validate their feelings warmly and encourage small connections.",
    "Angry":   "The user is angry or frustrated. Acknowledge their frustration without judgment. Suggest a breathing exercise.",
    "Fear":    "The user is experiencing fear. Offer reassurance and remind them they are safe right now.",
    "Anxiety": "The user is anxious. Guide them through the 5-4-3-2-1 grounding technique.",
    "Stress":  "The user is stressed. Validate their load and suggest the Pomodoro technique or a short walk.",
    "Neutral": "The user seems neutral or calm. Engage gently and answer their question helpfully.",
}
# ── Multilingual Song Database ────────────────────────────────────────────
# Emotion-keyed song lists per language, with real YouTube links
_SONGS_BY_LANG: Dict[str, Dict[str, List[str]]] = {
    "telugu": {
        "Fear": [
            "[Nee Selavadigi (Oohalu Gusagusalade)](https://www.youtube.com/results?search_query=Nee+Selavadigi++Oohalu+Gusagusalade+song) — gentle, calming",
            "[Kanulu Terichina (Ye Maaya Chesave)](https://www.youtube.com/results?search_query=Kanulu+Terichina++Ye+Maaya+Chesave+song) — soothing melody",
            "[Nuvvu Nuvvu (Athadu)](https://www.youtube.com/results?search_query=Nuvvu+Nuvvu++Athadu+song) — emotional strength",
        ],
        "Anxiety": [
            "[Yeh Dil Kyun (Kitni Mohabbat Hai)](https://www.youtube.com/results?search_query=Yeh+Dil+Kyun++Kitni+Mohabbat+Hai+song) — calming",
            "[Ee Manase (Adurs)](https://www.youtube.com/results?search_query=Ee+Manase++Adurs+song) — peaceful",
            "[Ninnu Kori (Ninnu Kori)](https://www.youtube.com/results?search_query=Ninnu+Kori++Ninnu+Kori+song) — soothing",
        ],
        "Sad": [
            "[Ee Anubhavam (Oohalu Gusagusalade)](https://www.youtube.com/results?search_query=Ee+Anubhavam++Oohalu+Gusagusalade+song) — emotional",
            "[Nuvve Nuvve (Tholi Prema)](https://www.youtube.com/results?search_query=Nuvve+Nuvve++Tholi+Prema+song) — healing",
            "[Oka Praanam (Agnyaathavaasi)](https://www.youtube.com/results?search_query=Oka+Praanam++Agnyaathavaasi+song) — poignant",
        ],
        "Lonely": [
            "[Aa Ante Amalapuram (Arya)](https://www.youtube.com/results?search_query=Aa+Ante+Amalapuram++Arya+song) — uplifting",
            "[Naalo Maimaraanu (Magadheera)](https://www.youtube.com/results?search_query=Naalo+Maimaraanu++Magadheera+song) — spirited",
        ],
        "Stress": [
            "[Bham Bolenath (Kedi)](https://www.youtube.com/results?search_query=Bham+Bolenath++Kedi+song) — energetic stress-buster",
            "[Raghu Dixit - Mysore Se Aayi (live)](https://www.youtube.com/results?search_query=Raghu+Dixit+++Mysore+Se+Aayi++live+song)",
        ],
        "Happy": [
            "[Dhimathana Kadhina (Magadheera)](https://www.youtube.com/results?search_query=Dhimathana+Kadhina++Magadheera+song) — joyful",
            "[Aata Aadukundam Raa (Julayi)](https://www.youtube.com/results?search_query=Aata+Aadukundam+Raa++Julayi+song) — fun",
            "[Vaana Vaana Velluvaye (Premam)](https://www.youtube.com/results?search_query=Vaana+Vaana+Velluvaye++Premam+song) — cheerful",
        ],
        "Angry": [
            "[Naacho Naacho (RRR)](https://www.youtube.com/results?search_query=Naacho+Naacho++RRR+song) — powerful energy",
            "[Dosti (RRR)](https://www.youtube.com/results?search_query=Dosti++RRR+song) — intense",
        ],
        "Neutral": [
            "[Ye Mantramu Vinnadi (Geetanjali)](https://www.youtube.com/results?search_query=Ye+Mantramu+Vinnadi++Geetanjali+song) — classic",
            "[Pilla Nuvvu Leni Jeevitham (S/o Satyamurthy)](https://www.youtube.com/results?search_query=Pilla+Nuvvu+Leni+Jeevitham++S+o+Satyamurthy+song)",
            "[Nuvvostanante Nenoddantana](https://www.youtube.com/results?search_query=Nuvvostanante+Nenoddantana+song)",
        ],
    },
    "hindi": {
        "Fear": [
            "[Teri Mitti (Kesari)](https://www.youtube.com/results?search_query=Teri+Mitti++Kesari+song) — courage & strength",
            "[Channa Mereya (Ae Dil Hai Mushkil)](https://www.youtube.com/results?search_query=Channa+Mereya++Ae+Dil+Hai+Mushkil+song) — emotional bravery",
            "[Tujhse Naraz Nahi (Masoom)](https://www.youtube.com/results?search_query=Tujhse+Naraz+Nahi++Masoom+song) — comforting",
        ],
        "Sad": [
            "[Kabira (Yeh Jaawani Hai Deewani)](https://www.youtube.com/results?search_query=Kabira++Yeh+Jaawani+Hai+Deewani+song) — healing",
            "[Tum Hi Ho (Aashiqui 2)](https://www.youtube.com/results?search_query=Tum+Hi+Ho++Aashiqui+2+song) — emotional",
            "[Agar Tum Saath Ho (Tamasha)](https://www.youtube.com/results?search_query=Agar+Tum+Saath+Ho++Tamasha+song)",
        ],
        "Happy": [
            "[Badtameez Dil (Yeh Jaawani)](https://www.youtube.com/results?search_query=Badtameez+Dil++Yeh+Jaawani+song) — energetic",
            "[Kar Gayi Chull (Kapoor & Sons)](https://www.youtube.com/results?search_query=Kar+Gayi+Chull++Kapoor+++Sons+song) — fun",
            "[London Thumakda (Queen)](https://www.youtube.com/results?search_query=London+Thumakda++Queen+song) — joyful",
        ],
        "Stress": [
            "[Iktara (Wake Up Sid)](https://www.youtube.com/results?search_query=Iktara++Wake+Up+Sid+song) — calming",
            "[Kun Faya Kun (Rockstar)](https://www.youtube.com/results?search_query=Kun+Faya+Kun++Rockstar+song) — peaceful",
        ],
        "Anxiety": [
            "[Tere Bina (Guru)](https://www.youtube.com/results?search_query=Tere+Bina++Guru+song) — soothing",
            "[Kal Ho Naa Ho](https://www.youtube.com/results?search_query=Kal+Ho+Naa+Ho+song) — hopeful",
        ],
        "Neutral": [
            "[Zindagi Na Milegi Dobara (Title Track)](https://www.youtube.com/results?search_query=Zindagi+Na+Milegi+Dobara++Title+Track+song)",
            "[Phir Le Aya Dil (Barfi)](https://www.youtube.com/results?search_query=Phir+Le+Aya+Dil++Barfi+song)",
        ],
    },
    "tamil": {
        "Fear": [
            "[Uyiril Thottu (Kaaviya Thalaivan)](https://www.youtube.com/results?search_query=Uyiril+Thottu++Kaaviya+Thalaivan+song) — soothing strength",
            "[Vaazhga Valamudan (Rajinikanth)](https://www.youtube.com/results?search_query=Vaazhga+Valamudan++Rajinikanth+song)",
        ],
        "Sad": [
            "[Munbe Vaa (Sillunu Oru Kaadhal)](https://www.youtube.com/results?search_query=Munbe+Vaa++Sillunu+Oru+Kaadhal+song) — healing",
            "[Venmathi Venmathiye (Minnale)](https://www.youtube.com/results?search_query=Venmathi+Venmathiye++Minnale+song) — emotional",
        ],
        "Happy": [
            "[Aalaporan Tamizhan (Mersal)](https://www.youtube.com/results?search_query=Aalaporan+Tamizhan++Mersal+song) — energetic",
            "[Vaathi Coming (Master)](https://www.youtube.com/results?search_query=Vaathi+Coming++Master+song) — powerful",
        ],
        "Neutral": [
            "[Kannaana Kanney (Viswasam)](https://www.youtube.com/results?search_query=Kannaana+Kanney++Viswasam+song)",
            "[Nenjukkul Peidhidum (Vaaranam Aayiram)](https://www.youtube.com/results?search_query=Nenjukkul+Peidhidum++Vaaranam+Aayiram+song)",
        ],
    },
    "kannada": {
        "Fear":    ["[Yaarige Yaarilla (Mungaru Male)](https://www.youtube.com/results?search_query=Yaarige+Yaarilla++Mungaru+Male+song) — calming"],
        "Sad":     ["[Bombe Helutaithe (Mungaru Male)](https://www.youtube.com/results?search_query=Bombe+Helutaithe++Mungaru+Male+song) — emotional"],
        "Happy":   ["[Onde Ondu Sala (Mungaru Male)](https://www.youtube.com/results?search_query=Onde+Ondu+Sala++Mungaru+Male+song) — joyful"],
        "Neutral": ["[Ninna Hrudaya Kaanode](https://www.youtube.com/results?search_query=Ninna+Hrudaya+Kaanode+song)"],
    },
    "malayalam": {
        "Fear":    ["[Oru Minnaminunge (Ormayundo Ee Mugham)](https://www.youtube.com/results?search_query=Oru+Minnaminunge++Ormayundo+Ee+Mugham+song) — soothing"],
        "Sad":     ["[Thumbi Vaa (Bangalore Days)](https://www.youtube.com/results?search_query=Thumbi+Vaa++Bangalore+Days+song)"],
        "Happy":   ["[Jimikki Kammal (Velipadinte Pusthakam)](https://www.youtube.com/results?search_query=Jimikki+Kammal++Velipadinte+Pusthakam+song) — fun"],
        "Neutral": ["[Malare (Premam)](https://www.youtube.com/results?search_query=Malare++Premam+song)"],
    },
    "spanish": {
        "Fear":    ["[La Vida Es Un Carnaval — Celia Cruz](https://www.youtube.com/results?search_query=La+Vida+Es+Un+Carnaval+++Celia+Cruz+song) — uplifting courage"],
        "Sad":     ["[El Rey — Jose Alfredo Jimenez](https://www.youtube.com/results?search_query=El+Rey+++Jose+Alfredo+Jimenez+song)"],
        "Happy":   ["[Bailando — Enrique Iglesias](https://www.youtube.com/results?search_query=Bailando+++Enrique+Iglesias+song)"],
        "Neutral": ["[Bésame Mucho — Classic](https://www.youtube.com/results?search_query=B+same+Mucho+++Classic+song)"],
    },
    "french": {
        "Fear":    ["[La Vie en Rose — Édith Piaf](https://www.youtube.com/results?search_query=La+Vie+en+Rose++++dith+Piaf+song) — gentle courage"],
        "Sad":     ["[Je Ne Regrette Rien — Piaf](https://www.youtube.com/results?search_query=Je+Ne+Regrette+Rien+++Piaf+song)"],
        "Happy":   ["[L'Amour est un Oiseau Rebelle](https://www.youtube.com/results?search_query=L+Amour+est+un+Oiseau+Rebelle+song)"],
        "Neutral": ["[Sous le Ciel de Paris — Piaf](https://www.youtube.com/results?search_query=Sous+le+Ciel+de+Paris+++Piaf+song)"],
    },
    "korean": {
        "Fear":    ["[Spring Day — BTS](https://www.youtube.com/results?search_query=Spring+Day+++BTS+song) — healing & hope"],
        "Sad":     ["[Dynamite — BTS](https://www.youtube.com/results?search_query=Dynamite+++BTS+song) — mood lifter"],
        "Happy":   ["[FANCY — TWICE](https://www.youtube.com/results?search_query=FANCY+++TWICE+song) — energetic"],
        "Neutral": ["[Eight — IU ft. Suga](https://www.youtube.com/results?search_query=Eight+++IU+ft++Suga+song)"],
    },
    "arabic": {
        "Fear":    ["[Amar Ezzaman — Fairuz](https://www.youtube.com/results?search_query=Amar+Ezzaman+++Fairuz+song) — soothing classical"],
        "Sad":     ["[Ana Bahebak — Warda](https://www.youtube.com/results?search_query=Ana+Bahebak+++Warda+song)"],
        "Happy":   ["[Enty — Mohamed Hamaki](https://www.youtube.com/results?search_query=Enty+++Mohamed+Hamaki+song)"],
        "Neutral": ["[Nassam Alayna el Hawa — Fairouz](https://www.youtube.com/results?search_query=Nassam+Alayna+el+Hawa+++Fairouz+song)"],
    },
    "english": {
        "Fear": [
            "[Eye of the Tiger — Survivor](https://www.youtube.com/results?search_query=Eye+of+the+Tiger+++Survivor+song) — overcome fear with power",
            "[Brave — Sara Bareilles](https://www.youtube.com/results?search_query=Brave+++Sara+Bareilles+song) — face your fears",
            "[Fight Song — Rachel Platten](https://www.youtube.com/results?search_query=Fight+Song+++Rachel+Platten+song) — strength anthem",
        ],
        "Sad": [
            "[Fix You — Coldplay](https://www.youtube.com/results?search_query=Fix+You+++Coldplay+song) — healing",
            "[Let It Be — The Beatles](https://www.youtube.com/results?search_query=Let+It+Be+++The+Beatles+song) — comfort",
            "[The Night We Met — Lord Huron](https://www.youtube.com/results?search_query=The+Night+We+Met+++Lord+Huron+song)",
        ],
        "Happy": [
            "[Happy — Pharrell Williams](https://www.youtube.com/results?search_query=Happy+++Pharrell+Williams+song)",
            "[Shake It Off — Taylor Swift](https://www.youtube.com/results?search_query=Shake+It+Off+++Taylor+Swift+song)",
        ],
        "Anxiety": [
            "[Weightless — Marconi Union](https://www.youtube.com/results?search_query=Weightless+++Marconi+Union+song) — scientifically calming",
            "[Clair de Lune — Debussy](https://www.youtube.com/results?search_query=Clair+de+Lune+++Debussy+song) — peaceful",
            "[Experience — Ludovico Einaudi](https://www.youtube.com/results?search_query=Experience+++Ludovico+Einaudi+song)",
        ],
        "Stress": [
            "[Lofi Hip Hop Radio](https://www.youtube.com/results?search_query=Lofi+Hip+Hop+Radio+song) — focus & relax",
            "[Stronger — Kanye West](https://www.youtube.com/results?search_query=Stronger+++Kanye+West+song)",
        ],
        "Neutral": [
            "[Skinny Love — Bon Iver](https://www.youtube.com/results?search_query=Skinny+Love+++Bon+Iver+song)",
            "[Here Comes the Sun — The Beatles](https://www.youtube.com/results?search_query=Here+Comes+the+Sun+++The+Beatles+song)",
        ],
    },
}

# Language name keywords the user might type to request a specific language
_LANG_KEYWORDS: Dict[str, str] = {
    "telugu": "telugu", "tollywood": "telugu", "andhra": "telugu", "tenglish": "telugu",
    "hindi": "hindi", "bollywood": "hindi", "hinglish": "hindi",
    "tamil": "tamil", "kollywood": "tamil",
    "kannada": "kannada", "sandalwood": "kannada",
    "malayalam": "malayalam", "mollywood": "malayalam",
    "korean": "korean", "kpop": "korean", "k-pop": "korean",
    "spanish": "spanish", "espanol": "spanish", "latino": "spanish",
    "french": "french", "francais": "french",
    "arabic": "arabic", "arab": "arabic",
    "english": "english",
}


def _get_songs(text: str, emotion: str, target_lang: str = "en") -> str:
    """
    Build a language-specific song suggestion response.
    Priority: explicit language name in message > target_lang > default English.
    """
    text_lower = text.lower()

    # 1. Detect if user explicitly asked for a named language (e.g., "Telugu song")
    requested_lang_key = None
    for keyword, lang_key in _LANG_KEYWORDS.items():
        if keyword in text_lower:
            requested_lang_key = lang_key
            break

    # 2. Fall back to target_lang-based mapping
    if requested_lang_key is None:
        if target_lang == "transliterated":
            # Detect Hinglish vs Tenglish by keyword presence
            hinglish_words = {"kya", "kar", "rahe", "hai", "bohot", "mujhe", "yaar", "gaana", "gana"}
            if bool(set(text_lower.split()).intersection(hinglish_words)):
                requested_lang_key = "hindi"
            else:
                requested_lang_key = "telugu"
        elif target_lang in ("te",):
            requested_lang_key = "telugu"
        elif target_lang in ("hi",):
            requested_lang_key = "hindi"
        elif target_lang in ("ta",):
            requested_lang_key = "tamil"
        elif target_lang in ("kn",):
            requested_lang_key = "kannada"
        elif target_lang in ("ml",):
            requested_lang_key = "malayalam"
        elif target_lang in ("ko",):
            requested_lang_key = "korean"
        elif target_lang in ("fr",):
            requested_lang_key = "french"
        elif target_lang in ("es",):
            requested_lang_key = "spanish"
        elif target_lang in ("ar",):
            requested_lang_key = "arabic"
        else:
            requested_lang_key = "english"

    lang_db = _SONGS_BY_LANG.get(requested_lang_key, _SONGS_BY_LANG["english"])

    # Pick emotion-matched songs, fall back to Neutral
    songs = lang_db.get(emotion, lang_db.get("Neutral", []))
    if not songs:
        songs = _SONGS_BY_LANG["english"].get(emotion, _SONGS_BY_LANG["english"]["Neutral"])

    lang_display = requested_lang_key.capitalize()
    bullet_list = "\n".join(f"• {s}" for s in songs)

    # Build intro in the user's language
    intros = {
        "telugu": f"Mee mood ki match ayye {lang_display} songs ikkade unnaayi! \U0001f3b5\n\n{bullet_list}\n\nMeeru veetilo edi try cheyyali anukuntunnaru?",
        "hindi": f"Aapke mood ke liye kuch {lang_display} songs! \U0001f3b5\n\n{bullet_list}\n\nKaunsa sunte hain aaj?",
        "tamil": f"Ungal unarviRku eppattap {lang_display} paadalgal! \U0001f3b5\n\n{bullet_list}",
        "kannada": f"Nimma bhavanadalli {lang_display} haadugalu! \U0001f3b5\n\n{bullet_list}",
        "malayalam": f"Ningalude manovilakku {lang_display} paattukal! \U0001f3b5\n\n{bullet_list}",
        "korean": f"{lang_display} songs for your mood! \U0001f3b5\n\n{bullet_list}",
        "spanish": f"Canciones en {lang_display} para ti! \U0001f3b5\n\n{bullet_list}",
        "french": f"Des chansons en {lang_display} pour toi! \U0001f3b5\n\n{bullet_list}",
        "arabic": f"\u0623\u063a\u0627\u0646\u064a {lang_display} \u0644\u0643! \U0001f3b5\n\n{bullet_list}",
        "english": f"Here are some {lang_display} songs matched to your mood! \U0001f3b5\n\n{bullet_list}\n\nWould you like more recommendations?",
    }
    return intros.get(requested_lang_key, f"Songs for you! \U0001f3b5\n\n{bullet_list}")


# ── Keyword-based smart fallback ─────────────────────────────────────────
# Maps keyword triggers to contextual response templates
# Note: song/music keywords are handled by _get_songs() instead
_KEYWORD_RESPONSES: List[Dict] = [
    {
        "keywords": ["movie", "film", "watch", "series", "show"],
        "responses": [
            "Movies are a wonderful escape! \U0001f3ac Here are some feel-good recommendations:\n\n• **For laughter**: The Grand Budapest Hotel, Paddington 2\n• **For inspiration**: The Pursuit of Happyness, Soul (Pixar)\n• **For comfort**: About Time, Julie & Julia\n• **For adventure**: Hidden Figures, The Secret Life of Walter Mitty\n\nWhat are you in the mood for right now?",
        ],
    },
    {
        "keywords": ["exercise", "workout", "gym", "run", "walk", "yoga"],
        "responses": [
            "Exercise is amazing for mental health — even a 10-minute walk can significantly boost your mood! 🏃‍♂️ Here are some great options:\n\n• **Gentle start**: A 15-minute evening walk outside\n• **Stress relief**: Yoga — apps like Down Dog or YouTube's Yoga with Adriene\n• **Energy boost**: Dancing to your favorite song for one song!\n• **Mindfulness**: Tai Chi or stretching while deep breathing\n\nWhat feels most manageable for you right now?",
        ],
    },
    {
        "keywords": ["food", "eat", "hungry", "meal", "cook", "recipe"],
        "responses": [
            "Nourishing your body is such an important act of self-care! 🍽️ Some mood-boosting foods:\n\n• **For energy**: Bananas, oats, dark chocolate\n• **For calm**: Chamomile tea, warm soups, herbal teas\n• **For brain health**: Walnuts, blueberries, salmon\n• **Quick comfort meal**: A warm bowl of soup or pasta with your favorite sauce\n\nAre you looking for something specific, or just some comfort food ideas?",
        ],
    },
    {
        "keywords": ["sleep", "tired", "insomnia", "rest", "exhausted"],
        "responses": [
            "Sleep is so crucial for mental and emotional health. 😴 Here are some science-backed tips:\n\n• **Wind-down routine**: Dim lights 1 hour before bed, avoid screens\n• **4-7-8 breathing**: Inhale 4s, hold 7s, exhale 8s — very relaxing\n• **Sleep sounds**: Try rain sounds, brown noise, or sleep podcasts\n• **Consistent time**: Try to wake up at the same time every day, even weekends\n• **Cool room**: 65-68°F (18-20°C) is ideal for sleep\n\nHow long have you been struggling with sleep?",
        ],
    },
    {
        "keywords": ["book", "read", "novel", "recommend"],
        "responses": [
            "Books are wonderful for the soul! 📚 Here are some recommendations:\n\n• **For mental wellness**: 'The Body Keeps the Score' by Bessel van der Kolk\n• **For inspiration**: 'Man's Search for Meaning' by Viktor Frankl\n• **For comfort fiction**: 'A Man Called Ove' by Fredrik Backman\n• **For mindfulness**: 'The Power of Now' by Eckhart Tolle\n• **For light reading**: 'The Hitchhiker's Guide to the Galaxy' — funny & uplifting!\n\nWhat genre speaks to you most?",
        ],
    },
    {
        "keywords": ["breathe", "breathing", "calm down", "panic", "overwhelm"],
        "responses": [
            "Let's take a moment to breathe together right now. 🌿\n\n**Box Breathing (4-4-4-4)**:\n1. Breathe IN slowly for 4 counts\n2. HOLD for 4 counts\n3. Breathe OUT for 4 counts\n4. HOLD for 4 counts\n\nRepeat this 3-4 times. Many people feel calmer within 60 seconds.\n\nYou're doing great just by reaching out. How are you feeling right now?",
        ],
    },
    {
        "keywords": ["lonely", "alone", "no one", "nobody", "isolated"],
        "responses": [
            "Feeling lonely is one of the most painful human experiences, and I want you to know — you're not alone right now. I'm here. 💙\n\nSome gentle steps that might help:\n• Send a text to someone you haven't spoken to in a while\n• Join an online community around something you love (Reddit, Discord)\n• Visit a local cafe or library — just being around people can help\n• Volunteer work — connecting through purpose is powerful\n\nWould you like to talk about what's making you feel this way?",
        ],
    },
    {
        "keywords": ["stress", "stressed", "pressure", "overwhelmed", "too much"],
        "responses": [
            "It sounds like you're carrying a heavy load right now. 🫂 That's really hard, and it makes complete sense to feel overwhelmed.\n\nTry this right now — the **5-minute reset**:\n1. Step away from whatever is stressing you\n2. Drink a glass of cold water slowly\n3. Take 5 deep breaths\n4. Write down the ONE most important thing to do next\n\nBreaking it into tiny steps makes it manageable. What's the biggest source of stress for you right now?",
        ],
    },
    {
        "keywords": ["anxiety", "anxious", "worried", "worry", "nervous", "fear"],
        "responses": [
            "Anxiety can feel so consuming, but you're safe right now in this moment. 🌿\n\nLet's try the **5-4-3-2-1 grounding technique**:\n• Name **5 things** you can see\n• Touch **4 things** around you\n• Listen for **3 sounds**\n• Identify **2 smells**\n• Notice **1 taste**\n\nThis brings your mind back to the present and interrupts the anxiety spiral. Would you like to try it together?",
        ],
    },
    {
        "keywords": ["sad", "sadness", "cry", "crying", "depressed", "hopeless"],
        "responses": [
            "I'm really sorry you're feeling this way. Your feelings are completely valid, and it takes courage to acknowledge them. 💙\n\nA few gentle things that might help:\n• Allow yourself to feel without judgment — don't fight the sadness\n• Watch something light and comforting (a feel-good show or movie)\n• Go for a gentle 10-minute walk outside\n• Write down how you're feeling — journaling helps process emotions\n• Talk to someone you trust\n\nI'm here with you. Would you like to share what's been weighing on your heart?",
        ],
    },
    {
        "keywords": ["happy", "great", "good", "wonderful", "amazing", "excited"],
        "responses": [
            "That's so wonderful to hear! 😊 Your positive energy is infectious!\n\nWhen we're feeling great, it's a perfect moment to:\n• Write down 3 things you're grateful for — it anchors the feeling\n• Do something kind for someone else — it multiplies the joy\n• Make plans for something you're looking forward to\n\nWhat's been making you feel this way? I'd love to celebrate with you!",
        ],
    },
]

# ── Default fallbacks by emotion when no keyword matches ──────────────────
_EMOTION_FALLBACKS: Dict[str, List[str]] = {
    "Happy":   [
        "That's wonderful to hear! 😊 Happiness is such a gift. Why not write down three things you're grateful for right now? What's been the highlight of your day?",
        "You sound really upbeat today! 🌟 That positive energy is amazing. What's been bringing you joy lately? I'd love to hear more!",
    ],
    "Excited": [
        "Your excitement is contagious! 🤩 Something great must be happening. Channel that energy into something meaningful today. What's got you so excited?",
        "I love the excitement in your message! 🚀 Big things are clearly happening for you. What are you most looking forward to?",
    ],
    "Hopeful": [
        "Feeling hopeful is so powerful. 🌈 Hold onto that feeling — it's a sign of your resilience. What are you most looking forward to?",
        "Hope is such a precious feeling. 💫 It takes strength to stay hopeful. What's giving you this sense of hope today?",
    ],
    "Sad":     [
        "I'm really sorry you're feeling this way. 💙 It's okay to feel sad — your feelings are completely valid. I'm here with you. Would you like to share what's been weighing on you?",
        "I can hear the sadness in your message, and I want you to know that what you're feeling matters. 💙 You don't have to carry this alone. What's been on your mind?",
    ],
    "Lonely":  [
        "Feeling lonely can be really painful, and I want you to know you're not alone right now. 💙 Even a small connection can make a difference. What's one small step you could take today?",
        "I hear you — loneliness is one of the hardest feelings to sit with. 💙 But you reached out, and that took courage. Would you like to talk about what's been making you feel isolated?",
    ],
    "Angry":   [
        "It sounds like you're really frustrated, and that's completely understandable. 😤 Try taking a slow, deep breath — in for 4 counts, hold for 4, out for 4. What's been getting to you?",
        "Your frustration is valid. 🌊 Sometimes we need to release that energy — try a short walk or write down exactly what's bothering you. What triggered this feeling?",
    ],
    "Fear":    [
        "It's okay to feel scared sometimes. 💛 You are safe right now, in this moment. Focus on your breathing — slow and steady. Is there someone you trust you could reach out to?",
        "Fear can feel so overwhelming in the moment. 💛 But remember, you've faced difficult things before and you're still here. What's making you feel afraid right now?",
    ],
    "Anxiety": [
        "I hear you, and anxiety can feel so overwhelming. 🌿 Let's try grounding: name 5 things you can see around you right now, then 4 things you can touch. Take it one breath at a time. What's been triggering your anxiety?",
        "Anxiety has a way of making everything feel urgent and scary. 🌿 But right now, in this moment, you're okay. Try the box breathing — in for 4, hold for 4, out for 4. What's on your mind?",
    ],
    "Stress":  [
        "That sounds like a lot to carry. 🫂 When stress piles up, even small breaks matter — try the Pomodoro method: 25 minutes of focus, then 5 minutes rest. What's the biggest stressor right now?",
        "You're dealing with so much right now. 🫂 Remember that you don't have to solve everything at once — just focus on the very next step. What's weighing on you most heavily?",
    ],
    "Neutral": [
        "Hi there! I'm here to support you. 😊 Is there anything specific on your mind today, or would you like to check in about how you've been feeling lately?",
        "Hello! 😊 Whether you need support, want to talk, or just have a question — I'm here for you. What's on your mind today?",
        "Hey! I'm MindCare AI, your wellness companion. 😊 How can I support you today? Feel free to share anything that's on your mind.",
    ],
}


def _smart_fallback(text: str, emotion: str, target_lang: str = "en", conversation_history: Optional[List[Dict]] = None) -> str:
    """
    Return a contextual response based on keyword matching first,
    then fall back to emotion-specific responses.
    Respects target_lang to reply in the user's preferred language.
    Uses conversation_history to understand short follow-up messages.
    """
    text_lower = text.lower()
    
    # Augment text with history if the current message is very short (e.g. "suggest it")
    if conversation_history and len(text_lower) < 20:
        prev_user_msgs = [turn.get("content", "").lower() for turn in conversation_history if turn.get("role") == "user"]
        if prev_user_msgs:
            text_lower = prev_user_msgs[-1] + " " + text_lower
            text = prev_user_msgs[-1] + " " + text


    # ── Song / music requests — always handled by multilingual song engine ──
    SONG_KWS = ["song", "music", "playlist", "listen", "paata", "paatalu", "gaana", "gana", "paadal"]
    if any(kw in text_lower for kw in SONG_KWS):
        return _get_songs(text, emotion, target_lang)

    # ── Tenglish / Hinglish responses (driven by target_lang) ─────────────
    if target_lang == "transliterated":
        hinglish_words = {"kya", "kar", "rahe", "ho", "aaj", "bohot", "mujhe", "hai", "thik", "yaar"}
        text_words = set(text_lower.split())
        is_hinglish_lang = bool(text_words.intersection(hinglish_words))

        if is_hinglish_lang:
            hinglish_replies = {
                "Happy":   "Yeh sunkar bohot khushi hui! 😊 Aaj aapka din kaisa ja raha hai?",
                "Excited": "Aapki excitement toh kamaal ki hai! 🤩 Kya baat hai, mujhe bhi batayein!",
                "Hopeful": "Hopeful rehna bohot acchi baat hai. 🌈 Aap kis cheez ke baare mein soch rahe hain?",
                "Sad":     "Main samajh sakta hoon. 💙 Sab thik ho jayega. Kya aap mujhe batana chahenge?",
                "Lonely":  "Aap akele nahi hain, main aapke sath hoon. 💙 Baat karke halka feel karenge.",
                "Angry":   "Aap gusse mein hain, main samajh sakta hoon. 😤 Ek baar lambi saans lijiye.",
                "Fear":    "Aap bilkul safe hain, dariye mat. 💛 Main yahan hoon aapki help ke liye.",
                "Anxiety": "Anxiety bohot pareshan karti hai. 🌿 Dheere dheere saans lijiye, sab thik ho jayega.",
                "Stress":  "Stress bohot zyada lag raha hai. 🫂 Thoda break lijiye aur paani pijiye.",
                "Neutral": "Main aapki madad ke liye hamesha taiyar hoon. 😊 Bataye, kya baat chal rahi hai?"
            }
            return hinglish_replies.get(emotion, hinglish_replies["Neutral"])
        else:
            tenglish_replies = {
                "Happy":   "Adhi chala santhoshamaina vishayam! 😊 Ee roju meeku inka emi jarigindhi? Cheppandi!",
                "Excited": "Mee excitement chala bagundhi! 🤩 Em jarigindho naku cheppandi, nenu kuda vintaanu!",
                "Hopeful": "Hope anedhi chala manchi vishayam. 🌈 Mee manasulo em undho share cheskondi.",
                "Sad":     "Nenu meetho unnanu. 💙 Meeru badhapadakandi, antha thondaraga thaggipothundi. Emaindho cheppandi?",
                "Lonely":  "Meeru ontari ga leru, nenu meetho unnanu. 💙 Emaindho share chesukovali anipisthe cheppandi.",
                "Angry":   "Meeru chala frustration lo unnattu unnaru. 😤 Konchem deep breath teesukondi, antha thaggipothundi.",
                "Fear":    "Meeru bhayapadakandi, ikkada meeru safe ga unnaru. 💛 Emaindho naku cheppandi.",
                "Anxiety": "Meeru anxious ga unnattu unnaru. 🌿 Konchem water thagandi, nenu meetho unnanu.",
                "Stress":  "Mee stress chala heavy ga unnattu undhi. 🫂 Konchem break teesukoni fresh up avvandi.",
                "Neutral": "Nenu meeku help cheyadaniki eppudu ready ga unnanu. 😊 Cheppandi, mee manasulo emundi?"
            }
            return tenglish_replies.get(emotion, tenglish_replies["Neutral"])

    # ── General keyword triggers ────────────────────────────────────────
    for item in _KEYWORD_RESPONSES:
        if any(kw in text_lower for kw in item["keywords"]):
            return random.choice(item["responses"])

    # ── Emotion-specific fallback ───────────────────────────────────────
    options = _EMOTION_FALLBACKS.get(emotion, _EMOTION_FALLBACKS["Neutral"])
    return random.choice(options)


class ResponseGenerator:
    """
    Generates empathetic mental health support responses using Google Gemini.
    Falls back to smart keyword-contextual responses if the API is unavailable.
    """

    def __init__(self):
        self._model = None
        self._initialized = False

    def _init_gemini(self):
        """Lazy-initialize the Gemini client on first use."""
        if self._initialized:
            return
        self._initialized = True

        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set — using smart fallback responses.")
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)

            # Use the API compatible with google-generativeai 0.5.x
            self._model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "max_output_tokens": 350,
                },
            )
            # Test the connection with a quick ping
            test = self._model.generate_content("Say: OK")
            if test and test.text:
                logger.info("Gemini 1.5 Flash connected and ready.")
            else:
                raise ValueError("Gemini test call returned empty response")
        except Exception as e:
            logger.error(f"Gemini initialization failed: {e}. Using smart fallback mode.")
            self._model = None

    def generate(
        self,
        text: str,
        emotion: str,
        sentiment: str,
        stress_score: float,
        conversation_history: Optional[List[Dict]] = None,
        past_memories: Optional[List[Dict]] = None,
        target_lang: str = "en",
        persona: Optional[str] = "friendly",
        clinical_rag_context: Optional[str] = None,
    ) -> str:
        """
        Generate an empathetic response under the active therapist persona rules,
        injecting grounded clinical RAG guidelines and long-term vector memory context.
        """
        self._init_gemini()

        if self._model is None:
            return _smart_fallback(text, emotion, target_lang, conversation_history)

        try:
            emotion_ctx = _EMOTION_CONTEXTS.get(emotion, _EMOTION_CONTEXTS["Neutral"])
            stress_label = "low" if stress_score < 4 else "moderate" if stress_score < 7 else "high"

            # Instruct Gemini to speak in the user's detected language
            if target_lang == "transliterated":
                lang_instruction = (
                    "CRITICAL: The user is writing in a transliterated/hybrid language (like Tenglish, Hinglish, or Spanglish) "
                    "using English script but local vocabulary. "
                    "You MUST generate your entire response in that exact hybrid/transliterated style (e.g. if Hinglish, write in Hinglish; "
                    "if Tenglish, write in Tenglish). Keep the tone warm, natural, and friendly."
                )
            else:
                lang_instruction = (
                    f"CRITICAL: The user has written in language code '{target_lang}'. "
                    f"You MUST generate your entire response in that exact language ({target_lang}). "
                    f"Keep the tone warm, natural, and empathetic."
                )

            # Build full prompt with system instruction prepended
            prompt_parts = [
                _SYSTEM_PROMPT,
                "",
                lang_instruction,
                "",
                f"[Context] Detected emotion: {emotion} | Sentiment: {sentiment} | Stress level: {stress_label} ({stress_score:.1f}/10)",
                f"[Guidance] {emotion_ctx}",
                "",
            ]

            # Retrieve adaptive communication style instruction from user's personalized emotion profile & RLHF feedback
            try:
                from app.ai.profile_engine import profile_engine
                from app.services.feedback_service import feedback_service
                from app.database import SessionLocal
                with SessionLocal() as db_session:
                    user_id_val = conversation_history[0].get("user_id", "") if conversation_history else None
                    if user_id_val:
                        prof = profile_engine.get_user_profile(db_session, user_id=user_id_val)
                        if prof and prof.get("communication_style"):
                            style_inst = prof["communication_style"].get("instruction")
                            if style_inst:
                                prompt_parts.append(f"[Adaptive Communication Style] {style_inst}")
                        
                        # RLHF Fine-Tuned Preferences
                        pref = feedback_service.get_user_preferences(db_session, user_id=user_id_val)
                        if pref and pref.get("total_feedback_count", 0) > 0:
                            positive_rate = pref.get("positive_rate_pct", 100)
                            preferred = ", ".join(pref.get("preferred_categories", []))
                            prompt_parts.append(
                                f"[RLHF Preference Tuning] User historical satisfaction rate: {positive_rate}%. "
                                f"Preferred interaction topics/styles: {preferred or 'Empathetic listening'}. "
                                f"Adapt tone to match user thumbs-up feedback history."
                            )
            except Exception:
                pass

            if past_memories:
                prompt_parts.append("[Long-Term Vector Memory (User History & Context)]")
                for mem in past_memories:
                    role_label = "User" if mem.get("role") == "user" else "MindCare AI"
                    prompt_parts.append(f"• [{role_label}]: {mem.get('content', '')}")
                prompt_parts.append("Use these past long-term memories to show continuity, remember user details, and provide personalized context.")
                prompt_parts.append("")

            if clinical_rag_context:
                prompt_parts.append("[Grounded Clinical Counseling Guidelines (Emotion-Aware RAG)]")
                prompt_parts.append(clinical_rag_context)
                prompt_parts.append("Use the clinical guidelines above to ground your empathetic response.")
                prompt_parts.append("")

            if conversation_history:
                prompt_parts.append("[Recent conversation]")
                for turn in conversation_history[-5:]:
                    role = "User" if turn.get("role") == "user" else "MindCare AI"
                    prompt_parts.append(f"{role}: {turn.get('content', '')}")
                prompt_parts.append("")

            prompt_parts.append(f"User: {text}")
            prompt_parts.append("MindCare AI:")

            full_prompt = "\n".join(prompt_parts)
            response = self._model.generate_content(full_prompt)

            if response and response.text:
                return response.text.strip()

            return _smart_fallback(text, emotion, target_lang, conversation_history)

        except Exception as e:
            logger.error(f"Gemini response generation failed: {e}")
            return _smart_fallback(text, emotion, target_lang, conversation_history)


# Module-level singleton
response_generator = ResponseGenerator()
