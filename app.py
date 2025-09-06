import os
import subprocess
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from PIL import Image
import pytesseract
import json
import subprocess as sp
import ollama
import uuid

app = FastAPI()

# ---------- Session Store ----------
sessions = {}  # { session_id: [ {role, content}, ... ] }

# ---------- Capture Screen ----------
def capture_screen(filename="screenshot.png"):
    try:
        subprocess.run(["gnome-screenshot", "-f", filename], check=True)
        return filename
    except Exception as e:
        raise RuntimeError(f"Screen capture failed: {str(e)}")

# ---------- OCR Extraction ----------
def extract_text_from_image(image_path):
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR failed: {str(e)}")

# ---------- Ollama Chat Call ----------
def chat_with_ollama(session_id, user_message):
    if session_id not in sessions:
        sessions[session_id] = []

    # Add user message
    sessions[session_id].append({"role": "user", "content": user_message})

    try:
        response = ollama.chat(
            model="llama3.1:latest",
            messages=sessions[session_id]
        )
        ai_reply = response["message"]["content"]

        # Add AI reply to session
        sessions[session_id].append({"role": "assistant", "content": ai_reply})

        return ai_reply
    except Exception as e:
        raise RuntimeError(f"Ollama chat failed: {str(e)}")

# ---------- Endpoints ----------
@app.get("/explain-screen")
def explain_screen():
    try:
        # Capture screenshot using gnome-screenshot (working for you earlier)
        subprocess.run(["gnome-screenshot", "-f", "screenshot.png"], check=True)

        # Extract text with OCR
        extracted_text = pytesseract.image_to_string(Image.open("screenshot.png"))

        if not extracted_text.strip():
            return {"error": "No text found on screen"}

        # Structured prompt for analysis
        prompt = f"""
You are an AI assistant. Analyze the following text extracted from a screen:

\"\"\"{extracted_text}\"\"\"

Classify it into one of these categories:
1. "problem" → if it's a programming problem, coding question, or issue.
   - Give only the direct solution (code, steps, or answer). Do not repeat the problem.
2. "paragraph" → if it's an academic/book/article paragraph.
   - Give a simplified explanation so anyone can easily understand.
3. "general" → for everything else.
   - Summarize briefly and provide useful insights.

Return your answer strictly in JSON format:
{{
  "type": "problem" | "paragraph" | "general",
  "solution_or_explanation": "...",
  "extra_notes": "..."
}}
"""

        # Call Ollama with session support
        session_id = str(uuid.uuid4())
        sessions[session_id] = [{"role": "user", "content": prompt}]

        response = ollama.chat(
            model="llama3.1:latest",
            messages=sessions[session_id]
        )

        ai_reply = response["message"]["content"]

        # Try JSON parsing
        try:
            parsed = json.loads(ai_reply)
        except Exception:
            parsed = {"type": "general", "solution_or_explanation": ai_reply, "extra_notes": ""}

        return {
            "session_id": session_id,
            "extracted_text": extracted_text,
            "ai_analysis": parsed
        }

    except Exception as e:
        return {"error": str(e)}


@app.post("/ask-text")
async def ask_text(request: dict):
    question = request.get("question", "")
    try:
        result = sp.run(
            ["ollama", "run", "llama3.1", question],
            capture_output=True,
            text=True
        )
        return {"question": question, "answer": result.stdout.strip()}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat-session")
async def chat_session(request: dict):
    session_id = request.get("session_id")
    message = request.get("message", "")

    if not session_id or session_id not in sessions:
        return {"error": "Invalid or expired session_id"}

    try:
        ai_reply = chat_with_ollama(session_id, message)
        return {"session_id": session_id, "user_message": message, "ai_reply": ai_reply}
    except Exception as e:
        return {"error": str(e)}
