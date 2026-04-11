const SCREEN_TITLES = {
  dashboard: 'Dashboard',
  'survey-create': 'Create survey',
  'survey-results': 'Survey results',
  grades: 'Grade analyzer',
  settings: 'Settings'
};

const SAMPLE_QUESTIONS = [
  'How does the light-dependent reaction produce ATP?',
  'What is the role of chlorophyll in photosynthesis?',
  'Explain the difference between C3 and C4 photosynthesis.',
  'Why is water splitting important in the light reactions?',
  'How does the Calvin cycle use energy from ATP and NADPH?'
];

let CURRENT_PREVIEW_QUESTIONS = [];
let LATEST_PUBLISHED_SURVEY_KEY = null;

const SURVEY_DATA = {
  wk5: {
    title: 'Week 5 — Photosynthesis',
    responses: 14, avg: 7.2, well: 3, revisit: 2,
    topics: [
      { name: 'Light reactions', score: 8.1 },
      { name: 'Calvin cycle', score: 7.4 },
      { name: 'C3 vs C4 plants', score: 6.8 },
      { name: 'Chlorophyll role', score: 5.2 },
      { name: 'Water splitting', score: 4.9 }
    ],
    questions: [
      'How does ATP synthase use the proton gradient in light reactions?',
      'What is the function of chlorophyll in capturing light energy?',
      'How do C3 and C4 pathways differ in photorespiration?',
      'Why is photolysis of water essential for photosystem II?',
      'How are ATP and NADPH consumed during the Calvin cycle?'
    ],
    aiWell: 'Students demonstrated strong understanding of the light reactions and the Calvin cycle. Most could explain the role of ATP and NADPH accurately.',
    aiRevisit: 'The roles of chlorophyll and water splitting were frequently misunderstood. Consider a visual walkthrough of the Z-scheme in the next session.'
  },
  wk2: {
    title: 'Week 2 — Cell division',
    responses: 11, avg: 6.1, well: 2, revisit: 3,
    topics: [
      { name: 'Mitosis stages', score: 7.9 },
      { name: 'Meiosis vs mitosis', score: 6.2 },
      { name: 'Chromosome segregation', score: 5.7 },
      { name: 'Cell cycle checkpoints', score: 4.8 },
      { name: 'Cytokinesis', score: 5.1 }
    ],
    questions: [
      'Which phase of mitosis aligns chromosomes at the metaphase plate?',
      'What is one key difference between mitosis and meiosis I?',
      'How does spindle attachment affect chromosome segregation?',
      'Why are cell-cycle checkpoints critical for genomic stability?',
      'How does cytokinesis differ between plant and animal cells?'
    ],
    aiWell: 'Students showed a solid grasp of the mitosis stages in sequence.',
    aiRevisit: 'Cell cycle checkpoints and the differences between mitosis and meiosis need reinforcement. Several students confused the two processes entirely.'
  },
  wk1: {
    title: 'Week 1 — Intro to Biology',
    responses: 18, avg: 8.4, well: 4, revisit: 1,
    topics: [
      { name: 'Cell theory', score: 9.1 },
      { name: 'Prokaryote vs eukaryote', score: 8.7 },
      { name: 'Macromolecules', score: 8.2 },
      { name: 'Scientific method', score: 7.9 },
      { name: 'Enzyme function', score: 6.3 }
    ],
    questions: [
      'What are the three core statements of classical cell theory?',
      'How do prokaryotic and eukaryotic cells differ structurally?',
      'What are the four major classes of biological macromolecules?',
      'Why is hypothesis testing central to the scientific method?',
      'How does activation energy relate to enzyme function?'
    ],
    aiWell: 'Excellent comprehension across almost all introductory topics. Students are well-prepared for more advanced content.',
    aiRevisit: 'Enzyme function and the concept of activation energy may need a brief revisit before covering metabolism.'
  }
};

