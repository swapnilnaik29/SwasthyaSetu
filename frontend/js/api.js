/**
 * SwasthyaSetu API Client
 * Automatically connects to the local FastAPI backend.
 */

class ApiService {
  constructor() {
    this.storageKey = 'swasthya_api_base_url';
    this.defaultBaseUrl = window.location.origin.includes('http') && !window.location.origin.includes('file')
      ? window.location.origin
      : 'http://127.0.0.1:8000';
  }

  getBaseUrl() {
    return localStorage.getItem(this.storageKey) || this.defaultBaseUrl;
  }

  setBaseUrl(url) {
    const clean = url.trim().replace(/\/+$/, '');
    localStorage.setItem(this.storageKey, clean);
  }

  resolveAudioUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.getBaseUrl()}${cleanPath}`;
  }

  async request(endpoint, options = {}) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const headers = options.headers || {};
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = `HTTP Error ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Health probe
  async checkHealth() {
    return this.request('/health');
  }

  // Doctor Settings
  async getDoctorSettings() {
    return this.request('/api/v1/doctor/settings');
  }

  async updateDoctorSettings(data) {
    return this.request('/api/v1/doctor/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Patients
  async getPatients(query = '') {
    const param = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request(`/api/v1/patients${param}`);
  }

  async createPatient(data) {
    return this.request('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPatient(id) {
    return this.request(`/api/v1/patients/${id}`);
  }

  async getPatientConsultations(patientId) {
    return this.request(`/api/v1/patients/${patientId}/consultations`);
  }

  // Conversational AI Patient Intake
  async submitConversationalIntake(intakeData) {
    return this.request('/api/v1/patients/intake', {
      method: 'POST',
      body: JSON.stringify(intakeData),
    });
  }

  // Direct Audio Synthesis & Transcription (Intake Assistant)
  async synthesizeSpeech(text, language = 'hi-IN') {
    return this.request('/api/v1/audio/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    });
  }

  async transcribeAudio(audioBlob, language = 'hi-IN', filename = 'intake.wav') {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    formData.append('language', language);

    return this.request('/api/v1/audio/transcribe', {
      method: 'POST',
      body: formData,
    });
  }

  // Consultations
  async createConsultation(patientId, doctorLang = 'en-IN', patientLang = 'hi-IN', mode = 'NORMAL') {
    return this.request('/api/v1/consultations', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        doctor_language: doctorLang,
        patient_language: patientLang,
        mode: mode,
      }),
    });
  }

  async getConsultation(id) {
    return this.request(`/api/v1/consultations/${id}`);
  }

  // Turn processing: Audio file upload
  async processAudioTurn(consultationId, speaker, sourceLang, targetLang, audioBlob, filename = 'turn.wav') {
    const formData = new FormData();
    formData.append('speaker', speaker);
    formData.append('source_language', sourceLang);
    formData.append('target_language', targetLang);
    formData.append('audio', audioBlob, filename);

    return this.request(`/api/v1/consultations/${consultationId}/turns`, {
      method: 'POST',
      body: formData,
    });
  }

  // Turn processing: Direct text fallback
  async processTextTurn(consultationId, speaker, sourceLang, targetLang, text) {
    const formData = new FormData();
    formData.append('speaker', speaker);
    formData.append('source_language', sourceLang);
    formData.append('target_language', targetLang);
    formData.append('text', text);

    return this.request(`/api/v1/consultations/${consultationId}/turns`, {
      method: 'POST',
      body: formData,
    });
  }

  async getTranscripts(consultationId) {
    return this.request(`/api/v1/consultations/${consultationId}/transcripts`);
  }

  // Structured Draft & Approval
  async generateDraft(consultationId) {
    return this.request(`/api/v1/consultations/${consultationId}/draft`, {
      method: 'POST',
    });
  }

  async getDraft(consultationId) {
    return this.request(`/api/v1/consultations/${consultationId}/draft`);
  }

  async updateDraft(consultationId, structuredPayload) {
    return this.request(`/api/v1/consultations/${consultationId}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ structured_payload: structuredPayload }),
    });
  }

  async approveDraft(consultationId) {
    return this.request(`/api/v1/consultations/${consultationId}/approve`, {
      method: 'POST',
    });
  }

  async rejectDraft(consultationId) {
    return this.request(`/api/v1/consultations/${consultationId}/reject`, {
      method: 'POST',
    });
  }

  // Follow-up scheduling
  async scheduleFollowup(consultationId, appointmentAt, phoneNumber) {
    return this.request(`/api/v1/consultations/${consultationId}/followups`, {
      method: 'POST',
      body: JSON.stringify({
        appointment_at: appointmentAt,
        phone_number: phoneNumber,
      }),
    });
  }
}

window.api = new ApiService();

