/**
 * SwasthyaSetu Main Application Controller
 */

// Application State
const state = {
  doctor: null,
  patients: [],
  selectedPatient: null,
  activeConsultation: null,
  activeSpeaker: 'PATIENT', // 'PATIENT' or 'DOCTOR'
  turns: [],
  draft: null,
  isProcessing: false,
};

const LANG_LABELS = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
};

// DOM Elements
const views = {
  dashboard: document.getElementById('view-dashboard'),
  patientDetail: document.getElementById('view-patient-detail'),
  consultation: document.getElementById('view-consultation'),
  draftReview: document.getElementById('view-draft-review'),
  approval: document.getElementById('view-approval'),
};

// Navigation Helper
function showView(viewName) {
  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.remove('active');
    }
  });
  if (views[viewName]) {
    views[viewName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.btn-close-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
  });
});

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupAudioCallbacks();
  await checkConnection();
  await loadDoctorSettings();
  await loadPatients();
});

// Connection Check
async function checkConnection() {
  const banner = document.getElementById('connection-banner');
  const statusText = document.getElementById('connection-status-text');

  try {
    const health = await window.api.checkHealth();
    banner.classList.remove('disconnected');
    statusText.textContent = `Connected to Backend (${health.database || 'SQLite WAL'}) • LAN: ${health.server_lan_ip || 'Active'}`;
  } catch (err) {
    banner.classList.add('disconnected');
    statusText.textContent = `Backend Disconnected (${window.api.getBaseUrl()}) — Tap Configure to set LAN IP`;
  }
}

// Load Doctor Settings
async function loadDoctorSettings() {
  try {
    const doc = await window.api.getDoctorSettings();
    state.doctor = doc;
    document.getElementById('dash-doctor-name').textContent = doc.name;
    document.getElementById('dash-doctor-creds').textContent = doc.credentials;
    document.getElementById('dash-doctor-lang').textContent = `Preferred: ${LANG_LABELS[doc.preferred_language] || doc.preferred_language}`;

    // Fill settings modal inputs
    document.getElementById('setting-doc-name').value = doc.name;
    document.getElementById('setting-doc-creds').value = doc.credentials;
    document.getElementById('setting-doc-lang').value = doc.preferred_language;
    document.getElementById('setting-api-url').value = window.api.getBaseUrl();
  } catch (err) {
    console.warn('Failed to load doctor settings:', err);
  }
}

// Load Patients List
async function loadPatients(query = '') {
  try {
    const list = await window.api.getPatients(query);
    state.patients = list;
    renderPatientsList(list);
  } catch (err) {
    console.error('Failed to load patients:', err);
  }
}