const GRADE_CONCEPTS = [
  { name: 'Photosynthesis', avg: 82 },
  { name: 'Cell division', avg: 74 },
  { name: 'DNA replication', avg: 58 },
  { name: 'Protein synthesis', avg: 49 },
  { name: 'Ecosystem dynamics', avg: 71 }
];

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (navItem) navItem.classList.add('active');
  document.getElementById('topbar-title').textContent = SCREEN_TITLES[id] || id;
  if (id === 'survey-results') {
    const selectedKey = document.getElementById('survey-select')?.value || LATEST_PUBLISHED_SURVEY_KEY || 'wk5';
    loadSurveyResult(selectedKey);
  }
  if (id === 'grades') resetGrades();
}

document.querySelectorAll('.nav-item[data-screen]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchScreen(item.dataset.screen);
  });
});

function generatePreview() {
  const content = document.getElementById('slide-content').value.trim();
  const label = document.getElementById('class-lbl').value.trim() || 'Survey';
  if (!content) { alert('Please paste some slide content first.'); return; }
  document.getElementById('sc-label').textContent = label;

  const requestedCount = parseInt(document.getElementById('nq')?.value, 10);
  const questionCount = Number.isFinite(requestedCount) ? Math.max(1, Math.min(20, requestedCount)) : 5;
  CURRENT_PREVIEW_QUESTIONS = Array.from({ length: questionCount }, (_, i) => SAMPLE_QUESTIONS[i] || `Generated question ${i + 1}`);

  const container = document.getElementById('preview-questions');
  container.innerHTML = '';
  CURRENT_PREVIEW_QUESTIONS.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'preview-q';
    div.innerHTML = `
      <div class="preview-q-text">${i + 1}. ${q}</div>
      <div class="preview-q-tags">
        <span class="tag tag-amber">Comprehension</span>
        <span class="tag tag-amber">1–10 rating</span>
      </div>`;
    container.appendChild(div);
  });
  document.getElementById('sc-step1').style.display = 'none';
  document.getElementById('sc-step2').style.display = 'block';
  document.getElementById('sc-step3').style.display = 'none';
}

