import io
import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import hash_password, verify_password, create_access_token

client = TestClient(app)

def test_password_hashing():
    pwd = "EnterpriseSecurePass2026!"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_auth_login():
    res = client.post("/api/v1/auth/login", json={"email": "accountant@ledgerai.io", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "accountant@ledgerai.io"

def test_csv_upload_and_deduplication():
    # First get bank account ID
    acc_res = client.get("/api/v1/settings/accounts")
    accounts = acc_res.json()
    assert len(accounts) > 0
    acc_id = accounts[0]["id"]

    ts = int(time.time() * 1000)
    ref1 = f"LIC-{ts}-A"
    ref2 = f"CLD-{ts}-B"

    # Sample CSV data
    csv_content = (
        f"Date,Description,Reference,Amount,Currency\n"
        f"2026-10-15,New Vendor Software License,{ref1},-350.00,USD\n"
        f"2026-10-16,Cloud Storage Upgrade,{ref2},-120.00,USD\n"
    )
    file_obj = io.BytesIO(csv_content.encode("utf-8"))

    res = client.post(
        f"/api/v1/transactions/upload?bank_account_id={acc_id}",
        files={"file": ("test_import.csv", file_obj, "text/csv")}
    )
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["imported_count"] == 2

    # Upload again with exact same rows -> Duplicate prevention must trigger
    file_obj_dup = io.BytesIO(csv_content.encode("utf-8"))
    res_dup = client.post(
        f"/api/v1/transactions/upload?bank_account_id={acc_id}",
        files={"file": ("test_import.csv", file_obj_dup, "text/csv")}
    )
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert dup_data["duplicate_skipped_count"] == 2
    assert dup_data["imported_count"] == 0
