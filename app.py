"""
Smart Curve — Flask app
Run: pip install flask requests && python app.py
"""

import json
import math
import os
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)


# ---------------------------------------------------------------------------
# Curve calculators — pure Python math, Gemini never touches these
# ---------------------------------------------------------------------------

def curve_flat(scores):
    bonus = 100 - max(scores)
    return [min(100, round(s + bonus, 1)) for s in scores]

def curve_root(scores):
    return [min(100, round(math.sqrt(s) * 10, 1)) for s in scores]

def curve_intelligence(scores, voided_pct):
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
    avg = round(sum(scores) / len(scores), 1)
    passing = [s for s in scores if s >= 60]
    return {
        "average": avg,
        "highest": max(scores),
        "lowest": min(scores),
        "passing_count": len(passing),
        "passing_rate_pct": round(len(passing) / len(scores) * 100, 1),
    }


# ---------------------------------------------------------------------------
# Per-question statistics — computed entirely in Python
# ---------------------------------------------------------------------------

def compute_question_stats(students):
    """
    Given a list of student dicts with 'question_scores' (list of dicts
    {label, score, max_score}), compute per-question aggregate stats.

    Returns a list of:
      {
        label, avg_score, max_score, avg_pct,
        miss_rate_pct,       # % of students scoring < 60% on that question
        perfect_rate_pct,    # % scoring 100%
        student_breakdown: [{name, score, max_score, pct}]
      }
    """
    if not students or not students[0].get("question_scores"):
        return []

    num_questions = len(students[0]["question_scores"])
    stats = []

    for q_idx in range(num_questions):
        q_label = students[0]["question_scores"][q_idx]["label"]
        max_score = students[0]["question_scores"][q_idx]["max_score"]

        breakdown = []
        for s in students:
            qs = s["question_scores"][q_idx]
            raw = float(qs["score"])
            pct = round(raw / max_score * 100, 1) if max_score > 0 else 0
            breakdown.append({
                "name": s["name"],
                "score": raw,
                "max_score": max_score,
                "pct": pct,
            })

        scores_pct = [b["pct"] for b in breakdown]
        miss_rate = round(sum(1 for p in scores_pct if p < 60) / len(scores_pct) * 100, 1)
        perfect_rate = round(sum(1 for p in scores_pct if p >= 99.9) / len(scores_pct) * 100, 1)

        stats.append({
            "label": q_label,
            "avg_score": round(sum(b["score"] for b in breakdown) / len(breakdown), 1),
            "max_score": max_score,
            "avg_pct": round(sum(scores_pct) / len(scores_pct), 1),
            "miss_rate_pct": miss_rate,
            "perfect_rate_pct": perfect_rate,
            "student_breakdown": breakdown,
        })

    return stats


# ---------------------------------------------------------------------------
# Gemini analyst
# ---------------------------------------------------------------------------

def _build_prompt(quiz_text, scores, selected_curve, question_stats):
    avg = round(sum(scores) / len(scores), 1)

    # Build a structured per-question table for Gemini
    if question_stats:
        rows = [
            f"  - {q['label']}: avg {q['avg_pct']}% | miss rate {q['miss_rate_pct']}% | "
            f"perfect rate {q['perfect_rate_pct']}%"
            for q in question_stats
        ]
        q_table = "Per-question breakdown (real computed data):\n" + "\n".join(rows)
    else:
        q_table = "(No per-question data — analyze overall scores only)"

    return f"""You are the backend AI analyst for a teacher's grading curve app.
Your role is ANALYSIS ONLY. You never calculate final scores — the Python backend does all arithmetic.
Identify patterns, flag unfair questions using the REAL miss-rate data provided below.
Only flag a question in flagged_questions if it appears in the per-question breakdown.

Quiz content:
{quiz_text or "(No quiz text provided)"}

Raw total scores (out of 100): {", ".join(str(s) for s in scores)}
Class average: {avg}%
Highest score: {max(scores)}%
Selected curve strategy: {selected_curve}

{q_table}

Respond ONLY with a valid JSON object — no markdown fences, no preamble:
{{
  "curve_recommendation": "flat" | "root" | "intelligence",
  "voided_question_pct": <integer 0-30>,
  "root_cause": "<2-3 sentence paragraph explaining WHY the class performed this way>",
  "flagged_questions": [
    {{
      "question": "<label exactly as shown in per-question breakdown>",
      "issue": "<one sentence>",
      "miss_rate_pct": <use the real miss_rate_pct from the data above>,
      "void_recommended": <true|false>
    }}
  ],
  "fairness_report": "<3-4 sentence formal summary a teacher can share with parents or admin>",
  "competency_gap": "<one sentence on what concept students have not yet mastered>"
}}"""


