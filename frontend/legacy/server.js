const express    = require("express");
const multer     = require("multer");
const pdfParse   = require("pdf-parse");
const cors       = require("cors");
const path       = require("path");
const fs         = require("fs");
const os         = require("os");
const { execFile }           = require("child_process");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// ─── App + Middleware ─────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── Multer (PDF / TXT / PPTX, 20 MB) ───────────────────────────────────────

const PPTX_MIMES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
];
const PDF_MIMES = ["application/pdf"];
const TXT_MIMES = ["text/plain"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok  = [...PPTX_MIMES, ...PDF_MIMES, ...TXT_MIMES].includes(file.mimetype)
             || [".pdf", ".txt", ".pptx", ".ppt"].includes(ext);
    ok ? cb(null, true) : cb(new Error("Only PDF, TXT, or PPTX files are supported."));
  },
});

// ─── Gemini ───────────────────────────────────────────────────────────────────

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function gemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in .env");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
}

async function ask(prompt) {
  const result = await gemini().generateContent(prompt);
  return result.response.text().replace(/```json|```/g, "").trim();
}

// ─── File text extraction ─────────────────────────────────────────────────────

function extractPptx(buffer) {
  return new Promise((resolve, reject) => {
    const tmp    = path.join(os.tmpdir(), `edu_${Date.now()}.pptx`);
    const script = path.join(__dirname, "extract_pptx.py");
    fs.writeFile(tmp, buffer, (err) => {
      if (err) return reject(err);
      execFile("python3", [script, tmp], { timeout: 30_000 }, (err, stdout) => {
        fs.unlink(tmp, () => {});
        if (err) return reject(new Error("PPTX extraction failed. Run: pip install python-pptx"));
        const text = stdout.trim();
        if (!text) return reject(new Error("No text found in PowerPoint."));
        resolve(text);
      });
    });
  });
}

