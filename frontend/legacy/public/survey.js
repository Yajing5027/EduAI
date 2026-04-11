// ─── Config ───────────────────────────────────────────────────────────────────

const API = "http://localhost:3000";

// ─── Load survey from sessionStorage (set by teacher dashboard on publish) ───

const stored = localStorage.getItem('activeSurvey');
const ACTIVE_SURVEY = stored ? JSON.parse(stored) : null;

const SURVEY_LABEL = ACTIVE_SURVEY?.label || 'Survey';
const QUESTIONS    = ACTIVE_SURVEY?.questions?.map(q => ({
  topic:    q.topic,
  question: q.question,
})) || [
  // Fallback demo questions shown if no survey is published yet
  { topic: 'Light reactions',  question: 'How well do you understand how the light reactions produce ATP?' },
  { topic: 'Calvin cycle',     question: 'How well do you understand the Calvin cycle?' },
  { topic: 'Chlorophyll role', question: 'How well do you understand the role of chlorophyll in photosynthesis?' },
  { topic: 'Water splitting',  question: 'How well do you understand why water splitting is important?' },
  { topic: 'C3 vs C4 plants',  question: 'How well do you understand the difference between C3 and C4 plants?' },
];

let studentName = '';
let ratings     = {};   // { index: score }

// ─── Init ─────────────────────────────────────────────────────────────────────

document.getElementById('survey-title-name').textContent = SURVEY_LABEL;

// ─── Step 1: Start ────────────────────────────────────────────────────────────

function startSurvey() {
  const nameInput = document.getElementById('student-name');
  studentName = nameInput.value.trim();
  if (!studentName) {
    nameInput.style.borderColor = '#B52A2A';
    nameInput.focus();
    return;
  }
  nameInput.style.borderColor = '';
  document.getElementById('survey-title-q').textContent = SURVEY_LABEL;
  document.getElementById('prog-total').textContent = QUESTIONS.length;
  renderQuestions();
  document.getElementById('step-name').classList.remove('active');
  document.getElementById('step-questions').classList.add('active');
}

// ─── Step 2: Questions ────────────────────────────────────────────────────────

function renderQuestions() {
  const container = document.getElementById('questions-list');
  container.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'q-card';
    div.id = `qcard-${i}`;
    div.innerHTML = `
      <div class="q-num">Question ${i + 1} of ${QUESTIONS.length}</div>
      <div class="q-text">${q.question}</div>
      <div class="rating-wrap">
        <div class="rating-labels">
          <span>1 — Not at all</span>
          <span>10 — Fully understood</span>
        </div>
        <div class="slider-row">
          <input type="range" min="1" max="10" value="5" step="1"
            id="slider-${i}" oninput="onRate(${i}, this.value)" />
          <div class="rating-val-badge" id="badge-${i}">—</div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function onRate(index, value) {
  const v = parseInt(value);
  ratings[index] = v;

  const badge = document.getElementById(`badge-${index}`);
  const card  = document.getElementById(`qcard-${index}`);
  badge.textContent = v;
  badge.className   = 'rating-val-badge ' + (v <= 3 ? 'active-low' : v <= 6 ? 'active-mid' : 'active-high');
  card.classList.add('rated');

  const done  = Object.keys(ratings).length;
  const total = QUESTIONS.length;
  document.getElementById('prog-done').textContent          = done;
  document.getElementById('progress-fill').style.width      = Math.round((done / total) * 100) + '%';

  const submitBtn  = document.getElementById('submit-btn');
  const submitNote = document.getElementById('submit-note');
  if (done >= total) {
    submitBtn.disabled  = false;
    submitNote.textContent = 'All questions rated — ready to submit';
  } else {
    submitBtn.disabled  = true;
    submitNote.textContent = `${total - done} question${total - done > 1 ? 's' : ''} remaining`;
  }
}

// ─── Step 3: Submit → POST /api/analyze-results ───────────────────────────────

async function submitSurvey() {
  // Build payload
  const ratingsList = QUESTIONS.map((q, i) => ({
    topic: q.topic,
    score: ratings[i] || 5,
  }));

  const payload = {
    label: SURVEY_LABEL,
    responses: [{ studentName, ratings: ratingsList }],
  };

  // Optimistically show done screen immediately
  document.getElementById('done-sub').textContent = `Thanks, ${studentName}! Your teacher can now see your responses.`;
  showSummary(ratingsList);
  document.getElementById('step-questions').classList.remove('active');
  document.getElementById('step-done').classList.add('active');

  // Fire-and-forget to backend (don't block UX on it)
  try {
    await fetch(`${API}/api/analyze-results`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Could not send results to backend:', err.message);
  }
}

function showSummary(ratingsList) {
  const list = document.getElementById('summary-list');
  list.innerHTML = '';
  ratingsList.forEach(({ topic, score }) => {
    const cls  = score <= 3 ? 'badge-low' : score <= 6 ? 'badge-mid' : 'badge-high';
    const item = document.createElement('div');
    item.className = 'summary-item';
    item.innerHTML = `
      <div class="summary-q">${topic.length > 55 ? topic.slice(0, 55) + '…' : topic}</div>
      <div class="summary-badge ${cls}">${score}/10</div>`;
    list.appendChild(item);
  });
}

// ─── Enter key on name field ──────────────────────────────────────────────────

document.getElementById('student-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') startSurvey();
});
