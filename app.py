import os
import uuid
import json
import pytesseract
from PIL import Image, ImageGrab
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import subprocess as sp
import ollama
import platform

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set Tesseract path for Windows
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- FIX ---
# The 'sessions' dictionary is restored here for the chat endpoints.
sessions = {}

# (capture_screen and extract_text_from_image functions are correct and unchanged)
def capture_screen(filename: str = "screenshot.png") -> str:
    current_os = platform.system()
    try:
        if current_os == "Windows":
            screenshot = ImageGrab.grab()
            screenshot.save(filename)
        elif current_os == "Darwin":
            sp.run(["screencapture", filename], check=True)
        elif current_os == "Linux":
            sp.run(["gnome-screenshot", "-f", filename], check=True)
        else:
            raise OSError(f"Unsupported OS: {current_os}")
        return filename
    except Exception as e:
        raise RuntimeError(f"Screen capture failed on {current_os}: {e}")

def extract_text_from_image(image_path: str) -> str:
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR failed: {e}")

# --- Streaming function for /explain-screen ---
async def stream_ollama_response(prompt: str):
    try:
        stream = ollama.chat(
            model="llama3.1:latest",
            messages=[{'role': 'user', 'content': prompt}],
            stream=True
        )
        for chunk in stream:
            yield chunk['message']['content']
    except Exception as e:
        yield f"Error from AI model: {e}"

# --- Non-streaming function for chat history ---
def ask_ollama_with_session(session_id: str, prompt_text: str) -> str:
    if session_id not in sessions:
        sessions[session_id] = []
    sessions[session_id].append({"role": "user", "content": prompt_text})
    try:
        resp = ollama.chat(model="llama3.1:latest", messages=sessions[session_id])
        ai_reply = resp["message"]["content"]
    except Exception as e:
        raise RuntimeError(f"Ollama chat failed: {e}")
    sessions[session_id].append({"role": "assistant", "content": ai_reply})
    return ai_reply


# ---------- Endpoints ----------

@app.get("/explain-screen")
async def explain_screen():
    screenshot_path = "screenshot.png"
    try:
        screenshot_path = capture_screen(screenshot_path)
        extracted_text = extract_text_from_image(screenshot_path)

        if not extracted_text:
            async def error_stream():
                yield "Error: No text found on screen"
            return StreamingResponse(error_stream(), media_type="text/plain")

        prompt = f"""
You are an expert programmer and assistant. Analyze the following text extracted from the user's screen.
If it is a programming problem, provide a clean, efficient code solution first. Then, add a brief explanation of the logic below the code.
If it is any other type of text, provide a concise explanation or summary.
Format your response clearly using Markdown.

---
Extracted Text:
{extracted_text}
---
"""
        return StreamingResponse(stream_ollama_response(prompt), media_type="text/event-stream")

    except Exception as e:
        async def exception_stream():
            yield f"An unexpected error occurred: {str(e)}"
        return StreamingResponse(exception_stream(), media_type="text/plain")
    finally:
        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)

@app.post("/ask-text")
async def ask_text(request: Request):
    data = await request.json()
    question = data.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    session_id = str(uuid.uuid4())
    try:
        ai_reply = ask_ollama_with_session(session_id, question)
        return {"session_id": session_id, "ai_reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat-session")
async def chat_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    message = data.get("message", "")
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=400, detail="Invalid or expired session_id")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    try:
        ai_reply = ask_ollama_with_session(session_id, message)
        return {"session_id": session_id, "ai_reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))