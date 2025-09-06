import os
import subprocess
from fastapi import FastAPI
from PIL import Image
import pytesseract
import json
import subprocess as sp

app = FastAPI()

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

# ---------- Ollama Call ----------
def ask_ollama_extracted_text(text):
    try:
        result = sp.run(
            ["ollama", "run", "llama3.1", text],
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except Exception as e:
        raise RuntimeError(f"Ollama call failed: {str(e)}")

# ---------- Endpoints ----------
@app.get("/explain-screen")
async def explain_screen():
    try:
        screenshot_file = capture_screen()
        extracted_text = extract_text_from_image(screenshot_file)
        explanation = ask_ollama_extracted_text(extracted_text)

        # Cleanup
        if os.path.exists(screenshot_file):
            os.remove(screenshot_file)

        return {
            "extracted_text": extracted_text,
            "explanation": explanation
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
