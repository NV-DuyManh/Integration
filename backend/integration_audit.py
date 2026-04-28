import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"

def print_res(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} | {name} | {detail}")

def run_tests():
    print("--- STARTING INTEGRATION AUDIT ---")
    
    # 1. Auth: Register & Login
    test_user = f"test_{uuid.uuid4().hex[:8]}"
    pwd = "password123"
    
    # Register
    try:
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
            "username": test_user,
            "email": f"{test_user}@example.com",
            "password": pwd,
            "confirm_password": pwd
        })
        if reg_resp.status_code == 200:
            print_res("Auth Register", True)
        else:
            print_res("Auth Register", False, f"HTTP {reg_resp.status_code} - {reg_resp.text}")
    except Exception as e:
        print_res("Auth Register", False, str(e))
        
    # Login
    token = ""
    try:
        log_resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": test_user,
            "password": pwd
        })
        if log_resp.status_code == 200:
            print_res("Auth Login", True)
            token = log_resp.json().get("token")
        else:
            print_res("Auth Login", False, f"HTTP {log_resp.status_code} - {log_resp.text}")
    except Exception as e:
        print_res("Auth Login", False, str(e))
        
    # ME endpoint
    try:
        me_resp = requests.get(f"{BASE_URL}/auth/me?token={token}")
        if me_resp.status_code == 200:
            print_res("Auth Me", True)
        else:
            print_res("Auth Me", False, f"HTTP {me_resp.status_code} - {me_resp.text}")
    except Exception as e:
        print_res("Auth Me", False, str(e))
        
    # 2. Endpoints Check
    endpoints = [
        ("HR Schema", f"{BASE_URL}/hr/schema", requests.get),
        ("Payroll Schema", f"{BASE_URL}/payroll/schema", requests.get),
        ("Dashboard Status", f"{BASE_URL}/dashboard/status", requests.get),
        ("Dashboard Overview", f"{BASE_URL}/dashboard/overview", requests.get),
        ("Dashboard Search", f"{BASE_URL}/dashboard/employees/search?q=1", requests.get),
        ("Dashboard Employee 360", f"{BASE_URL}/dashboard/employee/1", requests.get),
        ("Dashboard Recon", f"{BASE_URL}/dashboard/reconciliation", requests.get),
        ("Dashboard Quality", f"{BASE_URL}/dashboard/quality", requests.get),
        ("Dashboard Report Export", f"{BASE_URL}/dashboard/reports/json", requests.get),
    ]
    
    headers = {"Authorization": f"Bearer {token}"} # actually the routes might not require auth, or use token differently
    # Let's check without auth first
    
    for name, url, method in endpoints:
        try:
            resp = method(url)
            if resp.status_code in [200, 201]:
                print_res(name, True)
            else:
                print_res(name, False, f"HTTP {resp.status_code} - {resp.text[:100]}")
        except Exception as e:
            print_res(name, False, str(e))
            
    # Invalid Login
    try:
        log_resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "invalid_user_xyz",
            "password": "wrong"
        })
        if log_resp.status_code == 401:
            print_res("Invalid Login", True)
        else:
            print_res("Invalid Login", False, f"HTTP {log_resp.status_code}")
    except Exception as e:
        print_res("Invalid Login", False, str(e))

if __name__ == "__main__":
    run_tests()
