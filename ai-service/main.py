from fastapi import FastAPI
from app.config.settings import get_settings

settings = get_settings()  # validates on startup, crashes clearly if invalid

app = FastAPI(title='AI Resume Screening Service')

@app.get('/health')
def health():
    return { 'status': 'ok', 'port': settings.AI_SERVICE_PORT }