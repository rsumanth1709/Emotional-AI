"""
MindCare AI — Emoji Interpreter
Maps Unicode emojis to their emotional meaning and generates
contextual responses for emoji-only or emoji-heavy messages.
"""
from typing import Dict, Optional, Tuple

# ── Emoji → (emotion_label, expanded_meaning, response) ───────────────────
# Each entry: emoji -> (emotion for analyzer, human meaning, warm response)
EMOJI_MAP: Dict[str, Tuple[str, str, str]] = {
    # ── Joy / Happiness ────────────────────────────────────────────────────
    "😀": ("Happy",   "grinning with happiness",    "You're all smiles! 😀 That's such a wonderful energy. What's making you so happy today?"),
    "😃": ("Happy",   "grinning with big eyes",     "That big smile says it all! 😃 Something great must be happening. Would you like to share?"),
    "😄": ("Happy",   "beaming with joy",           "That beam of happiness is contagious! 😄 I love it. What's the source of your joy?"),
    "😁": ("Happy",   "beaming with smiling eyes",  "Your happiness is shining through! 😁 What's been lighting you up?"),
    "😆": ("Happy",   "laughing and squinting",     "You're cracking up! 😆 Laughter really is the best medicine. What's so funny?"),
    "😅": ("Neutral", "nervous laugh or relief",    "Phew! 😅 That nervous laugh could mean so many things — relief? Awkwardness? Tell me more!"),
    "🤣": ("Happy",   "rolling on the floor laughing", "ROFL! 🤣 Something must be absolutely hilarious right now. What's got you in stitches?"),
    "😂": ("Happy",   "laughing with tears of joy", "Laughing so hard you're crying! 😂 I love that kind of laughter. What's the joke?"),
    "🙂": ("Neutral", "slightly smiling",           "A gentle smile — 🙂 simple and calm. How are you really doing today?"),
    "🙃": ("Neutral", "upside-down, sarcastic or silly", "That upside-down smile 🙃 — are you feeling a little silly, or is something ironically frustrating you?"),
    "😉": ("Happy",   "winking playfully",          "A wink! 😉 Are you being playful, or is there a little secret behind that smile?"),
    "😊": ("Happy",   "smiling warmly",             "That warm smile says a lot! 😊 You seem to be in a good place. What's bringing you peace today?"),
    "😇": ("Happy",   "feeling innocent or angelic", "Feeling like an angel today? 😇 That halo looks good on you! What's put you in such a pure mood?"),
    "🥰": ("Happy",   "feeling loved and adored",   "You're feeling so loved! 🥰 That warmth in your heart is beautiful. Who or what is filling you with love?"),
    "😍": ("Happy",   "heart eyes, deeply in love or amazed", "Heart eyes! 😍 Something or someone clearly has you completely captivated. What's caught your eye?"),
    "🤩": ("Excited", "star-struck and amazed",     "You're absolutely star-struck! 🤩 Something incredible must be happening. What's got you this excited?"),
    "😘": ("Happy",   "blowing a kiss",             "Sending kisses! 😘 That's so sweet. Is there someone special on your mind?"),
    "😋": ("Happy",   "savoring something delicious", "Savoring something yummy? 😋 Whether it's food or a good feeling — enjoy every moment of it!"),
    "😜": ("Happy",   "winking and sticking out tongue, playful", "Being a little cheeky! 😜 I like it. Are you in a playful mood today?"),
    "🤪": ("Happy",   "being zany and wild",        "Feeling totally zany! 🤪 Sometimes a little wild energy is exactly what we need. What's sparked this energy?"),
    "🤑": ("Happy",   "money-mouth, feeling rich or excited about money", "Money-mouth! 🤑 Are you celebrating some good news about finances, or just feeling rich in life?"),
    "🤗": ("Happy",   "giving a warm hug",          "Sending hugs! 🤗 That's such a warm and caring gesture. Is there someone who needs a hug, or are you feeling extra loving?"),

    # ── Thinking / Neutral ─────────────────────────────────────────────────
    "🤔": ("Neutral", "thinking and pondering",     "Deep in thought! 🤔 Something's got your mind working. Would you like to think it through together?"),
    "🤫": ("Neutral", "keeping a secret or being quiet", "Shhh! 🤫 Are you keeping a secret, feeling like staying quiet, or just enjoying some peaceful silence?"),
    "😐": ("Neutral", "feeling neutral or blank",   "Feeling pretty neutral right now? 😐 That's completely okay. Sometimes 'fine' is where we are. Anything on your mind?"),
    "😑": ("Neutral", "feeling expressionless or done", "That expressionless face 😑 — are you feeling a bit 'done' with something, or just in a very calm, flat mood?"),
    "🙄": ("Neutral", "rolling eyes, feeling exasperated", "Rolling your eyes! 🙄 Something or someone clearly got on your nerves. Want to vent about it?"),
    "😬": ("Neutral", "grimacing awkwardly",        "That grimace says it all! 😬 Something awkward or uncomfortable is happening. What's going on?"),
    "🤥": ("Neutral", "lying or feeling dishonest", "That Pinocchio nose! 🤥 Are you joking around, or is something feeling a bit off or dishonest in your world?"),

    # ── Sadness ────────────────────────────────────────────────────────────
    "😌": ("Sad",     "feeling relieved but also a little sad", "That look of quiet calm 😌 — sometimes it comes after letting go of something. How are you really doing?"),
    "😔": ("Sad",     "feeling pensive and sad",    "That pensive look 😔 — I can sense something is weighing on you. I'm here to listen. What's on your heart?"),
    "😢": ("Sad",     "crying softly",              "I see those tears 😢 and I want you to know your feelings are completely valid. You don't have to carry this alone. What's making you sad?"),
    "😭": ("Sad",     "crying loudly and deeply",   "You're really hurting right now 😭 and that's okay. Cry it out — it's a sign you care deeply. I'm here with you. What happened?"),
    "🥺": ("Sad",     "pleading with teary eyes",   "Those pleading eyes 🥺 — something has touched your heart deeply. Are you feeling vulnerable or longing for something?"),
    "🥹": ("Sad",     "holding back tears",         "Holding back tears 🥹 — sometimes the bravest thing is trying not to cry. What's moved you so deeply?"),
    "😞": ("Sad",     "feeling disappointed",       "I can feel the disappointment 😞. It's hard when things don't go the way we hoped. What let you down?"),
    "😣": ("Sad",     "feeling persevering through pain", "Pushing through something really hard 😣. That takes incredible strength. What are you dealing with right now?"),
    "😩": ("Sad",     "feeling weary and exhausted", "Completely worn out 😩. Your mind and body are telling you they need rest. What's been draining you?"),
    "😫": ("Sad",     "feeling tired and overwhelmed", "Utterly exhausted 😫. When everything feels like too much, it's okay to pause. What's overwhelming you?"),
    "😓": ("Sad",     "sweating with worry or sadness", "That worried sweat 😓 — something is stressing you out or making you anxious. What's been weighing on you?"),

    # ── Anger / Frustration ────────────────────────────────────────────────
    "😤": ("Angry",   "huffing with frustration",   "I can feel that frustration! 😤 When things don't go our way, it's completely valid to feel this way. What's got you steaming?"),
    "😡": ("Angry",   "pouting and very angry",     "You're really angry right now 😡, and that's okay. Anger is a signal that something important to you was violated. What happened?"),
    "😠": ("Angry",   "angry and stern",            "That anger is real 😠. I hear you. Sometimes things genuinely make us furious. Would you like to talk about what's bothering you?"),
    "🤬": ("Angry",   "cursing with rage",          "You're absolutely furious! 🤬 Something really crossed a line for you. Take a breath — I'm here. What set this off?"),
    "😈": ("Angry",   "mischievous or darkly playful", "Feeling a little devilish! 😈 Are you in a mischievous mood, or is there some frustration you're channeling into dark humor?"),
    "👿": ("Angry",   "very angry with horns",      "That's some serious anger 👿. Something has really upset you. I'm here to listen without judgment. What's going on?"),

    # ── Fear / Anxiety ─────────────────────────────────────────────────────
    "😨": ("Fear",    "fearful and scared",         "That scared look 😨 — something has frightened you. You're safe here. What's making you feel afraid?"),
    "😰": ("Anxiety", "anxious with sweat",         "Anxious and sweating it out 😰. That's a tough feeling to carry. What's been making you feel this anxious?"),
    "😱": ("Fear",    "screaming in shock or fear", "Shocked or terrified! 😱 Something really startled or scared you. Are you okay? What happened?"),
    "🫨": ("Anxiety", "shaking with nervousness",   "Shaking nervously! 🫨 That trembling feeling of anxiety is really uncomfortable. What has you so on edge?"),
    "😧": ("Fear",    "anguished and scared",       "That anguished look 😧 — you're going through something really difficult. I'm here for you. What's happening?"),
    "😦": ("Fear",    "frowning with open mouth in shock", "That open-mouthed shock 😦 — something unexpected has happened. Are you okay? What's going on?"),

    # ── Confusion / Overwhelm ──────────────────────────────────────────────
    "😕": ("Neutral", "confused and unsure",        "Feeling confused 😕? That's completely okay — life can be puzzling sometimes. What's got you uncertain?"),
    "🫤": ("Neutral", "feeling uncertain or dissatisfied", "That uncertain feeling 🫤 — something doesn't quite sit right with you. What's leaving you feeling this way?"),
    "😟": ("Sad",     "worried and concerned",      "I can see the worry on your face 😟. Something's troubling you. I'm here to help you sort through it. What's on your mind?"),
    "😵": ("Anxiety", "dizzy and overwhelmed",      "Feeling totally overwhelmed and dizzy 😵. When it all spins out of control, it's okay to stop and breathe. What's causing this?"),
    "🤯": ("Anxiety", "mind blown or completely overwhelmed", "Your mind is completely blown 🤯! Whether it's excitement or overwhelm, that's intense. What just happened?"),

    # ── Tiredness / Illness ────────────────────────────────────────────────
    "😴": ("Neutral", "sleeping and exhausted",     "Feeling sleepy 😴? Rest is so important for mental health. Are you not getting enough sleep, or just feeling drained?"),
    "🥱": ("Neutral", "yawning with exhaustion",    "Yawning away 🥱 — your body is clearly telling you it needs rest. Have you been getting enough sleep lately?"),
    "😪": ("Sad",     "sleepy and a little sad",    "That sleepy-sad look 😪 — are you feeling both tired and down? Let's talk about what's going on."),
    "😷": ("Neutral", "feeling sick or unwell",     "Under the weather 😷? I'm sorry you're not feeling well. Physical health really affects our mental wellbeing too. How are you holding up?"),
    "🤒": ("Neutral", "sick with a fever",          "Feeling feverish and unwell 🤒. I hope you get better soon. Make sure to rest and drink plenty of water. How are you feeling emotionally?"),
    "🤕": ("Neutral", "hurt with a head bandage",   "Ouch, that looks painful 🤕! Are you physically hurt, or does this represent an emotional wound too?"),
    "🥵": ("Stress",  "burning up and stressed",    "Feeling completely burnt out and overheated 🥵? That level of stress or physical heat is exhausting. What's got you this overwhelmed?"),
    "🥶": ("Fear",    "freezing cold or scared stiff", "Frozen in the cold 🥶 — are you literally cold, or does this represent feeling paralyzed by fear or anxiety?"),

    # ── Love & Warmth ──────────────────────────────────────────────────────
    "❤️": ("Happy",   "sending love",               "Sending love! ❤️ That warm red heart means so much. Is there someone special you're thinking of, or are you just feeling full of love?"),
    "🧡": ("Happy",   "feeling warm and optimistic", "That warm orange heart 🧡 radiates such positive energy! You seem to be in a really warm, optimistic place. What's bringing you this feeling?"),
    "💛": ("Happy",   "feeling sunny and cheerful",  "A sunny yellow heart! 💛 Happiness and friendship in one little emoji. What's brightening your day?"),
    "💚": ("Happy",   "feeling healthy and at peace", "A green heart 💚 — representing growth, health, and harmony. Are you feeling balanced and at peace today?"),
    "💙": ("Hopeful", "feeling calm and peaceful",   "That calm blue heart 💙 — it speaks of peace, trust, and depth. Are you feeling serene today, or sending support to someone?"),
    "💜": ("Happy",   "feeling spiritual and creative", "Purple heart energy! 💜 Creativity, wisdom, and compassion all in one. What's inspiring this feeling?"),
    "🖤": ("Sad",     "feeling dark or expressing deep love", "A black heart 🖤 — it can mean so many things. Deep love, elegance, or sometimes sadness or pain. Which resonates with you right now?"),
    "🤍": ("Neutral", "feeling pure and innocent",  "A pure white heart 🤍 — clean, innocent, and gentle. What kind of peace or purity are you feeling right now?"),
    "🤎": ("Sad",     "feeling grounded or nostalgic", "A warm brown heart 🤎 — grounded, nostalgic, comforting. Are you feeling connected to something from the past?"),
    "❤️‍🔥": ("Excited", "feeling passionate and on fire", "A heart on fire! ❤️‍🔥 Pure passion and intensity. What (or who) has lit this fire in you?"),
    "❤️‍🩹": ("Sad",   "healing a broken heart",    "A mending heart ❤️‍🩹 — you're in the process of healing. That takes incredible courage. What are you recovering from?"),
    "💔": ("Sad",     "heartbroken",                "A broken heart 💔 — I'm so sorry. Heartbreak is one of the most painful things we experience. Would you like to talk about what happened?"),
    "💕": ("Happy",   "feeling lots of love",       "So much love! 💕 Those two hearts swirling together are beautiful. Who are you showering with affection?"),
    "💖": ("Happy",   "sparkling with love and joy", "A sparkling heart! 💖 Pure joy and love radiating from you. What's making your heart sparkle?"),
    "💯": ("Happy",   "expressing full agreement or perfection", "One hundred percent! 💯 You're feeling confident and on top of your game. What's got you feeling so sure of yourself?"),

    # ── Celebration & Positivity ───────────────────────────────────────────
    "🥳": ("Excited", "partying and celebrating",   "Party mode! 🥳 Something amazing is being celebrated. What's the occasion? I want to celebrate with you!"),
    "🎉": ("Excited", "celebrating with a party popper", "Celebration time! 🎉 Life has something wonderful happening. What are we cheering about?"),
    "🎊": ("Excited", "confetti and excitement",    "Confetti in the air! 🎊 Pure joy and festivity. What's the wonderful news?"),
    "✨": ("Happy",   "feeling magical and sparkly", "Sparkling magic! ✨ You've got that special energy today. What's making everything feel so bright?"),
    "🌟": ("Happy",   "shining like a star",        "You're shining like a star! 🌟 That glow of accomplishment or joy is beautiful. What's made you feel this radiant?"),
    "⭐": ("Happy",   "feeling like a star",        "Star energy! ⭐ You're feeling bright and notable today. What's made you feel like a star?"),
    "🔥": ("Excited", "feeling fired up and passionate", "On fire! 🔥 That passion and intensity is incredible. What's got you so fired up right now?"),
    "🌈": ("Hopeful", "feeling hopeful after difficulty", "A rainbow after the storm! 🌈 That symbol of hope and new beginnings is so powerful. Are you coming through something difficult and finding hope?"),

    # ── Peace & Wellness ───────────────────────────────────────────────────
    "🧘": ("Neutral", "meditating and finding peace", "In a meditative state 🧘 — finding your center and inner peace. That's a beautiful practice. How has your mindfulness journey been going?"),
    "🫂": ("Happy",   "hugging and offering comfort", "A big warm hug! 🫂 Whether you're giving or receiving comfort, that embrace means everything. Who needs a hug today?"),
    "🙏": ("Hopeful", "grateful and thankful",      "Hands folded in gratitude or prayer 🙏. There's something deeply meaningful in this gesture. What are you grateful for, or what are you hoping for?"),
    "💪": ("Happy",   "feeling strong and powerful", "Flexing that strength! 💪 You're feeling powerful and capable. What's made you feel so strong today?"),
    "🌸": ("Happy",   "feeling gentle and beautiful", "A cherry blossom 🌸 — delicate, beautiful, and fleeting. Are you appreciating something lovely in your life right now?"),
    "🌻": ("Happy",   "feeling sunny and optimistic", "A sunflower 🌻 always turning toward the light. You're radiating warmth and optimism. What's your sunshine today?"),
    "🌿": ("Neutral", "feeling calm and grounded",  "The calming green of nature 🌿. You seem to be seeking or feeling peace and groundedness. What's helping you feel centered?"),
    "🕊️": ("Hopeful", "feeling peaceful",           "A dove of peace 🕊️ — so serene and hopeful. Are you feeling at peace, or longing for it?"),
    "🦋": ("Hopeful", "feeling transformed or free", "A butterfly 🦋 — a symbol of transformation and freedom. Are you going through a beautiful change in your life?"),
    "🌱": ("Hopeful", "growing and starting fresh", "A tiny seedling 🌱 — new beginnings and growth. Something new is starting in your life. What's blossoming?"),

    # ── Stress & Struggle ──────────────────────────────────────────────────
    "😖": ("Sad",     "feeling confused and distressed", "Feeling really distressed 😖. Something is genuinely bothering you. I'm here — what's causing this pain?"),
    "💢": ("Angry",   "feeling anger and frustration", "That anger symbol 💢 is flashing! You're really frustrated. What's crossed a line for you?"),
    "💥": ("Angry",   "feeling explosive or overwhelmed", "Boom! 💥 That explosive energy — is it frustration, a sudden realization, or something that just hit you hard?"),
    "🌀": ("Anxiety", "feeling dizzy and confused", "That spinning cyclone 🌀 — are you feeling mentally dizzy, overwhelmed, or like thoughts are spiraling? Let's slow it down together."),

    # ── Humor & Playfulness ────────────────────────────────────────────────
    "🤡": ("Happy",   "being clownish and silly",   "Being a total clown! 🤡 Embracing the silly side of life. Sometimes humor is the best coping mechanism. What's making you laugh?"),
    "👻": ("Happy",   "being spooky and playful",   "Boo! 👻 Are you being playfully spooky, or does this ghost represent something that's haunting you a little?"),
    "🤤": ("Happy",   "drooling over something amazing", "Drooling! 🤤 Something must look or sound absolutely incredible. What's got you this excited?"),
    "😏": ("Neutral", "feeling smug or knowing something", "That knowing smirk 😏 — you've got a little secret or are feeling quite confident about something. What do you know?"),

    # ── Shock & Surprise ───────────────────────────────────────────────────
    "😲": ("Neutral", "astonished and amazed",      "Completely astonished! 😲 Something has genuinely surprised you. What just blew your mind?"),
    "😳": ("Neutral", "flushed with embarrassment or shock", "Flushed and flustered! 😳 Are you embarrassed, shocked, or did something unexpected happen?"),
    "🤯": ("Anxiety", "mind blown with overwhelm",  "Mind completely blown! 🤯 That level of intensity — whether awe or overwhelm — is a lot to process. What just happened?"),

    # ── Spiritual & Symbolic ───────────────────────────────────────────────
    "☮️": ("Hopeful", "seeking peace",              "The peace symbol ☮️ — you're craving or creating harmony. What peace are you seeking in your life right now?"),
    "🌙": ("Neutral", "feeling reflective at night", "A crescent moon 🌙 — the quiet and reflective time of night. Are you up late thinking, or just drawn to that calm nighttime energy?"),
    "☀️": ("Happy",   "feeling bright and energized", "The sun is shining! ☀️ You're radiating warmth and energy. What's brightening your day like the sun?"),
    "💫": ("Happy",   "feeling magical and dreamy", "Stars and dizziness! 💫 That dreamy, magical feeling. Are you starstruck, or floating on a wave of good feelings?"),
}

