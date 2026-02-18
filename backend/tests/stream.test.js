/**
 * Suite de Tests API Stream
 *
 * Teste les endpoints de gestion des streams vidéo :
 * - POST /api/stream/start — démarrer un stream (Socket.IO emit streamStarted)
 * - POST /api/stream/stop — arrêter un stream (Socket.IO emit streamEnded)
 * - GET /api/stream/active — streams actifs des matchs
 * - POST /api/stream/join/:streamId — rejoindre un stream (nécessite match)
 * - GET /api/stream/public — liste des streams publics (max 20)
 *
 * Socket.IO est mocké avec { emit: jest.fn() }
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

// Mock Socket.IO — évite les émissions réelles
const mockIo = { emit: jest.fn() };

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Injecter le mock io dans l'app
  app.set('io', mockIo);

  // Créer User 1
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'stream1@test.com',
      password: 'Password123',
      firstName: 'Alexandre',
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
      email: 'stream2@test.com',
      password: 'Password123',
      firstName: 'Sophie',
      lastName: 'Test',
      birthDate: '1992-08-20',
      gender: 'femme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  // Créer User 3 (sans match avec User 1)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'stream3@test.com',
      password: 'Password123',
      firstName: 'Marie',
      lastName: 'Test',
      birthDate: '1988-12-10',
      gender: 'femme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  // User 1 et User 2 se matchent mutuellement
  await request(app)
    .post(`/api/swipe/like/${user2Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

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

beforeEach(async () => {
  // Remettre tous les utilisateurs hors-live avant chaque test
  await User.updateMany({}, { $set: { isLive: false, liveStreamId: null } });
  mockIo.emit.mockClear();
});

// ====================
// TESTS DÉMARRAGE STREAM
// ====================

describe('API Stream - Démarrage', () => {

  test('POST /api/stream/start - démarrage réussi (200)', async () => {
    const res = await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streamId).toBeDefined();
    expect(res.body.message).toContain('Stream démarré');

    // Vérifier format streamId
    expect(res.body.streamId).toMatch(/^stream_/);

    // Vérifier isLive en DB
    const user = await User.findById(user1Id);
    expect(user.isLive).toBe(true);
    expect(user.liveStreamId).toBe(res.body.streamId);
  });

  test('POST /api/stream/start - Socket.IO emit streamStarted (200)', async () => {
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    // io.emit doit avoir été appelé au moins une fois
    expect(mockIo.emit).toHaveBeenCalled();
    expect(mockIo.emit).toHaveBeenCalledWith('streamStarted', expect.objectContaining({
      streamId: expect.stringMatching(/^stream_/)
    }));
  });

  test('POST /api/stream/start - déjà en live (400)', async () => {
    // Démarrer une première fois
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    // Deuxième démarrage → erreur
    const res = await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà en live');
  });

  test('POST /api/stream/start - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/stream/start');

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS ARRÊT STREAM
// ====================

describe('API Stream - Arrêt', () => {

  test('POST /api/stream/stop - arrêt réussi (200)', async () => {
    // Démarrer d'abord
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    // Arrêter
    const res = await request(app)
      .post('/api/stream/stop')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Stream arrêté');

    // Vérifier isLive = false en DB
    const user = await User.findById(user1Id);
    expect(user.isLive).toBe(false);
    expect(user.liveStreamId).toBeNull();
  });

  test('POST /api/stream/stop - Socket.IO emit streamEnded (200)', async () => {
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    mockIo.emit.mockClear();

    await request(app)
      .post('/api/stream/stop')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(mockIo.emit).toHaveBeenCalledWith('streamEnded', expect.objectContaining({
      streamId: expect.any(String),
      userId: expect.anything()
    }));
  });

  test('POST /api/stream/stop - pas en live (400)', async () => {
    // User 1 n'est pas en live (beforeEach a remis isLive: false)
    const res = await request(app)
      .post('/api/stream/stop')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("n'êtes pas en live");
  });

  test('POST /api/stream/stop - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/stream/stop');

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS STREAMS ACTIFS DES MATCHS
// ====================

describe('API Stream - Streams Actifs', () => {

  test('GET /api/stream/active - aucun match en live (200)', async () => {
    const res = await request(app)
      .get('/api/stream/active')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streams).toBeDefined();
    expect(Array.isArray(res.body.streams)).toBe(true);
    expect(res.body.streams.length).toBe(0);
  });

  test('GET /api/stream/active - un match en live (200)', async () => {
    // User 2 démarre un stream (User 1 et User 2 sont matchés)
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user2Token}`);

    const res = await request(app)
      .get('/api/stream/active')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(1);

    const stream = res.body.streams[0];
    expect(stream.streamId).toBeDefined();
    expect(stream.startedAt).toBeDefined();
    expect(stream.user).toBeDefined();
  });

  test('GET /api/stream/active - User 3 sans matchs voit 0 streams (200)', async () => {
    // User 2 est en live mais User 3 n'est pas matché avec lui
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user2Token}`);

    const res = await request(app)
      .get('/api/stream/active')
      .set('Authorization', `Bearer ${user3Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(0);
  });

  test('GET /api/stream/active - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/stream/active');

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS REJOINDRE UN STREAM
// ====================

describe('API Stream - Rejoindre', () => {

  test('POST /api/stream/join/:streamId - rejoindre réussi (match présent) (200)', async () => {
    // User 2 démarre un stream
    const startRes = await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user2Token}`);

    const streamId = startRes.body.streamId;

    // User 1 (matché avec User 2) rejoint
    const res = await request(app)
      .post(`/api/stream/join/${streamId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streamId).toBe(streamId);
    expect(res.body.streamer).toBeDefined();
  });

  test('POST /api/stream/join/:streamId - stream inexistant (404)', async () => {
    const fakeStreamId = 'stream_fake_id_123456';

    const res = await request(app)
      .post(`/api/stream/join/${fakeStreamId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('Stream non trouvé');
  });

  test('POST /api/stream/join/:streamId - stream non actif (400)', async () => {
    // Démarrer puis arrêter un stream
    const startRes = await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user2Token}`);

    const streamId = startRes.body.streamId;

    await request(app)
      .post('/api/stream/stop')
      .set('Authorization', `Bearer ${user2Token}`);

    // Essayer de rejoindre le stream arrêté
    const res = await request(app)
      .post(`/api/stream/join/${streamId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404); // Stream supprimé de la DB → 404
  });

  test('POST /api/stream/join/:streamId - pas de match avec le streamer (403)', async () => {
    // User 1 démarre un stream
    const startRes = await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    const streamId = startRes.body.streamId;

    // User 3 (pas matché avec User 1) essaie de rejoindre
    const res = await request(app)
      .post(`/api/stream/join/${streamId}`)
      .set('Authorization', `Bearer ${user3Token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('matcher');
  });

  test('POST /api/stream/join/:streamId - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/stream/join/stream_fake_123');

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS STREAMS PUBLICS
// ====================

describe('API Stream - Streams Publics', () => {

  test('GET /api/stream/public - aucun stream actif (200)', async () => {
    const res = await request(app)
      .get('/api/stream/public')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streams).toBeDefined();
    expect(Array.isArray(res.body.streams)).toBe(true);
    expect(res.body.streams.length).toBe(0);
  });

  test('GET /api/stream/public - streams actifs visibles (200)', async () => {
    // User 1 et User 2 démarrent des streams
    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app)
      .post('/api/stream/start')
      .set('Authorization', `Bearer ${user2Token}`);

    const res = await request(app)
      .get('/api/stream/public')
      .set('Authorization', `Bearer ${user3Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(2);

    const stream = res.body.streams[0];
    expect(stream.streamId).toBeDefined();
    expect(stream.user).toBeDefined();
  });

  test('GET /api/stream/public - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/stream/public');

    expect(res.statusCode).toBe(401);
  });

});