function renderPatientsList(patients) {
  const container = document.getElementById('patient-list-container');
  const countBadge = document.getElementById('patient-count-badge');
  countBadge.textContent = `${patients.length} registered`;

  if (patients.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-users-slash" style="font-size: 38px; margin-bottom: 10px; color: #cbd5e1;"></i>
        <p style="font-weight: 600;">No patients found</p>
        <p style="font-size: 12px; margin-top: 4px;">Click "+ Add" above to register a new patient.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = patients.map(p => {
    const lang = p.preferred_language || 'hi-IN';
    const langClass = lang.includes('hi') ? 'badge-hi' : (lang.includes('mr') ? 'badge-mr' : 'badge-en');
    const langName = LANG_LABELS[lang] || lang;

    return `
      <div class="patient-card" onclick="viewPatientDetail('${p.id}')">
        <div class="patient-meta">
          <div class="patient-avatar">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="patient-details">
            <h4>${p.name}</h4>
            <p>${p.age ? p.age + ' yrs • ' : ''}${p.mobile_number}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-chip ${langClass}">${langName}</span>
          <i class="fa-solid fa-chevron-right" style="color: #94a3b8; font-size: 13px;"></i>
        </div>
      </div>
    `;
  }).join('');
}

// Patient Detail View
window.viewPatientDetail = async function(patientId) {
  try {
    const patient = await window.api.getPatient(patientId);
    state.selectedPatient = patient;

    document.getElementById('detail-patient-name').textContent = patient.name;
    document.getElementById('card-patient-name').textContent = patient.name;
    document.getElementById('card-patient-meta').textContent = `${patient.age ? patient.age + ' years • ' : ''}${patient.mobile_number}`;
    
    const langBadge = document.getElementById('card-patient-lang');
    langBadge.textContent = LANG_LABELS[patient.preferred_language] || patient.preferred_language;
    langBadge.className = `badge-chip ${patient.preferred_language.includes('hi') ? 'badge-hi' : (patient.preferred_language.includes('mr') ? 'badge-mr' : 'badge-en')}`;

    showView('patientDetail');
    loadConsultationHistory(patient.id);
  } catch (err) {
    alert('Failed to load patient: ' + err.message);
  }
};

async function loadConsultationHistory(patientId) {
  const container = document.getElementById('consultation-history-list');
  const countBadge = document.getElementById('consultation-count-badge');

  try {
    const history = await window.api.getPatientConsultations(patientId);
    countBadge.textContent = `${history.length} past visits`;

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          No previous consultations recorded for this patient.
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(c => {
      const dateStr = new Date(c.started_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isCompleted = c.status === 'COMPLETED';
      return `
        <div class="patient-card" style="cursor: default;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700;">${dateStr}</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Doctor: ${c.doctor_language} ↔ Patient: ${c.patient_language}
            </p>
          </div>
          <span class="badge-chip" style="background: ${isCompleted ? 'var(--success-light)' : 'var(--warning-light)'}; color: ${isCompleted ? 'var(--success-green)' : 'var(--warning-amber)'}; font-size: 10px;">
            ${c.status}
          </span>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--error-red);">Failed to load history</p>`;
  }
}

// Start New Consultation
async function startConsultation() {
  if (!state.selectedPatient) return;

  const btn = document.getElementById('btn-start-consultation');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing Session...`;

  try {
    const doctorLang = state.doctor ? state.doctor.preferred_language : 'en-IN';
    const patientLang = state.selectedPatient.preferred_language || 'hi-IN';

    const consultation = await window.api.createConsultation(
      state.selectedPatient.id,
      doctorLang,
      patientLang
    );

    state.activeConsultation = consultation;
    state.turns = [];
    state.activeSpeaker = 'PATIENT'; // patient starts

    // Setup consultation screen
    document.getElementById('cons-patient-title').textContent = state.selectedPatient.name;
    document.getElementById('cons-badge-patient').textContent = `Patient: ${LANG_LABELS[patientLang] || patientLang}`;
    document.getElementById('cons-badge-doctor').textContent = `Doctor: ${LANG_LABELS[doctorLang] || doctorLang}`;

    switchSpeaker('PATIENT');
    renderTimeline([]);
    showView('consultation');
  } catch (err) {
    alert('Failed to start consultation: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> Start New Consultation`;
  }
}

// Speaker Selector (Patient vs Doctor)
function switchSpeaker(speaker) {
  state.activeSpeaker = speaker;
  const isPatient = speaker === 'PATIENT';

  const btnPatient = document.getElementById('btn-speaker-patient');
  const btnDoctor = document.getElementById('btn-speaker-doctor');
  const recBtn = document.getElementById('btn-record-turn');
  const turnBanner = document.getElementById('turn-direction-banner');
  const turnText = document.getElementById('turn-direction-text');

  if (isPatient) {
    btnPatient.classList.add('active');
    btnDoctor.classList.remove('active');
    recBtn.className = 'record-btn-big';
    turnBanner.className = 'turn-direction-banner patient-turn';
    const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
    const dLang = state.activeConsultation ? state.activeConsultation.doctor_language : 'en-IN';
    turnText.textContent = `Patient Speaks (${LANG_LABELS[pLang] || pLang}) ➔ Doctor Listens (${LANG_LABELS[dLang] || dLang})`;
  } else {
    btnPatient.classList.remove('active');
    btnDoctor.classList.add('active');
    recBtn.className = 'record-btn-big doctor';
    turnBanner.className = 'turn-direction-banner doctor-turn';
    const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
    const dLang = state.activeConsultation ? state.activeConsultation.doctor_language : 'en-IN';
    turnText.textContent = `Doctor Speaks (${LANG_LABELS[dLang] || dLang}) ➔ Patient Listens (${LANG_LABELS[pLang] || pLang} Male Voice)`;
  }
}

// Audio Recording & Turn Processing
async function toggleRecording() {
  if (state.isProcessing) return;

  if (window.audioManager.isRecording) {
    // Stop recording
    const audioBlob = await window.audioManager.stopRecording();
    if (audioBlob) {
      await processAudioTurn(audioBlob);
    }
  } else {
    // Start recording
    await window.audioManager.startRecording();
  }
}

async function processAudioTurn(audioBlob) {
  if (!state.activeConsultation) return;

  const isPatient = state.activeSpeaker === 'PATIENT';
  const sourceLang = isPatient ? state.activeConsultation.patient_language : state.activeConsultation.doctor_language;
  const targetLang = isPatient ? state.activeConsultation.doctor_language : state.activeConsultation.patient_language;

  setProcessing(true, 'Transcribing with Gnani AI & translating with GPT-6 Luna...');

  try {
    const result = await window.api.processAudioTurn(
      state.activeConsultation.id,
      state.activeSpeaker,
      sourceLang,
      targetLang,
      audioBlob
    );

    appendTurn(result);

    // Auto-play synthesized audio for recipient
    if (result.audio_url) {
      const fullUrl = window.api.resolveAudioUrl(result.audio_url);
      window.audioManager.playAudio(fullUrl);
    }

    // Auto-prompt turn handoff
    promptTurnHandoff();
  } catch (err) {
    alert('Turn processing failed: ' + err.message);
  } finally {
    setProcessing(false);
  }
}

async function processTextTurn(text) {
  if (!state.activeConsultation || !text.trim()) return;

  const isPatient = state.activeSpeaker === 'PATIENT';
  const sourceLang = isPatient ? state.activeConsultation.patient_language : state.activeConsultation.doctor_language;
  const targetLang = isPatient ? state.activeConsultation.doctor_language : state.activeConsultation.patient_language;

  setProcessing(true, 'Translating with GPT-6 Luna & querying translation cache...');

  try {
    const result = await window.api.processTextTurn(
      state.activeConsultation.id,
      state.activeSpeaker,
      sourceLang,
      targetLang,
      text.trim()
    );

    appendTurn(result);

    if (result.audio_url) {
      const fullUrl = window.api.resolveAudioUrl(result.audio_url);
      window.audioManager.playAudio(fullUrl);
    }

    promptTurnHandoff();
  } catch (err) {
    alert('Turn processing error: ' + err.message);
  } finally {
    setProcessing(false);
  }
}

function promptTurnHandoff() {
  // After patient turn, suggest switching to Doctor; after doctor, suggest Patient
  if (state.activeSpeaker === 'PATIENT') {
    switchSpeaker('DOCTOR');
  } else {
    switchSpeaker('PATIENT');
  }
}

function setProcessing(isProcessing, message = 'Processing speech turn...') {
  state.isProcessing = isProcessing;
  const banner = document.getElementById('turn-processing-banner');
  const bannerText = document.getElementById('turn-processing-text');
  const recordBtn = document.getElementById('btn-record-turn');

  if (isProcessing) {
    banner.style.display = 'flex';
    bannerText.textContent = message;
    recordBtn.disabled = true;
  } else {
    banner.style.display = 'none';
    recordBtn.disabled = false;
  }
}

function appendTurn(turn) {
  state.turns.push(turn);
  renderTimeline(state.turns);
}

function renderTimeline(turns) {
  const container = document.getElementById('transcript-timeline');

  if (turns.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-microphone-slash" style="font-size: 42px; margin-bottom: 12px; color: #cbd5e1;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: #475569;">No speech recorded yet</h4>
        <p style="font-size: 12px; margin-top: 4px;">Select active speaker above, then tap the record button to speak.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = turns.map((t, idx) => {
    const isPatient = t.speaker === 'PATIENT';
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cachedBadge = t.cache_hit ? `<span class="cached-pill"><i class="fa-solid fa-bolt"></i> CACHED</span>` : '';
    const audioBtn = t.audio_url ? `
      <button class="btn btn-outline btn-sm" style="margin-left: auto;" onclick="playTurnAudio('${t.audio_url}')">
        <i class="fa-solid fa-volume-high"></i> Play TTS
      </button>
    ` : '';

    return `
      <div class="transcript-card ${isPatient ? 'patient' : 'doctor'}">
        <div class="transcript-top-row">
          <div style="display: flex; align-items: center;">
            <span class="speaker-tag ${isPatient ? 'patient' : 'doctor'}">
              ${isPatient ? '<i class="fa-solid fa-user"></i> PATIENT' : '<i class="fa-solid fa-user-doctor"></i> DOCTOR'}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">
              ${t.source_language} ➔ ${t.recipient_language}
            </span>
            ${cachedBadge}
          </div>
          <span class="transcript-time">${timeStr}</span>
        </div>

        ${t.recognized_source_text ? `
          <div class="transient-source">
            <strong>Recognized (${t.source_language}):</strong> "${t.recognized_source_text}"
          </div>
        ` : ''}

        <div class="recipient-translation">
          ${t.recipient_translation}
        </div>

        <div class="canonical-english-box">
          <strong>Canonical Clinical Record (English):</strong>
          ${t.canonical_english}
        </div>

        ${audioBtn ? `<div style="display: flex; margin-top: 4px;">${audioBtn}</div>` : ''}
      </div>
    `;
  }).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

window.playTurnAudio = function(urlPath) {
  const fullUrl = window.api.resolveAudioUrl(urlPath);
  window.audioManager.playAudio(fullUrl);
};

// Draft Medical Record Generation & Review
async function loadDraftReview() {
  if (!state.activeConsultation) return;

  const reviewBtn = document.getElementById('btn-review-draft');
  reviewBtn.disabled = true;
  reviewBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

  try {
    const draft = await window.api.generateDraft(state.activeConsultation.id);
    state.draft = draft;

    renderDraftReview(draft);
    showView('draftReview');
  } catch (err) {
    alert('Failed to generate draft: ' + err.message);
  } finally {
    reviewBtn.disabled = false;
    reviewBtn.innerHTML = `<i class="fa-solid fa-clipboard-check"></i> Review Draft`;
  }
}

function renderDraftReview(draft) {
  const payload = draft.structured_payload || {};

  // Symptoms
  const symptomsContainer = document.getElementById('draft-symptoms-list');
  const symptoms = payload.patient_reported_symptoms || [];

  if (symptoms.length === 0) {
    symptomsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No symptoms extracted.</p>`;
  } else {
    symptomsContainer.innerHTML = symptoms.map(s => `
      <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fffbeb; border-radius: 8px; margin-bottom: 6px;">
        <i class="fa-solid fa-virus" style="color: var(--patient-color);"></i>
        <div>
          <strong style="font-size: 14px;">${s.symptom}</strong>
          <span style="font-size: 12px; color: var(--text-muted);"> • Duration: ${s.duration || 'Not stated'}</span>
        </div>
      </div>
    `).join('');
  }

  // Doctor diagnosis input
  document.getElementById('draft-input-diagnosis').value = payload.doctor_diagnosis || 'Not specified; doctor to enter or confirm';
  document.getElementById('draft-input-history').value = payload.medical_history || 'Not stated in the conversation';
  document.getElementById('draft-input-allergies').value = payload.allergies || 'Not stated';
  document.getElementById('draft-input-followup').value = payload.follow_up_recommendation || 'Follow up after 3 days if symptoms persist';

  renderPrescriptions(payload.prescriptions || []);
}

function renderPrescriptions(prescriptions) {
  const container = document.getElementById('draft-prescriptions-list');

  if (prescriptions.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: var(--text-muted); text-align: center;">
        No medicines prescribed yet. Tap "+ Add Medicine" to prescribe.
      </div>
    `;
    return;
  }

  container.innerHTML = prescriptions.map((p, idx) => `
    <div class="prescription-item-row">
      <div>
        <h5>${p.medicine} ${p.strength || ''}</h5>
        <p>${p.dose || ''} • ${p.frequency || ''} • ${p.duration || ''}</p>
      </div>
      <button class="icon-btn" style="color: var(--error-red);" onclick="removePrescription(${idx})">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

window.removePrescription = function(index) {
  if (!state.draft || !state.draft.structured_payload) return;
  state.draft.structured_payload.prescriptions.splice(index, 1);
  renderPrescriptions(state.draft.structured_payload.prescriptions);
};

// Save Draft Edits
async function saveDraftEdits() {
  if (!state.activeConsultation || !state.draft) return;

  const payload = state.draft.structured_payload;
  payload.doctor_diagnosis = document.getElementById('draft-input-diagnosis').value.trim();
  payload.medical_history = document.getElementById('draft-input-history').value.trim();
  payload.allergies = document.getElementById('draft-input-allergies').value.trim();
  payload.follow_up_recommendation = document.getElementById('draft-input-followup').value.trim();

  try {
    const updated = await window.api.updateDraft(state.activeConsultation.id, payload);
    state.draft = updated;
    alert('Draft edits saved successfully!');
  } catch (err) {
    alert('Failed to save draft: ' + err.message);
  }
}

// Approve Official Record
async function approveClinicalRecord() {
  if (!state.activeConsultation || !state.draft) return;

  const btn = document.getElementById('btn-approve-record');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Committing Official Record...`;

  try {
    // Save latest input edits first
    const payload = state.draft.structured_payload;
    payload.doctor_diagnosis = document.getElementById('draft-input-diagnosis').value.trim();
    payload.medical_history = document.getElementById('draft-input-history').value.trim();
    payload.allergies = document.getElementById('draft-input-allergies').value.trim();
    payload.follow_up_recommendation = document.getElementById('draft-input-followup').value.trim();

    await window.api.updateDraft(state.activeConsultation.id, payload);
    const approved = await window.api.approveDraft(state.activeConsultation.id);

    // Setup Approval & Follow-up View
    document.getElementById('appr-diagnosis-text').textContent = payload.doctor_diagnosis;
    const prescContainer = document.getElementById('appr-prescription-summary');
    if (payload.prescriptions && payload.prescriptions.length > 0) {
      prescContainer.innerHTML = payload.prescriptions.map(p => `
        <div>• <strong>${p.medicine} ${p.strength || ''}</strong> (${p.dose || ''}, ${p.frequency || ''})</div>
      `).join('');
    } else {
      prescContainer.innerHTML = `<em>No medicines prescribed</em>`;
    }

    // Set default follow-up 3 days later at 10:30 AM
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    nextDate.setHours(10, 30, 0, 0);
    const dateInputStr = nextDate.toISOString().slice(0, 16);
    document.getElementById('input-followup-datetime').value = dateInputStr;
    document.getElementById('input-followup-phone').value = state.selectedPatient.mobile_number;

    showView('approval');
  } catch (err) {
    alert('Failed to approve clinical record: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Approve & Save Official Clinical Record`;
  }
}

// Schedule Follow-up Appointment
async function saveFollowupAppointment() {
  if (!state.activeConsultation) return;

  const dtStr = document.getElementById('input-followup-datetime').value;
  const phone = document.getElementById('input-followup-phone').value.trim();

  if (!dtStr || !phone) {
    alert('Please enter both appointment date/time and contact phone number.');
    return;
  }

  const btn = document.getElementById('btn-save-followup');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving Appointment...`;

  try {
    const appointmentAt = new Date(dtStr).toISOString();
    await window.api.scheduleFollowup(state.activeConsultation.id, appointmentAt, phone);
    alert('Follow-up appointment saved successfully in local clinic database!');
    showView('dashboard');
    loadPatients();
  } catch (err) {
    alert('Failed to save follow-up: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Save Follow-up Appointment`;
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Settings modal
  document.getElementById('btn-open-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('link-configure-ip').addEventListener('click', () => openModal('modal-settings'));

  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const name = document.getElementById('setting-doc-name').value.trim();
    const creds = document.getElementById('setting-doc-creds').value.trim();
    const lang = document.getElementById('setting-doc-lang').value;
    const apiUrl = document.getElementById('setting-api-url').value.trim();

    if (apiUrl) window.api.setBaseUrl(apiUrl);

    try {
      await window.api.updateDoctorSettings({
        name,
        credentials: creds,
        preferred_language: lang,
      });
      await loadDoctorSettings();
      await checkConnection();
      closeModal('modal-settings');
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  });

  // Patient Registration
  document.getElementById('btn-add-patient').addEventListener('click', () => openModal('modal-patient-register'));
  document.getElementById('btn-submit-patient').addEventListener('click', async () => {
    const name = document.getElementById('reg-patient-name').value.trim();
    const age = parseInt(document.getElementById('reg-patient-age').value) || null;
    const phone = document.getElementById('reg-patient-phone').value.trim();
    const lang = document.getElementById('reg-patient-lang').value;

    if (!name || !phone) {
      alert('Name and Mobile Number are required.');
      return;
    }

    try {
      const created = await window.api.createPatient({
        name,
        age,
        mobile_number: phone,
        preferred_language: lang,
      });
      closeModal('modal-patient-register');
      document.getElementById('reg-patient-name').value = '';
      document.getElementById('reg-patient-phone').value = '';
      await loadPatients();
      viewPatientDetail(created.id);
    } catch (err) {
      alert('Failed to register patient: ' + err.message);
    }
  });

  // Patient Search Debounce
  let searchTimer;
  document.getElementById('input-patient-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      loadPatients(e.target.value.trim());
    }, 250);
  });

  // Navigation Back buttons
  document.getElementById('btn-back-to-dashboard').addEventListener('click', () => showView('dashboard'));
  document.getElementById('btn-back-to-consultation').addEventListener('click', () => showView('consultation'));
  document.getElementById('btn-finish-to-dashboard').addEventListener('click', () => showView('dashboard'));

  // Start Consultation
  document.getElementById('btn-start-consultation').addEventListener('click', startConsultation);

  // Speaker Selector Buttons
  document.getElementById('btn-speaker-patient').addEventListener('click', () => switchSpeaker('PATIENT'));
  document.getElementById('btn-speaker-doctor').addEventListener('click', () => switchSpeaker('DOCTOR'));

  // Record Turn Button
  document.getElementById('btn-record-turn').addEventListener('click', toggleRecording);

  // Quick Text Input Turn
  document.getElementById('btn-type-turn').addEventListener('click', () => {
    document.getElementById('modal-text-turn-title').textContent = `Type Turn (${state.activeSpeaker === 'PATIENT' ? 'Patient' : 'Doctor'})`;
    document.getElementById('input-turn-text').value = '';
    openModal('modal-text-turn');
  });

  document.getElementById('btn-submit-text-turn').addEventListener('click', () => {
    const text = document.getElementById('input-turn-text').value.trim();
    if (text) {
      closeModal('modal-text-turn');
      processTextTurn(text);
    }
  });

  // Scripted Demo Presets
  document.getElementById('btn-preset-turn').addEventListener('click', () => {
    const isPatient = state.activeSpeaker === 'PATIENT';
    const patientPresets = [
      'Mujhe three days se fever hai aur headache bhi hai.',
      'Mala teen divasapasun taap aani dukhane ahe.',
      'I have severe stomach ache since yesterday morning.',
    ];
    const doctorPresets = [
      'Take paracetamol 500mg twice daily after meals for three days.',
      'तुम्हाला किती दिवसांपासून ताप येत आहे?',
      'Drink plenty of warm water and take complete bed rest.',
    ];
    const presets = isPatient ? patientPresets : doctorPresets;

    const listContainer = document.getElementById('presets-list-container');
    listContainer.innerHTML = presets.map(p => `
      <button class="btn btn-outline" style="text-align: left; justify-content: flex-start; font-size: 13px;" onclick="selectPreset('${p.replace(/'/g, "\\'")}')">
        <i class="fa-solid fa-comment-dots"></i> "${p}"
      </button>
    `).join('');

    document.getElementById('modal-presets-title').textContent = `Demo Presets (${isPatient ? 'Patient' : 'Doctor'})`;
    openModal('modal-presets');
  });

  window.selectPreset = function(phrase) {
    closeModal('modal-presets');
    processTextTurn(phrase);
  };

  // Review Draft Button
  document.getElementById('btn-review-draft').addEventListener('click', loadDraftReview);

  // Draft Actions
  document.getElementById('btn-save-draft').addEventListener('click', saveDraftEdits);
  document.getElementById('btn-approve-record').addEventListener('click', approveClinicalRecord);

  // Add Prescription
  document.getElementById('btn-add-prescription').addEventListener('click', () => openModal('modal-prescription'));
  document.getElementById('btn-confirm-add-presc').addEventListener('click', () => {
    const med = document.getElementById('presc-med').value.trim();
    const strength = document.getElementById('presc-strength').value.trim();
    const dose = document.getElementById('presc-dose').value.trim();
    const freq = document.getElementById('presc-freq').value.trim();
    const dur = document.getElementById('presc-duration').value.trim();

    if (!med) return;

    if (!state.draft.structured_payload.prescriptions) {
      state.draft.structured_payload.prescriptions = [];
    }

    state.draft.structured_payload.prescriptions.push({
      medicine: med,
      strength,
      dose,
      frequency: freq,
      duration: dur,
    });

    renderPrescriptions(state.draft.structured_payload.prescriptions);
    closeModal('modal-prescription');
  });

  // Follow-up Save
  document.getElementById('btn-save-followup').addEventListener('click', saveFollowupAppointment);
}

// Audio Callbacks for Single-Device Echo Management
function setupAudioCallbacks() {
  const playbackBanner = document.getElementById('audio-playback-banner');
  const recordLabel = document.getElementById('record-status-label');
  const recordBtn = document.getElementById('btn-record-turn');

  window.audioManager.onStateChange = ({ isRecording, isPlaying }) => {
    if (isPlaying) {
      playbackBanner.style.display = 'flex';
      recordBtn.disabled = true;
      recordLabel.textContent = 'TTS PLAYING — MIC LOCKED';
      recordLabel.className = 'record-status-label';
    } else {
      playbackBanner.style.display = 'none';
      recordBtn.disabled = false;
      if (isRecording) {
        recordBtn.classList.add('recording');
        recordLabel.classList.add('recording');
        recordLabel.textContent = 'RECORDING... (TAP TO STOP)';
      } else {
        recordBtn.classList.remove('recording');
        recordLabel.classList.remove('recording');
        recordLabel.textContent = 'TAP TO RECORD TURN';
      }
    }
  };

  window.audioManager.onTimerTick = (timeFormatted) => {
    recordLabel.textContent = `RECORDING (${timeFormatted}) — TAP TO STOP`;
  };
}

