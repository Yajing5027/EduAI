# Top-one (EduAI) — Teacher-focused Survey Generator

Purpose
-------
Top-one helps teachers quickly gauge student understanding after a lecture. Teachers paste or upload slide text, the system generates concise comprehension questions, and students rate their confidence. Results give an immediate, actionable view of which concepts the class understands and which need review.

Core flow
-------------------------
- Teacher: paste slide text → set number of questions → Generate (preview)
- Teacher: review previewed questions → Publish
- Results: open Survey Results → the same questions from the preview appear under "Survey questions"; aggregated ratings and short AI summaries are shown above

Why this matters
-----------------
- Rapid classroom feedback so teachers can prioritise follow-up teaching.
- Actionable signals (per-topic scores and class average) to guide remediation.
- Low-friction workflow focused on teacher usability.

Key features
------------
- AI-assisted question generation from slide text
- Preview → Publish mapping: previewed questions are preserved and shown in results
- Shareable student link for quick response collection

Implementation notes (brief)
---------------------------
- Frontend: static single-page app under `frontend/` — core logic in `frontend/app.js`.
- Prototypes for parsing and AI integration exist under `frontend/legacy/` and `Smart Curve/`, but evaluation should focus on the front-end preview→publish→results behavior.
- Prototypes for parsing and AI integration exist under `frontend/legacy/` and `Smart Curve/`, but evaluation should focus on the front-end preview→publish→results behavior.
============================================================

SMART CURVE | QUICK-ANALYSIS EDITION (MANUAL ENTRY)

============================================================

DESCRIPTION:
Smart Curve is a lightweight Flask application designed for 
educators to apply fair grading curves to quiz results. This 
version uses manual data entry, making it extremely reliable 
for quick demonstrations and classroom use.

------------------------------------------------------------
1. PREREQUISITES
------------------------------------------------------------
- Python 3.10 or higher installed.
- A Google Gemini API Key (from https://aistudio.google.com/).

------------------------------------------------------------
2. INSTALLATION
------------------------------------------------------------
Open your terminal or command prompt and run:

	 pip install flask requests python-dotenv

------------------------------------------------------------
3. SETUP
------------------------------------------------------------
1. Create a file named ".env" in the same folder as app.py.
2. Add your API key inside the .env file like this:

	GEMINI_API_KEY=your_actual_key_here

3. Ensure "index.html" is located inside a folder named 
	"templates".

------------------------------------------------------------
4. RUNNING THE APP
------------------------------------------------------------
Run the following command in your terminal:

	 python app.py

Once running, open your web browser and go to: 
http://127.0.0.1:5000

------------------------------------------------------------
5. THE INTELLIGENCE CURVE (AI-POWERED)
------------------------------------------------------------
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

------------------------------------------------------------
6. OTHER MATH MODELS USED
------------------------------------------------------------
- FLAT CURVE: Adds points based on the highest score.
- ROOT CURVE: Lifts lower scores more aggressively using 
  the Square Root of Score * 10 formula.

------------------------------------------------------------
Developed for academic projects at MNSU, Mankato
