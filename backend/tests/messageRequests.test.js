const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const MessageRequest = require('../models/MessageRequest');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;
let requestId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});
  await MessageRequest.deleteMany({});

  // Créer User 1
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'msgreq1@test.com',
      password: 'Password123',
      firstName: 'Alice',
      lastName: 'Test',
      birthDate: '1990-05-15',
      gender: 'femme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  // Créer User 2
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'msgreq2@test.com',
      password: 'Password123',
      firstName: 'Bob',
      lastName: 'Test',
      birthDate: '1992-08-20',
      gender: 'homme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  // Créer User 3 (pour test avec match existant)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'msgreq3@test.com',
      password: 'Password123',
      firstName: 'Charlie',
      lastName: 'Test',
      birthDate: '1988-12-10',
      gender: 'homme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  // Créer un match entre User 1 et User 3
  await request(app)
    .post(`/api/swipe/like/${user3Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  await request(app)
    .post(`/api/swipe/like/${user1Id}`)
    .set('Authorization', `Bearer ${user3Token}`);
});

afterAll(async () => {
  await User.deleteMany({});
  await MessageRequest.deleteMany({});
  await mongoose.connection.close();
});

describe('API MessageRequests - Envoi', () => {
  test('POST /api/message-requests/send/:recipientId - envoyer une demande', async () => {
    const res = await request(app)
      .post(`/api/message-requests/send/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ message: 'Salut ! Je te trouve intéressant(e)' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Demande envoyée');
    expect(res.body.request).toBeDefined();
    expect(res.body.request.message).toBe('Salut ! Je te trouve intéressant(e)');

    requestId = res.body.request._id;
  });

  test('POST /api/message-requests/send/:recipientId - message vide (400)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/send/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ message: '  ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('requis');
  });

  test('POST /api/message-requests/send/:recipientId - demande déjà envoyée (400)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/send/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ message: 'Nouveau message' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà envoyé une demande');
  });

  test('POST /api/message-requests/send/:recipientId - déjà matché (400)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/send/${user3Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ message: 'Test' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà matchés');
  });

  test('POST /api/message-requests/send/:recipientId - sans token (401)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/send/${user2Id}`)
      .send({ message: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});

describe('API MessageRequests - Récupération', () => {
  test('GET /api/message-requests/received - obtenir demandes reçues', async () => {
    const res = await request(app)
      .get('/api/message-requests/received')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requests).toBeDefined();
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(res.body.requests.length).toBeGreaterThan(0);

    const receivedRequest = res.body.requests[0];
    expect(receivedRequest.message).toBe('Salut ! Je te trouve intéressant(e)');
    expect(receivedRequest.sender).toBeDefined();
  });

  test('GET /api/message-requests/sent - obtenir demandes envoyées', async () => {
    const res = await request(app)
      .get('/api/message-requests/sent')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requests).toBeDefined();
    expect(res.body.requests.length).toBeGreaterThan(0);

    const sentRequest = res.body.requests[0];
    expect(sentRequest.message).toBe('Salut ! Je te trouve intéressant(e)');
  });

  test('GET /api/message-requests/check/:recipientId - vérifier demande envoyée', async () => {
    const res = await request(app)
      .get(`/api/message-requests/check/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hasSent).toBe(true);
    expect(res.body.request).toBeDefined();
  });

  test('GET /api/message-requests/check/:recipientId - aucune demande (false)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/message-requests/check/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasSent).toBe(false);
    expect(res.body.request).toBeNull();
  });

  test('GET /api/message-requests/received - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/message-requests/received');

    expect(res.statusCode).toBe(401);
  });
});

describe('API MessageRequests - Réponse', () => {
  test('POST /api/message-requests/accept/:requestId - accepter demande', async () => {
    const res = await request(app)
      .post(`/api/message-requests/accept/${requestId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.match).toBe(true);
    expect(res.body.message).toContain('matchés');
  });

  test('POST /api/message-requests/accept/:requestId - demande déjà traitée (400)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/accept/${requestId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà été traitée');
  });

  test('POST /api/message-requests/accept/:requestId - demande inexistante (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/message-requests/accept/${fakeId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(404);
  });

  test('POST /api/message-requests/reject/:requestId - créer nouvelle demande pour test reject', async () => {
    // User 2 envoie une demande à User 3 pour tester le rejet
    const res = await request(app)
      .post(`/api/message-requests/send/${user3Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ message: 'Hello !' });

    expect(res.statusCode).toBe(200);
    requestId = res.body.request._id;
  });

  test('POST /api/message-requests/reject/:requestId - rejeter demande', async () => {
    const res = await request(app)
      .post(`/api/message-requests/reject/${requestId}`)
      .set('Authorization', `Bearer ${user3Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('rejetée');
  });

  test('POST /api/message-requests/accept/:requestId - sans permission (403)', async () => {
    const res = await request(app)
      .post(`/api/message-requests/accept/${requestId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('vos propres demandes');
  });
});

describe('API MessageRequests - Suppression', () => {
  test('DELETE /api/message-requests/:requestId - créer demande pour test suppression', async () => {
    // User 1 envoie une nouvelle demande à User 3 (pas matché avec User1)
    // Mais attendez, User 1 et User 3 sont déjà matchés... utilisons un autre scénario
    // Créons un User 4 temporaire
    const res4 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'msgreq4@test.com',
        password: 'Password123',
        firstName: 'David',
        lastName: 'Test',
        birthDate: '1995-01-01',
        gender: 'homme'
      });

    const user4Id = res4.body.user.id;
    const user4Token = res4.body.token;

    const res = await request(app)
      .post(`/api/message-requests/send/${user4Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ message: 'Test pour suppression' });

    expect(res.statusCode).toBe(200);
    requestId = res.body.request._id;
  });

  test('DELETE /api/message-requests/:requestId - supprimer demande', async () => {
    const res = await request(app)
      .delete(`/api/message-requests/${requestId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('supprimée');
  });

  test('DELETE /api/message-requests/:requestId - demande inexistante (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/message-requests/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
  });

  test('DELETE /api/message-requests/:requestId - sans permission (403)', async () => {
    // Créer une nouvelle demande
    const createRes = await request(app)
      .post(`/api/message-requests/send/${user3Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ message: 'Test permission' });

    const newRequestId = createRes.body.request._id;

    // Essayer de supprimer avec un autre utilisateur
    const res = await request(app)
      .delete(`/api/message-requests/${newRequestId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('DELETE /api/message-requests/:requestId - sans token (401)', async () => {
    const res = await request(app)
      .delete(`/api/message-requests/${requestId}`);

    expect(res.statusCode).toBe(401);
  });
});