function publishSurvey() {
  const label = document.getElementById('sc-label').textContent;
  const slug = (label || 'survey').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const generatedQuestions = CURRENT_PREVIEW_QUESTIONS.length ? CURRENT_PREVIEW_QUESTIONS.slice() : SAMPLE_QUESTIONS.slice(0, 5);
  let surveyKey = slug || `survey-${Date.now()}`;
  if (SURVEY_DATA[surveyKey]) surveyKey = `${surveyKey}-${Date.now().toString().slice(-4)}`;

  SURVEY_DATA[surveyKey] = {
    title: label,
    responses: 0,
    avg: 0,
    well: 0,
    revisit: generatedQuestions.length,
    topics: generatedQuestions.map((q, i) => ({
      name: q.length > 28 ? `${q.slice(0, 28)}...` : q,
      score: 0
    })),
    questions: generatedQuestions,
    aiWell: 'Survey has been published. Waiting for responses from students.',
    aiRevisit: 'No response data yet. Insights will appear after students submit answers.'
  };

  const surveySelect = document.getElementById('survey-select');
  if (surveySelect) {
    const option = document.createElement('option');
    option.value = surveyKey;
    option.textContent = label;
    surveySelect.insertBefore(option, surveySelect.firstChild);
    surveySelect.value = surveyKey;
  }

  LATEST_PUBLISHED_SURVEY_KEY = surveyKey;
  document.getElementById('share-link').textContent = `http://localhost:3000/studentSurvey.html`;
  renderDashboard();
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

function loadSurveyResult(key) {
  const data = SURVEY_DATA[key];
  if (!data) return;
  document.getElementById('res-count').textContent = data.responses;
  document.getElementById('res-avg').textContent = data.avg + ' / 10';
  document.getElementById('res-well').textContent = data.well;
  document.getElementById('res-revisit').textContent = data.revisit;
  document.getElementById('ai-well').textContent = data.aiWell;
  document.getElementById('ai-revisit').textContent = data.aiRevisit;
  const container = document.getElementById('result-bars');
  container.innerHTML = '';
  data.topics.forEach(t => {
    const pct = Math.round((t.score / 10) * 100);
    const color = t.score >= 7 ? '#1E7B4B' : t.score >= 5.5 ? '#8A5A00' : '#B52A2A';
    container.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">${t.name}</div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="bar-pct" style="color:${color}">${t.score}/10</div>
      </div>`;
  });

  renderSurveyQuestions(data.questions || []);
}

function renderSurveyQuestions(questions) {
  const container = document.getElementById('result-questions');
  if (!container) return;
  container.innerHTML = '';

  if (!questions.length) {
    container.innerHTML = '<div class="activity-meta">No questions available yet.</div>';
    return;
  }

  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'preview-q';
    div.innerHTML = `<div class="preview-q-text">${i + 1}. ${q}</div>`;
    container.appendChild(div);
  });
}

function simulateUpload() {
  const title = document.getElementById('upload-title');
  const zone = document.getElementById('upload-zone');
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
  const classAvg = Math.round((GRADE_CONCEPTS.reduce((s, c) => s + (c.avg || 0), 0) / (GRADE_CONCEPTS.length || 1)));
  const classAvgEl = document.getElementById('ga-class-average');
  if (classAvgEl) classAvgEl.textContent = classAvg + '%';
  const conceptsEl = document.getElementById('ga-concepts-tracked');
  if (conceptsEl) conceptsEl.textContent = GRADE_CONCEPTS.length;
  const studentsEl = document.getElementById('ga-students');
  if (studentsEl && !studentsEl.textContent.trim()) studentsEl.textContent = '20';
  const threshVal = parseInt(document.getElementById('thresh-slider')?.value || document.getElementById('thresh-in')?.value || 70, 10);
  updateThresh(threshVal);
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
  const passing = GRADE_CONCEPTS.filter(c => c.avg >= v).length;
  const approx = Math.round((passing / (GRADE_CONCEPTS.length || 1)) * 20);
  const passNote = document.getElementById('pass-note');
  if (passNote) passNote.textContent = `At ${v}% — approx. ${approx} / 20 students pass`;
  const passRate = document.getElementById('ga-pass-rate');
  if (passRate) passRate.textContent = Math.round((approx / 20) * 100) + '%';
}

function renderDashboard() {
  const surveys = Object.values(SURVEY_DATA || {});
  const surveysCreated = Object.keys(SURVEY_DATA || {}).length;
  const totalResponses = surveys.reduce((s, cur) => s + (cur.responses || 0), 0);
  const weightedAvg = totalResponses ? Math.round((surveys.reduce((s, cur) => s + ((cur.avg || 0) * (cur.responses || 0)), 0) / totalResponses) * 10) / 10 : (surveys.length ? Math.round((surveys.reduce((s, cur) => s + (cur.avg || 0), 0) / surveys.length) * 10) / 10 : 0);
  const studentsReached = totalResponses;
  const gradeReports = 1; // kept local: number of available grade reports (sample data)

  const elSurveysCreated = document.getElementById('db-surveys-created');
  if (elSurveysCreated) elSurveysCreated.textContent = surveysCreated;
  const elAvg = document.getElementById('db-avg-understanding');
  if (elAvg) elAvg.innerHTML = `${weightedAvg}<span style="font-size:14px;font-weight:400"> / 10</span>`;
  const elStudents = document.getElementById('db-students-reached');
  if (elStudents) elStudents.textContent = studentsReached;
  const elGradeReports = document.getElementById('db-grade-reports');
  if (elGradeReports) elGradeReports.textContent = gradeReports;

  const recentContainer = document.getElementById('recent-surveys-list');
  if (recentContainer) {
    recentContainer.innerHTML = '';
    const keys = Object.keys(SURVEY_DATA || {});
    keys.sort().reverse().forEach(k => {
      const d = SURVEY_DATA[k];
      const row = document.createElement('div');
      row.className = 'activity-row';
      row.innerHTML = `<div class="activity-title">${d.title}</div><div class="activity-meta">${d.responses} responses • ${d.avg}/10 avg</div>`;
      recentContainer.appendChild(row);
    });
  }
}

// render dashboard metrics computed from local page data, then show a default survey
renderDashboard();
loadSurveyResult('wk5');
