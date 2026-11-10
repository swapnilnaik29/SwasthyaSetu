import pytest
from app.services.translation.luna_service import GPT6LunaTranslationService
from app.services.translation.cache import TranslationCacheService
from app.core.security import encrypt_text, decrypt_text, compute_cache_key
from sqlalchemy import select
from app.models.translation_cache import TranslationCache


@pytest.mark.asyncio
async def test_bidirectional_translation(test_db):
    service = GPT6LunaTranslationService(test_db)

    # 1. Patient (Hindi) -> Doctor (English)
    res_patient = await service.translate_turn(
        text="Mujhe three days se fever hai aur headache bhi hai.",
        speaker="PATIENT",
        source_lang="hi-IN",
        recipient_lang="en-IN",
    )
    assert "fever" in res_patient["canonical_english"].lower()
    assert "headache" in res_patient["canonical_english"].lower()
    assert res_patient["recipient_language"] == "en-IN"
    assert res_patient["canonical_english"] == res_patient["recipient_translation"]

    # 2. Doctor (English) -> Patient (Hindi)
    res_doctor = await service.translate_turn(
        text="Take this paracetamol 500mg twice daily after meals for three days.",
        speaker="DOCTOR",
        source_lang="en-IN",
        recipient_lang="hi-IN",
    )
    assert res_doctor["recipient_language"] == "hi-IN"
    assert "पैरासिटामोल" in res_doctor["recipient_translation"]
    assert "paracetamol" in res_doctor["canonical_english"].lower()

    # 3. Marathi turn -> Doctor (English)
    res_mr = await service.translate_turn(
        text="Mala teen divasapasun taap aani dukhane ahe.",
        speaker="PATIENT",
        source_lang="mr-IN",
        recipient_lang="en-IN",
    )
    assert res_mr["recipient_language"] == "en-IN"
    assert "fever" in res_mr["canonical_english"].lower()


@pytest.mark.asyncio
async def test_same_language_skips_translation(test_db):
    service = GPT6LunaTranslationService(test_db)

    # English -> English: no translation call
    res_en = await service.translate_turn(
        text="I have mild back pain.",
        speaker="PATIENT",
        source_lang="en-IN",
        recipient_lang="en-IN",
    )
    assert res_en["recipient_translation"] == "I have mild back pain."
    assert res_en["canonical_english"] == "I have mild back pain."


@pytest.mark.asyncio
async def test_translation_cache_hit_and_encryption(test_db, mocker):
    service = GPT6LunaTranslationService(test_db)
    cache_service = TranslationCacheService(test_db)

    utterance = "Mujhe three days se fever hai aur headache bhi hai."
    source_lang = "hi-IN"
    recipient_lang = "en-IN"

    # First call: Cache miss, writes to cache
    res1 = await service.translate_turn(utterance, "PATIENT", source_lang, recipient_lang)
    assert res1["cache_hit"] is False

    # Verify cache entry is encrypted at rest in DB
    stmt = select(TranslationCache)
    cached_rows = (await test_db.execute(stmt)).scalars().all()
    assert len(cached_rows) >= 1
    cached_entry = cached_rows[0]

    # Verify plaintext is NOT in cache_key_hash or translated_text_encrypted
    assert utterance not in cached_entry.cache_key_hash
    assert "fever" not in cached_entry.translated_text_encrypted.lower()

    # Verify decryption restores plaintext
    decrypted = decrypt_text(cached_entry.translated_text_encrypted)
    assert "fever" in decrypted.lower()

    # Spy on _call_luna to ensure it is NOT invoked on the second call
    spy = mocker.spy(service, "_call_luna")

    # Second call with identical phrase: Must be CACHE HIT and NOT call _call_luna!
    res2 = await service.translate_turn(utterance, "PATIENT", source_lang, recipient_lang)
    assert res2["cache_hit"] is True
    assert res2["canonical_english"] == res1["canonical_english"]
    assert spy.call_count == 0  # Proves model call was skipped!

    # Check stats
    stats = await cache_service.get_stats()
    assert stats["total_cache_hits"] >= 1


@pytest.mark.asyncio
async def test_reverse_direction_separate_cache(test_db):
    service = GPT6LunaTranslationService(test_db)

    text = "Fever and headache"
    # Direction 1: en-IN -> hi-IN
    res1 = await service.translate_turn(text, "DOCTOR", "en-IN", "hi-IN")

    # Direction 2: hi-IN -> en-IN with the same text
    # Should NOT hit the en-IN -> hi-IN cache!
    key1, _ = compute_cache_key(text, "en-IN", "hi-IN")
    key2, _ = compute_cache_key(text, "hi-IN", "en-IN")
    assert key1 != key2  # Distinct keys


@pytest.mark.asyncio
async def test_ui_database_cache_endpoints(client):
    """Test retrieving and storing UI language caches in the SQLite database."""
    # 1. Fetch all UI caches
    res = await client.get("/api/v1/cache/ui")
    assert res.status_code == 200
    data = res.json()
    assert "en-IN" in data or "hi-IN" in data

    # 2. Fetch specific language cache
    res_mr = await client.get("/api/v1/cache/ui/mr-IN")
    assert res_mr.status_code == 200
    mr_data = res_mr.json()
    assert mr_data["language_code"] == "mr-IN"
    assert "translations" in mr_data
    assert "brandSubtitle" in mr_data["translations"]

    # 3. Upsert a custom or new language cache in DB
    custom_ui = {
        "name": "Gujarati (ગુજરાતી)",
        "translations": {
            "brandSubtitle": "ક્લિનિકલ કમ્યુનિકેશન પોર્ટલ",
            "searchPatientsPlaceholder": "દર્દી શોધો...",
        },
    }
    post_res = await client.post("/api/v1/cache/ui/gu-IN", json=custom_ui)
    assert post_res.status_code == 200

    # 4. Verify stored in DB
    get_gu = await client.get("/api/v1/cache/ui/gu-IN")
    assert get_gu.status_code == 200
    assert get_gu.json()["translations"]["brandSubtitle"] == "ક્લિનિકલ કમ્યુનિકેશન પોર્ટલ"


