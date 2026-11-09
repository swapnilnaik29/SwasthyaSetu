import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "openai_model" in data
    assert "gnani_stt_model" in data


@pytest.mark.asyncio
async def test_doctor_settings_get_and_put(client):
    # GET settings (auto-creates default doctor)
    get_res = await client.get("/api/v1/doctor/settings")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["preferred_language"] in ["en-IN", "hi-IN", "mr-IN"]
    assert "Dr." in data["name"]

    # PUT settings
    put_res = await client.put(
        "/api/v1/doctor/settings",
        json={
            "name": "Dr. Rajesh Kulkarni",
            "credentials": "MBBS, MD (Internal Medicine)",
            "preferred_language": "mr-IN",
        },
    )
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["name"] == "Dr. Rajesh Kulkarni"
    assert updated["preferred_language"] == "mr-IN"
