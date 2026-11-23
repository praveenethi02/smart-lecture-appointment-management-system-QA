import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, closeDB } from '../../config/db.js';
import { seedDatabase } from '../../scripts/seed.js';

setDefaultTimeout(60 * 1000);

const PASSWORDS = { lecturer: 'Lecturer@123', student: 'Student@123' };
let slotCounter = 0;
let slotId;
let studentToken;
let response;

const futureDate = (days) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

const login = async (email, password) =>
  (await request(app).post('/api/auth/login').send({ email, password })).body.token;

const book = (token, reason) =>
  request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`)
    .send({ availabilityId: slotId, reason });

BeforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/qa_bdd';
  await connectDB();
  await seedDatabase({ keepOpen: true });
});

AfterAll(async () => {
  await closeDB();
});

Given('lecturer {string} has published a free slot', async (email) => {
  const token = await login(email, PASSWORDS.lecturer);
  const hour = 15 + slotCounter++;
  const res = await request(app).post('/api/availability').set('Authorization', `Bearer ${token}`)
    .send({ date: futureDate(45), startTime: `${hour}:00`, endTime: `${hour}:30`, location: 'Room 304' });
  assert.equal(res.status, 201);
  slotId = res.body.slot._id;
});

Given('student {string} is logged in', async (email) => {
  studentToken = await login(email, PASSWORDS.student);
  assert.ok(studentToken);
});

Given('student {string} has already booked the slot', async (email) => {
  const token = await login(email, PASSWORDS.student);
  const res = await book(token, 'Earlier booking');
  assert.equal(res.status, 201);
});

When('the student books the slot with reason {string}', async (reason) => {
  response = await book(studentToken, reason);
});

Then('the response status should be {int}', (status) => {
  assert.equal(response.status, status);
});