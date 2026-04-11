# Top-one (EduAI) — Lecture Quiz & Survey Generator

Brief: an AI-assisted web application that converts lecture slides or notes into short, actionable student surveys. It enables teachers to generate comprehension questions, publish a lightweight student-facing survey link, and immediately visualise class-level understanding.

## Executive summary

Top-one (EduAI) is designed for rapid classroom feedback: paste slide text or upload a document, let the AI generate targeted comprehension questions, publish a shareable survey link, then view aggregated student ratings and AI summaries. The repository contains a static frontend prototype, a legacy Node service for document parsing and generation, and a small Flask prototype used during experimentation.

This README is written for technical reviewers and judges: it explains the user flow, architecture, how to run the demo locally, the exact front-end mapping between the question preview and the survey results page, and evaluation criteria to assess functionality, security, and extensibility.

## Quick demo (what judges should try)

1. Open the UI: open [frontend/index.html](frontend/index.html) in a browser or serve the `frontend` folder with a static server.
2. Go to **Create survey** → paste slide text or notes → set `Number of questions` → click **Generate with Gemini**.
3. Confirm the generated questions appear in the preview (step 2).
4. Click **Publish survey** and then open **Survey results**; select the newly published survey in the dropdown — the exact questions from step 2 should appear under **Survey questions**.

This flow demonstrates the required mapping: previewed questions are saved to client state and written into the in-memory `SURVEY_DATA` object so they appear in results immediately after publishing.

## Architecture & design (concise)

- **Frontend (static SPA)**: the UI lives under [frontend/](frontend). Core files:
    - [frontend/index.html](frontend/index.html) — main UI markup and view containers.
    - [frontend/app.js](frontend/app.js) — application logic: generation, publish, and results mapping.
    - [frontend/survey.js](frontend/survey.js) — student-facing survey page logic.
- **Legacy generation service**: `frontend/legacy/server.js` is a Node/Express prototype used for parsing uploads (PDF/PPTX) and interacting with Google Generative AI in legacy testing.
- **Prototype backend**: `Smart Curve/app.py` and the root `app.py` are small Flask prototypes used to experiment with alternate generation flows.

Data flow (frontend): `generatePreview()` builds `CURRENT_PREVIEW_QUESTIONS` from the requested `nq` value; `publishSurvey()` persists those questions into `SURVEY_DATA[<surveyKey>].questions`; `loadSurveyResult()` renders them via `renderSurveyQuestions()` into the results view.

## Key features

- **AI-driven question generation**: turn slide text into comprehension questions.
- **Preview → publish mapping**: number of previewed questions (step 2) becomes the published survey's question set and is visible in Survey Results.
- **Lightweight student link**: publish produces a shareable link to a student survey page.
- **Client-side demo-ready**: minimal server dependencies to review the UX and data mapping quickly.

## Quick start — run locally

Static frontend (fast, no install):

