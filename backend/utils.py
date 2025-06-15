import os
from typing import List, Dict
import torch
from transformers import pipeline
from google import genai
from dotenv import load_dotenv
from db import search_similar
import requests

# Load environment variables
load_dotenv()

# Initialize Gemini
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))



# Initialize emotion model
emotion_pipeline = pipeline(
    "text-classification",
    model="boltuix/bert-emotion",
    device=0 if torch.cuda.is_available() else -1,  # Use GPU if available
)

def detect_emotion(text: str) -> List[Dict[str, float]]:
    """Detect top 3 emotions in text using BERT model"""
    try:
        results = emotion_pipeline(text, top_k=3)
        emotions = []
        for result in results:
            emotions.append({
                "emotion": result['label'],
                "score": result['score']
            })
        return emotions
    except Exception as e:
        print(f"Error in emotion detection: {str(e)}")
        return [{"emotion": "neutral", "score": 1.0}]

def get_relevant_context(text: str, n_results: int = 3) -> List[str]:
    """Get relevant context from vector DB"""
    try:
        return search_similar(text, "conversations", n_results)
    except Exception as e:
        print(f"Error in context retrieval: {str(e)}")
        return []

def generate_response(
    user_text: str,
    conversation_history: List[Dict],
    emotions: List[Dict[str, float]],
    context: List[str]
) -> str:
    """Generate response using Gemini"""
    try:
        # Format emotions for prompt
        emotion_text = ", ".join([f"{e['emotion']} ({e['score']:.2f})" for e in emotions])
        
        # Build prompt
        prompt = f"""You are a helpful call center agent. Keep your responses brief and direct - maximum 2 sentences.
        
User's emotional states (with confidence scores): {emotion_text}

Relevant context:
{chr(10).join(context)}

Conversation history:
{chr(10).join([f"{msg['role']}: {msg['text']}" for msg in conversation_history[-6:]])}

User's message: {user_text}

Instructions:
1. Keep your response brief and direct - maximum 2 sentences
2. Do not mention emotions in your response 
3. Focus on answering the user's question directly
4. If the user asks what you can help with, provide a brief list of 2-3 main capabilities"""

        # Generate response using Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error in response generation: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again."

def process_text_input(text: str, session_id: str, conversation_history: List[Dict] = None) -> str:
    """Process text input from frontend and return only the response text"""
    try:
        # Detect emotions
        emotions = detect_emotion(text)
        
        # Get relevant context
        context = get_relevant_context(text)
        
        # Generate response
        response = generate_response(
            user_text=text,
            conversation_history=conversation_history or [],
            emotions=emotions,
            context=context
        )
        
        return response
    except Exception as e:
        print(f"Error in text processing: {str(e)}")
        return "I apologize, but I'm having trouble processing your message right now. Please try again."

def text_to_speech(text: str) -> bytes:
    """Convert text to speech using Gemini TTS"""
    # TODO: Implement text-to-speech conversion
    return b""

def process_audio_chunk(audio_data: bytes, session_id: str) -> Dict:
    """Process audio chunk"""
    # TODO: Implement audio processing with Whisper
    return {
        "text": "Test transcription",
        "emotion": "neutral",
        "context": [],
        "response": "Test response",
        "audio": b""
    } 