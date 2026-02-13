const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let testUser;
let testToken;
let otherUser;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Créer un utilisateur de test
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user-test@test.com',
      password: 'Password123',
      firstName: 'User',
      lastName: 'Test',
      birthDate: '1995-06-15',
      gender: 'homme',
      lookingFor: ['femme'],
      bio: 'Test bio'
    });

  testUser = res.body.user;
  testToken = res.body.token;

  // Créer un autre utilisateur pour les tests de profil public
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'other-user@test.com',
      password: 'Password123',
      firstName: 'Other',
      lastName: 'User',
      birthDate: '1992-03-10',
      gender: 'femme',
      lookingFor: ['homme'],
      bio: 'Other user bio'
    });

  otherUser = res2.body.user;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('API Users - Profil Personnel', () => {
  test('GET /api/users/me - obtenir son propre profil', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('user-test@test.com');
    expect(res.body.user.displayName).toBe('User Test');
    expect(res.body.user.password).toBeUndefined(); // Ne doit pas retourner le mot de passe
  });

  test('GET /api/users/me - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/users/me');

    expect(res.statusCode).toBe(401);
  });

  test('PATCH /api/users/me - mettre à jour son profil', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        bio: 'Bio mise à jour par Jest',
        interests: ['cinéma', 'sport'],
        height: 180,
        job: 'Développeur'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.bio).toBe('Bio mise à jour par Jest');
    expect(res.body.user.interests).toContain('cinéma');
    expect(res.body.user.interests).toContain('sport');
    expect(res.body.user.height).toBe(180);
    expect(res.body.user.job).toBe('Développeur');
  });

  test('PATCH /api/users/me - mettre à jour localisation', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566] // Paris
        },
        city: 'Paris',
        country: 'France'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.city).toBe('Paris');
    expect(res.body.user.country).toBe('France');
    expect(res.body.user.location).toBeDefined();
    expect(res.body.user.location.coordinates).toEqual([2.3522, 48.8566]);
  });

  test('PATCH /api/users/me - champs immuables (email, password) ignorés', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        email: 'newemail@test.com', // Ne doit pas être modifié
        password: 'NewPassword', // Ne doit pas être modifié
        bio: 'Nouvelle bio'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('user-test@test.com'); // Email inchangé
    expect(res.body.user.bio).toBe('Nouvelle bio'); // Bio changée
  });

  test('PATCH /api/users/me - sans token (401)', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ bio: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});

describe('API Users - Profil Public', () => {
  test('GET /api/users/:userId - obtenir profil public d\'un autre utilisateur', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUser._id}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.displayName).toBe('Other User');
    expect(res.body.user.bio).toBe('Other user bio');
    expect(res.body.user.email).toBeUndefined(); // Email non exposé dans profil public
    expect(res.body.user.password).toBeUndefined();
  });

  test('GET /api/users/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('GET /api/users/:userId - ID invalide (500)', async () => {
    const res = await request(app)
      .get('/api/users/invalid-id-format')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toBe(500);
  });

  test('GET /api/users/:userId - sans token (401)', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUser._id}`);

    expect(res.statusCode).toBe(401);
  });
});