def _gemini_analyze_with_url(quiz_text, scores, selected_curve, url, question_stats=None):
    prompt = _build_prompt(quiz_text, scores, selected_curve, question_stats or [])
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise Exception(data["error"].get("message", "Unknown Gemini error"))
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(clean)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY environment variable is not set. Set it and restart the server."}), 500

    body = request.get_json()
    students = body.get("students", [])
    quiz_text = body.get("quiz_text", "")
    curve_method = body.get("curve_method", "flat")

    if not students:
        return jsonify({"error": "No students provided"}), 400

    # ── Compute total scores ──────────────────────────────────────────────
    # If per-question scores are provided, sum them into a 0-100 total.
    # Otherwise fall back to the legacy single-score field.
    has_question_scores = bool(
        students[0].get("question_scores") and len(students[0]["question_scores"]) > 0
    )

    if has_question_scores:
        total_possible = sum(q["max_score"] for q in students[0]["question_scores"])
        for s in students:
            earned = sum(float(q["score"]) for q in s["question_scores"])
            s["score"] = round(earned / total_possible * 100, 1) if total_possible > 0 else 0

    raw_scores = [float(s["score"]) for s in students]

    # ── Per-question stats (Python only, not Gemini) ──────────────────────
    question_stats = compute_question_stats(students) if has_question_scores else []

    # ── Gemini call ───────────────────────────────────────────────────────
    key = GEMINI_API_KEY
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={key}"
    )

    try:
        analysis = _gemini_analyze_with_url(
            quiz_text, raw_scores, curve_method, url, question_stats
        )
    except Exception as e:
        return jsonify({"error": f"Gemini error: {str(e)}"}), 500

    # ── Curve ─────────────────────────────────────────────────────────────
    voided_pct = analysis.get("voided_question_pct", 0)
    curved_scores = CURVE_FNS.get(curve_method, CURVE_FNS["flat"])(raw_scores, voided_pct)

    gradebook = []
    for i, student in enumerate(students):
        raw = raw_scores[i]
        curved = curved_scores[i]
        entry = {
            "name": student["name"],
            "raw_score": raw,
            "raw_letter": letter_grade(raw),
            "curved_score": curved,
            "curved_letter": letter_grade(curved),
            "delta": round(curved - raw, 1),
        }
        if has_question_scores:
            entry["question_scores"] = student["question_scores"]
        gradebook.append(entry)

    upgrades = sum(
        1 for row in gradebook
        if letter_grade(row["curved_score"]) > row["raw_letter"]
    )

    return jsonify({
        "analysis": analysis,
        "gradebook": gradebook,
        "raw_stats": class_stats(raw_scores),
        "curved_stats": class_stats(curved_scores),
        "students_upgraded": upgrades,
        "curve_method": curve_method,
        "question_stats": question_stats,
    })


@app.route("/api/preview", methods=["POST"])
def preview():
    """Recalculate final scores with an extra bonus — no AI call needed."""
    body = request.get_json()
    gradebook = body.get("gradebook", [])
    extra_bonus = float(body.get("extra_bonus", 0))

    result = []
    upgrades = 0
    for row in gradebook:
        final = min(100, round(row["curved_score"] + extra_bonus, 1))
        fl = letter_grade(final)
        if fl > row["raw_letter"]:
            upgrades += 1
        result.append({**row, "final_score": final, "final_letter": fl,
                        "total_delta": round(final - row["raw_score"], 1)})

    return jsonify({"gradebook": result, "students_upgraded": upgrades})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
