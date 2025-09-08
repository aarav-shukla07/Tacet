import os
import uuid
import json
import pytesseract
from PIL import Image
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess as sp
import ollama

app = FastAPI()

# Allow CORS (frontend can talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- In-memory session store ----------
sessions = {}

# ---------- Capture Screen ----------
def capture_screen(filename: str = "screenshot.png") -> str:
    try:
        sp.run(["gnome-screenshot", "-f", filename], check=True)
        return filename
    except sp.CalledProcessError as e:
        raise RuntimeError(f"Screen capture failed: {e}")

# ---------- OCR Extraction ----------
def extract_text_from_image(image_path: str) -> str:
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR failed: {e}")

# ---------- JSON extractor ----------
def extract_json_substring(s: str) -> str:
    start = s.find("{")
    if start == -1:
        raise ValueError("No JSON object found")
    depth = 0
    for i in range(start, len(s)):
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
            if depth == 0:
                return s[start:i+1]
    raise ValueError("No complete JSON object found")

# ---------- Ollama Session Chat ----------
def ask_ollama_with_session(session_id: str, prompt_text: str) -> str:
    if session_id not in sessions:
        sessions[session_id] = []

    sessions[session_id].append({"role": "user", "content": prompt_text})

    try:
        resp = ollama.chat(
            model="llama3.1:latest",
            messages=sessions[session_id]
        )
    except Exception as e:
        raise RuntimeError(f"Ollama chat failed: {e}")

    try:
        ai_reply = resp["message"]["content"]
    except Exception:
        ai_reply = str(resp)

    sessions[session_id].append({"role": "assistant", "content": ai_reply})
    return ai_reply

# ---------- Endpoints ----------

@app.get("/explain-screen")
def explain_screen():
    try:
        session_id = str(uuid.uuid4())
        screenshot_path = capture_screen("screenshot.png")
        extracted_text = extract_text_from_image(screenshot_path)

        if not extracted_text:
            return {"error": "No text found on screen"}

        prompt = f"""
You are Genie. Analyze the following extracted screen text:

\"\"\"{extracted_text}\"\"\"

Return JSON only:
{{
  "type": "problem" | "paragraph" | "general",
  "solution_or_explanation": "...",
  "extra_notes": "..."
}}
"""

        ai_reply = ask_ollama_with_session(session_id, prompt)

        try:
            parsed = json.loads(ai_reply)
        except Exception:
            try:
                parsed = json.loads(extract_json_substring(ai_reply))
            except Exception:
                parsed = {
                    "type": "general",
                    "solution_or_explanation": ai_reply,
                    "extra_notes": ""
                }

        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)

        return {
            "session_id": session_id,
            "extracted_text": extracted_text,
            "ai_analysis": parsed
        }

    except Exception as e:
        return {"error": str(e)}

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
