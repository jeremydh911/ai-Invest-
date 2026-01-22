from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from api.routes import router
from api.websockets import router as websocket_router  # Split voice
from core.auth import oauth2_scheme, create_access_token  # For login

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(router, prefix="/api")
app.include_router(websocket_router, prefix="/ws")

@app.post("/token")  # Login endpoint
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verify user/pass (DB check)
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}