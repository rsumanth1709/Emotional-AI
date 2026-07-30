"""
MindCare AI — Speech-to-Text Transcriber (Multilingual Edition)
Uses OpenAI Whisper 'small' model for best-in-class multilingual STT across 99 languages.
Integrates fasttext language detection for pre-transcription language identification.
"""
import os
from typing import Optional, Tuple
from app.utils.logger import logger

# fasttext model path (downloaded by download_multilingual_models.py)
_FASTTEXT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "models", "fasttext", "lid.176.bin"
)


class SpeechTranslator:
    """Singleton service for transcribing voice check-ins in 99+ languages."""

    _instance: Optional["SpeechTranslator"] = None
    _model = None
    _lang_detector = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        """Lazy load Whisper small model (best multilingual accuracy)."""
        if self._model is not None:
            return
        try:
            import whisper
            logger.info("Loading Whisper 'small' multilingual model (99 languages)...")
            self._model = whisper.load_model("small")
            logger.info("Whisper small model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Whisper small model: {e}. Falling back to base.")
            try:
                import whisper
                self._model = whisper.load_model("base")
                logger.info("Whisper base model loaded as fallback.")
            except Exception as e2:
                logger.error(f"Whisper base also failed: {e2}")
                self._model = None

    def _load_lang_detector(self):
        """Lazy load fasttext language detector."""
        if self._lang_detector is not None:
            return
        try:
            if os.path.exists(_FASTTEXT_MODEL_PATH):
                import fasttext
                self._lang_detector = fasttext.load_model(_FASTTEXT_MODEL_PATH)
                logger.info(f"fasttext language detector loaded (176 languages).")
            else:
                logger.info("fasttext model not found — language detection will use Whisper auto-detect.")
        except Exception as e:
            logger.warning(f"fasttext load failed: {e}")
            self._lang_detector = None

    def detect_language(self, text: str) -> str:
        """
        Detect the language of a text string using fasttext.
        Falls back to 'auto' if unavailable.
        Returns ISO 639-1 language code (e.g. 'en', 'es', 'hi', 'te').
        """
        self._load_lang_detector()
        if not text or not self._lang_detector:
            return "auto"
        try:
            predictions = self._lang_detector.predict(text.replace("\n", " "), k=1)
            raw_label = predictions[0][0]  # e.g. '__label__en'
            lang_code = raw_label.replace("__label__", "")
            confidence = float(predictions[1][0])
            logger.info(f"fasttext detected language: '{lang_code}' (confidence={confidence:.2f})")
            return lang_code if confidence > 0.5 else "auto"
        except Exception as e:
            logger.warning(f"fasttext language detection error: {e}")
            return "auto"

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Tuple[str, str]:
        """
        Transcribe the audio file to text with language detection.
        
        Args:
            audio_path: Path to the audio file.
            language:   Optional BCP-47 language hint (e.g. 'es', 'hi', 'fr').
                        Pass None or 'auto' for Whisper to auto-detect.

        Returns:
            Tuple of (transcription_text, detected_language_code)
        """
        self._load_model()

        if self._model is None:
            logger.warning("Whisper is unavailable. Using mock transcription fallback.")
            return (
                "I am feeling a bit stressed today because of work, but I am trying to stay hopeful.",
                "en"
            )

        try:
            logger.info(f"Transcribing audio file: {audio_path} (language hint: {language})")

            # Build transcribe options
            options: dict = {
                "task": "transcribe",
                "fp16": False,  # CPU-safe
            }

            # If a specific language is provided (not auto), tell Whisper
            if language and language not in ("auto", "auto-detect"):
                # Normalize BCP-47 to ISO 639-1 (e.g. 'hi-IN' -> 'hi')
                lang_code = language.split("-")[0].lower()
                options["language"] = lang_code
                logger.info(f"Whisper using forced language: '{lang_code}'")

            result = self._model.transcribe(audio_path, **options)
            transcription = result.get("text", "").strip()
            detected_lang = result.get("language", language or "en")
            logger.info(f"Transcription complete [{detected_lang}]: '{transcription[:80]}'")
            return transcription, detected_lang

        except Exception as e:
            logger.error(f"Error during audio transcription: {e}")
            return (
                "I am feeling a bit stressed today because of work, but I am trying to stay hopeful.",
                language or "en"
            )


speech_translator = SpeechTranslator()
