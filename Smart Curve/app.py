"""
Smart Curve - Flask app
Run: pip install flask requests python-dotenv && python app.py
"""

import json
import math
import os
import time
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv() 

app = Flask(__name__)

# 2. Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Use v1beta and gemini-1.5-flash for stability on free tier
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

# ---------------------------------------------------------------------------
# Curve calculators - pure Python math
# ---------------------------------------------------------------------------

def curve_flat(scores):
    if not scores: return []
    bonus = 100 - max(scores)
    return [min(100, round(s + bonus, 1)) for s in scores]

def curve_root(scores):
    if not scores: return []
    return [min(100, round(math.sqrt(s) * 10, 1)) for s in scores]

def curve_intelligence(scores, voided_pct):
    if not scores: return []
    if voided_pct <= 0:
        return [round(s, 1) for s in scores]
    divisor = 1 - (voided_pct / 100)
    return [min(100, round(s / divisor, 1)) for s in scores]

CURVE_FNS = {
    "flat": lambda scores, vp: curve_flat(scores),
    "root": lambda scores, vp: curve_root(scores),
    "intelligence": lambda scores, vp: curve_intelligence(scores, vp),
}

def letter_grade(score):
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"

def class_stats(scores):
    if not scores: return {}
    avg = round(sum(scores) / len(scores), 1)
    passing = [s for s in scores if s >= 60]
    return {
        "average": avg,
        "highest": max(scores),
        "lowest": min(scores),
        "passing_count": len(passing),
        "passing_rate_pct": round(len(passing) / len(scores) * 100, 1) if scores else 0,
    }

# ---------------------------------------------------------------------------
# Gemini Logic
# ---------------------------------------------------------------------------

def _gemini_analyze_with_url(quiz_text, scores, selected_curve, url, max_retries=3):
    avg = round(sum(scores) / len(scores), 1)
    
    prompt = f"""Analyze these biology results. 
Quiz: {quiz_text[:500]} 
Scores: {scores}
Avg: {avg}%
Strategy: {selected_curve}

Return ONLY JSON:
{{
  "curve_recommendation": "{selected_curve}",
  "voided_question_pct": 5,
  "root_cause": "Brief explanation.",
  "flagged_questions": [],
  "fairness_report": "Summary.",
  "competency_gap": "Main concept missed."
}}"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800},
    }

    for attempt in range(max_retries):
        try:
            resp = requests.post(url, json=payload, timeout=25)
            if resp.status_code == 429:
                time.sleep((attempt + 1) * 5)
                continue
            
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].strip()
                
            return json.loads(raw_text)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json()
    students = body.get("students", [])
    quiz_text = body.get("quiz_text", "")
    curve_method = body.get("curve_method", "flat")

    if not students:
        return jsonify({"error": "No students provided"}), 400

    raw_scores = [float(s["score"]) for s in students]

    try:
        analysis = _gemini_analyze_with_url(quiz_text, raw_scores, curve_method, GEMINI_URL)
    except Exception as e:
        print(f"Fallback used. Error: {e}")
        analysis = {
            "curve_recommendation": curve_method,
            "voided_question_pct": 5 if curve_method == "intelligence" else 0,
            "root_cause": "AI busy. Standard curve applied.",
            "flagged_questions": [],
            "fairness_report": "Grade adjustment applied.",
            "competency_gap": "N/A"
        }

    voided_pct = float(analysis.get("voided_question_pct", 0))
    final_method = analysis.get("curve_recommendation", curve_method)
    curve_fn = CURVE_FNS.get(final_method, CURVE_FNS["flat"])
    curved_scores = curve_fn(raw_scores, voided_pct)

    gradebook = []
    for i, student in enumerate(students):
        r_score = raw_scores[i]
        c_score = curved_scores[i]
        gradebook.append({
            "name": student["name"],
            "raw_score": r_score,
            "raw_letter": letter_grade(r_score),
            "curved_score": c_score,
            "curved_letter": letter_grade(c_score),
            "delta": round(c_score - r_score, 1)
        })

    return jsonify({
        "analysis": analysis,
        "gradebook": gradebook,
        "raw_stats": class_stats(raw_scores),
        "curved_stats": class_stats(curved_scores),
        "curve_method": final_method
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)