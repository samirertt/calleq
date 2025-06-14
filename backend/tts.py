import os
from typing import Dict, Any
from dia.model import Dia
import soundfile as sf
from pathlib import Path

class TextToSpeech:
    def __init__(self):
        """Initialize Dia TTS model."""
        self.model = Dia.from_pretrained("nari-labs/Dia-1.6B")
        self.output_dir = Path("audio_outputs")
        self.output_dir.mkdir(exist_ok=True)
    
    def _get_emotion_tag(self, emotion: str) -> str:
        """Convert emotion to Dia emotion tag."""
        emotion_map = {
            "happy": "happy",
            "sad": "sad",
            "angry": "angry",
            "neutral": "neutral",
            "excited": "excited",
            "worried": "worried",
            "friendly": "friendly",
            "professional": "professional"
        }
        return emotion_map.get(emotion.lower(), "neutral")
    
    def text_to_speech(self, text: str, emotion: str = "neutral", output_filename: str = None) -> str:
        """
        Convert text to speech using Dia TTS with specified emotion.
        
        Args:
            text (str): Text to convert to speech
            emotion (str): Emotion to use in speech (happy, sad, angry, neutral, etc.)
            output_filename (str): Optional custom filename for output
            
        Returns:
            str: Path to the generated audio file
        """
        # Get emotion tag
        emotion_tag = self._get_emotion_tag(emotion)
        
        # Format text with emotion tag
        formatted_text = f"[S1][{emotion_tag}] {text}"
        
        # Generate speech
        audio = self.model.generate(formatted_text, use_torch_compile=True)
        
        # Generate output filename if not provided
        if output_filename is None:
            output_filename = f"response_{emotion_tag}.wav"
        
        # Ensure output filename has .wav extension
        if not output_filename.endswith('.wav'):
            output_filename += '.wav'
        
        # Full path to output file
        output_path = self.output_dir / output_filename
        
        # Save audio file
        sf.write(str(output_path), audio, 44100)
        
        return str(output_path)

# Example usage
if __name__ == "__main__":
    tts = TextToSpeech()
    
    # Test different emotions
    test_texts = [
        ("Hello, how may I assist you today?", "friendly"),
        ("I apologize, but we cannot process your request at this time.", "sad"),
        ("Great news! Your booking has been confirmed!", "excited"),
        ("Please provide your booking reference number.", "professional")
    ]
    
    for text, emotion in test_texts:
        output_path = tts.text_to_speech(text, emotion)
        print(f"Generated {emotion} audio: {output_path}") 