import base64
import hashlib
import hmac
import os
import unicodedata
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def normalize_text(text: str) -> str:
    """
    Safely normalizes text for cache indexing.
    - Normalizes unicode variations (NFC).
    - Trims leading/trailing whitespace and collapses multiple whitespace characters.
    - Preserves clinically meaningful punctuation, numbers, decimal points, dosage separators,
      units, negation ('no', 'not', 'nahi', 'nahi aa raha'), and symbols.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFC", text)
    # Collapse multiple spaces/tabs/newlines into single space without stripping punctuation
    words = normalized.strip().split()
    return " ".join(words).lower()


def compute_hmac_hash(data: str, key: str = None) -> str:
    """Computes a keyed HMAC-SHA256 hex digest for lookup privacy."""
    hmac_key = (key or settings.TRANSLATION_CACHE_HMAC_KEY).encode("utf-8")
    return hmac.new(hmac_key, data.encode("utf-8"), hashlib.sha256).hexdigest()


def compute_cache_key(
    source_text: str,
    source_lang: str,
    target_lang: str,
    model_id: str = None,
    prompt_version: str = None,
    glossary_version: str = "v1",
) -> tuple[str, str]:
    """
    Computes (cache_key_hash, normalized_source_hash).
    Uses keyed HMAC to ensure plaintext source text is never exposed in cache keys.
    """
    normalized_source = normalize_text(source_text)
    model = model_id or settings.OPENAI_MODEL
    p_version = prompt_version or settings.TRANSLATION_PROMPT_VERSION

    normalized_source_hash = compute_hmac_hash(normalized_source)
    composite_data = f"{normalized_source}|{source_lang.strip().lower()}|{target_lang.strip().lower()}|{model}|{p_version}|{glossary_version}"
    cache_key_hash = compute_hmac_hash(composite_data)

    return cache_key_hash, normalized_source_hash


def _get_encryption_key() -> bytes:
    """Derives a fixed 32-byte key for AES-256-GCM from settings."""
    raw = settings.TRANSLATION_CACHE_ENCRYPTION_KEY
    try:
        decoded = base64.b64decode(raw)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass
    # Deterministically derive 32 bytes using SHA-256
    return hashlib.sha256(raw.encode("utf-8")).digest()


def encrypt_text(plaintext: str) -> str:
    """
    Encrypts sensitive translation text at rest using AES-GCM with a fresh 96-bit nonce.
    Returns base64 encoded (nonce + ciphertext + tag).
    """
    if not plaintext:
        return ""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit standard nonce for AES-GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_text(encrypted_b64: str) -> str:
    """
    Decrypts base64 encoded (nonce + ciphertext + tag) using AES-GCM.
    """
    if not encrypted_b64:
        return ""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted_b64)
    nonce = raw[:12]
    ciphertext = raw[12:]
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode("utf-8")
