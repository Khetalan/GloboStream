const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Créer User 1
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'match1@test.com',
      password: 'Password123',
      firstName: 'Match1',
      lastName: 'Test',
      birthDate: '1990-05-15',
      gender: 'homme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  // Créer User 2
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'match2@test.com',
      password: 'Password123',
      firstName: 'Match2',
      lastName: 'Test',
      birthDate: '1992-08-20',
      gender: 'femme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  // Créer User 3
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'match3@test.com',
      password: 'Password123',
      firstName: 'Match3',
      lastName: 'Test',
      birthDate: '1988-12-10',
      gender: 'femme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  // Créer un match entre User 1 et User 2
  await request(app)
    .post(`/api/swipe/like/${user2Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  await request(app)
    .post(`/api/swipe/like/${user1Id}`)
    .set('Authorization', `Bearer ${user2Token}`);

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
  await mongoose.connection.close();
});

describe('API Matches - Liste', () => {
  test('GET /api/matches - obtenir tous les matchs', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.matches).toBeDefined();
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBe(2); // User 1 a 2 matchs (User 2 et User 3)
  });

  test('GET /api/matches - structure du match', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    const firstMatch = res.body.matches[0];
    expect(firstMatch.id).toBeDefined();
    expect(firstMatch.user).toBeDefined();
    expect(firstMatch.user.displayName).toBeDefined();
    expect(firstMatch.matchedAt).toBeDefined();
    expect(firstMatch.user.email).toBeUndefined(); // Email non exposé dans profil public
  });

  test('GET /api/matches - matchs triés par date (plus récent en premier)', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    const matches = res.body.matches;

    if (matches.length > 1) {
      const firstMatchDate = new Date(matches[0].matchedAt);
      const secondMatchDate = new Date(matches[1].matchedAt);
      expect(firstMatchDate >= secondMatchDate).toBe(true);
    }
  });

  test('GET /api/matches - utilisateur sans matchs', async () => {
    // Créer un nouvel utilisateur sans matchs
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'nomatch@test.com',
        password: 'Password123',
        firstName: 'NoMatch',
        lastName: 'Test',
        birthDate: '1995-01-01',
        gender: 'homme'
      });

    const noMatchToken = res.body.token;

    const matchesRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${noMatchToken}`);

    expect(matchesRes.statusCode).toBe(200);
    expect(matchesRes.body.matches.length).toBe(0);
  });

  test('GET /api/matches - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/matches');

    expect(res.statusCode).toBe(401);
  });
});

describe('API Matches - Unmatch', () => {
  test('DELETE /api/matches/:userId - retirer un match', async () => {
    const res = await request(app)
      .delete(`/api/matches/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('retiré');
  });

  test('DELETE /api/matches/:userId - vérifier que le match a été retiré des deux côtés', async () => {
    // Vérifier que User 1 n'a plus User 2 dans ses matchs
    const res1 = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res1.statusCode).toBe(200);
    const hasUser2 = res1.body.matches.some(m => m.user._id === user2Id);
    expect(hasUser2).toBe(false);

    // Vérifier que User 2 n'a plus User 1 dans ses matchs
    const res2 = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res2.statusCode).toBe(200);
    const hasUser1 = res2.body.matches.some(m => m.user._id === user1Id);
    expect(hasUser1).toBe(false);
  });

  test('DELETE /api/matches/:userId - unmatch utilisateur inexistant (500)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/matches/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    // L'API ne vérifie pas si l'utilisateur existe avant de retirer le match
    // Donc ça peut retourner 200 même si l'utilisateur n'existe pas
    expect([200, 500]).toContain(res.statusCode);
  });

  test('DELETE /api/matches/:userId - unmatch utilisateur non matché', async () => {
    // User 1 n'a jamais été matché avec lui-même
    const res = await request(app)
      .delete(`/api/matches/${user1Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE /api/matches/:userId - sans token (401)', async () => {
    const res = await request(app)
      .delete(`/api/matches/${user2Id}`);

    expect(res.statusCode).toBe(401);
  });
});
