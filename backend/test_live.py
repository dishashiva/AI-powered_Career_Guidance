import asyncio
import httpx
import json

BASE = "http://localhost:8000"

async def test_endpoints():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Health check
        r = await client.get(f"{BASE}/health")
        print(f"Health: {r.status_code} {r.text}")

        # 2. Test login to get a token
        r = await client.post(f"{BASE}/auth/login",
            data={"username": "disha@example.com", "password": "password123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"})
        print(f"\nLogin: {r.status_code}")

        if r.status_code != 200:
            # Try to register
            r2 = await client.post(f"{BASE}/auth/register", json={
                "email": "disha@example.com",
                "password": "password123",
                "full_name": "Disha"
            })
            print(f"Register: {r2.status_code} {r2.text[:200]}")

            r = await client.post(f"{BASE}/auth/login",
                data={"username": "disha@example.com", "password": "password123"},
                headers={"Content-Type": "application/x-www-form-urlencoded"})
            print(f"Login after register: {r.status_code}")

        if r.status_code != 200:
            print("Cannot get token, stopping.")
            return

        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Token obtained: {token[:20]}...")

        # 3. Test AI chat
        print("\n--- Testing /ai/chat ---")
        r = await client.post(f"{BASE}/ai/chat",
            json={"message": "What skills should I learn in 2026?"},
            headers=headers)
        print(f"Chat: {r.status_code}")
        if r.status_code != 200:
            print(f"Error body: {r.text[:500]}")
        else:
            print(f"Response: {r.text[:300]}")

        # 4. Test AI salary
        print("\n--- Testing /ai/salary ---")
        r = await client.post(f"{BASE}/ai/salary",
            json={"job_title": "Software Engineer", "skills": ["Python", "React"], "experience_years": 3, "location": "New York"},
            headers=headers)
        print(f"Salary: {r.status_code}")
        if r.status_code != 200:
            print(f"Error body: {r.text[:500]}")
        else:
            print(f"Response: {r.text[:300]}")

        # 5. List resumes to get an ID
        print("\n--- Testing /resumes/ ---")
        r = await client.get(f"{BASE}/resumes/", headers=headers)
        print(f"Resumes list: {r.status_code}")
        resumes = r.json() if r.status_code == 200 else []
        print(f"Resumes count: {len(resumes)}")

        if resumes:
            rid = resumes[0]["id"]
            print(f"\n--- Testing /ai/analyze/{rid} ---")
            r = await client.get(f"{BASE}/ai/analyze/{rid}", headers=headers)
            print(f"Analyze: {r.status_code}")
            if r.status_code != 200:
                print(f"Error body: {r.text[:500]}")
            else:
                print(f"Response keys: {list(r.json().keys())}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
