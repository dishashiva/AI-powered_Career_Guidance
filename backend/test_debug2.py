import asyncio
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from app.services.ai_service import _chat_completion

async def test():
    # Replicate what career_chat sends
    messages = [
        {"role": "system", "content": "You are CareerAI, an expert career intelligence coach."},
        {"role": "system", "content": "User Profile Context:\nUser: Disha\nSkills: Python, React"},
        {"role": "user", "content": "Hello"}
    ]
    try:
        result = await _chat_completion(messages)
        print(f"SUCCESS: {result[:200]}")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
