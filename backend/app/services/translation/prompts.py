"""
Stable prompt prefix and structured output schemas for OpenAI GPT-6 Luna.
Designed for prompt caching by keeping system instructions and schema immutable.
"""

# Fixed, stable system prompt prefix (Version v1)
STABLE_TRANSLATION_SYSTEM_PREFIX = """You are the clinical translation and canonicalization engine for SwasthyaSetu, a multilingual healthcare communication application operated by a doctor.
Your purpose is to translate speech utterances bidirectionally between Doctor and Patient, and provide an accurate canonical English representation of every turn for clinical record-keeping.

STRICT CLINICAL RULES:
1. PRESERVE ACCURACY: Faithfully preserve all medical terms, symptoms, durations, numbers, quantities, units, dosage, frequency, and severity.
2. NEGATION INTEGRITY: Never invert or alter negation (e.g., 'no fever' must remain negated; 'fever nahi hai' -> 'no fever').
3. NO FABRICATION: Never invent or assume medical facts, diagnoses, treatments, or prescriptions not explicitly stated in the source utterance.
4. MEDICINE NAMES: Preserve exact brand names, salt names, strengths, and units as spoken. Do not normalize or guess unfamiliar names.
5. CODE-MIXED SPEECH: Indian clinical conversations frequently mix English, Hindi, and Marathi terms. Preserve the intended meaning of code-mixed phrasing. If a term is ambiguous, transcribe it phonetically/literally and add an uncertainty flag.
6. CANONICAL ENGLISH: Regardless of the recipient's language, always provide a canonical English translation for persisted clinical records.
   - If recipient is English: canonical_english equals recipient_translation.
   - If source is English: canonical_english equals the original English text.
   - If neither source nor recipient is English: provide both recipient_translation and canonical_english.
7. FLAG UNCERTAINTY: If an utterance contains slurred speech, ambiguous colloquialisms, or uncertain medicine names, set needs_human_review=true and explain in uncertainty_flags.
"""

TRANSLATION_RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "clinical_translation_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "recipient_translation": {
                    "type": "string",
                    "description": "Translation of the utterance into the recipient's configured language.",
                },
                "recipient_language": {
                    "type": "string",
                    "description": "Configured recipient language code (e.g. en-IN, hi-IN, mr-IN).",
                },
                "canonical_english": {
                    "type": "string",
                    "description": "Standard canonical English translation for medical record persistence.",
                },
                "source_language": {
                    "type": "string",
                    "description": "Configured source language code of the speaker.",
                },
                "uncertainty_flags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of any uncertain terms, medicine names, or dosage details.",
                },
                "needs_human_review": {
                    "type": "boolean",
                    "description": "True if doctor review is required due to ambiguity or transcription doubts.",
                },
            },
            "required": [
                "recipient_translation",
                "recipient_language",
                "canonical_english",
                "source_language",
                "uncertainty_flags",
                "needs_human_review",
            ],
            "additionalProperties": False,
        },
    },
}
