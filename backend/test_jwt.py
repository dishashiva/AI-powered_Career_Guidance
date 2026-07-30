from datetime import datetime, timedelta, timezone
from jose import jwt
print("Testing JWT")
payload = {"sub": "1"}
expire = datetime.now(timezone.utc) + timedelta(minutes=60)
payload.update({"exp": expire})
token = jwt.encode(payload, "changeme-super-secret", algorithm="HS256")
print("Encoded:", token)
decoded = jwt.decode(token, "changeme-super-secret", algorithms=["HS256"])
print("Decoded:", decoded)