# Emojis that could mean multiple things — use context from their position
_AMBIGUOUS_EMOJIS = {"😅", "🙃", "😏", "😬", "😌", "🖤", "👻"}


def expand_emoji_message(message: str) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Analyzes a message for emoji content.

    Returns:
        Tuple of:
        - expanded_text: text version of the message for emotion analysis
        - detected_emotion: emotion label if emoji-dominant, else None  
        - emoji_response: pre-built response if emoji-only message, else None
    """
    stripped = message.strip()
    emojis_found = [ch for ch in stripped if ch in EMOJI_MAP]

    # Pure emoji message (only emojis, possibly with whitespace)
    non_emoji_text = "".join(
        ch for ch in stripped if ch not in EMOJI_MAP and not ch.isspace()
    )

    if emojis_found and not non_emoji_text:
        # Emoji-only message — use the first dominant emoji
        primary = emojis_found[0]
        emotion, meaning, response = EMOJI_MAP[primary]

        # If multiple different emojis, combine meanings
        if len(set(emojis_found)) > 1:
            meanings = [EMOJI_MAP[e][1] for e in set(emojis_found) if e in EMOJI_MAP]
            expanded = f"I am feeling {', '.join(meanings)}"
            # Use emotion from first emoji but build combined response
            response = (
                f"{''.join(emojis_found)} — I can feel a whole mix of emotions here! "
                f"You seem to be feeling {', '.join(meanings)}. "
                f"That's a lot to hold at once. Would you like to talk about what's going on?"
            )
        else:
            expanded = f"I am feeling {meaning}"

        return expanded, emotion, response

    # Mixed message (text + emojis) — expand emojis inline for better analysis
    if emojis_found:
        expanded = message
        for emoji in set(emojis_found):
            if emoji in EMOJI_MAP:
                expanded = expanded.replace(emoji, f" {EMOJI_MAP[emoji][1]} ")
        return expanded, None, None

    # No emojis at all
    return message, None, None


def get_emoji_response(emoji: str) -> Optional[str]:
    """Get the pre-built response for a specific emoji."""
    if emoji in EMOJI_MAP:
        return EMOJI_MAP[emoji][2]
    return None
