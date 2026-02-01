const API_BASE = '/api';

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);
document.getElementById('addPatientBtn').addEventListener('click', addPatient);
document.getElementById('stations').addEventListener('click', switchStation);

let currentStation = 'OPD';

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    showQueue();
  } else {
    alert(data.error);
  }
}

async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = 'staff'; // Default role
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  if (response.ok) {
    alert('Registered successfully');
  } else {
    const data = await response.json();
    alert(data.error);
  }
}

async function showQueue() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('queue').style.display = 'block';
  loadCountryCodes();
  loadStations();
  loadQueue();
}

async function loadCountryCodes() {
  const response = await fetch(`${API_BASE}/country-codes`);
  const codes = await response.json();
  const select = document.getElementById('country-code');
  codes.forEach(code => {
    const option = document.createElement('option');
    option.value = code.code;
    option.textContent = `${code.code} (${code.country})`;
    select.appendChild(option);
  });
}

async function loadStations() {
  const response = await fetch(`${API_BASE}/stations`);
  const stations = await response.json();
  const container = document.getElementById('stations');
  container.innerHTML = '';
  stations.forEach(station => {
    const btn = document.createElement('button');
    btn.className = 'station-btn';
    btn.dataset.station = station;
    btn.textContent = station;
    if (station === currentStation) btn.classList.add('active');
    container.appendChild(btn);
  });
}

async function loadQueue() {
  const response = await fetch(`${API_BASE}/queue`);
  const patients = await response.json();
  const list = document.getElementById('patientList');
  list.innerHTML = '';
  const stationPatients = patients.filter(p => p.station === currentStation);
  stationPatients.forEach(patient => {
    const div = document.createElement('div');
    div.className = 'patient';
    const statusText = patient.status === 'called' ? ' (Called)' : '';
    div.innerHTML = `<span>${patient.name} - ${patient.condition}${statusText}</span>
                     <div>
                       <button class="call-btn" onclick="callPatient(${patient.id})">Call</button>
                       <button onclick="completePatient(${patient.id})">Complete</button>
                       <button onclick="removePatient(${patient.id})">Remove</button>
                     </div>`;
    list.appendChild(div);
  });
}

function switchStation(e) {
  if (e.target.classList.contains('station-btn')) {
    document.querySelectorAll('.station-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentStation = e.target.dataset.station;
    loadQueue();
  }
}

async function addPatient() {
  const name = document.getElementById('patientName').value;
  const condition = document.getElementById('patientCondition').value;
  const station = document.getElementById('stationSelect').value;
  const response = await fetch(`${API_BASE}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, condition, station })
  });
  if (response.ok) {
    loadQueue();
    document.getElementById('patientName').value = '';
    document.getElementById('patientCondition').value = '';
  }
}

async function callPatient(id) {
  await fetch(`${API_BASE}/queue/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'called' })
  });
  const response = await fetch(`${API_BASE}/queue`);
  const patients = await response.json();
  const patient = patients.find(p => p.id === id);
  if (patient) {
    speak(`Patient ${patient.name}, ticket number ${patient.id}, please proceed to ${patient.station}`);
  }
  loadQueue();
}

function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else {
    alert(text);
  }
}

async function completePatient(id) {
  await fetch(`${API_BASE}/queue/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' })
  });
  loadQueue();
}

async function removePatient(id) {
  await fetch(`${API_BASE}/queue/${id}`, { method: 'DELETE' });
  loadQueue();
}

async function exportToExcel() {
  const response = await fetch(`${API_BASE}/export`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'patients.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
}