import os
from dotenv import load_dotenv
from app.config import get_settings

load_dotenv()

# Check raw env
key = os.getenv("GROQ_API_KEY", "")
print(f"RAW env key length: {len(key)}")
print(f"RAW key repr: {repr(key[:20])}...repr end: {repr(key[-5:])}")

# Check through Settings (what the app actually uses)
settings = get_settings()
print(f"Settings key length: {len(settings.GROQ_API_KEY)}")
print(f"Settings model: {settings.GROQ_MODEL}")
print(f"Settings base_url: {settings.GROQ_BASE_URL}")
