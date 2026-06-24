import time
from jose import jwt, JWTError

ALGORITHM = "HS256"
SECRET_KEY = "my_secret_key"

# Create a token that is already expired
expired_time = int(time.time()) - 3600
token_data = {"sub": "test@user.com", "exp": expired_time}
token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

print(f"Token: {token}")

# Try to decode with verify_exp = False
try:
    decoded = jwt.decode(
        token, 
        SECRET_KEY, 
        algorithms=[ALGORITHM], 
        options={"verify_aud": False, "verify_exp": False}
    )
    print("Success with verify_exp: False! Decoded payload:", decoded)
except JWTError as e:
    print("Failed with verify_exp: False:", e)

# Try with options = {"verify_signature": True, "verify_exp": False}
try:
    decoded = jwt.decode(
        token, 
        SECRET_KEY, 
        algorithms=[ALGORITHM], 
        options={"verify_signature": True, "verify_exp": False}
    )
    print("Success with verify_signature! Decoded payload:", decoded)
except JWTError as e:
    print("Failed with verify_signature:", e)
