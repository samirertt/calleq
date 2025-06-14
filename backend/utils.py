import os
from typing import List, Dict
import torch
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import google.generativeai as genai
from dotenv import load_dotenv
from db import search_similar

# Load environment variables
load_dotenv()

# Initialize Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize emotion model
emotion_model = AutoModelForSequenceClassification.from_pretrained("boltuix/bert-emotion")
emotion_tokenizer = AutoTokenizer.from_pretrained("boltuix/bert-emotion")
emotion_pipeline = pipeline(
    "text-classification",
    model=emotion_model,
    tokenizer=emotion_tokenizer,
    device=0 if torch.cuda.is_available() else -1  # Use GPU if available
)

def detect_emotion(text: str) -> str:
    """Detect emotion in text"""
    try:
        result = emotion_pipeline(text)[0]
        return result['label']
    except Exception as e:
        print(f"Error in emotion detection: {str(e)}")
        return "neutral"

def get_relevant_context(text: str, n_results: int = 3) -> List[str]:
    """Get relevant context from vector DB"""
    try:
        return search_similar("company_knowledge", text, n_results)
    except Exception as e:
        print(f"Error in context retrieval: {str(e)}")
        return []

def generate_response(
    user_text: str,
    conversation_history: List[Dict],
    emotion: str,
    context: List[str]
) -> str:
    """Generate response using Gemini"""
    try:
        # Build prompt
        prompt = f"""You are a caring call center agent with emotional intelligence.
        
User's emotional state: {emotion}

Relevant context:
{chr(10).join(context)}

Conversation history:
{chr(10).join([f"{msg['role']}: {msg['text']}" for msg in conversation_history[-6:]])}

User's message: {user_text}

Please provide a natural, empathetic response that addresses the user's needs while considering their emotional state."""

        # Generate response
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error in response generation: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again."

def process_text_input(text: str, session_id: str) -> Dict:
    """Process text input from frontend"""
    try:
        # Detect emotion
        emotion = detect_emotion(text)
        
        # Get relevant context
        context = get_relevant_context(text)
        
        # Generate response
        response = generate_response(
            user_text=text,
            conversation_history=[],  # TODO: Get from session storage
            emotion=emotion,
            context=context
        )
        
        return {
            "text": text,
            "emotion": emotion,
            "context": context,
            "response": response
        }
    except Exception as e:
        print(f"Error in text processing: {str(e)}")
        return {
            "text": text,
            "emotion": "neutral",
            "context": [],
            "response": "I apologize, but I'm having trouble processing your message right now. Please try again."
        }

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