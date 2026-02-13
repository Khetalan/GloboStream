const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let user1Token, user1Id;
let user2Token, user2Id;
let user3Id;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Créer User 1 (homme, Paris)
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user1@test.com',
      password: 'Password123',
      firstName: 'Marc',
      lastName: 'Test',
      birthDate: '1990-05-15',
      gender: 'homme',
      lookingFor: ['femme'],
      bio: 'User 1',
      interests: ['cinéma', 'sport'],
      languages: ['français', 'anglais'],
      height: 180
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user._id;

  // Mettre à jour la localisation de User 1 (Paris)
  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566] // Paris
      },
      city: 'Paris'
    });

  // Créer User 2 (femme, Paris)
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user2@test.com',
      password: 'Password123',
      firstName: 'Sophie',
      lastName: 'Test',
      birthDate: '1992-08-20',
      gender: 'femme',
      lookingFor: ['homme'],
      bio: 'User 2',
      interests: ['cinéma', 'lecture'],
      languages: ['français'],
      height: 165
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user._id;

  // Mettre à jour la localisation de User 2 (Paris)
  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user2Token}`)
    .send({
      location: {
        type: 'Point',
        coordinates: [2.3500, 48.8500] // Paris (proche)
      },
      city: 'Paris'
    });

  // Créer User 3 (femme, loin)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user3@test.com',
      password: 'Password123',
      firstName: 'Marie',
      lastName: 'Test',
      birthDate: '1988-12-10',
      gender: 'femme',
      lookingFor: ['homme'],
      bio: 'User 3',
      interests: ['voyage'],
      languages: ['anglais'],
      height: 170
    });

  user3Id = res3.body.user._id;

  // User 3 sans localisation (ou très loin)
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('API Swipe - Obtenir Profils', () => {
  test('POST /api/swipe/profiles - obtenir profils avec filtres par défaut', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profiles).toBeDefined();
    expect(Array.isArray(res.body.profiles)).toBe(true);
    // User 1 ne doit pas se voir lui-même
    expect(res.body.profiles.find(p => p.id === user1Id)).toBeUndefined();
  });

  test('POST /api/swipe/profiles - filtre par genre (femme)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        gender: ['femme']
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.profiles.length).toBeGreaterThan(0);
    // Tous les profils doivent être des femmes
    res.body.profiles.forEach(profile => {
      expect(profile.gender).toBe('femme');
    });
  });

  test('POST /api/swipe/profiles - filtre par âge (25-35 ans)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        ageMin: 25,
        ageMax: 35
      });

    expect(res.statusCode).toBe(200);
    res.body.profiles.forEach(profile => {
      expect(profile.age).toBeGreaterThanOrEqual(25);
      expect(profile.age).toBeLessThanOrEqual(35);
    });
  });

  test('POST /api/swipe/profiles - filtre par taille (160-170 cm)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        heightMin: 160,
        heightMax: 170
      });

    expect(res.statusCode).toBe(200);
    res.body.profiles.forEach(profile => {
      if (profile.height) {
        expect(profile.height).toBeGreaterThanOrEqual(160);
        expect(profile.height).toBeLessThanOrEqual(170);
      }
    });
  });

  test('POST /api/swipe/profiles - filtre par intérêts (cinéma)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        interests: ['cinéma']
      });

    expect(res.statusCode).toBe(200);
    // Au moins User 2 doit être dans les résultats (a "cinéma" en intérêt)
    const hasUser2 = res.body.profiles.some(p => p.id === user2Id);
    expect(hasUser2).toBe(true);
  });

  test('POST /api/swipe/profiles - filtre par distance (10 km)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        distance: 10 // 10 km autour de Paris
      });

    expect(res.statusCode).toBe(200);
    // User 2 est proche (Paris) donc doit être présent
    const hasUser2 = res.body.profiles.some(p => p.id === user2Id);
    expect(hasUser2).toBe(true);
    // Vérifier que les distances sont calculées
    res.body.profiles.forEach(profile => {
      if (profile.distance !== null) {
        expect(profile.distance).toBeLessThanOrEqual(10);
      }
    });
  });

  test('POST /api/swipe/profiles - limite de résultats (limit: 1)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        limit: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.profiles.length).toBeLessThanOrEqual(1);
  });

  test('POST /api/swipe/profiles - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/swipe/profiles')
      .send({});

    expect(res.statusCode).toBe(401);
  });
});

describe('API Swipe - Like', () => {
  test('POST /api/swipe/like/:userId - liker un utilisateur', async () => {
    const res = await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.match).toBe(false); // Pas encore de match (User 2 n'a pas liké User 1)
  });

  test('POST /api/swipe/like/:userId - liker deux fois le même utilisateur (idempotent)', async () => {
    const res = await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Déjà liké');
  });

  test('POST /api/swipe/like/:userId - match mutuel', async () => {
    // User 2 like User 1 en retour
    const res = await request(app)
      .post(`/api/swipe/like/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.match).toBe(true); // C'est un match !
    expect(res.body.message).toContain('match');
  });

  test('POST /api/swipe/like/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/swipe/like/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
  });

  test('POST /api/swipe/like/:userId - sans token (401)', async () => {
    const res = await request(app)
      .post(`/api/swipe/like/${user2Id}`);

    expect(res.statusCode).toBe(401);
  });
});

describe('API Swipe - Dislike', () => {
  test('POST /api/swipe/dislike/:userId - disliker un utilisateur', async () => {
    const res = await request(app)
      .post(`/api/swipe/dislike/${user3Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/swipe/dislike/:userId - utilisateur disliké n\'apparaît plus dans les profils', async () => {
    // Obtenir les profils après dislike
    const res = await request(app)
      .post('/api/swipe/profiles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({});

    expect(res.statusCode).toBe(200);
    // User 3 ne doit pas être dans les résultats (disliké)
    const hasUser3 = res.body.profiles.some(p => p.id === user3Id);
    expect(hasUser3).toBe(false);
  });

  test('POST /api/swipe/dislike/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/swipe/dislike/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
  });

  test('POST /api/swipe/dislike/:userId - sans token (401)', async () => {
    const res = await request(app)
      .post(`/api/swipe/dislike/${user3Id}`);

    expect(res.statusCode).toBe(401);
  });
});
