/**
 * Suite de Tests API Surprise
 *
 * Teste les endpoints de la fonctionnalité "Surprise" (speed dating vidéo) :
 * - GET /api/surprise/check-mutual/:partnerId — vérification like mutuel + création match
 * - POST /api/surprise/session — enregistrement session (TODO incomplet)
 * - GET /api/surprise/stats — statistiques utilisateur (TODO incomplet)
 *
 * Notes :
 * - check-mutual crée automatiquement un match si les deux se sont likés
 * - session et stats retournent succès sans persistance réelle (TODO)
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
      email: 'surprise1@test.com',
      password: 'Password123',
      firstName: 'Alice',
      lastName: 'Test',
      birthDate: '1992-03-10',
      gender: 'femme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  // Créer User 2
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'surprise2@test.com',
      password: 'Password123',
      firstName: 'Bob',
      lastName: 'Test',
      birthDate: '1990-07-22',
      gender: 'homme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  // Créer User 3 (sans likes)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'surprise3@test.com',
      password: 'Password123',
      firstName: 'Charlie',
      lastName: 'Test',
      birthDate: '1988-11-05',
      gender: 'homme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
});

// Nettoyer les likes et matchs entre chaque describe
beforeEach(async () => {
  await User.updateMany({}, { $set: { likes: [], matches: [] } });
});

// ====================
// TESTS VÉRIFICATION MUTUELLE
// ====================

describe('API Surprise - Vérification Mutuelle', () => {

  test('GET /api/surprise/check-mutual/:partnerId - pas mutuel (200)', async () => {
    // User 1 like User 2, mais User 2 n'a pas liké User 1
    await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    const res = await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mutual).toBe(false);
  });

  test('GET /api/surprise/check-mutual/:partnerId - mutuel → mutual: true (200)', async () => {
    // Les deux se likent mutuellement
    await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app)
      .post(`/api/swipe/like/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    const res = await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mutual).toBe(true);
  });

  test('GET /api/surprise/check-mutual/:partnerId - match créé automatiquement si mutuel (200)', async () => {
    // User 1 et User 2 se likent mutuellement
    await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app)
      .post(`/api/swipe/like/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    // Vérifier que le match est créé dans les deux sens
    const user1DB = await User.findById(user1Id);
    const user2DB = await User.findById(user2Id);

    const user1HasMatch = user1DB.matches.some(m => m.user.toString() === user2Id);
    const user2HasMatch = user2DB.matches.some(m => m.user.toString() === user1Id);

    expect(user1HasMatch).toBe(true);
    expect(user2HasMatch).toBe(true);
  });

  test('GET /api/surprise/check-mutual/:partnerId - matchedAt timestamp défini (200)', async () => {
    // Les deux se likent
    await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app)
      .post(`/api/swipe/like/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    const beforeTime = Date.now();

    await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    const user1DB = await User.findById(user1Id);
    const match = user1DB.matches.find(m => m.user.toString() === user2Id);

    expect(match).toBeDefined();
    expect(match.matchedAt).toBeDefined();
    expect(new Date(match.matchedAt).getTime()).toBeGreaterThanOrEqual(beforeTime - 1000);
  });

  test('GET /api/surprise/check-mutual/:partnerId - pas de duplication si match existe déjà (200)', async () => {
    // Les deux se likent et créent un match
    await request(app)
      .post(`/api/swipe/like/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app)
      .post(`/api/swipe/like/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    // Premier appel : crée le match
    await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    // Deuxième appel : ne doit pas créer de doublon
    await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    const user1DB = await User.findById(user1Id);
    const matchesWithUser2 = user1DB.matches.filter(
      m => m.user.toString() === user2Id
    );

    // Un seul match doit exister
    expect(matchesWithUser2.length).toBe(1);
  });

  test('GET /api/surprise/check-mutual/:partnerId - partenaire inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/surprise/check-mutual/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('Partenaire non trouvé');
  });

  test('GET /api/surprise/check-mutual/:partnerId - sans token (401)', async () => {
    const res = await request(app)
      .get(`/api/surprise/check-mutual/${user2Id}`);

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/surprise/check-mutual/:partnerId - user3 sans likes → mutual: false (200)', async () => {
    // User 3 n'a liké personne, vérifier depuis User 1
    const res = await request(app)
      .get(`/api/surprise/check-mutual/${user3Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.mutual).toBe(false);
  });

});

// ====================
// TESTS SESSION SURPRISE
// ====================

describe('API Surprise - Session', () => {

  test('POST /api/surprise/session - enregistrement réussi (200)', async () => {
    // TODO : L'implémentation est incomplète (pas de persistance réelle)
    const res = await request(app)
      .post('/api/surprise/session')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        partnerId: user2Id,
        duration: 120,
        outcome: 'like'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Session enregistrée');
  });

  test('POST /api/surprise/session - outcome dislike (200)', async () => {
    const res = await request(app)
      .post('/api/surprise/session')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        partnerId: user2Id,
        duration: 45,
        outcome: 'dislike'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/surprise/session - outcome skip (200)', async () => {
    const res = await request(app)
      .post('/api/surprise/session')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        partnerId: user3Id,
        duration: 5,
        outcome: 'skip'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/surprise/session - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/surprise/session')
      .send({
        partnerId: user2Id,
        duration: 60,
        outcome: 'like'
      });

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS STATISTIQUES SURPRISE
// ====================

describe('API Surprise - Statistiques', () => {

  test('GET /api/surprise/stats - récupération stats (200)', async () => {
    const res = await request(app)
      .get('/api/surprise/stats')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
  });

  test('GET /api/surprise/stats - structure stats complète (200)', async () => {
    // TODO : L'implémentation retourne des valeurs hardcodées à 0
    const res = await request(app)
      .get('/api/surprise/stats')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);

    const stats = res.body.stats;

    // Vérifier la structure de la réponse (TODO : retourne 0 pour tout)
    expect(stats).toHaveProperty('totalSessions');
    expect(stats).toHaveProperty('totalLikes');
    expect(stats).toHaveProperty('totalDislikes');
    expect(stats).toHaveProperty('totalSkips');
    expect(stats).toHaveProperty('totalMatches');
    expect(stats).toHaveProperty('averageDuration');

    // Valeurs hardcodées à 0 (TODO : pas de SurpriseSession model)
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalMatches).toBe(0);
  });

  test('GET /api/surprise/stats - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/surprise/stats');

    expect(res.statusCode).toBe(401);
  });

});
