import os
import uuid
import json
import pytesseract
from PIL import Image
from fastapi import FastAPI, Request, HTTPException
import subprocess as sp
import ollama

app = FastAPI()

# ---------- In-memory session store ----------
# Each session is a list of messages in Ollama format: {"role": "user"|"assistant", "content": "..."}
sessions = {}

# ---------- Capture Screen (gnome-screenshot) ----------
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

# ---------- Helper: extract JSON substring if model wraps with markdown / text ----------
def extract_json_substring(s: str) -> str:
    """Find first balanced JSON object in s and return it (raises ValueError if none)."""
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

# ---------- Ollama: ask + store in session ----------
def ask_ollama_with_session(session_id: str, prompt_text: str) -> str:
    """
    Send messages in sessions[session_id] (which should already contain prior messages),
    append the user message, call ollama.chat, append assistant reply to session and return reply string.
    """
    if session_id not in sessions:
        sessions[session_id] = []

    # append user message (as Ollama expects)
    sessions[session_id].append({"role": "user", "content": prompt_text})

    try:
        resp = ollama.chat(
            model="llama3.1:latest",
            messages=sessions[session_id]
        )
    except Exception as e:
        raise RuntimeError(f"Ollama chat failed: {e}")

    # Ollama's response structure assumed: resp["message"]["content"]
    try:
        ai_reply = resp["message"]["content"]
    except Exception:
        # fallback: marshalled resp -> string
        ai_reply = str(resp)

    # append assistant message
    sessions[session_id].append({"role": "assistant", "content": ai_reply})

    return ai_reply

# ---------- Endpoints ----------

@app.get("/explain-screen")
def explain_screen():
    """
    Capture the screen, OCR the text, ask Ollama to classify & either solve or explain.
    Always returns structured ai_analysis (tries to parse JSON from the model; falls back to 'general').
    Also returns a new session_id for follow-up chat.
    """
    try:
        session_id = str(uuid.uuid4())

        # capture (uses the gnome-screenshot command that worked for you)
        screenshot_path = capture_screen("screenshot.png")

        # OCR
        extracted_text = extract_text_from_image(screenshot_path)
        if not extracted_text:
            return {"error": "No text found on screen"}

        # structured prompt (model will be asked to return valid JSON)
        prompt = f"""
You are an AI assistant. Analyze the following text extracted from a screen:

\"\"\"{extracted_text}\"\"\"

Classify it into one of these categories:
1. "problem" → if it's a programming/coding problem.
   - Give only the direct solution (code, steps, or answer). Do not repeat the problem.
2. "paragraph" → if it's an academic/book/article paragraph.
   - Give a simplified explanation so anyone can easily understand.
3. "general" → everything else.
   - Summarize briefly and provide useful insights.

Return ONLY valid JSON in this format (no extra text):
{{
  "type": "problem" | "paragraph" | "general",
  "solution_or_explanation": "...",
  "extra_notes": "..."
}}
"""

        # send to Ollama and store session history
        ai_reply = ask_ollama_with_session(session_id, prompt)

        # attempt to parse JSON strictly; if fails, try to extract JSON substring; if still fails, fallback
        parsed = None
        try:
            parsed = json.loads(ai_reply)
        except Exception:
            try:
                json_sub = extract_json_substring(ai_reply)
                parsed = json.loads(json_sub)
            except Exception:
                parsed = {
                    "type": "general",
                    "solution_or_explanation": ai_reply,
                    "extra_notes": ""
                }

        # optionally cleanup screenshot file
        try:
            if os.path.exists(screenshot_path):
                os.remove(screenshot_path)
        except Exception:
            pass

        return {
            "session_id": session_id,
            "extracted_text": extracted_text,
            "ai_analysis": parsed
        }

    except Exception as e:
        return {"error": str(e)}

@app.post("/ask-text")
async def ask_text(request: Request):
    """
    Simple text ask endpoint (unchanged): runs `ollama run llama3.1 <question>` via subprocess.
    This stays as-is so existing behavior is preserved.
    """
    data = await request.json()
    question = data.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        result = sp.run(
            ["ollama", "run", "llama3.1", question],
            capture_output=True,
            text=True
        )
        return {"question": question, "answer": result.stdout.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat-session")
async def chat_session(request: Request):
    """
    Continue a session-based chat using session_id returned by /explain-screen.
    Body JSON: { "session_id": "...", "message": "..." }
    """
    data = await request.json()
    session_id = data.get("session_id")
    message = data.get("message", "")

    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=400, detail="Invalid or expired session_id")

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    try:
        ai_reply = ask_ollama_with_session(session_id, message)
        return {"session_id": session_id, "user_message": message, "ai_reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
