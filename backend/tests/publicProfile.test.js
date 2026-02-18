/**
 * Suite de Tests API Profil Public
 *
 * Teste l'endpoint GET /api/public-profile/:userId :
 * - Récupération de profils publics avec données calculées
 * - Calcul de l'âge à partir de birthDate (gestion anniversaire)
 * - Calcul distance Haversine entre utilisateurs (formule géodésique)
 * - Vérification statuts hasLiked et isMatch
 * - Exclusion champs sensibles (password, moderation, etc.)
 * - Gestion cas limites (sans location, sans birthDate)
 * - Gestion erreurs (404, 401)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;
let user4Token, user4Id;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Créer User 1 (homme, Paris, a liké User 2)
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'profile1@test.com',
      password: 'Password123',
      firstName: 'Alexandre',
      lastName: 'Dupont',
      birthDate: '1990-05-15',
      gender: 'homme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({
      bio: 'Profil User 1',
      interests: ['cinéma', 'sport'],
      languages: ['français', 'anglais'],
      height: 180,
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566], // Paris
        city: 'Paris'
      }
    });

  // Créer User 2 (femme, Paris proche, matchée avec User 1)
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'profile2@test.com',
      password: 'Password123',
      firstName: 'Sophie',
      lastName: 'Martin',
      birthDate: '1992-08-20',
      gender: 'femme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user2Token}`)
    .send({
      bio: 'Profil User 2',
      interests: ['cinéma', 'lecture'],
      languages: ['français'],
      height: 165,
      location: {
        type: 'Point',
        coordinates: [2.3500, 48.8500], // Paris proche (~1 km)
        city: 'Paris'
      }
    });

  // Créer User 3 (femme, Lyon, sans match)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'profile3@test.com',
      password: 'Password123',
      firstName: 'Marie',
      lastName: 'Bernard',
      birthDate: '1988-12-10',
      gender: 'femme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user3Token}`)
    .send({
      bio: 'Profil User 3',
      interests: ['voyage'],
      location: {
        type: 'Point',
        coordinates: [4.8357, 45.7640], // Lyon (~390 km de Paris)
        city: 'Lyon'
      }
    });

  // Créer User 4 (sans location ni birthDate pour edge cases)
  const res4 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'profile4@test.com',
      password: 'Password123',
      firstName: 'Thomas',
      lastName: 'Petit',
      birthDate: '1995-01-01',
      gender: 'homme'
    });

  user4Token = res4.body.token;
  user4Id = res4.body.user.id;

  // Pas de PATCH pour User 4 (reste sans location)

  // User 1 like User 2
  await request(app)
    .post(`/api/swipe/like/${user2Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  // User 2 like User 1 (crée match mutuel)
  await request(app)
    .post(`/api/swipe/like/${user1Id}`)
    .set('Authorization', `Bearer ${user2Token}`);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
});

describe('API Profil Public - Récupération', () => {

  test('GET /api/public-profile/:userId - récupération profil complète (200)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toBeDefined();

    const profile = res.body.profile;

    // Vérifier structure profil
    expect(profile.id).toBe(user2Id);
    expect(profile.firstName).toBe('Sophie');
    expect(profile.gender).toBe('femme');
    expect(profile.bio).toBe('Profil User 2');
    expect(profile.interests).toEqual(['cinéma', 'lecture']);
    expect(profile.languages).toEqual(['français']);
    expect(profile.height).toBe(165);

    // Vérifier champs calculés présents
    expect(profile.age).toBeDefined();
    expect(profile.distance).toBeDefined();
    expect(profile.hasLiked).toBeDefined();
    expect(profile.isMatch).toBeDefined();

    // Vérifier champs sensibles exclus
    expect(profile.password).toBeUndefined();
    expect(profile.linkedAccounts).toBeUndefined();
    expect(profile.moderationPermissions).toBeUndefined();
    expect(profile.moderationStats).toBeUndefined();
    expect(profile.warnings).toBeUndefined();
  });

  test('GET /api/public-profile/:userId - calcul âge correct (200)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;
    const birthDate = new Date('1992-08-20');
    const today = new Date();
    let expectedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Ajuster si anniversaire pas encore atteint cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      expectedAge--;
    }

    expect(profile.age).toBe(expectedAge);
  });

  test('GET /api/public-profile/:userId - calcul distance Haversine Paris-Paris (~1 km)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;

    // Distance Paris [2.3522, 48.8566] vers Paris proche [2.3500, 48.8500]
    // Devrait être environ 1 km
    expect(profile.distance).toBeDefined();
    expect(profile.distance).toBeGreaterThan(0);
    expect(profile.distance).toBeLessThan(3); // Maximum 3 km
  });

  test('GET /api/public-profile/:userId - calcul distance Paris-Lyon (~390 km)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user3Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;

    // Distance Paris vers Lyon devrait être environ 390 km
    expect(profile.distance).toBeDefined();
    expect(profile.distance).toBeGreaterThan(380);
    expect(profile.distance).toBeLessThan(410);
  });

  test('GET /api/public-profile/:userId - hasLiked true (200)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;

    // User 1 a liké User 2 dans beforeAll
    expect(profile.hasLiked).toBe(true);
  });

  test('GET /api/public-profile/:userId - isMatch true (200)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;

    // User 1 et User 2 sont matchés (likes mutuels)
    expect(profile.isMatch).toBe(true);
  });

  test('GET /api/public-profile/:userId - hasLiked false et isMatch false pour profil non liké (200)', async () => {
    // User 1 n'a pas liké User 3, et ils ne sont pas matchés
    const res = await request(app)
      .get(`/api/public-profile/${user3Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;

    // Vérifier que les statuts sont bien false pour un profil non liké
    expect(profile.hasLiked).toBe(false);
    expect(profile.isMatch).toBe(false);
  });

  test('GET /api/public-profile/:userId - sans birthDate, age null (200)', async () => {
    // Créer un utilisateur temporaire sans birthDate
    const tempRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'nobirth@test.com',
        password: 'Password123',
        firstName: 'NoBirth',
        lastName: 'Test',
        birthDate: '1990-01-01', // Obligatoire pour register
        gender: 'homme'
      });

    const tempId = tempRes.body.user.id;

    // Supprimer le birthDate directement en DB
    await User.findByIdAndUpdate(tempId, { $unset: { birthDate: 1 } });

    const res = await request(app)
      .get(`/api/public-profile/${tempId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const profile = res.body.profile;
    expect(profile.age).toBeNull();

    // Cleanup
    await User.findByIdAndDelete(tempId);
  });

  test('GET /api/public-profile/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/public-profile/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('Utilisateur non trouvé');
  });

  test('GET /api/public-profile/:userId - sans token (401)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`);

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/public-profile/:userId - token invalide (401)', async () => {
    const res = await request(app)
      .get(`/api/public-profile/${user2Id}`)
      .set('Authorization', 'Bearer token-invalide-xyz123');

    expect(res.statusCode).toBe(401);
  });

});
