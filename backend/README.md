# AI Call Center Backend

Backend for AI call center using FastAPI, WebSocket, and various AI models.

## Requirements

- Python 3.8+
- pip
- Google Gemini API key
- Milvus server

## Installation

1. Install and start Milvus server:

```bash
# Using Docker
docker run -d --name milvus_standalone -p 19530:19530 -p 9091:9091 milvusdb/milvus:latest
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # for Linux/Mac
# or
.\venv\Scripts\activate  # for Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create `.env` file and add required environment variables:

```bash
cp .env.example .env
# Edit .env file with your API keys and settings
```

## Environment Variables

- `GOOGLE_API_KEY` - API key for Google Gemini
- `HOST` - server host (default: 0.0.0.0)
- `PORT` - server port (default: 8000)
- `ALLOWED_ORIGINS` - allowed CORS origins
- `MILVUS_HOST` - Milvus server host (default: localhost)
- `MILVUS_PORT` - Milvus server port (default: 19530)
- `EMOTION_MODEL` - emotion detection model
- `MAX_CONVERSATION_TURNS` - maximum conversation history turns

## Running the Server

```bash
uvicorn main:app --reload
```

## API Endpoints

### POST /call/start

Start a new call. Returns:

- session_id
- greeting_text

### WebSocket /call/text/{session_id}

WebSocket endpoint for text processing. Accepts:

- Text data
- Returns:
  - Response text
  - Emotion analysis
  - Relevant context

## Text Processing Pipeline

1. Receive text from client
2. Analyze emotions using Huggingface
3. Search context in Milvus
4. Generate response using Gemini
5. Send response back to client

## Project Structure

```
backend/
├── main.py           # FastAPI application
├── utils.py          # Text processing and model utilities
├── db.py            # Milvus database operations
├── requirements.txt  # Project dependencies
└── README.md         # Documentation
```

## Features

- Real-time text processing via WebSocket
- Emotion detection using Huggingface transformers
- Context retrieval using Milvus vector database
- Natural language generation using Google Gemini
- Session-based conversation history
- Concurrent call handling

## Technologies

- FastAPI
- WebSocket
- Huggingface Transformers
- Milvus
- Google Gemini API
- Python 3.8+
