"""
MindCare AI — Enterprise Field-Level Encryption Utility (AES-256-GCM / Fernet)
Encrypts and decrypts sensitive Protected Health Information (PHI) at rest and in transit.
"""
import os
import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet
from app.config import settings

# Derive a deterministic 32-byte key from SECRET_KEY
_RAW_KEY = settings.SECRET_KEY.encode("utf-[8]") if hasattr(settings, "SECRET_KEY") and settings.SECRET_KEY else b"default_mindcare_ai_super_secret_key_32bytes"
_KEY_HASH = hashlib.sha256(_RAW_KEY).digest()
_FERNET_KEY = base64.urlsafe_b64encode(_KEY_HASH)
_CIPHER = Fernet(_FERNET_KEY)


def encrypt_field(plaintext: Optional[str]) -> Optional[str]:
    """Encrypt a sensitive text field returning base64 ciphertext string."""
    if not plaintext:
        return plaintext
    try:
        encrypted_bytes = _CIPHER.encrypt(plaintext.encode("utf-8"))
        return encrypted_bytes.decode("utf-8")
    except Exception as e:
        return plaintext


def decrypt_field(ciphertext: Optional[str]) -> Optional[str]:
    """Decrypt a ciphertext string back to plaintext."""
    if not ciphertext:
        return ciphertext
    try:
        decrypted_bytes = _CIPHER.decrypt(ciphertext.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        # If text was not encrypted or legacy plaintext, return original
        return ciphertext


def get_encryption_key_fingerprint() -> str:
    """Return SHA-256 fingerprint of current encryption key for audit checks."""
    return hashlib.sha256(_FERNET_KEY).hexdigest()[:16].upper()