```bash
cd frontend
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

Legacy Node server (document parsing & generation prototype):

```bash
cd frontend/legacy
npm install
npm start
# Server listens on http://localhost:3000 (see server.js)
```

Flask prototype (optional):

Windows PowerShell:
```powershell
cd "Smart Curve"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
setx GEMINI_API_KEY "<your_api_key>"
python app.py
```

macOS / Linux:
```bash
cd "Smart Curve"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY="<your_api_key>"
python app.py
```

Notes: set `GEMINI_API_KEY` in an environment variable or `.env`; the code expects a key named `GEMINI_API_KEY`.

## Integration contract (recommended JSON shape)

If you wire a backend API to publish surveys or return generated questions, the frontend expects a minimal payload like:

```json
{
    "title": "Bio 101 — Week 6",
    "questions": ["Question 1", "Question 2", "Question 3"],
    "topics": [{ "name": "Topic A", "score": 7.2 }]
}
```

When publishing from the UI, the client writes the `questions` array into the in-memory `SURVEY_DATA` structure so the results page renders immediately.

- Do not commit API keys. Use environment variables (`GEMINI_API_KEY`) or a secure secrets store. Remove any `.env` files containing secrets from the repository and rotate exposed keys.
- The current demo uses client-side in-memory storage for surveys — for production, persist surveys and responses in a controlled database and enforce authentication.

## Known limitations

- In-memory survey storage (`SURVEY_DATA`) is ephemeral and exists only in the running page.
- AI generation is mocked by sample data for offline demos; connecting to the Google Generative API requires a valid `GEMINI_API_KEY` and billing setup.
- No authentication or multi-teacher tenancy implemented yet.

## Suggested next steps (for production readiness)

- Persist surveys and responses to a database and add a small API layer (REST) for CRUD operations.
- Add user authentication and role-based access (teacher vs. student).
- Add end-to-end tests for generate → publish → results flows and basic UI tests.
- Harden config: ensure keys are read from environment only and secrets are never checked into source control.

## Contact & review notes

For questions or to request a live walkthrough, open an issue in this repository. When reviewing, try the Quick demo steps above and consult these files: [frontend/index.html](frontend/index.html), [frontend/app.js](frontend/app.js), and [frontend/legacy/server.js](frontend/legacy/server.js).

---
Thank you for reviewing Top-one (EduAI). This README targets judges evaluating the project's design, implementation, demonstrable functionality, and production-readiness.
Students open the link, rate each topic, and submit
Teacher views real results — per-topic scores, class average, and an AI-generated summary of what went well and what needs revisiting


Project Structure
frontend/legacy/
├── server.js              ← Express backend (main entry point)
├── extract_pptx.py        ← Python helper for PowerPoint text extraction
├── data.json              ← Auto-created — stores surveys and responses
├── .env                   ← Your API key (never commit this)
├── package.json
├── node_modules/
└── public/
    ├── index.html         ← Teacher dashboard
    ├── studentSurvey.html ← Student survey page
    ├── app.js             ← Teacher dashboard logic
    ├── survey.js          ← Student survey logic
    ├── style.css          ← Main styles
    └── style-1.css        ← Student survey styles

Setup (Local)
1. Prerequisites

Node.js v18 or higher
Python 3 (for PowerPoint support)

2. Install dependencies
bashcd frontend/legacy
npm install
pip install python-pptx
3. Add your Gemini API key
Create a .env file inside frontend/legacy/:
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
Get a free key at → https://aistudio.google.com/app/apikey

⚠️ Never commit your .env file to GitHub. Make sure .env is in your .gitignore.

4. Start the server
bashnode server.js
5. Open the app

Teacher dashboard → http://localhost:3000
Student survey → http://localhost:3000/studentSurvey.html


API Endpoints
MethodEndpointDescriptionPOST/api/generate-surveyGenerate questions from slide contentPOST/api/submit-responseSave a student's ratingsGET/api/results/:slugGet results for a surveyGET/api/surveysList all created surveysGET/api/survey/:slugGet survey questions by slugPOST/api/extract-textExtract text from PDF/PPTX/TXTGET/api/healthServer health check

How to Use
Creating a Survey (Teacher)

Go to http://localhost:3000
Click Create survey in the sidebar
Paste lecture notes or upload a file (PDF, PPTX, TXT)
Set the number of questions (1–20) and a class label
Click Generate with Gemini
Review the generated questions and click Publish survey
Copy the link and share it with students

Taking a Survey (Student)

Open the link shared by the teacher
Enter your name
Rate your understanding of each topic from 1 (not at all) to 10 (fully understood)
Click Submit responses

Viewing Results (Teacher)

Click Survey results in the sidebar
Select the survey from the dropdown
View per-topic scores, class average, and the Gemini AI summary


Deployment (Railway)

Go to railway.app and sign in with GitHub
Click New Project → Deploy from GitHub repo
Select your repo and set the root directory to frontend/legacy
Add your GEMINI_API_KEY in the Variables tab
Set the start command to node server.js
Railway gives you a public URL — update API in app.js and survey.js:

jsconst API = "https://your-railway-url.up.railway.app";

Tech Stack
LayerTechnologyRuntimeNode.jsFrameworkExpress 4AIGoogle Gemini 2.0 FlashFile uploadsMulter (in-memory)PDF parsingpdf-parsePPTX parsingpython-pptxStorageJSON file (data.json)FrontendVanilla HTML/CSS/JS

Environment Variables
VariableDescriptionGEMINI_API_KEYYour Google Gemini API keyPORTServer port (default: 3000)

Notes

data.json is auto-created on first survey generation — do not delete it while the server is running
The student survey loads questions from localStorage — both teacher and student must use the same browser on the same machine for local testing. For real use, deploy to Railway
PowerPoint support requires Python 3 and pip install python-pptx





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
Developed for academic projects at MNSU, Mankato.
============================================================
