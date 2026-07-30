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

    # Test with a resume-style prompt and json_mode (like parse_resume does)
    prompt = (
        "You are an expert resume parser. Analyze the following resume text "
        "and extract structured information.\n\n"
        "Return ONLY a valid JSON object with this exact structure:\n"
        '{"skills": ["Python", "React"], "roles": ["Engineer"]}\n\n'
        "Resume Text:\n"
        '"""\n'
        "John Doe - Software Engineer with 5 years experience in Python and React.\n"
        '"""\n'
    )

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
    }

    print("Testing resume parser prompt with json_mode...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Error body: {res.text}")
        else:
            data = res.json()
            print("Success:", data["choices"][0]["message"]["content"][:200])

    # Test ATS analysis prompt
    ats_prompt = (
        "You are a professional ATS and career coach AI.\n\n"
        "Analyze this resume.\n\n"
        "Return ONLY a valid JSON object:\n"
        '{"ats_score": 85, "skill_gaps": [], "strengths": [], "recommendations": []}'
    )

    payload2 = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": ats_prompt}],
        "response_format": {"type": "json_object"},
    }

    print("\nTesting ATS analysis prompt with json_mode...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload2)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Error body: {res.text}")
        else:
            data = res.json()
            print("Success:", data["choices"][0]["message"]["content"][:200])

    # Test salary prediction prompt
    salary_prompt = (
        "You are a compensation and salary benchmarking expert.\n\n"
        "Estimate salary for: Software Engineer, Python, 5 years, New York.\n\n"
        "Return ONLY a valid JSON object:\n"
        '{"min_salary": 100000, "max_salary": 150000, "median_salary": 125000, '
        '"currency": "USD", "factors": [], "market_demand": "high", "negotiation_tips": []}'
    )

    payload3 = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": salary_prompt}],
        "response_format": {"type": "json_object"},
    }

    print("\nTesting salary prediction prompt with json_mode...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(url, headers=headers, json=payload3)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Error body: {res.text}")
        else:
            data = res.json()
            print("Success:", data["choices"][0]["message"]["content"][:200])


if __name__ == "__main__":
    asyncio.run(test())
