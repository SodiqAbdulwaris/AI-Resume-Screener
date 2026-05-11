import secrets

print(f"JWT_SECRET={secrets.token_hex(32)}")
