from fish_audio_sdk import WebSocketSession, TTSRequest
import logging
import tempfile
import os
from pathlib import Path
import wave
import struct

logger = logging.getLogger(__name__)

def play_reka_audio_directly(text: str, api_key: str = "1f03239462174d28b5542be2c40e0598", model_id: str = "77fb1472a0f54b358ef95fab9d80139a"):
    """
    Play Reka AI output directly as speech on the backend server.
    This function generates audio from text and plays it through PyAudio.
    
    Args:
        text: Text from Reka AI to convert to speech
        api_key: Fish Audio API key
        model_id: Voice model ID for TTS
        
    Returns:
        Path to the generated audio file (if saved)
    """
    try:
        logger.info(f"Starting Fish Audio TTS for text: '{text[:50]}...'")
        
        # Initialize Fish Audio session
        session = WebSocketSession(api_key)
        
        # Create TTS request
        request = TTSRequest(
            text=text,
            reference_id=model_id
        )
        
        # Collect audio chunks
        audio_chunks = []
        chunk_count = 0
        with session:
            for chunk in session.tts(request):
                audio_chunks.append(chunk)
                chunk_count += 1
        
        logger.info(f"Received {chunk_count} audio chunks from Fish Audio")
        
        if not audio_chunks:
            logger.warning("No audio chunks received from Fish Audio")
            return None
        
        # Save audio to temporary file
        temp_dir = Path("temp_reka_uploads")
        temp_dir.mkdir(exist_ok=True)
        
        audio_file = temp_dir / f"reka_output_{hash(text) % 100000}.wav"
        
        # Combine all chunks
        audio_data = b''.join(audio_chunks)
        
        # Fish Audio returns PCM data, we need to create a proper WAV file
        # Assuming 16-bit PCM, mono, 24kHz (common for TTS)
        sample_rate = 24000
        num_channels = 1
        bits_per_sample = 16
        
        # Write WAV file with proper headers
        with wave.open(str(audio_file), 'wb') as wav_file:
            wav_file.setnchannels(num_channels)
            wav_file.setsampwidth(bits_per_sample // 8)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data)
        
        logger.info(f"Audio file saved: {audio_file} ({len(audio_data)} bytes)")
        
        # Try to play audio using PyAudio if available
        try:
            import pyaudio
            
            logger.info("Playing audio through PyAudio...")
            p = pyaudio.PyAudio()
            
            # Try to determine audio format from file
            # For now, we'll assume WAV format
            stream = p.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=24000,  # Common sample rate
                output=True
            )
            
            # Read and play the audio file
            with open(audio_file, 'rb') as f:
                # Skip WAV header (44 bytes) if it's a WAV file
                audio_data_to_play = f.read()[44:] if audio_file.suffix == '.wav' else f.read()
                stream.write(audio_data_to_play)
            
            stream.stop_stream()
            stream.close()
            p.terminate()
            
            logger.info("Audio playback completed")
            
        except ImportError:
            logger.info("PyAudio not available, skipping live playback")
        except Exception as e:
            logger.warning(f"Could not play audio directly: {e}")
        
        return str(audio_file)
        
    except Exception as e:
        logger.error(f"Fish Audio TTS failed: {e}")
        logger.exception("Full error trace:")
        return None


def generate_speech_from_text(
    text: str,
    api_key: str = "1f03239462174d28b5542be2c40e0598",
    model_id: str = "77fb1472a0f54b358ef95fab9d80139a",
    output_file: str = None
) -> bytes:
    """
    Generate speech audio from text and optionally save to file.
    This is used by the API endpoint to generate audio files.
    
    Args:
        text: Text to convert to speech
        api_key: Fish Audio API key
        model_id: Voice model ID for TTS
        output_file: Optional path to save audio file
        
    Returns:
        bytes: Audio data
    """
    try:
        logger.info(f"Generating speech from text: '{text[:50]}...'")
        
        # Initialize Fish Audio session
        session = WebSocketSession(api_key)
        
        # Create TTS request
        request = TTSRequest(
            text=text,
            reference_id=model_id
        )
        
        # Collect audio chunks
        audio_chunks = []
        with session:
            for chunk in session.tts(request):
                audio_chunks.append(chunk)
        
        audio_data = b''.join(audio_chunks)
        
        # Save to file if specified
        if output_file:
            # Create proper WAV file
            sample_rate = 24000
            num_channels = 1
            bits_per_sample = 16
            
            with wave.open(output_file, 'wb') as wav_file:
                wav_file.setnchannels(num_channels)
                wav_file.setsampwidth(bits_per_sample // 8)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data)
            logger.info(f"Audio saved to {output_file}")
        
        logger.info(f"Generated {len(audio_data)} bytes of audio")
        return audio_data
        
    except Exception as e:
        logger.error(f"Fish Audio TTS failed: {e}")
        logger.exception("Full error trace:")
        raise