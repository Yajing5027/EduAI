# EduAI — Teacher-focused Toolkit

### 🏆 **Winner: 1st Place (Beginner Track) @ ColorStack x Google Developer Groups Hackathon 2026**
> This project was developed during the **2026 ColorStack x Google Developer Groups Hackathon**, where it stood out among numerous entries to secure the top spot in the beginner category.

Jump to: [Survey Flow](#survey-flow) · [Smart Curve Detailed Manual](#appendix-smart-curve-detailed-manual)

---

## Purpose
EduAI helps teachers quickly gauge student understanding after a lecture by combining two complementary capabilities in one workflow: an in-class survey flow and a **Smart Curve** tool for fair score adjustments.

## Survey Flow
This feature produces concise comprehension questions from slide text, lets teachers preview and publish a survey, and collects student confidence ratings. 

* **Highlights:** Preserves previewed questions on publish; Quick shareable student links; Aggregated AI summaries.
* **Usage:** Paste slide text → Generate → Review & Publish → View Results.

---

## Why this matters
- **Rapid Feedback:** Teachers can prioritize follow-up teaching immediately.
- **Actionable Signals:** Per-topic scores and class averages guide remediation.
- **Low-friction:** A streamlined workflow designed for real classroom environments.

---

## Implementation Notes
- **Frontend:** Static single-page app under `frontend/` (core logic in `app.js`).
- **Prototypes:** AI integration logic exists under `frontend/legacy/` and `Smart Curve/`.

---

## Appendix: Smart Curve Detailed Manual
<a name="appendix-smart-curve-detailed-manual"></a>

### 📊 SMART CURVE | QUICK-ANALYSIS EDITION (MANUAL ENTRY)

**Description:**
Smart Curve is a lightweight Flask application designed for educators to apply fair grading curves. This version uses manual data entry, making it extremely reliable for quick demonstrations and classroom use.

#### 1. Prerequisites
- Python 3.10 or higher.
- Google Gemini API Key.

#### 2. Installation
```bash
pip install flask requests python-dotenv
```

#### 3. Setup
1. Create a `.env` file in the same folder as `app.py`.
2. Add your key: `GEMINI_API_KEY=your_actual_key_here`
3. Ensure `index.html` is inside the `templates` folder.

#### 4. Running the App
```bash
python app.py
```
Access via: `http://127.0.0.1:5000`

#### 5. The Intelligence Curve (AI-Powered)
The **Intelligence Curve** is our flagship feature that uses **Google Gemini** to analyze if a quiz was "unfair" due to poor wording or curriculum gaps.
- **How it works:** If the AI detects a high failure rate on specific topics, it calculates a **"Voided Question Percentage"**, effectively removing "bad" questions without penalizing students.

#### 6. Math Models
- **Flat Curve:** Adds points based on the highest score.
- **Root Curve:** Lifts lower scores more aggressively ($10 \times \sqrt{\text{score}}$).

---
*Developed for academic projects at MNSU, Mankato.*
