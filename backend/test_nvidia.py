import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test_nvidia():
    api_key = os.getenv('NVIDIA_API_KEY')
    print(f"API Key present: {bool(api_key)}")
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "meta/llama-3.1-70b-instruct",
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 10
    }
    print("Testing connection to NVIDIA NIM...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=10.0)
            print(f"Status Code: {res.status_code}")
            if res.status_code == 200:
                print("API Key is working correctly!")
            else:
                print(f"Error: {res.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_nvidia())
