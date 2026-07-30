import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    api_key = os.getenv("GROQ_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Replicate exactly what career_chat sends
    messages = [
        {"role": "system", "content": "You are CareerAI, an expert career intelligence coach. You help users with:\n- Career planning and path recommendations\n- Resume improvement tips\n- Interview preparation\n- Skill development guidance\n- Job search strategies\n- Salary negotiation advice\n\nBe specific, actionable, and encouraging. Keep responses concise but helpful."},
        {"role": "user", "content": "What skills should I learn in 2026?"}
    ]

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
    }

    print("Payload:")
    print(json.dumps(payload, indent=2))

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        print(f"\nStatus: {res.status_code}")
        print(f"Response: {res.text[:500]}")

    # Also test with a user context (like the actual code does)
    print("\n\n--- With user context ---")
    messages2 = [
        {"role": "system", "content": "You are CareerAI, an expert career intelligence coach. You help users with:\n- Career planning and path recommendations\n- Resume improvement tips\n- Interview preparation\n- Skill development guidance\n- Job search strategies\n- Salary negotiation advice\n\nBe specific, actionable, and encouraging. Keep responses concise but helpful."},
        {"role": "system", "content": "User Profile Context:\nUser: Disha\nSkills: Python, React\nRoles: Software Engineer"},
        {"role": "user", "content": "What skills should I learn in 2026?"}
    ]

    payload2 = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages2,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload2)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:500]}")

    # Test with json_mode (for resume parsing etc.)
    print("\n\n--- With json_mode ---")
    messages3 = [
        {"role": "user", "content": "Return a JSON object: {\"hello\": \"world\"}. Return ONLY valid JSON."}
    ]

    payload3 = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages3,
        "response_format": {"type": "json_object"}
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload3)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:500]}")

asyncio.run(test())
