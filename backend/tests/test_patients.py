import pytest


@pytest.mark.asyncio
async def test_patient_crud_and_search(client):
    # 1. Create Patient
    payload = {
        "name": "Aarav Sharma",
        "age": 32,
        "date_of_birth": "1994-05-12",
        "mobile_number": "9876543210",
        "preferred_language": "hi-IN",
    }
    create_res = await client.post("/api/v1/patients", json=payload)
    assert create_res.status_code == 201
    patient = create_res.json()
    assert patient["name"] == "Aarav Sharma"
    patient_id = patient["id"]

    # 2. Get Patient by ID
    get_res = await client.get(f"/api/v1/patients/{patient_id}")
    assert get_res.status_code == 200
    assert get_res.json()["mobile_number"] == "9876543210"

    # 3. Search Patient by name
    search_res = await client.get("/api/v1/patients?q=Aarav")
    assert search_res.status_code == 200
    items = search_res.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Aarav Sharma"

    # 4. Search Patient by phone
    phone_search = await client.get("/api/v1/patients?q=9876543210")
    assert phone_search.status_code == 200
    assert len(phone_search.json()) >= 1

    # 5. Patch Patient
    patch_res = await client.patch(
        f"/api/v1/patients/{patient_id}",
        json={"preferred_language": "mr-IN", "age": 33},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["preferred_language"] == "mr-IN"
    assert patch_res.json()["age"] == 33


@pytest.mark.asyncio
async def test_patient_validation(client):
    # Invalid phone number
    bad_payload = {
        "name": "Invalid User",
        "mobile_number": "123",  # too short
        "preferred_language": "hi-IN",
    }
    res = await client.post("/api/v1/patients", json=bad_payload)
    assert res.status_code == 422

