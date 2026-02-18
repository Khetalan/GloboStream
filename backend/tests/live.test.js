/**
 * Suite de Tests API Live
 *
 * Teste les endpoints de découverte et gestion des lives publics :
 * - GET /api/live/public — liste des lives actifs (limit 50)
 * - GET /api/live/public?filter=trending — tri viewersCount décroissant
 * - GET /api/live/public?filter=nearby — distance ≤ 50km (Haversine)
 * - GET /api/live/public?filter=new — tri startedAt décroissant
 * - GET /api/live/public?filter=favorites — isFavorite true (TODO : toujours vide)
 * - POST /api/live/favorite/:streamId — toggle favori (TODO : retourne succès sans persistance)
 * - POST /api/live/start — démarrer live (set isLive: true)
 * - POST /api/live/stop — arrêter live (set isLive: false)
 *
 * Notes :
 * - viewersCount et duration sont des valeurs aléatoires simulées
 * - isFavorite est toujours false (TODO non implémenté)
 * - /live/start utilise user._id comme streamId temporaire
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

  // Créer User 1 (Paris)
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'live1@test.com',
      password: 'Password123',
      firstName: 'Alexandre',
      lastName: 'Test',
      birthDate: '1990-05-15',
      gender: 'homme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566], // Paris
        city: 'Paris'
      }
    });

  // Créer User 2 (Paris proche)
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'live2@test.com',
      password: 'Password123',
      firstName: 'Sophie',
      lastName: 'Test',
      birthDate: '1992-08-20',
      gender: 'femme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user2Token}`)
    .send({
      location: {
        type: 'Point',
        coordinates: [2.3500, 48.8500], // Paris proche (~1 km)
        city: 'Paris'
      }
    });

  // Créer User 3 (Lyon)
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'live3@test.com',
      password: 'Password123',
      firstName: 'Marie',
      lastName: 'Test',
      birthDate: '1988-12-10',
      gender: 'femme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${user3Token}`)
    .send({
      location: {
        type: 'Point',
        coordinates: [4.8357, 45.7640], // Lyon (~390 km de Paris)
        city: 'Lyon'
      }
    });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  // Remettre tous les utilisateurs hors-live avant chaque test
  await User.updateMany({}, { $set: { isLive: false } });
});

// ====================
// TESTS STREAMS PUBLICS
// ====================

describe('API Live - Streams Publics', () => {

  test('GET /api/live/public - aucun live actif (200)', async () => {
    const res = await request(app)
      .get('/api/live/public')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streams).toBeDefined();
    expect(Array.isArray(res.body.streams)).toBe(true);
    expect(res.body.streams.length).toBe(0);
  });

  test('GET /api/live/public - streams actifs retournés (200)', async () => {
    // User 1 et User 2 démarrent un live
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $set: { isLive: true } }
    );

    const res = await request(app)
      .get('/api/live/public')
      .set('Authorization', `Bearer ${user3Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streams.length).toBe(2);
  });

  test('GET /api/live/public - structure stream complète (200)', async () => {
    await User.findByIdAndUpdate(user1Id, { $set: { isLive: true } });

    const res = await request(app)
      .get('/api/live/public')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(1);

    const stream = res.body.streams[0];

    // Champs obligatoires
    expect(stream._id).toBeDefined();
    expect(stream.streamer).toBeDefined();
    expect(stream.streamer.firstName).toBe('Alexandre');
    expect(stream.title).toBeDefined();
    expect(stream.viewersCount).toBeDefined();
    expect(stream.viewersCount).toBeGreaterThanOrEqual(5);
    expect(stream.tags).toBeDefined();
    expect(Array.isArray(stream.tags)).toBe(true);
    expect(stream.isFavorite).toBe(false); // TODO : toujours false
    expect(stream.startedAt).toBeDefined();
  });

  test('GET /api/live/public - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/live/public');

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS FILTRES
// ====================

describe('API Live - Filtres', () => {

  test('GET /api/live/public?filter=trending - tri viewersCount décroissant (200)', async () => {
    // Mettre 3 utilisateurs en live
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id, user3Id] } },
      { $set: { isLive: true } }
    );

    const res = await request(app)
      .get('/api/live/public?filter=trending')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(3);

    // Vérifier tri décroissant par viewersCount
    const streams = res.body.streams;
    for (let i = 0; i < streams.length - 1; i++) {
      expect(streams[i].viewersCount).toBeGreaterThanOrEqual(streams[i + 1].viewersCount);
    }
  });

  test('GET /api/live/public?filter=nearby - seuls les utilisateurs dans 50km (200)', async () => {
    // Tous les 3 en live
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id, user3Id] } },
      { $set: { isLive: true } }
    );

    // Requête depuis Paris : User1 (~0km) et User2 (~1km) inclus, User3 (~390km) exclu
    const res = await request(app)
      .get('/api/live/public?filter=nearby&userLat=48.8566&userLon=2.3522')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(2); // Paris + Paris proche

    // Vérifier tri croissant par distance
    const streams = res.body.streams;
    for (let i = 0; i < streams.length - 1; i++) {
      expect(streams[i].distance).toBeLessThanOrEqual(streams[i + 1].distance);
    }

    // Vérifier toutes distances ≤ 50km
    streams.forEach(s => {
      expect(s.distance).toBeLessThanOrEqual(50);
    });
  });

  test('GET /api/live/public?filter=nearby - sans coords (aucun filtrage distance) (200)', async () => {
    // Sans userLat/userLon, distance=null → filtre nearby retourne vide
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $set: { isLive: true } }
    );

    const res = await request(app)
      .get('/api/live/public?filter=nearby')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    // Sans coords : distance=null pour tous → filtre nearby exclut tout (distance !== null)
    expect(res.body.streams.length).toBe(0);
  });

  test('GET /api/live/public?filter=new - tri startedAt décroissant (200)', async () => {
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $set: { isLive: true } }
    );

    const res = await request(app)
      .get('/api/live/public?filter=new')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streams.length).toBe(2);

    // Vérifier tri décroissant par startedAt
    const streams = res.body.streams;
    for (let i = 0; i < streams.length - 1; i++) {
      expect(new Date(streams[i].startedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(streams[i + 1].startedAt).getTime());
    }
  });

  test('GET /api/live/public?filter=favorites - retourne vide (TODO non implémenté) (200)', async () => {
    // isFavorite est toujours false (TODO), donc favorites filtre toujours vide
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $set: { isLive: true } }
    );

    const res = await request(app)
      .get('/api/live/public?filter=favorites')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streams.length).toBe(0); // isFavorite toujours false
  });

});

// ====================
// TESTS FAVORIS
// ====================

describe('API Live - Favoris', () => {

  test('POST /api/live/favorite/:streamId - succès (TODO retourne toujours succès) (200)', async () => {
    const fakeStreamId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/live/favorite/${fakeStreamId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Favori modifié');
  });

  test('POST /api/live/favorite/:streamId - sans token (401)', async () => {
    const fakeStreamId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/live/favorite/${fakeStreamId}`);

    expect(res.statusCode).toBe(401);
  });

});

// ====================
// TESTS DÉMARRAGE / ARRÊT LIVE
// ====================

describe('API Live - Démarrage et Arrêt', () => {

  test('POST /api/live/start - démarrage réussi, isLive: true en DB (200)', async () => {
    const res = await request(app)
      .post('/api/live/start')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Mon Live Test', tags: ['Discussion'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Live démarré');
    expect(res.body.streamId).toBeDefined();

    // Vérifier isLive = true en DB
    const user = await User.findById(user1Id);
    expect(user.isLive).toBe(true);
  });

  test('POST /api/live/start - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/live/start')
      .send({ title: 'Test' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/live/stop - arrêt réussi, isLive: false en DB (200)', async () => {
    // Démarrer d'abord
    await request(app)
      .post('/api/live/start')
      .set('Authorization', `Bearer ${user1Token}`);

    // Arrêter
    const res = await request(app)
      .post('/api/live/stop')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Live arrêté');

    // Vérifier isLive = false en DB
    const user = await User.findById(user1Id);
    expect(user.isLive).toBe(false);
  });

  test('POST /api/live/stop - sans token (401)', async () => {
    const res = await request(app)
      .post('/api/live/stop');

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/live/start - streamId correspond à user._id (200)', async () => {
    const res = await request(app)
      .post('/api/live/start')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streamId).toBeDefined();
    // Le streamId temporaire = user._id
    expect(res.body.streamId.toString()).toBe(user2Id.toString());
  });

});
