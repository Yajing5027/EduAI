const SURVEY_LABEL = 'Bio 101 — Week 5';

const QUESTIONS = [
  'How does the light-dependent reaction produce ATP?',
  'What is the role of chlorophyll in photosynthesis?',
  'Explain the difference between C3 and C4 photosynthesis.',
  'Why is water splitting important in the light reactions?',
  'How does the Calvin cycle use energy from ATP and NADPH?'
];

let studentName = '';
let ratings = {};

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

function renderQuestions() {
  const container = document.getElementById('questions-list');
  container.innerHTML = '';

  QUESTIONS.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'q-card';
    div.id = `qcard-${i}`;
    div.innerHTML = `
      <div class="q-num">Question ${i + 1} of ${QUESTIONS.length}</div>
      <div class="q-text">${q}</div>
      <div class="rating-wrap">
        <div class="rating-labels">
          <span>1 — Not at all</span>
          <span>10 — Fully understood</span>
        </div>
        <div class="slider-row">
          <input
            type="range" min="1" max="10" value="5" step="1"
            id="slider-${i}"
            oninput="onRate(${i}, this.value)"
          />
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
  const card = document.getElementById(`qcard-${index}`);

  badge.textContent = v;
  badge.className = 'rating-val-badge ' + (v <= 3 ? 'active-low' : v <= 6 ? 'active-mid' : 'active-high');
  card.classList.add('rated');

  const done = Object.keys(ratings).length;
  const total = QUESTIONS.length;

  document.getElementById('prog-done').textContent = done;
  document.getElementById('progress-fill').style.width = Math.round((done / total) * 100) + '%';

  const submitBtn = document.getElementById('submit-btn');
  const submitNote = document.getElementById('submit-note');

  if (done >= total) {
    submitBtn.disabled = false;
    submitNote.textContent = 'All questions rated — ready to submit';
  } else {
    submitBtn.disabled = true;
    submitNote.textContent = `${total - done} question${total - done > 1 ? 's' : ''} remaining`;
  }
}

function submitSurvey() {
  document.getElementById('done-sub').textContent = `Thanks, ${studentName}! Your teacher can now see your responses.`;

  const list = document.getElementById('summary-list');
  list.innerHTML = '';

  QUESTIONS.forEach((q, i) => {
    const v = ratings[i] || 5;
    const cls = v <= 3 ? 'badge-low' : v <= 6 ? 'badge-mid' : 'badge-high';
    const item = document.createElement('div');
    item.className = 'summary-item';
    item.innerHTML = `
      <div class="summary-q">${q.length > 55 ? q.slice(0, 55) + '…' : q}</div>
      <div class="summary-badge ${cls}">${v}/10</div>`;
    list.appendChild(item);
  });

  document.getElementById('step-questions').classList.remove('active');
  document.getElementById('step-done').classList.add('active');
}

document.getElementById('student-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') startSurvey();
});
