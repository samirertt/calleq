import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
import os
import tempfile
import base64

model = ChatterboxTTS.from_pretrained(device="cuda")


def text_to_speech(text: str) -> bytes:
    """
    Convert text to speech using ChatterboxTTS and return the audio data as bytes
    
    Args:
        text (str): The text to convert to speech
        
    Returns:
        bytes: The audio data as bytes
    """
    # Generate speech using ChatterboxTTS
    wav = model.generate(text)
    
    # Create a temporary file to store the audio
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
        # Save the audio
        ta.save(temp_file.name, wav, model.sr)
        
        # Read the audio data
        with open(temp_file.name, 'rb') as audio_file:
            audio_data = audio_file.read()
            
        # Clean up the temporary file
        os.unlink(temp_file.name)
        
        return audio_data
