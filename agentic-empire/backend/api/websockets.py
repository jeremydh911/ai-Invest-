from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from loguru import logger
from core.llm_tier import tiered_generate
import tempfile
import os

router = APIRouter()

try:
    import speech_recognition as sr
    import pyttsx3
    engine = pyttsx3.init()
except ImportError:
    sr = None
    pyttsx3 = None
    engine = None

@router.websocket("/voice-chat")
async def voice_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            try:
                # STT: Save bytes to temp WAV and recognize
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                    temp_file.write(data)
                    temp_path = temp_file.name
                
                recognizer = sr.Recognizer()
                with sr.AudioFile(temp_path) as source:
                    audio = recognizer.record(source)
                    try:
                        text = recognizer.recognize_google(audio)  # Free Google STT
                    except sr.UnknownValueError:
                        text = "Sorry, could not understand audio."
                    except sr.RequestError:
                        text = "STT service unavailable."
                
                os.unlink(temp_path)  # Clean up
                
                if text and text != "Sorry, could not understand audio.":
                    response = await tiered_generate(text)  # Tiered LLM
                    
                    # TTS: Generate speech
                    engine.save_to_file(response, 'temp.mp3')
                    engine.runAndWait()
                    
                    # Read audio file and send bytes
                    with open('temp.mp3', 'rb') as f:
                        audio_bytes = f.read()
                    os.unlink('temp.mp3')  # Clean up
                    
                    await websocket.send_bytes(audio_bytes)
                else:
                    # Send error audio
                    engine.save_to_file("Please try again.", 'error.mp3')
                    engine.runAndWait()
                    with open('error.mp3', 'rb') as f:
                        audio_bytes = f.read()
                    os.unlink('error.mp3')
                    await websocket.send_bytes(audio_bytes)
                    
            except Exception as e:
                logger.error(f"Voice chat error: {e}")
                await websocket.close()
                break
    except WebSocketDisconnect:
        pass