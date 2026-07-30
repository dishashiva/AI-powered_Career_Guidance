import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from app.services.ai_service import _chat_completion

async def test():
    messages = [
        {"role": "system", "content": "You are CareerAI, an expert career intelligence coach. You help users with:\n- Career planning and path recommendations\n- Resume improvement tips\n- Interview preparation\n- Skill development guidance  \n- Job search strategies\n- Salary negotiation advice\n\nBe specific, actionable, and encouraging. Keep responses concise but helpful."},
        {"role": "user", "content": "What skills should I learn in 2026?"}
    ]
    
    print("Calling _chat_completion...")
    try:
        result = await _chat_completion(messages)
        print(f"SUCCESS: {result[:200]}")
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")

asyncio.run(test())