async function fileToText(file) {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (PPTX_MIMES.includes(mime) || ext === ".pptx" || ext === ".ppt")
    return extractPptx(file.buffer);
  if (PDF_MIMES.includes(mime) || ext === ".pdf")
    return (await pdfParse(file.buffer)).text.trim();
  return file.buffer.toString("utf-8").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/generate-survey
//
//  Purpose:
//    Takes lecture notes / slide text and generates n survey questions.
//    Each question is a TOPIC (concept) that students will rate 1–10
//    on how well they understood it.
//
//  Request (multipart/form-data or application/json):
//    content       — raw slide / notes text  (OR)
//    file          — PDF / TXT / PPTX upload
//    numQuestions  — how many topics to generate (1–20, default 5)
//    label         — class/topic label e.g. "Bio 101 — Week 5"
//
//  Response:
//  {
//    label: "Bio 101 — Week 5",
//    questions: [
//      { topic: "Role of chlorophyll in photosynthesis",
//        question: "How well did you understand the role of chlorophyll?" }
//    ]
//  }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/generate-survey", upload.single("file"), async (req, res) => {
  try {
    let content = req.body.content?.trim() || "";
    if (req.file) {
      const extracted = await fileToText(req.file);
      if (extracted) content = extracted;
    }
    if (!content)
      return res.status(400).json({ error: "No slide content provided." });

    const raw = parseInt(req.body.numQuestions ?? "5", 10);
    const n   = Math.min(20, Math.max(1, isNaN(raw) ? 5 : raw));
    const label = req.body.label?.trim() || "Survey";

    const prompt = `You are an expert educator. Read the lecture notes below and identify exactly ${n} distinct concepts or topics the students need to understand.

For each concept, write:
- A short topic name (3–7 words)
- A plain survey question asking students to rate their understanding of that topic on a 1–10 scale (e.g. "How well do you understand the role of ATP in cellular respiration?")

Return ONLY a valid JSON array — no markdown, no commentary.

Shape:
[
  {
    "topic": "Short concept name",
    "question": "How well do you understand [concept]?"
  }
]

Lecture notes:
${content.slice(0, 8000)}`;

    const raw_json = await ask(prompt);
    const questions = JSON.parse(raw_json);

    if (!Array.isArray(questions) || !questions.length)
      return res.status(502).json({ error: "Could not generate questions. Please retry." });

    return res.json({ label, questions });

  } catch (err) {
    console.error("/api/generate-survey:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/analyze-results
//
//  Purpose:
//    Takes all student rating submissions and returns a Gemini AI summary
//    — what was understood well and what needs revisiting —
//    along with per-topic average scores.
//
//  Request (application/json):
//  {
//    label: "Bio 101 — Week 5",
//    responses: [
//      {
//        studentName: "Alice",
//        ratings: [
//          { topic: "Role of chlorophyll", score: 8 },
//          { topic: "Calvin cycle",        score: 5 }
//        ]
//      }
//    ]
//  }
//
//  Response:
//  {
//    label: "Bio 101 — Week 5",
//    totalResponses: 14,
//    classAverage: 6.8,
//    topics: [
//      { name: "Role of chlorophyll", score: 7.4 }
//    ],
//    wellUnderstood: [ "Role of chlorophyll" ],
//    needsRevisit:   [ "Calvin cycle" ],
//    aiSummary: {
//      well:    "Students demonstrated strong understanding of ...",
//      revisit: "The Calvin cycle was frequently misunderstood ..."
//    }
//  }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/analyze-results", express.json(), async (req, res) => {
  try {
    const { label = "Survey", responses = [] } = req.body;

    if (!responses.length)
      return res.status(400).json({ error: "No responses provided." });

    // ── Compute per-topic averages ────────────────────────────────────────────
    const topicTotals = {};
    const topicCounts = {};

    for (const resp of responses) {
      for (const { topic, score } of (resp.ratings || [])) {
        topicTotals[topic] = (topicTotals[topic] || 0) + score;
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }

    const topics = Object.keys(topicTotals).map(name => ({
      name,
      score: Math.round((topicTotals[name] / topicCounts[name]) * 10) / 10,
    }));

    const allScores    = topics.map(t => t.score);
    const classAverage = allScores.length
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : 0;

    const wellUnderstood = topics.filter(t => t.score >= 7).map(t => t.name);
    const needsRevisit   = topics.filter(t => t.score <  6).map(t => t.name);

    // ── Ask Gemini for a narrative summary ────────────────────────────────────
    const topicSummary = topics.map(t => `${t.name}: ${t.score}/10`).join("\n");

    const prompt = `You are an educator reviewing student comprehension survey results for: "${label}".

Here are the average self-rated understanding scores per topic (out of 10):
${topicSummary}

Class average: ${classAverage}/10
Total responses: ${responses.length}

Write two short paragraphs (2–3 sentences each):
1. "well" — what students understood well and why that's positive
2. "revisit" — what topics need revisiting and a brief suggestion for how to address it

Return ONLY a JSON object — no markdown, no commentary.

Shape:
{
  "well": "...",
  "revisit": "..."
}`;

    const raw_json  = await ask(prompt);
    const aiSummary = JSON.parse(raw_json);

    return res.json({
      label,
      totalResponses: responses.length,
      classAverage,
      topics,
      wellUnderstood,
      needsRevisit,
      aiSummary,
    });

  } catch (err) {
    console.error("/api/analyze-results:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/extract-text
//
//  Utility: upload a file, get back its plain text.
//  Useful for previewing content before generating.
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided." });
    const text = await fileToText(req.file);
    if (!text)  return res.status(422).json({ error: "No text could be extracted." });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const payload = { text };
    if (ext === ".pptx" || ext === ".ppt")
      payload.slideCount = (text.match(/--- Slide \d+ ---/g) || []).length;
    return res.json(payload);
  } catch (err) {
    console.error("/api/extract-text:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiKeySet: !!process.env.GEMINI_API_KEY, model: "gemini-1.5-flash" });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "File too large. Max 20 MB." });
  res.status(500).json({ error: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │  EduAI Backend                                   │
  ├──────────────────────────────────────────────────┤
  │  http://localhost:${PORT}                            │
  │                                                  │
  │  POST /api/generate-survey   ← generate Qs      │
  │  POST /api/analyze-results   ← AI result summary │
  │  POST /api/extract-text      ← file → text       │
  │  GET  /api/health                                │
  └──────────────────────────────────────────────────┘
`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT to a free port or stop the process using it.`);
    process.exit(1);
  }
  throw err;
});
