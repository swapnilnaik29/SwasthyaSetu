import logging
import sys

# Configure root logger with sanitized clinical privacy standards
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("SwasthyaSetu")


def log_sanitized_event(event_name: str, **kwargs):
    """
    Logs structured events safely. Never log clinical transcripts, patient names,
    phone numbers, audio buffers, or provider secrets.
    """
    safe_data = {}
    for k, v in kwargs.items():
        if any(secret in k.lower() for secret in ["key", "token", "secret", "transcript", "audio", "phone", "name", "symptom"]):
            safe_data[k] = "[REDACTED]"
        else:
            safe_data[k] = v
    logger.info(f"event={event_name} metadata={safe_data}")

