import copy
import pytest
from fastapi.testclient import TestClient

import src.app as app_module


INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # Ensure each test runs with a fresh copy of initial activities
    app_module.activities = copy.deepcopy(INITIAL_ACTIVITIES)
    yield


client = TestClient(app_module.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic expected key
    assert "Chess Club" in data


def test_signup_and_delete_participant():
    email = "tester@example.com"
    # sign up
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json().get("message", "")

    # verify present
    data = client.get("/activities").json()
    assert email in data["Chess Club"]["participants"]

    # duplicate signup should 400
    resp2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp2.status_code == 400

    # delete participant
    resp3 = client.delete(f"/activities/Chess%20Club/participant?email={email}")
    assert resp3.status_code == 200
    assert f"Removed {email}" in resp3.json().get("message", "")

    # verify removed
    data2 = client.get("/activities").json()
    assert email not in data2["Chess Club"]["participants"]
