import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { seedDatabase } from '../scripts/seed.js';

const futureDate = (days) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

const login = async (email, password) =>
  (await request(app).post('/api/auth/login').send({ email, password })).body.token;

let lecturer, student1, student2;

beforeAll(async () => {
  // Force the in-memory DB so the seed never wipes a real database
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/qa_test';
  await connectDB();
  await seedDatabase({ keepOpen: true });
  lecturer = await login('dr.kamal@apex.edu', 'Lecturer@123');
  student1 = await login('kasun@student.apex.edu', 'Student@123');
  student2 = await login('dinithi@student.apex.edu', 'Student@123');
});

afterAll(async () => {
  await closeDB();
});

const createSlot = (body) =>
  request(app).post('/api/availability').set('Authorization', `Bearer ${lecturer}`).send(body);

describe('Authentication', () => {
  test('valid login returns 200 and a token', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'kasun@student.apex.edu', password: 'Student@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'kasun@student.apex.edu', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('student cannot open the admin dashboard (403)', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${student1}`);
    expect(res.status).toBe(403);
  });
});

describe('Create availability slot', () => {
  const date = futureDate(30);

  test('valid slot is created (201)', async () => {
    const res = await createSlot({ date, startTime: '18:00', endTime: '18:30', location: 'Room 304' });
    expect(res.status).toBe(201);
  });

  test('overlapping slot is rejected (400)', async () => {
    const res = await createSlot({ date, startTime: '18:15', endTime: '18:45', location: 'Room 304' });
    expect(res.status).toBe(400);
  });

  test('slot in the past is rejected (400)', async () => {
    const res = await createSlot({ date: '2020-01-01', startTime: '10:00', endTime: '10:30', location: 'Room 304' });
    expect(res.status).toBe(400);
  });

  // KNOWN BUG: month 13 is accepted. test.failing passes while the bug exists.
  // After the bug is fixed, change test.failing to test.
  test.failing('BUG-01: impossible date 2027-13-01 should be rejected (400)', async () => {
    const res = await createSlot({ date: '2027-13-01', startTime: '10:00', endTime: '10:30', location: 'Room 304' });
    expect(res.status).toBe(400);
  });
});

describe('Book appointment - decision table', () => {
  let slotId;

  beforeAll(async () => {
    const res = await createSlot({ date: futureDate(31), startTime: '19:00', endTime: '19:30', location: 'Room 304' });
    slotId = res.body.slot._id;
  });

  const book = (token, availabilityId) =>
    request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`)
      .send({ availabilityId, reason: 'Project review' });

  test('R1: no token -> 401', async () => {
    const res = await request(app).post('/api/appointments').send({ availabilityId: slotId, reason: 'x' });
    expect(res.status).toBe(401);
  });

  test('R2: lecturer tries to book -> 403', async () => {
    expect((await book(lecturer, slotId)).status).toBe(403);
  });

  test('R3: slot does not exist -> 404', async () => {
    expect((await book(student1, '64b000000000000000000000')).status).toBe(404);
  });

  test('R4: free slot is booked -> 201', async () => {
    expect((await book(student1, slotId)).status).toBe(201);
  });

  test('R5: second student books the same slot -> 409 (no double booking)', async () => {
    expect((await book(student2, slotId)).status).toBe(409);
  });
});