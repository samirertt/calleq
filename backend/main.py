from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import uuid
import logging
from typing import Dict, List
import asyncio
from datetime import datetime
from utils import process_text_input
from google import genai
from google.genai import types
import wave
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Call Center API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions and conversation history
active_sessions: Dict[str, WebSocket] = {}
conversations: Dict[str, List[dict]] = {}

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
    """Save PCM data to a WAV file"""
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)

def text_to_speech(text: str) -> bytes:
    """Convert text to speech using Gemini TTS and return audio data as bytes"""
    try:
        prompt = f"""TTS the following response from the AI assistant:
        Assistant: {text}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name='Kore',
                        )
                    )
                )
            )
        )


        # Return the audio data as bytes
        return response.candidates[0].content.parts[0].inline_data.data
    except Exception as e:
        logger.error(f"Error in text-to-speech conversion: {str(e)}")
        return None

class CallStartResponse(BaseModel):
    session_id: str
    greeting_text: str

class TextInput(BaseModel):
    text: str
    session_id: str

@app.post("/call/start")
async def start_call() -> CallStartResponse:
    """Start a new call session"""
    session_id = str(uuid.uuid4())
    greeting_text = "Hello, my name is AI Assistant from Company X. How can I help you?"
    
    conversations[session_id] = []
    
    return CallStartResponse(
        session_id=session_id,
        greeting_text=greeting_text
    )

@app.websocket("/call/text/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for text processing"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await websocket.accept()
    active_sessions[session_id] = websocket
    
    try:
        while True:
            # Receive text data
            data = await websocket.receive_text()
            text_input = json.loads(data)
            
            # Process text input with conversation history
            response = process_text_input(
                text_input["text"], 
                session_id,
                conversation_history=conversations[session_id]
            )
            
            # Add to conversation history
            conversations[session_id].append({
                "role": "user",
                "text": text_input["text"]
            })
            conversations[session_id].append({
                "role": "assistant",
                "text": response
            })
            
            # Convert response to speech
            audio_data = text_to_speech(response)
            if audio_data:
                # Send both text and audio response
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": response,
                    "has_audio": True
                }))
                # Send audio data as binary
                await websocket.send_bytes(audio_data)
            else:
                # Send only text response if audio conversion fails
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": response,
                    "has_audio": False
                }))
            
    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {session_id}")
        if session_id in active_sessions:
            del active_sessions[session_id]
    except Exception as e:
        logger.error(f"Error in websocket connection: {str(e)}")
        if session_id in active_sessions:
            del active_sessions[session_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 