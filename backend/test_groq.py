import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test_groq():
    api_key = os.getenv('GROQ_API_KEY')
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "system", "content": "Context: User is a software engineer."},
            {"role": "user", "content": "Hi"}
        ],
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=payload, timeout=10.0)
        print(res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(test_groq())
