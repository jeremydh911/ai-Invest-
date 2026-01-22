import pytest
from fastapi.testclient import TestClient
from core.auth import create_access_token
from api.main import app

client = TestClient(app)

def test_create_access_token():
    token = create_access_token({"sub": "testuser"})
    assert isinstance(token, str)
    assert len(token) > 0

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_protected_route():
    token = create_access_token({"sub": "test"})
    response = client.post("/api/execute", headers={"Authorization": f"Bearer {token}"}, json={"prompt": "test", "dept": "executive"})
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_current_user_valid():
    # Mock a valid token
    # This would require mocking jwt.decode
    pass  # Placeholder

@pytest.mark.asyncio
async def test_get_current_user_invalid():
    try:
        await get_current_user("invalid_token")
        assert False, "Should raise HTTPException"
    except HTTPException:
        pass