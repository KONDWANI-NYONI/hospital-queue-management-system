const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// In-memory storage for local testing
let users = [];
let patients = [];
let userIdCounter = 1;
let patientIdCounter = 1;

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
  const { name, condition, station } = req.body;
  const patient = { id: patientIdCounter++, name, condition, station, status: 'waiting' };
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});