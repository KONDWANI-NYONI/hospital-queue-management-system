const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

const app = express();
const port = process.env.PORT || 3000;

// In-memory storage for local testing
let users = [];
let patients = [];
let userIdCounter = 1;
let patientIdCounter = 1;

// Stations
const stations = ['Cardiology', 'Radiology', 'Laboratory', 'Pharmacy', 'OPD'];

// Country codes, Zambia first
const countryCodes = [
  { code: '+260', country: 'Zambia' },
  { code: '+263', country: 'Zimbabwe' },
  { code: '+27', country: 'South Africa' },
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+257', country: 'Burundi' },
  { code: '+258', country: 'Mozambique' },
  { code: '+259', country: 'Zanzibar' },
  { code: '+250', country: 'Rwanda' }
];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: userIdCounter++, username, password: hashedPassword, role };
  users.push(user);
  res.status(201).json({ id: user.id });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'User not found' });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey');
  res.json({ token });
});

app.get('/api/queue', (req, res) => {
  res.json(patients);
});

app.post('/api/queue', (req, res) => {
  const { name, condition, station, phone } = req.body;
  const date_registered = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const patient = { id: patientIdCounter++, name, condition, station, phone, date_registered, status: 'waiting' };
  patients.push(patient);
  res.status(201).json(patient);
});

app.put('/api/queue/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const patient = patients.find(p => p.id === id);
  if (patient) {
    patient.status = status;
    res.status(200).send();
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

app.delete('/api/queue/:id', (req, res) => {
  const id = parseInt(req.params.id);
  patients = patients.filter(p => p.id !== id);
  res.status(204).send();
});

app.get('/api/export', (req, res) => {
  const ws = XLSX.utils.json_to_sheet(patients);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patients');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=patients.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

app.get('/api/stations', (req, res) => {
  res.json(stations);
});

app.get('/api/country-codes', (req, res) => {
  res.json(countryCodes);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});