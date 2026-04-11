# Top-one
# Top-one
EduAI — Lecture Quiz & Survey Generator
A full-stack AI-powered web app that helps teachers generate comprehension surveys from lecture slides and collect student understanding ratings in real time.

What It Does

Teacher uploads lecture slides (PDF, PPTX, or TXT) or pastes notes
Gemini AI generates survey questions asking students to rate their understanding of each concept (1–10)
Teacher publishes the survey and shares the link with students
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
