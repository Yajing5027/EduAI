# EduAI — Teacher-focused Toolkit

Jump to: [Survey Flow](#survey-flow) · [Smart Curve](#smart-curve)

Purpose
-------
EduAI helps teachers quickly gauge student understanding after a lecture by combining two complementary capabilities in one workflow: an in-class survey flow that generates, publishes, and collects responses to comprehension questions, and a Smart Curve tool for fair, interpretable score adjustments. Both features target the same classroom users and are presented together so teachers can choose one or both in their practice.

## Survey Flow
This feature produces concise comprehension questions from slide text, lets teachers preview and publish a survey, and collects student confidence ratings. The published survey preserves the previewed questions exactly so results map directly to teacher intent.

## Smart Curve
The Smart Curve component provides classroom-focused, explainable score adjustments and analysis to help teachers interpret aggregate results. It can be used independently or together with the Survey Flow.

Why this matters
-----------------
- Rapid classroom feedback so teachers can prioritise follow-up teaching.
- Actionable signals (per-topic scores and class average) to guide remediation.
- Low-friction workflow focused on teacher usability.

Features
--------
Below are the two integrated features of EduAI. They share the same target users (teachers) and can be used together or independently.

### Survey Flow
Description
- Generates concise comprehension questions from slide text, allows teachers to preview and edit, then publish the exact same questions as a student-facing survey.

Highlights
- Preserves previewed questions on publish so results map directly to teacher intent.
- Quick shareable student link for in-class responses.
- Aggregated per-question confidence ratings and short AI summaries.

Usage
- Teacher pastes slide text → chooses number of questions → Generate (preview) → review and Publish → view Results.

### Smart Curve
Description
- Provides classroom-focused, explainable score adjustments and tools to interpret aggregate results (e.g., voiding badly-performing questions, applying flat or root-based lifts).

Highlights
- Explainable models: Voided Question Percentage, Flat Curve, Root Curve.
- Designed to help teachers adjust scores fairly when question wording or curriculum gaps skew results.

Usage
- Manual data entry or CSV import → choose curve model → apply adjustments → review adjusted aggregates.

Implementation notes (brief)
---------------------------
- Frontend: static single-page app under `frontend/` — core logic in `frontend/app.js`.
- Prototypes for parsing and AI integration exist under `frontend/legacy/` and `Smart Curve/`.

Appendix: Smart Curve Detailed Manual
-----------------------------------
The detailed Smart Curve manual follows for teachers who want step-by-step installation and operation. Content retained verbatim.

---

SMART CURVE | QUICK-ANALYSIS EDITION (MANUAL ENTRY)

---

DESCRIPTION:
Smart Curve is a lightweight Flask application designed for 
educators to apply fair grading curves to quiz results. This 
version uses manual data entry, making it extremely reliable 
for quick demonstrations and classroom use.

---
1. PREREQUISITES
---
- Python 3.10 or higher installed.
- A Google Gemini API Key (from https://aistudio.google.com/).

---
2. INSTALLATION
---
Open your terminal or command prompt and run:

	pip install flask requests python-dotenv

---
3. SETUP
---
1. Create a file named ".env" in the same folder as app.py.
2. Add your API key inside the .env file like this:

   GEMINI_API_KEY=your_actual_key_here

3. Ensure "index.html" is located inside a folder named 
   "templates".

---
4. RUNNING THE APP
---
Run the following command in your terminal:

	python app.py

Once running, open your web browser and go to: 
http://127.0.0.1:5000

---
5. THE INTELLIGENCE CURVE (AI-POWERED)
---
The Intelligence Curve is a unique feature that uses Google 
Gemini to analyze if a quiz was "unfair" due to poor wording 
or curriculum gaps.

HOW IT WORKS:
1. The AI looks at the quiz content and score distribution.
2. If the AI detects a high failure rate on specific topics, 
	it calculates a "Voided Question Percentage."
3. The backend math then adjusts the total possible points, 
	effectively removing the "bad" questions from the grade 
	without penalizing students.

This ensures that students are graded on what they actually 
learned, rather than being punished for confusing questions.

---
6. OTHER MATH MODELS USED
---
- FLAT CURVE: Adds points based on the highest score.
- ROOT CURVE: Lifts lower scores more aggressively using 
  the Square Root of Score * 10 formula.

Developed for academic projects at MNSU, Mankato