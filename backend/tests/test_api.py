import requests

# Test Login and fetch appointments
def test():
    # Login as Dr. Emily Rodriguez (from seed_data.py)
    resp = requests.post("http://localhost:5000/api/auth/login", json={
        "email": "dr.rodriguez@hospital.com",
        "password": "password"
    })
    
    if not resp.ok:
        print("Login failed:", resp.text)
        return
        
    token = resp.json().get("access_token")
    print("Logged in!")
    
    # Fetch appointments
    headers = {"Authorization": f"Bearer {token}"}
    appts_resp = requests.get("http://localhost:5000/api/appointments", headers=headers)
    
    appts = appts_resp.json().get('items', [])
    for a in appts:
        print(f"Appt {a['id']}: patientName='{a.get('patientName', 'MISSING')}' | patientId='{a.get('patientId')}'")

if __name__ == '__main__':
    test()
