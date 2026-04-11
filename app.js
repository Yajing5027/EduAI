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
  if (id === 'survey-results') loadSurveyResult('wk5');
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
  const container = document.getElementById('preview-questions');
  container.innerHTML = '';
  SAMPLE_QUESTIONS.forEach((q, i) => {
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
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  document.getElementById('share-link').textContent = `eduai.app/survey/${slug}`;
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
  updateThresh(70);
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
  document.getElementById('thresh-disp').textContent = v + '%';
  const passing = GRADE_CONCEPTS.filter(c => c.avg >= v).length;
  const approx = Math.round((passing / GRADE_CONCEPTS.length) * 20);
  document.getElementById('pass-note').textContent = `At ${v}% — approx. ${approx} / 20 students pass`;
  document.getElementById('ga-pass-rate').textContent = Math.round((approx / 20) * 100) + '%';
}

loadSurveyResult('wk5');
