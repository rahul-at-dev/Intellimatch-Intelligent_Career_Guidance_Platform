import pytest
from app.main import app
from app.core.auth import get_current_user


@pytest.fixture(autouse=True)
def override_auth():
    """Automatically authenticate API test requests with a test user context."""
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": "test-user-id",
        "email": "test@intellimatch.ai",
        "demo": False,
    }
    yield
    app.dependency_overrides.pop(get_current_user, None)
