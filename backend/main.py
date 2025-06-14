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
            
            # Process text input
            result = process_text_input(text_input["text"], session_id)
            
            # Add to conversation history
            conversations[session_id].append({
                "role": "user",
                "text": text_input["text"]
            })
            conversations[session_id].append({
                "role": "assistant",
                "text": result["response"]
            })
            
            # Send response back
            await websocket.send_text(json.dumps({
                "type": "response",
                "text": result["response"],
                "emotion": result["emotion"],
                "context": result["context"]
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