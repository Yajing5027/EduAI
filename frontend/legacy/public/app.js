// ─── Config ───────────────────────────────────────────────────────────────────

const API = "http://localhost:3000";

// ─── Screen routing ───────────────────────────────────────────────────────────

const SCREEN_TITLES = {
  dashboard: 'Dashboard',
  'survey-create': 'Create survey',
  'survey-results': 'Survey results',
  grades: 'Grade analyzer',
  settings: 'Settings'
};

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (navItem) navItem.classList.add('active');
  document.getElementById('topbar-title').textContent = SCREEN_TITLES[id] || id;
  if (id === 'survey-results') loadSurveyResult('wk5');
  if (id === 'grades') resetGrades();
}

document.querySelectorAll('.nav-item[data-screen]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchScreen(item.dataset.screen);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE SURVEY — calls POST /api/generate-survey
// ─────────────────────────────────────────────────────────────────────────────

// Holds the last generated questions so publishSurvey() can use them
let lastGeneratedSurvey = null;

async function generatePreview() {
  const content = document.getElementById('slide-content').value.trim();
  const label   = document.getElementById('class-lbl').value.trim() || 'Survey';
  const nq      = parseInt(document.getElementById('nq').value, 10) || 5;

  if (!content) { alert('Please paste some slide content first.'); return; }

  // Show loading state on button
  const btn = document.querySelector('#sc-step1 .btn-accent');
  const orig = btn.textContent;
  btn.textContent = 'Generating…';
  btn.disabled = true;

  try {
    const form = new FormData();
    form.append('content', content);
    form.append('numQuestions', nq);
    form.append('label', label);

    const res  = await fetch(`${API}/api/generate-survey`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    lastGeneratedSurvey = data; // { label, questions: [{topic, question}] }

    // Render preview
    document.getElementById('sc-label').textContent = data.label;
    const container = document.getElementById('preview-questions');
    container.innerHTML = '';

    data.questions.forEach((q, i) => {
      const div = document.createElement('div');
      div.className = 'preview-q';
      div.innerHTML = `
        <div class="preview-q-text">${i + 1}. ${q.question}</div>
        <div class="preview-q-tags">
          <span class="tag tag-amber">${q.topic}</span>
          <span class="tag tag-amber">1–10 rating</span>
        </div>`;
      container.appendChild(div);
    });

    document.getElementById('sc-step1').style.display = 'none';
    document.getElementById('sc-step2').style.display = 'block';
    document.getElementById('sc-step3').style.display = 'none';

  } catch (err) {
    alert('Error generating questions: ' + err.message);
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
}

function publishSurvey() {
  const label = document.getElementById('sc-label').textContent;
  const slug  = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  document.getElementById('share-link').textContent = `http://localhost:3000/studentSurvey.html`;

  // Save survey to sessionStorage so the student survey page can load it
  if (lastGeneratedSurvey) {
    localStorage.setItem('activeSurvey', JSON.stringify(lastGeneratedSurvey));
  }

  document.getElementById('sc-step1').style.display = 'none';
  document.getElementById('sc-step2').style.display = 'none';
  document.getElementById('sc-step3').style.display = 'block';
}

function copyLink() {
  const link = document.getElementById('share-link').textContent;
  navigator.clipboard.writeText(link).catch(() => {});
  const btn = event.target;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 1500);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SURVEY RESULTS
//  Still uses local SURVEY_DATA for historical records.
//  New surveys submitted via the student page flow into /api/analyze-results.
// ─────────────────────────────────────────────────────────────────────────────

const SURVEY_DATA = {
  wk5: {
    title: 'Week 5 — Photosynthesis',
    responses: 14, avg: 7.2, well: 3, revisit: 2,
    topics: [
      { name: 'Light reactions',   score: 8.1 },
      { name: 'Calvin cycle',      score: 7.4 },
      { name: 'C3 vs C4 plants',   score: 6.8 },
      { name: 'Chlorophyll role',  score: 5.2 },
      { name: 'Water splitting',   score: 4.9 }
    ],
    aiWell:    'Students demonstrated strong understanding of the light reactions and the Calvin cycle. Most could explain the role of ATP and NADPH accurately.',
    aiRevisit: 'The roles of chlorophyll and water splitting were frequently misunderstood. Consider a visual walkthrough of the Z-scheme in the next session.'
  },
  wk2: {
    title: 'Week 2 — Cell division',
    responses: 11, avg: 6.1, well: 2, revisit: 3,
    topics: [
      { name: 'Mitosis stages',            score: 7.9 },
      { name: 'Meiosis vs mitosis',        score: 6.2 },
      { name: 'Chromosome segregation',    score: 5.7 },
      { name: 'Cell cycle checkpoints',    score: 4.8 },
      { name: 'Cytokinesis',               score: 5.1 }
    ],
    aiWell:    'Students showed a solid grasp of the mitosis stages in sequence.',
    aiRevisit: 'Cell cycle checkpoints and the differences between mitosis and meiosis need reinforcement.'
  },
  wk1: {
    title: 'Week 1 — Intro to Biology',
    responses: 18, avg: 8.4, well: 4, revisit: 1,
    topics: [
      { name: 'Cell theory',               score: 9.1 },
      { name: 'Prokaryote vs eukaryote',   score: 8.7 },
      { name: 'Macromolecules',            score: 8.2 },
      { name: 'Scientific method',         score: 7.9 },
      { name: 'Enzyme function',           score: 6.3 }
    ],
    aiWell:    'Excellent comprehension across almost all introductory topics.',
    aiRevisit: 'Enzyme function and activation energy may need a brief revisit before covering metabolism.'
  }
};

function loadSurveyResult(key) {
  const data = SURVEY_DATA[key];
  if (!data) return;
  document.getElementById('res-count').textContent  = data.responses;
  document.getElementById('res-avg').textContent    = data.avg + ' / 10';
  document.getElementById('res-well').textContent   = data.well;
  document.getElementById('res-revisit').textContent= data.revisit;
  document.getElementById('ai-well').textContent    = data.aiWell;
  document.getElementById('ai-revisit').textContent = data.aiRevisit;

  const container = document.getElementById('result-bars');
  container.innerHTML = '';
  data.topics.forEach(t => {
    const pct   = Math.round((t.score / 10) * 100);
    const color = t.score >= 7 ? '#1E7B4B' : t.score >= 5.5 ? '#8A5A00' : '#B52A2A';
    container.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">${t.name}</div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="bar-pct" style="color:${color}">${t.score}/10</div>
      </div>`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  GRADE ANALYZER  (unchanged — uses local sample data)
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_CONCEPTS = [
  { name: 'Photosynthesis',     avg: 82 },
  { name: 'Cell division',      avg: 74 },
  { name: 'DNA replication',    avg: 58 },
  { name: 'Protein synthesis',  avg: 49 },
  { name: 'Ecosystem dynamics', avg: 71 }
];

function simulateUpload() {
  const title = document.getElementById('upload-title');
  const zone  = document.getElementById('upload-zone');
  title.textContent = '✓  grade_template.xlsx — 20 students loaded';
  title.classList.add('upload-success');
  zone.style.borderStyle = 'solid';
  zone.style.borderColor = '#1E7B4B';
  document.getElementById('analyze-btn').disabled = false;
}

function showGradeResults() {
  const course = document.getElementById('course-in').value.trim() || 'Introduction to Biology';
  document.getElementById('ga-course-title').textContent = course;

  const container = document.getElementById('grade-bars');
  container.innerHTML = '';
  GRADE_CONCEPTS.forEach(c => {
    const color = c.avg >= 70 ? '#1E7B4B' : c.avg >= 55 ? '#8A5A00' : '#B52A2A';
    container.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">${c.name}</div>
        <div class="bar-bg"><div class="bar-fill" style="width:${c.avg}%;background:${color}"></div></div>
        <div class="bar-pct" style="color:${color}">${c.avg}%</div>
      </div>`;
  });

  const classAvg = Math.round(GRADE_CONCEPTS.reduce((s, c) => s + c.avg, 0) / GRADE_CONCEPTS.length);
  document.getElementById('ga-class-average').textContent  = classAvg + '%';
  document.getElementById('ga-concepts-tracked').textContent = GRADE_CONCEPTS.length;
  const studentsEl = document.getElementById('ga-students');
  if (studentsEl && !studentsEl.textContent.trim()) studentsEl.textContent = '20';

  updateThresh(parseInt(document.getElementById('thresh-slider')?.value || document.getElementById('thresh-in')?.value || 70, 10));

  document.getElementById('ga-step1').style.display = 'none';
  document.getElementById('ga-step2').style.display = 'block';
}

function resetGrades() {
  document.getElementById('ga-step1').style.display = 'block';
  document.getElementById('ga-step2').style.display = 'none';
  const title = document.getElementById('upload-title');
  title.textContent = 'Click to upload grade_template.xlsx';
  title.classList.remove('upload-success');
  const zone = document.getElementById('upload-zone');
  zone.style.borderStyle = 'dashed';
  zone.style.borderColor = '';
  document.getElementById('analyze-btn').disabled = true;
}

function updateThresh(v) {
  const disp = document.getElementById('thresh-disp');
  if (disp) disp.textContent = v + '%';
  const passing  = GRADE_CONCEPTS.filter(c => c.avg >= v).length;
  const approx   = Math.round((passing / GRADE_CONCEPTS.length) * 20);
  const passNote = document.getElementById('pass-note');
  if (passNote) passNote.textContent = `At ${v}% — approx. ${approx} / 20 students pass`;
  const passRate = document.getElementById('ga-pass-rate');
  if (passRate) passRate.textContent = Math.round((approx / 20) * 100) + '%';
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function renderDashboard() {
  const surveys        = Object.values(SURVEY_DATA);
  const totalResponses = surveys.reduce((s, c) => s + c.responses, 0);
  const weightedAvg    = totalResponses
    ? Math.round((surveys.reduce((s, c) => s + c.avg * c.responses, 0) / totalResponses) * 10) / 10
    : 0;

  const elSurveysCreated = document.getElementById('db-surveys-created');
  if (elSurveysCreated) elSurveysCreated.textContent = surveys.length;
  const elAvg = document.getElementById('db-avg-understanding');
  if (elAvg) elAvg.innerHTML = `${weightedAvg}<span style="font-size:14px;font-weight:400"> / 10</span>`;
  const elStudents = document.getElementById('db-students-reached');
  if (elStudents) elStudents.textContent = totalResponses;
  const elGradeReports = document.getElementById('db-grade-reports');
  if (elGradeReports) elGradeReports.textContent = 1;

  const recentContainer = document.getElementById('recent-surveys-list');
  if (recentContainer) {
    recentContainer.innerHTML = '';
    Object.keys(SURVEY_DATA).sort().reverse().forEach(k => {
      const d   = SURVEY_DATA[k];
      const row = document.createElement('div');
      row.className = 'activity-row';
      row.innerHTML = `
        <div class="activity-title">${d.title}</div>
        <div class="activity-meta">${d.responses} responses · ${d.avg}/10 avg</div>`;
      recentContainer.appendChild(row);
    });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
renderDashboard();
loadSurveyResult('wk5');
