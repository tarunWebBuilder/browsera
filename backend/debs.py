from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from auth import SECRET_KEY, ALGORITHM


def get_current_user(request: Request):
    def _token_from_header():
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1]
        return None

    token = _token_from_header() or request.cookies.get("auth-token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["email"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
